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

    // 🛡️ ✅ PATOVICA DE DATOS (Validación estricta)
    // 1. Evitamos que manden textos gigantes para saturar la base de datos
    if (prediction.score && prediction.score.length > 10) {
      return { success: false, error: "El formato del resultado es inválido." };
    }

    // 2. Solo aceptamos valores reales para el ganador de la serie
    const allowedWinners = ["HOME", "AWAY", "TIE", ""];
    if (!allowedWinners.includes(prediction.winnerId)) {
      return { success: false, error: "Ganador de serie no válido." };
    }

    // 3. Limpiamos y validamos los picks diarios (Solo permitimos L, V y comas)
    const cleanDailyPicks = prediction.dailyPicks.toUpperCase().replace(/[^LV,]/g, '');
    if (cleanDailyPicks.length > 20) return { success: false, error: "Picks inválidos." };

    // 4. Limpiamos y validamos los pitchers (Solo permitimos S, I, N, O y comas)
    const pPicks = (prediction.pitcherPicks || "").toUpperCase().replace(/[^SINO,]/g, '');
    if (pPicks.length > 30) return { success: false, error: "Picks de pitcher inválidos." };

    // ⏱️ ✅ RELOJ ATÓMICO DEL SERVIDOR
    if (seriesData.firstGameTime) {
      const serverTime = new Date();
      const gameTime = new Date(seriesData.firstGameTime);

      if (serverTime > gameTime) {
        return { 
          success: false, 
          error: "Apuesta rechazada: Esta serie ya ha comenzado." 
        };
      }
    }

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

    // 2. Upsert de la Predicción del Usuario
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
        dailyPicks: cleanDailyPicks, // Guardamos la variable limpia
        pitcherPicks: pPicks         // Guardamos la variable limpia
      },
      create: { 
        userId: userId, 
        seriesId: series.id, 
        predictedWinnerId: prediction.winnerId, 
        predictedScore: prediction.score, 
        dailyPicks: cleanDailyPicks, // Guardamos la variable limpia
        pitcherPicks: pPicks,        // Guardamos la variable limpia
        totalRuns: 0 
      }
    });

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

    // 🛡️ ✅ PATOVICA DE FANTASY
    // Evitamos que un hacker mande un array con 50.000 jugadores
    if (!Array.isArray(players) || players.length > 15) {
      return { success: false, error: "Cantidad de jugadores inválida." };
    }

    // Filtramos para que solo queden textos limpios (evita inyecciones raras)
    const safePlayers = players.filter(p => typeof p === 'string').map(p => p.trim());
    const playerString = safePlayers.join(",");

    if (playerString.length > 500) {
      return { success: false, error: "Los datos del equipo son demasiado largos." };
    }

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

// ... (El resto de las funciones getMyFantasyTeam, createLeague, joinLeague y getMyLeagues quedan exactamente igual que en tu versión anterior)

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

export async function createLeague(name: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Debes iniciar sesión." };
    
    // 🛡️ Validación estricta del nombre de la sala
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 30) return { success: false, error: "El nombre debe tener entre 1 y 30 caracteres." };

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newLeague = await db.league.create({
      data: {
        name: cleanName,
        inviteCode: inviteCode,
        ownerId: userId,
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

export async function joinLeague(inviteCode: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Debes iniciar sesión." };

    const code = inviteCode.trim().toUpperCase();
    if (!code || code.length > 10) return { success: false, error: "Escribí un código válido." };

    const league = await db.league.findUnique({
      where: { inviteCode: code }
    });

    if (!league) {
      return { success: false, error: "Código incorrecto o sala no encontrada." };
    }

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

export async function getMyLeagues() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    const memberships = await db.leagueMember.findMany({
      where: { userId: userId },
      include: {
        league: true 
      },
      orderBy: { joinedAt: 'desc' }
    });

    return memberships.map(m => m.league);
  } catch (error) {
    console.error("❌ Error en getMyLeagues:", error);
    return [];
  }
}