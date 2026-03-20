// src/lib/mlbFantasy.ts

// 1. Buscamos todos los equipos activos de la MLB (son 30)
export async function fetchAllMLBTeams() {
  try {
    const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&active=true');
    const data = await response.json();
    
    const teams = data.teams.map((t: any) => ({
      id: t.id,
      name: t.name
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return teams;
  } catch (error) {
    console.error("Error fetching MLB teams:", error);
    return [];
  }
}

// 2. Buscamos el Roster completo de un equipo específico
export async function fetchTeamRoster(teamId: number) {
  try {
    const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`);
    const data = await response.json();
    
    const roster = data.roster.map((r: any) => ({
      id: r.person.id,
      name: r.person.fullName,
      positionAbbr: r.position.abbreviation,
      positionCode: r.position.code 
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return roster;
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}

// 3. NUEVA: Busca estadísticas diarias para el Árbitro del Fantasy
// Aplica la fórmula: (R*2) + H + RBI + SB + (HR*3) - K
export async function fetchPlayerDailyStats(playerName: string) {
  try {
    // Buscamos el ID del jugador por nombre
    const searchRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(playerName)}&active=true`
    );
    const searchData = await searchRes.json();

    if (!searchData.people || searchData.people.length === 0) {
      console.log(`⚠️ Jugador no encontrado: ${playerName}`);
      return null;
    }

    const playerId = searchData.people[0].id;

    // Traemos el Game Log de la temporada actual (2026)
    const statsRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=hitting&season=2026`
    );
    const statsData = await statsRes.json();

    // Si no tiene juegos registrados aún
    if (!statsData.stats || statsData.stats[0].splits.length === 0) {
      return { runs: 0, hits: 0, rbi: 0, sb: 0, homeRuns: 0, strikeouts: 0 };
    }

    // El primer elemento del split es el juego más reciente
    const lastGame = statsData.stats[0].splits[0].stat;

    return {
      runs: lastGame.runs || 0,
      hits: lastGame.hits || 0,
      rbi: lastGame.rbi || 0,
      sb: lastGame.stolenBases || 0,
      homeRuns: lastGame.homeRuns || 0,
      strikeouts: lastGame.strikeOuts || 0,
    };
  } catch (error) {
    console.error(`❌ Error en stats de ${playerName}:`, error);
    return null;
  }
}
// Agregalo en src/lib/mlbFantasy.ts
// En src/lib/mlbFantasy.ts
export async function getPitchersForSeries(homeId: number, awayId: number, homeAbbr: string, awayAbbr: string) {
  try {
    const homeRoster = await fetchTeamRoster(homeId);
    const awayRoster = await fetchTeamRoster(awayId);

    // Filtramos los pitchers y les "pegamos" la etiqueta de su equipo
    const homePitchers = homeRoster
      .filter((p: any) => p.positionCode === '1')
      .map((p: any) => ({ ...p, teamAbbr: homeAbbr })); // Agregamos el equipo local
      
    const awayPitchers = awayRoster
      .filter((p: any) => p.positionCode === '1')
      .map((p: any) => ({ ...p, teamAbbr: awayAbbr })); // Agregamos el equipo visitante

    // Los juntamos y ordenamos alfabéticamente
    return [...homePitchers, ...awayPitchers].sort((a: any, b: any) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
}