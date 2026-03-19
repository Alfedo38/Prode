// src/app/actions.ts
"use server"
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// 1. Guardar Predicción de Serie (Ya lo tenías, lo mantenemos)
export async function savePrediction(
  seriesData: any, 
  prediction: { winnerId: string, score: string, dailyPicks: string }
) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Debes iniciar sesión" };

  try {
    const series = await db.series.upsert({
      where: { mlbSeriesId: seriesData.id },
      update: {},
      create: {
        mlbSeriesId: seriesData.id,
        homeTeam: seriesData.homeTeam,
        awayTeam: seriesData.awayTeam,
        startDate: new Date(seriesData.firstGameTime),
        endDate: new Date(seriesData.firstGameTime),
        firstGameTime: new Date(seriesData.firstGameTime),
        status: "UPCOMING"
      }
    });

    await db.prediction.upsert({
      where: { userId_seriesId: { userId: userId, seriesId: series.id } },
      update: { predictedWinnerId: prediction.winnerId, predictedScore: prediction.score, dailyPicks: prediction.dailyPicks },
      create: { userId: userId, seriesId: series.id, predictedWinnerId: prediction.winnerId, predictedScore: prediction.score, dailyPicks: prediction.dailyPicks, totalRuns: 0 }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar predicción:", error);
    return { success: false, error: "Falla de base de datos" };
  }
}

// 2. Guardar Equipo Fantasy (Ya lo tenías, lo mantenemos)
export async function saveFantasyTeam(players: string[]) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Debes iniciar sesión" };

  const playerString = players.join(",");

  try {
    await db.fantasyTeam.upsert({
      where: { userId: userId },
      update: { playerNames: playerString },
      create: { userId: userId, playerNames: playerString, pointsEarned: 0 }
    });

    revalidatePath("/fantasy");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar Fantasy:", error);
    return { success: false, error: "Falla de base de datos" };
  }
}

// 3. LEER Equipo Fantasy (Corregida para evitar que la UI se cuelgue)
export async function getMyFantasyTeam() {
  const { userId } = await auth();
  if (!userId) return null; // Si no hay usuario, devolvemos null rápido

  try {
    const team = await db.fantasyTeam.findUnique({
      where: { userId: userId }
    });
    // Si no tiene equipo creado, Prisma devuelve null, lo pasamos tal cual
    return team;
  } catch (error) {
    console.error("Error al buscar el equipo Fantasy:", error);
    return null; // En caso de error de DB, devolvemos null para no trabar la UI
  }
}