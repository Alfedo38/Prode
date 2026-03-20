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

// ==========================================
// 🔥 NUEVAS FUNCIONES PARA SALAS PRIVADAS
// ==========================================

// 4. CREAR UNA SALA NUEVA
export async function createLeague(name: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Debes iniciar sesión." };
    if (!name || name.trim() === "") return { success: false, error: "El nombre es obligatorio." };

    // Generamos un código aleatorio de 6 letras/números (Ej: M7X9PQ)
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newLeague = await db.league.create({
      data: {
        name: name.trim(),
        inviteCode: inviteCode,
        ownerId: userId,
        // Agregamos automáticamente al creador como el primer miembro
        members: {
          create: {
            userId: userId
          }
        }
      }
    });

    revalidatePath("/perfil");
    return { success: true, league: newLeague };
  } catch (error) {
    console.error("❌ Error en createLeague:", error);
    return { success: false, error: "Hubo un error al crear la sala." };
  }
}

// 5. UNIRSE A UNA SALA EXISTENTE
export async function joinLeague(inviteCode: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Debes iniciar sesión." };

    const code = inviteCode.trim().toUpperCase();
    if (!code) return { success: false, error: "Escribí un código válido." };

    // Buscamos si la sala existe
    const league = await db.league.findUnique({
      where: { inviteCode: code }
    });

    if (!league) {
      return { success: false, error: "Código incorrecto o sala no encontrada." };
    }

    // Verificamos si el usuario ya está en esta sala
    const existingMember = await db.leagueMember.findUnique({
      where: {
        leagueId_userId: {
          leagueId: league.id,
          userId: userId
        }
      }
    });

    if (existingMember) {
      return { success: false, error: "Ya sos miembro de esta sala." };
    }

    // Lo agregamos a la sala
    await db.leagueMember.create({
      data: {
        leagueId: league.id,
        userId: userId
      }
    });

    revalidatePath("/perfil");
    return { success: true, league };
  } catch (error) {
    console.error("❌ Error en joinLeague:", error);
    return { success: false, error: "Hubo un error al unirte a la sala." };
  }
}

// 6. OBTENER LAS SALAS DEL USUARIO
export async function getMyLeagues() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    // Buscamos a qué ligas pertenece este usuario
    const memberships = await db.leagueMember.findMany({
      where: { userId: userId },
      include: {
        league: true // Traemos los datos de la liga (nombre, código)
      },
      orderBy: { joinedAt: 'desc' }
    });

    // Mapeamos para devolver solo las ligas limpias
    return memberships.map(m => m.league);
  } catch (error) {
    console.error("❌ Error en getMyLeagues:", error);
    return [];
  }
}