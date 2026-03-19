// src/lib/mlbFantasy.ts

// 1. Buscamos todos los equipos activos de la MLB (son 30)
export async function fetchAllMLBTeams() {
  try {
    const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1&active=true');
    const data = await response.json();
    
    // Mapeamos para quedarnos solo con ID y Nombre completo (ordenados alfabéticamente)
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
    
    // Mapeamos para tener Nombre, ID, y Posición (abreviada y código)
    // El 'primaryPosition.code' es clave para saber dónde ponerlo en el campo.
    const roster = data.roster.map((r: any) => ({
      id: r.person.id,
      name: r.person.fullName,
      positionAbbr: r.position.abbreviation,
      positionCode: r.position.code // '1'=Pitcher, '2'=Catcher, '3'=1B, etc.
    })).sort((a: any, b: any) => a.name.localeCompare(b.name)); // Ordenados por nombre

    return roster;
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}