// src/app/api/cron/update-scores/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  // 🔒 1. Seguridad de Vercel
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log("🤖 Iniciando el Árbitro Automático del Prode...");

    // 📅 2. FECHAS DINÁMICAS: Buscamos desde hace 4 días hasta hoy
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 4); 

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    // ⚾ 3. Buscamos resultados en la MLB (gameType=R para Temporada Regular)
    const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${start}&endDate=${end}&gameType=R&hydrate=decisions,probablePitcher`;

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!data.dates || data.dates.length === 0) {
      return NextResponse.json({ message: "No hay partidos finalizados en este rango de fechas." });
    }

    const realResults = new Map();

    data.dates.forEach((date: any) => {
      date.games.forEach((game: any) => {
        if (game.status.statusCode === 'F') {
          const teamIds = [game.teams.home.team.id, game.teams.away.team.id].sort();
          const seriesKey = `${teamIds[0]}-${teamIds[1]}`;

          if (!realResults.has(seriesKey)) {
            realResults.set(seriesKey, { homeWins: 0, awayWins: 0, games: [] });
          }

          const sr = realResults.get(seriesKey);
          
          const isHomeWin = game.teams.home.isWinner;
          if (isHomeWin) sr.homeWins++; else sr.awayWins++;
          const winnerPick = isHomeWin ? "L" : "V";

          const winningPitcherId = game.decisions?.winner?.id;
          const homeSP = game.teams.home.probablePitcher?.id;
          const awaySP = game.teams.away.probablePitcher?.id;
          const didSPWin = (winningPitcherId === homeSP || winningPitcherId === awaySP) ? "SI" : "NO";

          sr.games.push({ winnerPick, didSPWin });
        }
      });
    });

    // 🛡️ 4. BLINDAJE: Traemos TODAS las predicciones. 
    // Al recalcular todo, evitamos sumar puntos duplicados si el Cron corre dos veces.
    const userPredictions = await db.prediction.findMany({
      include: { series: true }
    });

    let prediccionesProcesadas = 0;

    for (const pred of userPredictions) {
      const sr = realResults.get(pred.series.mlbSeriesId);
      
      if (sr && sr.games.length > 0) {
        let earnedPoints = 0;

        // Reglas de Serie
        if (sr.homeWins + sr.awayWins === 3 || sr.homeWins === 2 || sr.awayWins === 2) {
          const realWinnerId = sr.awayWins > sr.homeWins ? "AWAY" : "HOME";
          const realScore = sr.awayWins > sr.homeWins ? `${sr.awayWins}-${sr.homeWins}` : `${sr.homeWins}-${sr.awayWins}`;

          if (pred.predictedWinnerId === realWinnerId) earnedPoints += 1; 
          if (pred.predictedScore === realScore) earnedPoints += 3;       
        }

        // Reglas de Partidos Individuales
        const userPicks = pred.dailyPicks ? pred.dailyPicks.split(',') : [];
        const userPitchers = pred.pitcherPicks ? pred.pitcherPicks.split(',') : [];

        sr.games.forEach((gameResult: any, index: number) => {
          if (userPicks[index] === gameResult.winnerPick) earnedPoints += 1;
          if (userPitchers[index] === gameResult.didSPWin) earnedPoints += 3;
        });

        // Guardamos el puntaje total recalculado
        await db.prediction.update({
          where: { id: pred.id },
          data: { pointsEarned: earnedPoints }
        });

        prediccionesProcesadas++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se actualizaron los puntos de ${prediccionesProcesadas} pronósticos con la realidad.` 
    });

  } catch (error: any) {
    console.error("❌ Error en el Cron Job del Prode:", error);
    return NextResponse.json({ success: false, error: "Falla al procesar resultados" }, { status: 500 });
  }
}