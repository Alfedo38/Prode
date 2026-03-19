// src/app/ranking/page.tsx
import db from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const rankings = await db.prediction.groupBy({
    by: ['userId'],
    _sum: {
      pointsEarned: true,
    },
    orderBy: {
      _sum: {
        pointsEarned: 'desc',
      },
    },
  });

  const client = await clerkClient();
  let clerkUsers: any[] = [];
  
  if (rankings.length > 0) {
    const userIds = rankings.map((r) => r.userId);
    try {
      const response = await client.users.getUserList({ userId: userIds });
      clerkUsers = response.data;
    } catch (error) {
      console.error("Error trayendo usuarios de Clerk:", error);
    }
  }

  const leaderboard = rankings.map((rank, index) => {
    const user = clerkUsers.find((u) => u.id === rank.userId);
    
    // ACÁ EL CAMBIO: Le damos prioridad 100% al username único
    const displayName = user?.username || user?.firstName || "Jugador Sin Nombre";

    return {
      position: index + 1,
      id: rank.userId,
      name: displayName,
      imageUrl: user?.imageUrl || "",
      points: rank._sum.pointsEarned || 0,
    };
  });

  return (
    // ACÁ EL CAMBIO VISUAL: Agregamos bg-slate-950 y text-slate-100 para matar el fondo blanco
    <main className="bg-slate-950 text-slate-100 p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2 uppercase">
            Ranking <span className="text-blue-500">Global</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Temporada 2026
          </p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 md:p-8 shadow-2xl">
          
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">
            <div className="col-span-2 text-center">Pos</div>
            <div className="col-span-8">Jugador</div>
            <div className="col-span-2 text-right">Pts</div>
          </div>

          <div className="mt-4 space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.map((player) => (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl transition-all ${
                    player.position === 1 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-950/50 border border-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="col-span-2 flex justify-center">
                    {player.position === 1 ? <span className="text-2xl" title="Oro">🥇</span> :
                     player.position === 2 ? <span className="text-2xl" title="Plata">🥈</span> :
                     player.position === 3 ? <span className="text-2xl" title="Bronce">🥉</span> :
                     <span className="font-black text-slate-500 text-lg">{player.position}</span>}
                  </div>

                  <div className="col-span-8 flex items-center gap-4">
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className="w-10 h-10 rounded-full border-2 border-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <span className={`font-black uppercase truncate ${player.position === 1 ? 'text-blue-400' : 'text-slate-200'}`}>
                      {player.name}
                    </span>
                  </div>

                  <div className="col-span-2 text-right font-black text-xl italic text-white">
                    {player.points}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 font-bold uppercase tracking-widest">
                  Todavía no hay pronósticos registrados.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}