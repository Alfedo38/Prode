// src/app/actions.ts
"use server"

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

// ==========================================
// 1. GUARDAR PREDICCIÓN DE SERIE
// ==========================================
export async function savePrediction(
  seriesData: any, 
  prediction: { winnerId: string, score: string, dailyPicks: string, pitcherPicks?: string }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Debes iniciar sesión para guardar tu prode." };
    }

    if (!seriesData || !seriesData.id) {
      return { success: false, error: "Faltan datos de la serie." };
    }

    // ✅ Lo hacemos más flexible para evitar errores de bloqueo
    const pPicks = prediction.pitcherPicks || "";

    const startDate = seriesData.firstGameTime 
      ? new Date(seriesData.firstGameTime) 
      : new Date();

    // 1. Upsert de la Serie
    const series = await db.series.upsert({
      where: { mlbSeriesId: seriesData.id.toString() },
      update: {
        homeTeam: seriesData.homeTeam,
        awayTeam: seriesData.awayTeam,
      },
      create: {
        mlbSeriesId: seriesData.id.toString(),
        homeTeam: seriesData.homeTeam,
        awayTeam: seriesData.awayTeam,
        startDate: startDate,
        endDate: startDate,
        firstGameTime: startDate,
        status: "UPCOMING"
      }
    });

    // 2. Upsert de la Predicción del Usuario (Guardamos picks y pitchers)
    await db.prediction.upsert({
      where: { 
        userId_seriesId: { 
          userId: userId, 
          seriesId: series.id 
        } 
      },
      update: { 
        predictedWinnerId: prediction.winnerId, 
        predictedScore: prediction.score, 
        dailyPicks: prediction.dailyPicks,
        pitcherPicks: pPicks // ✅ Usamos la variable segura
      },
      create: { 
        userId: userId, 
        seriesId: series.id, 
        predictedWinnerId: prediction.winnerId, 
        predictedScore: prediction.score, 
        dailyPicks: prediction.dailyPicks, 
        pitcherPicks: pPicks, // ✅ Usamos la variable segura
        totalRuns: 0 
      }
    });

    // Actualizamos las vistas
    revalidatePath("/series");
    revalidatePath("/");
    
    return { success: true };

  } catch (error: any) {
    console.error("❌ Error en savePrediction:", error);
    return { 
      success: false, 
      error: "Error interno al guardar. Revisa la consola del servidor." 
    };
  }
}

// ==========================================
// 2. GUARDAR EQUIPO FANTASY
// ==========================================
export async function saveFantasyTeam(players: string[]) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Debes iniciar sesión para guardar tu equipo." };
    }

    const playerString = players.join(",");

    await db.fantasyTeam.upsert({
      where: { userId: userId },
      update: { playerNames: playerString },
      create: { 
        userId: userId, 
        playerNames: playerString, 
        pointsEarned: 0 
      }
    });

    revalidatePath("/fantasy");
    return { success: true };

  } catch (error: any) {
    console.error("❌ Error en saveFantasyTeam:", error);
    return { 
      success: false, 
      error: "Error interno al guardar el equipo Fantasy." 
    };
  }
}

// ==========================================
// 3. OBTENER EQUIPO FANTASY
// ==========================================
export async function getMyFantasyTeam() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const team = await db.fantasyTeam.findUnique({
      where: { userId: userId }
    });
    
    return team;

  } catch (error) {
    console.error("❌ Error en getMyFantasyTeam:", error);
    return null;
  }
}