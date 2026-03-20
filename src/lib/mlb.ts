// src/lib/mlb.ts
export async function fetchWeekendSeries() {
  const openingDay = new Date("2026-03-26T12:00:00Z"); 
  const start = openingDay.toISOString().split('T')[0];
  const endLimit = new Date(openingDay);
  endLimit.setDate(openingDay.getDate() + 5);
  const end = endLimit.toISOString().split('T')[0];

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
            homeId: game.teams.home.team.id, // ✅ AGREGADO
            awayId: game.teams.away.team.id, // ✅ AGREGADO
            homeAbbr: game.teams.home.team.abbreviation,
            awayAbbr: game.teams.away.team.abbreviation,
            firstGameTime: game.gameDate, 
            gameCount: 0,
            games: [],
            // 📊 ACA AGREGAMOS LOS RÉCORDS REALES DE LA API
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
      .filter(s => s.gameCount === 3)
      .sort((a, b) => new Date(a.firstGameTime).getTime() - new Date(b.firstGameTime).getTime());

  } catch (error) {
    console.error("❌ Error MLB API:", error);
    return [];
  }
}