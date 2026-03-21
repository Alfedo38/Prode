// src/app/page.tsx
import Link from "next/link";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import db from "@/lib/db"; // Importamos la base de datos

export default async function Home() {
  // Comprobamos si el usuario está logueado desde el servidor
  const user = await currentUser();

  // === LÓGICA DE RANKING REAL ===
  const rankingData = await db.prediction.groupBy({
    by: ['userId'],
    _sum: { pointsEarned: true },
    orderBy: { _sum: { pointsEarned: 'desc' } },
    take: 3, 
  });

  const client = await clerkClient();
  const userIds = rankingData.map(r => r.userId);
  let usersInfo: any[] = [];
  
  if (userIds.length > 0) {
    const response = await client.users.getUserList({ userId: userIds });
    usersInfo = response.data;
  }

  const topPlayers = rankingData.map(r => {
    const clerkUser = usersInfo.find(u => u.id === r.userId);
    return {
      name: clerkUser?.firstName || clerkUser?.username || "Mánager",
      points: r._sum.pointsEarned || 0
    };
  }).filter(player => player.points > 0); 

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* 1. HERO SECTION (Diseño PRODEMLB) */}
      <section className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-5 text-center md:text-left">
          <div className="inline-block bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 shadow-inner mb-2">
            <p className="text-[9px] font-black uppercase text-red-500 tracking-[0.3em]">Opening Day 2026</p>
          </div>
          
          {/* TEXTO CORREGIDO: Evitamos la palabra "Oficial" */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none text-white">
            EL PRODE <br className="hidden md:block"/> DEFINITIVO <br className="md:hidden"/>
            DE <span className="text-blue-500">BÈISBOL</span>
          </h1>
          
          <p className="text-slate-400 font-bold max-w-md mx-auto md:mx-0 text-xs md:text-sm tracking-widest uppercase">
            Demostrá tus conocimientos de Béisbol Profesional. Jugá con amigos, sumá puntos y convertite en el Mánager del Año.
          </p>
          
          <div className="pt-4 flex justify-center md:justify-start">
            <Link href="/series" className="bg-blue-800 hover:bg-blue-700 border border-blue-600 px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] md:text-xs text-white transition-all shadow-[0_0_20px_rgba(30,58,138,0.5)] flex items-center gap-3">
              <span>⚾</span> Votar Jornada
            </Link>
          </div>
        </div>
        
        {/* Decoración visual de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-900/20 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. MINI RANKING REAL (Top 3) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-xl">
          <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2 text-white">
            Top <span className="text-amber-400 font-black">Líderes</span>
          </h3>
          
          <div className="space-y-4">
            {topPlayers.length > 0 ? (
              topPlayers.map((player, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-500 w-4 text-center text-xs">#{i+1}</span>
                    <span className="font-bold text-sm text-slate-200 truncate max-w-[120px]">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 italic text-lg">{player.points}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">PTS</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aún no hay puntos</p>
                <p className="text-slate-600 text-[9px] font-bold mt-1">¡Sé el primero en liderar!</p>
              </div>
            )}
          </div>

          <Link href="/ranking" className="block text-center mt-6 text-[10px] font-black uppercase text-slate-500 hover:text-blue-500 tracking-[0.2em] transition-colors">
            Ver Tabla Completa →
          </Link>
        </div>

        {/* 3. FANTASY CTA & SALAS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Banner de Fantasy */}
          <Link href="/fantasy" className="group block relative overflow-hidden bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 hover:border-emerald-500/30 transition-all shadow-xl">
            <div className="relative z-10">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-widest mb-4 inline-block">
                Draft Abierto
              </span>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase text-white mb-2">
                Armá tu <span className="text-emerald-500">Equipo</span></h2>
              <p className="text-slate-400 font-medium max-w-sm mb-6 text-xs md:text-sm">
                Elegí tus 9 estrellas para el finde y sumá puntos según su rendimiento real.
              </p>
              <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest group-hover:translate-x-2 transition-transform inline-block">
                Empezar Draft →
              </span>
            </div>
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-64 h-64 bg-emerald-900/20 blur-[60px] rounded-full pointer-events-none"></div>
          </Link>

          {/* Banner de Salas Privadas */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black uppercase italic text-white mb-2">Salas <span className="text-red-500">Privadas</span></h3>
              <p className="text-slate-400 text-xs md:text-sm font-medium">Jugá contra tus amigos en un grupo cerrado y demostrá quién manda en la oficina.</p>
            </div>
            <div className="w-full md:w-auto shrink-0">
              {user ? (
                <Link href="/perfil" className="block text-center w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white font-black px-6 py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-colors border border-slate-700">
                  Ver mis Salas
                </Link>
              ) : (
                <Link href="/sign-in" className="block text-center w-full md:w-auto bg-red-600 hover:bg-red-500 text-white font-black px-6 py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-colors shadow-lg shadow-red-900/20">
                  Iniciá sesión para unirte
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}