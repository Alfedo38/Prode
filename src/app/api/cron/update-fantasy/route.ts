// src/app/api/cron/update-fantasy/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  // 🔒 1. Seguridad
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log("🔥 Iniciando el Árbitro Automático del Fantasy...");

    // 📅 2. Usamos la fecha de hoy para buscar los partidos
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // 🚀 3. EL TRUCO NINJA: hydrate=boxscore nos trae todas las stats del día en 1 solo llamado
    const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${dateStr}&endDate=${dateStr}&gameType=R&hydrate=boxscore`;
    
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.dates || data.dates.length === 0) {
      return NextResponse.json({ message: "No hay partidos hoy para calcular el Fantasy." });
    }

    // 4. Armamos un diccionario gigante con todos los bateadores que jugaron hoy
    const statsDelDia = new Map();

    data.dates[0].games.forEach((game: any) => {
      if (game.status.statusCode === 'F' && game.boxscore) {
        // Extraemos jugadores de ambos equipos
        const teams = [game.boxscore.teams.home, game.boxscore.teams.away];
        
        teams.forEach(team => {
          Object.values(team.players).forEach((player: any) => {
            if (player.stats?.batting) {
              // Guardamos las stats usando el nombre completo del jugador como llave
              statsDelDia.set(player.person.fullName, player.stats.batting);
            }
          });
        });
      }
    });

    // 5. Traemos todos los equipos de Fantasy de tu DB
    const allFantasyTeams = await db.fantasyTeam.findMany();
    let equiposProcesados = 0;

    for (const team of allFantasyTeams) {
      if (!team.playerNames) continue;

      const players = team.playerNames.split(',');
      let puntosDeHoy = 0;

      // 6. Buscamos a tus jugadores en el diccionario que armamos
      for (const playerString of players) {
        if (!playerString) continue;

        // Limpiamos el nombre: "Shohei Ohtani (LAD - DH)" -> "Shohei Ohtani"
        const playerName = playerString.split(' (')[0].trim();
        const stats = statsDelDia.get(playerName);

        if (stats) {
          // 🧮 LA FÓRMULA MÁGICA DE ALFEDO
          const playerPoints = 
            (stats.runs * 2) +       
            (stats.hits * 1) +       
            (stats.rbi * 1) +        
            (stats.stolenBases * 1) + // (La API le dice stolenBases, no sb) 
            (stats.homeRuns * 3) -   
            (stats.strikeOuts * 1);   // (La API le dice strikeOuts)

          // Si el jugador sumó en negativo, lo dejamos en 0 para no castigar de más (Opcional, pero recomendado)
          puntosDeHoy += playerPoints > 0 ? playerPoints : 0; 
        }
      }

      // 7. Sumamos los puntos de hoy al histórico que ya tenía el equipo
      const totalTeamPoints = (team.pointsEarned || 0) + puntosDeHoy;

      await db.fantasyTeam.update({
        where: { id: team.id },
        data: { pointsEarned: totalTeamPoints } 
      });

      equiposProcesados++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se actualizaron los puntos de ${equiposProcesados} equipos de Fantasy.` 
    });

  } catch (error: any) {
    console.error("❌ Error en el Cron Job de Fantasy:", error);
    return NextResponse.json({ success: false, error: "Falla al procesar el Fantasy" }, { status: 500 });
  }
}