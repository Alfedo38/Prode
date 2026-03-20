// src/app/ranking/page.tsx
import db from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// En Next.js 15+, searchParams es una promesa que debemos resolver
export default async function RankingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  
  // 1. Lógica de Paginación
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const LIMIT_PER_PAGE = 50;
  const skipAmount = (currentPage - 1) * LIMIT_PER_PAGE;

  // 2. Buscamos SOLO los 50 usuarios de la página actual
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
    take: LIMIT_PER_PAGE,
    skip: skipAmount,
  });

  // 3. Calculamos cuántas páginas hay en total
  const totalUsersGroups = await db.prediction.groupBy({
    by: ['userId'],
  });
  const totalPages = Math.ceil(totalUsersGroups.length / LIMIT_PER_PAGE);

  // 4. Buscamos los datos en Clerk solo de estos 50
  const client = await clerkClient();
  let clerkUsers: any[] = [];
  
  if (rankings.length > 0) {
    const userIds = rankings.map((r) => r.userId);
    try {
      const response = await client.users.getUserList({ userId: userIds });
      clerkUsers = response.data;
    } catch (error) {
      console.error("❌ Error trayendo usuarios de Clerk:", error);
    }
  }

  // 5. Armamos la tabla
  const leaderboard = rankings.map((rank, index) => {
    const user = clerkUsers.find((u) => u.id === rank.userId);
    const displayName = user?.username || user?.firstName || "Jugador Sin Nombre";

    return {
      // Le sumamos el "skipAmount" para que en la pág 2 la posición empiece en 51, no en 1 de vuelta.
      position: skipAmount + index + 1,
      id: rank.userId,
      name: displayName,
      imageUrl: user?.imageUrl || "",
      points: rank._sum.pointsEarned || 0,
    };
  });

  return (
    <main className="min-h-screen p-4 md:p-8 pt-8 max-w-5xl mx-auto text-slate-100 bg-slate-950">
      
      {/* Botón Volver */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 mb-8 font-bold uppercase text-[10px] tracking-[0.2em] transition-colors"
      >
        <span>←</span> Volver a la Boleta
      </Link>

      {/* CABECERA */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white mb-2 uppercase">
          Ranking <span className="text-blue-500">Global</span>
        </h1>
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
          Los puntos se actualizan cada lunes a las 05:00 AM
        </p>
      </div>
        
      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 md:p-8 shadow-2xl">
        
        <div className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-800/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4">
          <div className="col-span-2 text-center">Pos</div>
          <div className="col-span-8">Mánager</div>
          <div className="col-span-2 text-right">Pts</div>
        </div>

        <div className="mt-4 space-y-3">
          {leaderboard.length > 0 ? (
            leaderboard.map((player) => {
              const isFirst = player.position === 1;
              const isSecond = player.position === 2;
              const isThird = player.position === 3;
              
              let rowStyle = "bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700";
              let nameStyle = "text-slate-200";
              let posIcon = <span className="font-black text-slate-600 text-xl">{player.position}</span>;

              if (isFirst) {
                rowStyle = "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]";
                nameStyle = "text-amber-400";
                posIcon = <span className="text-3xl drop-shadow-md" title="Oro">🥇</span>;
              } else if (isSecond) {
                rowStyle = "bg-slate-300/10 border-slate-400/30";
                nameStyle = "text-slate-300";
                posIcon = <span className="text-3xl drop-shadow-md" title="Plata">🥈</span>;
              } else if (isThird) {
                rowStyle = "bg-orange-700/10 border-orange-500/30";
                nameStyle = "text-orange-400";
                posIcon = <span className="text-3xl drop-shadow-md" title="Bronce">🥉</span>;
              }

              return (
                <div key={player.id} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border transition-all ${rowStyle}`}>
                  <div className="col-span-2 flex justify-center items-center">{posIcon}</div>
                  <div className="col-span-8 flex items-center gap-4 min-w-0">
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full border-2 border-slate-800 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-black text-slate-500 shrink-0">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <span className={`font-black uppercase truncate text-sm md:text-lg tracking-tight ${nameStyle}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-black italic text-2xl md:text-3xl text-white">
                    {player.points}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 flex flex-col items-center justify-center">
              <span className="text-6xl mb-4 opacity-50">⚾</span>
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
                La temporada acaba de empezar.<br/>Aún no hay puntos registrados.
              </p>
            </div>
          )}
        </div>

        {/* 6. CONTROLES DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="mt-8 pt-8 border-t border-slate-800/50 flex items-center justify-between gap-4">
            {currentPage > 1 ? (
              <Link 
                href={`/ranking?page=${currentPage - 1}`} 
                className="bg-slate-950 border border-slate-800 hover:border-blue-500 hover:text-white text-slate-500 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                ← Anterior
              </Link>
            ) : (
              <div className="px-6 py-4 opacity-0 pointer-events-none">← Anterior</div>
            )}
            
            <div className="flex flex-col items-center">
              <span className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em]">Página</span>
              <span className="text-white font-black italic text-lg">{currentPage} <span className="text-slate-600">/ {totalPages}</span></span>
            </div>

            {currentPage < totalPages ? (
              <Link 
                href={`/ranking?page=${currentPage + 1}`} 
                className="bg-slate-950 border border-slate-800 hover:border-blue-500 hover:text-white text-slate-500 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Siguiente →
              </Link>
            ) : (
              <div className="px-6 py-4 opacity-0 pointer-events-none">Siguiente →</div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}