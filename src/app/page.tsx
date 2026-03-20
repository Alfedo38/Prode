// src/app/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";

export default async function Home() {
  // Aquí luego traeremos datos reales del Ranking
  const topPlayers = [
    { name: "Alfedo", points: 150, trend: "up" },
    { name: "JuanSoto Fan", points: 142, trend: "up" },
    { name: "Mookie_10", points: 138, trend: "down" },
  ];

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto space-y-10">
      
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-900 via-slate-900 to-black p-10 rounded-[3rem] border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">
            MLB <span className="text-blue-500">Prode</span> <br /> Dashboard
          </h1>
          <p className="text-slate-400 font-bold max-w-md">
            La temporada está que arde. ¿Ya dejaste tus pronósticos para este fin de semana?
          </p>
          <div className="flex gap-4 pt-4">
            <Link href="/series" className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-blue-900/40">
              Votar Jornada
            </Link>
          </div>
        </div>
        {/* Decoración visual de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. MINI RANKING (Top 5) */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
            Top <span className="text-blue-500 font-black">Líderes</span> 🔥
          </h3>
          <div className="space-y-4">
            {topPlayers.map((player, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-black text-blue-500 w-4 text-center">#{i+1}</span>
                  <span className="font-bold">{player.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg">{player.points}</span>
                  <span className="text-xs">{player.trend === "up" ? "📈" : "📉"}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/ranking" className="block text-center mt-6 text-xs font-black uppercase text-slate-500 hover:text-blue-500 tracking-widest">
            Ver Tabla Completa →
          </Link>
        </div>

        {/* 3. FANTASY CTA & JUGADORES CLAVE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Banner de Fantasy */}
          <Link href="/fantasy" className="group block relative overflow-hidden bg-emerald-950/30 border-2 border-emerald-900/50 rounded-[2.5rem] p-10 hover:border-emerald-500/50 transition-all">
            <div className="relative z-10">
              <span className="bg-emerald-500 text-emerald-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter mb-4 inline-block">
                Draft Abierto
              </span>
              <h2 className="text-3xl font-black italic uppercase text-white mb-2">
                Armá tu <span className="text-emerald-500">Novenita</span>
              </h2>
              <p className="text-slate-400 font-medium max-w-sm mb-6">
                Elegí tus 9 estrellas para el finde y sumá puntos según su rendimiento real.
              </p>
              <span className="text-emerald-500 font-black uppercase text-xs group-hover:translate-x-2 transition-transform inline-block">
                Empezar Draft →
              </span>
            </div>
            {/* El diamante de fondo como decoración sutil */}
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 bg-emerald-500/5 blur-[60px] rounded-full"></div>
          </Link>

          {/* Mini Preview de Partidos Clave */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-sm font-black uppercase text-slate-500 mb-6 tracking-widest">Duelos Imperdibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="font-bold">Yankees</span>
                  <span className="text-slate-700 italic font-black">VS</span>
                  <span className="font-bold">Dodgers</span>
               </div>
               <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="font-bold">Mets</span>
                  <span className="text-slate-700 italic font-black">VS</span>
                  <span className="font-bold">Astros</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}