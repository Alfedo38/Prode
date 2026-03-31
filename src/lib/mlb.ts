// src/lib/mlb.ts
export async function fetchWeekendSeries() {
  // 📅 LÓGICA DINÁMICA: SOLO FINES DE SEMANA (Jueves a Domingo)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 es Domingo, 1 es Lunes... 4 es Jueves.
  
  // Calculamos a cuántos días estamos del Jueves de esta semana
  let daysToThursday = 4 - dayOfWeek;
  if (dayOfWeek === 0) {
    // Si hoy es Domingo, el Jueves fue hace 3 días atrás
    daysToThursday = -3; 
  }
  
  // Fijamos el inicio de nuestra búsqueda en el JUEVES
  const startOfWeekend = new Date(today);
  startOfWeekend.setDate(today.getDate() + daysToThursday);
  const start = startOfWeekend.toISOString().split('T')[0];

  // Fijamos el final de nuestra búsqueda en el DOMINGO (3 días después del Jueves)
  const endOfWeekend = new Date(startOfWeekend);
  endOfWeekend.setDate(startOfWeekend.getDate() + 3);
  const end = endOfWeekend.toISOString().split('T')[0];

  // Buscamos los partidos de la MLB estrictamente en ese bloque de Jue a Dom
  const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${start}&endDate=${end}&gameType=R&hydrate=probablePitcher`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!data.dates) return [];

    const seriesMap = new Map();

    data.dates.forEach((date: any) => {
      date.games.forEach((game: any) => {
        const teamIds = [game.teams.home.team.id, game.teams.away.team.id].sort();
        const seriesKey = `${teamIds[0]}-${teamIds[1]}`;

        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, {
            id: seriesKey,
            mlbSeriesId: seriesKey,
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            homeId: game.teams.home.team.id,
            awayId: game.teams.away.team.id,
            homeAbbr: game.teams.home.team.abbreviation,
            awayAbbr: game.teams.away.team.abbreviation,
            firstGameTime: game.gameDate, 
            gameCount: 0,
            games: [],
            homeRecord: {
              wins: game.teams.home.leagueRecord?.wins || 0,
              losses: game.teams.home.leagueRecord?.losses || 0,
              pct: game.teams.home.leagueRecord?.pct || ".000"
            },
            awayRecord: {
              wins: game.teams.away.leagueRecord?.wins || 0,
              losses: game.teams.away.leagueRecord?.losses || 0,
              pct: game.teams.away.leagueRecord?.pct || ".000"
            }
          });
        }

        const current = seriesMap.get(seriesKey);
        current.gameCount++;

        const homeP = game.teams.home.probablePitcher;
        const awayP = game.teams.away.probablePitcher;

        current.games.push({
          gameId: game.gamePk,
          gameDate: game.gameDate,
          pitchers: [
            { id: homeP?.id || `h-${game.gamePk}`, name: homeP?.fullName || "TBA (Local)", teamAbbr: game.teams.home.team.abbreviation },
            { id: awayP?.id || `a-${game.gamePk}`, name: awayP?.fullName || "TBA (Visitante)", teamAbbr: game.teams.away.team.abbreviation }
          ]
        });
      });
    });

    return Array.from(seriesMap.values())
      // 🛡️ FILTRO ESTRICTO: Solo devolvemos las series que tengan EXACTAMENTE 3 partidos
      .filter(s => s.gameCount === 3)
      .sort((a, b) => new Date(a.firstGameTime).getTime() - new Date(b.firstGameTime).getTime());

  } catch (error) {
    console.error("❌ Error MLB API:", error);
    return [];
  }
}