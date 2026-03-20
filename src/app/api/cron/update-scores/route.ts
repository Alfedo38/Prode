// src/app/api/cron/update-scores/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  // 🔒 1. Tu seguridad de Vercel intacta
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log("🤖 Iniciando el Árbitro Automático del Prode...");

    // ⚾ 2. Buscamos los resultados reales directo en la MLB
    // Usamos Opening Day (Modificá estas fechas según la jornada)
    const start = "2026-03-26";
    const end = "2026-03-31";
    const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${start}&endDate=${end}&gameType=R&hydrate=decisions,probablePitcher`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.dates) {
      return NextResponse.json({ message: "No hay datos de la MLB para hoy." });
    }

    // 3. Organizamos los resultados reales por Serie
    const realResults = new Map();

    data.dates.forEach((date: any) => {
      date.games.forEach((game: any) => {
        // Solo evaluamos si el partido terminó ('F')
        if (game.status.statusCode === 'F') {
          const teamIds = [game.teams.home.team.id, game.teams.away.team.id].sort();
          const seriesKey = `${teamIds[0]}-${teamIds[1]}`;

          if (!realResults.has(seriesKey)) {
            realResults.set(seriesKey, { homeWins: 0, awayWins: 0, games: [] });
          }

          const sr = realResults.get(seriesKey);
          
          // A. ¿Quién ganó?
          const isHomeWin = game.teams.home.isWinner;
          if (isHomeWin) sr.homeWins++; else sr.awayWins++;
          const winnerPick = isHomeWin ? "L" : "V";

          // B. Lógica del Pitcher Abridor (SI/NO)
          const winningPitcherId = game.decisions?.winner?.id;
          const homeSP = game.teams.home.probablePitcher?.id;
          const awaySP = game.teams.away.probablePitcher?.id;
          const didSPWin = (winningPitcherId === homeSP || winningPitcherId === awaySP) ? "SI" : "NO";

          sr.games.push({ winnerPick, didSPWin });
        }
      });
    });

    // 4. Traemos los pronósticos que todavía no se calcularon (puntos = 0)
    const userPredictions = await db.prediction.findMany({
      where: { pointsEarned: 0 },
      include: { series: true }
    });

    let prediccionesProcesadas = 0;

    // 5. El Cerebro: Cruzamos datos y calculamos
    for (const pred of userPredictions) {
      const sr = realResults.get(pred.series.mlbSeriesId);
      
      // Si la serie tiene juegos terminados
      if (sr && sr.games.length > 0) {
        let earnedPoints = 0;

        // 🎯 REGLA 1 y 2: Puntos de Serie (Solo si ya jugaron los 3, o alguien ganó 2)
        if (sr.homeWins + sr.awayWins === 3 || sr.homeWins === 2 || sr.awayWins === 2) {
          const realWinnerId = sr.awayWins > sr.homeWins ? "AWAY" : "HOME";
          const realScore = sr.awayWins > sr.homeWins ? `${sr.awayWins}-${sr.homeWins}` : `${sr.homeWins}-${sr.awayWins}`;

          if (pred.predictedWinnerId === realWinnerId) earnedPoints += 1; // Ganador
          if (pred.predictedScore === realScore) earnedPoints += 3;       // Resultado Exacto
        }

        // ⚾ REGLA 3 y 4: Puntos por cada Partido
        const userPicks = pred.dailyPicks ? pred.dailyPicks.split(',') : [];
        const userPitchers = pred.pitcherPicks ? pred.pitcherPicks.split(',') : [];

        sr.games.forEach((gameResult: any, index: number) => {
          // Acierto ganador partido (V o L) = +1 pto
          if (userPicks[index] === gameResult.winnerPick) {
            earnedPoints += 1;
          }
          // Acierto Pitcher (SI o NO) = +3 ptos
          if (userPitchers[index] === gameResult.didSPWin) {
            earnedPoints += 3;
          }
        });

        // 💾 Guardamos en Base de Datos
        await db.prediction.update({
          where: { id: pred.id },
          data: { pointsEarned: earnedPoints }
        });

        prediccionesProcesadas++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se actualizaron los puntos de ${prediccionesProcesadas} pronósticos.` 
    });

  } catch (error: any) {
    console.error("❌ Error en el Cron Job:", error);
    return NextResponse.json({ success: false, error: "Falla al procesar resultados" }, { status: 500 });
  }
}