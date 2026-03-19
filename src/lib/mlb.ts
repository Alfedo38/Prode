// src/lib/mlb.ts
export async function fetchWeekendSeries() {
  // Opening Day 2026 (Para ver datos reales ahora mismo)
  const openingDay = new Date("2026-03-26T12:00:00Z"); 
  const start = openingDay.toISOString().split('T')[0];
  const endLimit = new Date(openingDay);
  endLimit.setDate(openingDay.getDate() + 5);
  const end = endLimit.toISOString().split('T')[0];

  const url = `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${start}&endDate=${end}&gameType=R`;

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
            homeTeam: game.teams.home.team.name,
            awayTeam: game.teams.away.team.name,
            firstGameTime: game.gameDate, 
            gameCount: 0,
            individualGames: []
          });
        }

        const current = seriesMap.get(seriesKey);
        current.gameCount++;
        current.individualGames.push(game.gameDate);
        
        if (new Date(game.gameDate) < new Date(current.firstGameTime)) {
          current.firstGameTime = game.gameDate;
        }
      });
    });

    // Filtramos solo Bo3 (3 juegos) de fin de semana
    return Array.from(seriesMap.values())
      .filter(s => s.gameCount === 3)
      .sort((a, b) => new Date(a.firstGameTime).getTime() - new Date(b.firstGameTime).getTime());

  } catch (error) {
    console.error("Error MLB API:", error);
    return [];
  }
}