// src/app/api/cron/update-fantasy/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
// Asumimos que vas a crear/tener una función en tu API para traer las stats del día
import { fetchPlayerDailyStats } from "@/lib/mlbFantasy"; 

export async function GET(request: Request) {
  // 1. SEGURIDAD (La misma que en el Prode)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log("🔥 Iniciando el Árbitro Automático del Fantasy...");

    // 2. Traemos todos los equipos de Fantasy de la base de datos
    // (Asegurate de que el nombre de tu tabla sea fantasyTeam o el que estés usando)
    const allFantasyTeams = await db.fantasyTeam.findMany();

    if (allFantasyTeams.length === 0) {
      return NextResponse.json({ message: "No hay equipos de Fantasy armados todavía." });
    }

    let equiposProcesados = 0;

    // 3. Procesamos cada equipo (los 9 jugadores de cada usuario)
    for (const team of allFantasyTeams) {
      if (!team.playerNames) continue;

      // Separamos los 9 jugadores (vienen como "Shohei Ohtani (LAD - DH), Aaron Judge (NYY - CF)...")
      const players = team.playerNames.split(',');
      
      // Partimos del puntaje que ya tenían de días anteriores
     let totalTeamPoints = team.pointsEarned || 0;

      for (const playerString of players) {
        if (!playerString) continue;

        // Extraemos solo el nombre para buscarlo en la API (ej: de "Shohei Ohtani (LAD - DH)" sacamos "Shohei Ohtani")
        const playerName = playerString.split(' (')[0].trim();

        // 4. Le preguntamos a la API de MLB cómo le fue a este jugador HOY
        const stats = await fetchPlayerDailyStats(playerName);

        if (stats) {
          // 5. 🧮 LA FÓRMULA MÁGICA DE ALFEDO
          const playerPoints = 
            (stats.runs * 2) +       // Carreras Anotadas (R)
            (stats.hits * 1) +       // Hits (H)
            (stats.rbi * 1) +        // Carreras Impulsadas (RBI)
            (stats.sb * 1) +         // Robos de Base (SB)
            (stats.homeRuns * 3) -   // Home Runs (HR)
            (stats.strikeouts * 1);  // Ponches (K) - ¡Resta 1!

          totalTeamPoints += playerPoints;
        }
      }

      // 6. Guardamos el nuevo puntaje total en la base de datos para ese usuario
      await db.fantasyTeam.update({
        where: { id: team.id },
        data: { totalPoints: totalTeamPoints }
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