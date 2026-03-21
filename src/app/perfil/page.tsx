// src/app/perfil/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { getMyLeagues } from "@/app/actions";
import SalasManager from "./SalasManager";

export default async function PerfilPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/");

  // Consultas a la base de datos
  const misPredicciones = await db.prediction.findMany({
    where: { userId: userId },
    include: { series: true },
    orderBy: { createdAt: 'desc' }
  });

  const miFantasy = await db.fantasyTeam.findUnique({
    where: { userId: userId }
  });

  // Buscamos las salas a las que pertenece el usuario
  const misSalas = await getMyLeagues();

  const puntosTotales = misPredicciones.reduce((total, pred) => total + (pred.pointsEarned || 0), 0);

  const rankingData = await db.prediction.groupBy({
    by: ['userId'],
    _sum: { pointsEarned: true },
    orderBy: { _sum: { pointsEarned: 'desc' } },
  });
  const miPosicion = rankingData.findIndex(r => r.userId === userId) + 1;

  // 💡 Cálculo de Efectividad (Win Rate)
  const puntosPosibles = misPredicciones.length * 14; 
  const efectividad = puntosPosibles > 0 ? Math.round((puntosTotales / puntosPosibles) * 100) : 0;

  // 📅 MEJORA: Agrupar historial por "Jornada X" en base a la semana
  const OPENING_DAY = new Date("2026-03-26T00:00:00Z");

  const historialPorFecha = misPredicciones.reduce((acc: any, pred) => {
    const gameDate = new Date(pred.series.startDate);
    
    // Calculamos la diferencia en milisegundos y lo pasamos a días
    const diffTime = Math.abs(gameDate.getTime() - OPENING_DAY.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Dividimos por 7 días a la semana y redondeamos para arriba para sacar el número de Jornada
    const numJornada = Math.ceil((diffDays === 0 ? 1 : diffDays) / 7);
    
    // Si la fecha es anterior al Opening Day, la forzamos a Jornada 1
    const finalJornada = gameDate < OPENING_DAY ? 1 : numJornada;

    const fechaClave = `JORNADA ${finalJornada}`;
    
    if (!acc[fechaClave]) {
      acc[fechaClave] = { puntosTotales: 0, boletas: [] };
    }
    acc[fechaClave].boletas.push(pred);
    acc[fechaClave].puntosTotales += (pred.pointsEarned || 0);
    return acc;
  }, {});

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* --- CABECERA DE PERFIL --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <Image 
            src={user.imageUrl} 
            alt="Perfil" 
            width={100} 
            height={100} 
            className="rounded-full border-4 border-slate-800 shadow-xl"
          />
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
              {user.firstName || user.username || "Mánager"}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
              {efectividad > 50 ? "🔥 Pronosticador Experto" : "⚾ Analista Novato"}
            </p>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto mt-4 md:mt-0">
            <div className="bg-blue-600/20 border border-blue-500/50 rounded-2xl p-4 flex-1 text-center min-w-[100px]">
              <p className="text-2xl md:text-3xl font-black text-blue-500 italic drop-shadow-md">{puntosTotales}</p>
              <p className="text-[9px] font-black uppercase text-blue-200 tracking-widest mt-1">Pts Totales</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex-1 text-center min-w-[100px]">
              <p className="text-2xl md:text-3xl font-black text-amber-500 italic drop-shadow-md">
                {miPosicion > 0 ? `#${miPosicion}` : "-"}
              </p>
              <p className="text-[9px] font-black uppercase text-amber-200 tracking-widest mt-1">Ranking</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex-1 text-center min-w-[100px]">
              <p className="text-2xl md:text-3xl font-black text-emerald-500 italic drop-shadow-md">{efectividad}%</p>
              <p className="text-[9px] font-black uppercase text-emerald-200 tracking-widest mt-1">Efectividad</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- COLUMNA IZQUIERDA: GRUPOS Y FANTASY --- */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* 1. SECCIÓN GRUPOS (LIGAS PRIVADAS) -> AHORA INTERACTIVA */}
            <SalasManager misSalas={misSalas} />

            {/* 2. SECCIÓN FANTASY */}
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                Mi <span className="text-blue-500">Fantasy</span>
              </h2>
              {miFantasy ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Alineación</p>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">
                      {miFantasy.pointsEarned} PTS
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {miFantasy.playerNames.split(',').slice(0, 5).map((jugador, index) => (
                      <li key={index} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800/50">
                        <span className="font-bold text-xs text-slate-300 truncate">{jugador}</span>
                      </li>
                    ))}
                    <p className="text-center text-[9px] text-slate-500 uppercase font-black pt-2">+ 4 Jugadores más</p>
                  </ul>
                  <Link href="/fantasy" className="block text-center w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl transition-colors">
                    Gestionar
                  </Link>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-center shadow-xl">
                  <p className="text-slate-500 font-bold text-xs mb-4">No armaste tu equipo.</p>
                  <Link href="/fantasy" className="block bg-blue-600 text-white font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-colors">
                    Ir al Draft
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* --- COLUMNA DERECHA: HISTORIAL DESPLEGABLE (POR FECHA) --- */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3 mb-6">
              Historial de <span className="text-blue-500">Resultados</span>
            </h2>

            {Object.keys(historialPorFecha).length > 0 ? (
              <div className="space-y-4">
                {Object.keys(historialPorFecha).map((fecha, idx) => {
                  const jornada = historialPorFecha[fecha];
                  
                  return (
                    <details key={idx} className="group bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl" open={idx === 0}>
                      <summary className="cursor-pointer p-6 flex items-center justify-between bg-slate-900 hover:bg-slate-800/50 transition-colors list-none">
                        <div className="flex items-center gap-4">
                          <span className="text-blue-500 font-black text-xl group-open:rotate-90 transition-transform duration-300">▶</span>
                          <div>
                            {/* ACÁ AHORA VA A DECIR "JORNADA X" */}
                            <p className="font-black text-lg text-white uppercase">{fecha}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                              {jornada.boletas.length} Series Pronosticadas
                            </p>
                          </div>
                        </div>
                        <div className="bg-blue-600/20 border border-blue-500/30 px-4 py-2 rounded-xl text-center">
                          <p className="font-black text-blue-400 text-xl leading-none">+{jornada.puntosTotales}</p>
                          <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest mt-1">PTS</p>
                        </div>
                      </summary>

                      <div className="p-6 pt-0 border-t border-slate-800/50 bg-slate-950/30 space-y-3 mt-4">
                        {jornada.boletas.map((pred: any) => (
                          <div key={pred.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <div className="flex-1">
                              <p className="font-black text-sm text-white uppercase">
                                {pred.series.awayTeam} <span className="text-slate-600 font-normal mx-1">vs</span> {pred.series.homeTeam}
                              </p>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex-1 sm:flex-none text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pronóstico</p>
                                <p className="font-black text-white text-xs">{pred.predictedWinnerId === "AWAY" ? "Visita" : "Local"} {pred.predictedScore}</p>
                              </div>
                              <div className={`rounded-lg px-3 py-1 flex-1 sm:flex-none text-center border min-w-[60px] ${
                                pred.pointsEarned > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}>
                                <p className="font-black text-sm leading-tight">+{pred.pointsEarned || 0}</p>
                                <p className="text-[7px] font-black uppercase tracking-widest">PTS</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-10 text-center shadow-xl">
                <p className="text-slate-500 font-bold mb-4">Todavía no completaste ninguna Boleta Maestra.</p>
                <Link href="/" className="inline-block bg-blue-600 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-colors">
                  Ver Partidos de Hoy
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}