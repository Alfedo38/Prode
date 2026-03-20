// src/app/series/[id]/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function SeriesDetailPage() {
  // Estado para los 3 juegos (P = Pirates, M = Mets como ejemplo)
  const [picks, setPicks] = useState(["P", "M", "P"]);

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto text-slate-100">
      <Link href="/series" className="text-slate-600 font-black uppercase text-[10px] tracking-widest hover:text-blue-500 transition-colors">
        ← Volver a los partidos
      </Link>

      <div className="mt-10 mb-12 text-center">
         <h2 className="text-5xl font-black italic uppercase tracking-tighter">
            <span className="text-slate-500">@</span> NEW YORK METS
         </h2>
         <p className="text-slate-500 font-bold text-[10px] uppercase mt-2 tracking-widest">Visitante: Pittsburgh Pirates</p>
      </div>

      {/* DISEÑO DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: LOS 3 JUEGOS */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((num, i) => (
            <div key={num} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 flex items-center justify-between">
              <div className="w-32">
                <p className="text-blue-500 font-black text-[10px] uppercase">Juego {num}</p>
                <p className="text-slate-600 text-[9px] font-bold uppercase tracking-tighter">Finalizado</p>
              </div>

              <div className="flex-1 flex gap-2 justify-end">
                <button 
                  onClick={() => { let newP = [...picks]; newP[i] = "P"; setPicks(newP); }}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${picks[i] === 'P' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}
                >
                  Pirates
                </button>
                <span className="flex items-center text-slate-800 italic font-black text-xs px-2">vs</span>
                <button 
                  onClick={() => { let newP = [...picks]; newP[i] = "M"; setPicks(newP); }}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${picks[i] === 'M' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}
                >
                  Mets
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* COLUMNA DERECHA: RESULTADO (STICKY) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600/10 to-slate-900 border-2 border-blue-600/20 rounded-[3rem] p-10 h-fit flex flex-col items-center justify-center text-center sticky top-8">
            <div className="bg-blue-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase mb-8 tracking-widest shadow-lg shadow-blue-900/20">
              Guardado
            </div>
            <p className="text-slate-500 font-black uppercase text-[9px] tracking-[0.3em] mb-4">Resultado de Serie</p>
            <h3 className="text-3xl font-black italic uppercase leading-none text-white">
              Pittsburgh <span className="text-blue-500">Pirates</span> <br /> 
              <span className="text-5xl mt-2 block">2 - 1</span>
            </h3>
            <div className="w-16 h-1 bg-blue-600/30 mt-8 rounded-full"></div>
            <button className="mt-8 text-[10px] font-black uppercase text-blue-500 hover:text-white transition-colors">
                Editar Pronóstico
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}