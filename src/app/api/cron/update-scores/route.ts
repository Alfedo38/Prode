// src/app/api/cron/update-scores/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { fetchWeekendSeries } from "@/lib/mlb";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    console.log("🤖 Iniciando el Árbitro Automático del Prode...");

    const allSeries = await fetchWeekendSeries();
    const finishedSeries = allSeries.filter((s: any) => s.status === "FINISHED" || s.isComplete);

    if (finishedSeries.length === 0) {
      return NextResponse.json({ message: "No hay series finalizadas para procesar hoy." });
    }

    let prediccionesProcesadas = 0;

    for (const series of finishedSeries) {
      const realWinnerId = series.awayWins > series.homeWins ? "AWAY" : "HOME";
      const realScore = series.awayWins > series.homeWins 
        ? `${series.awayWins}-${series.homeWins}` 
        : `${series.homeWins}-${series.awayWins}`;

      // Array con los resultados reales de cada juego (Ej: ["V", "L", "V"])
      // ESTO DEPENDE DE TU API: Asegurate de que fetchWeekendSeries devuelva 'gameWinners'
      const realPicks = series.gameWinners || []; 

      const userPredictions = await db.prediction.findMany({
        where: { 
          series: { mlbSeriesId: series.id },
          pointsEarned: 0 
        }
      });

      for (const prediction of userPredictions) {
        let earnedPoints = 0;

        // 🎯 REGLA 1: Acertar resultado exacto de la serie (+3 puntos)
        if (prediction.predictedScore === realScore) {
          earnedPoints += 3;
        }

        // 🏆 REGLA 2: Acertar ganador de la serie (+1 punto)
        if (prediction.predictedWinnerId === realWinnerId) {
          earnedPoints += 1;
        }

        // ⚾ REGLA 3: Acertar ganador por partido (+1 punto por cada uno)
        if (prediction.dailyPicks && realPicks.length > 0) {
          const userPicks = prediction.dailyPicks.split(','); // Ej: ["V", "L", "V"]
          
          userPicks.forEach((pick: string, index: number) => {
            if (pick === realPicks[index]) {
              earnedPoints += 1;
            }
          });
        }

        await db.prediction.update({
          where: { id: prediction.id },
          data: { pointsEarned: earnedPoints }
        });

        prediccionesProcesadas++;
      }

      await db.series.update({
        where: { mlbSeriesId: series.id },
        data: { status: "COMPLETED" }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se actualizaron los puntos de ${prediccionesProcesadas} pronósticos.` 
    });

  } catch (error: any) {
    console.error("❌ Error en el Cron Job:", error);
    return NextResponse.json({ success: false, error: "Falla al procesar los resultados" }, { status: 500 });
  }
}