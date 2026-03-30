// src/app/series/BoletaForm.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { savePrediction } from "@/app/actions";

const formatDate = (dateString: string) => {
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }).toUpperCase();
};

export default function BoletaForm({ seriesList, userPredictions }: { seriesList: any[], userPredictions: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const buildInitialState = () => {
    const state: any = { picks: {}, pitchers: {} };
    seriesList.forEach(s => {
      const p = userPredictions.find(prev => prev.series?.mlbSeriesId === s.id || prev.seriesId === s.id);
      state.picks[s.id] = p?.dailyPicks ? p.dailyPicks.split(',') : ["", "", ""];
      state.pitchers[s.id] = p?.pitcherPicks ? p.pitcherPicks.split(',') : ["", "", ""];
    });
    return state;
  };

  const [formData, setFormData] = useState(buildInitialState());
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const handlePick = (seriesId: string, idx: number, val: string) => {
    const newPicks = [...(formData.picks[seriesId] || ["", "", ""])];
    newPicks[idx] = val;
    setFormData({ ...formData, picks: { ...formData.picks, [seriesId]: newPicks } });
  };

  const handlePitcher = (seriesId: string, idx: number, val: string) => {
    const newPitchers = [...(formData.pitchers[seriesId] || ["", "", ""])];
    newPitchers[idx] = val;
    setFormData({ ...formData, pitchers: { ...formData.pitchers, [seriesId]: newPitchers } });
  };

  const calculate = (sId: string, away: string, home: string) => {
    const picks = formData.picks[sId] || ["", "", ""];
    const v = picks.filter((p: any) => p === "V").length;
    const l = picks.filter((p: any) => p === "L").length;
    if (v + l < 3) return null;
    return { 
      winner: v > l ? away : home, 
      winnerId: v > l ? "AWAY" : "HOME", 
      score: v > l ? `${v}-${l}` : `${l}-${v}` 
    };
  };

  const handleSave = async (series: any) => {
    const res = calculate(series.id, series.awayTeam, series.homeTeam);
    if (!res) return toast.error("Serie incompleta", { description: "Marcá los 3 juegos antes de guardar." });

    setIsSaving(series.id);
    const result = await savePrediction(series, {
      winnerId: res.winnerId,
      score: res.score,
      dailyPicks: formData.picks[series.id].join(","),
      pitcherPicks: formData.pitchers[series.id].join(",") 
    });

    if (result.success) {
      toast.success("¡Estrategia guardada!");
      setExpandedId(null);
    } else {
      toast.error("Error al guardar", { description: result.error });
    }
    setIsSaving(null);
  };

  return (
    <div className="space-y-4 pb-24">
      {seriesList.map((s) => {
        const res = calculate(s.id, s.awayTeam, s.homeTeam);
        const isOpen = expandedId === s.id;
        
        const dbPrediction = userPredictions.find(p => p.series?.mlbSeriesId === s.id || p.seriesId === s.id);
        const isSavedInDB = !!dbPrediction;
        
        const isLocked = new Date() > new Date(s.firstGameTime);

        const puntosGanados = dbPrediction?.pointsEarned || 0;
        
        // 🧾 NUEVO: Extraemos el recibo detallado de la base de datos (si existe)
        const detail = dbPrediction?.pointsDetail as any;

        const isEvaluated = isSavedInDB && isLocked && new Date() > new Date(new Date(s.firstGameTime).getTime() + (3 * 24 * 60 * 60 * 1000));

        return (
          <div key={s.id} className={`bg-slate-900 border rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-2xl ${isSavedInDB ? 'border-blue-500/40' : 'border-slate-800'}`}>
            
            <div 
              onClick={() => setExpandedId(isOpen ? null : s.id)}
              className="p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex-1 flex flex-col justify-center px-8 bg-slate-950/50 rounded-3xl h-32 border border-slate-800/30 relative mt-4 md:mt-0">
                
                {isLocked && !isEvaluated && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500/20 text-red-500 text-[8px] font-black px-3 py-1 rounded-b-lg uppercase tracking-widest border-x border-b border-red-500/30">
                    🔒 Apuestas Cerradas
                  </div>
                )}
                
                {isEvaluated && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-slate-400 text-[8px] font-black px-3 py-1 rounded-b-lg uppercase tracking-widest border-x border-b border-slate-700">
                    🏁 Serie Finalizada
                  </div>
                )}

                <div className="flex items-center justify-between w-full mt-4 md:mt-2">
                  <div className="text-center flex-1 min-w-0">
                    <p className="text-lg md:text-xl font-black uppercase text-white truncate">{s.awayTeam}</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Visitante</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center px-4 shrink-0">
                    <span className="text-slate-800 font-black italic text-xl">VS</span>
                  </div>

                  <div className="text-center flex-1 min-w-0">
                    <p className="text-lg md:text-xl font-black uppercase text-blue-500 truncate">{s.homeTeam}</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Local</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-center gap-6 pb-2 md:pb-0">
                  <div className="text-center">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      Récord Temp.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-slate-300 bg-slate-800/50 px-2 py-0.5 rounded">
                        V: {s.awayRecord?.wins || 0}-{s.awayRecord?.losses || 0}
                      </span>
                      <span className="text-slate-600 font-black">|</span>
                      <span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                        L: {s.homeRecord?.wins || 0}-{s.homeRecord?.losses || 0}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">
                      Efectividad (PCT)
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="text-slate-300">
                        {s.awayRecord?.pct || ".000"}
                      </span>
                      <span className="text-slate-600 font-black">vs</span>
                      <span className="text-blue-400">
                        {s.homeRecord?.pct || ".000"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`w-full md:w-64 h-32 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden mt-2 md:mt-0 ${res ? (isEvaluated ? 'bg-slate-900 border border-slate-800' : 'bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)]') : 'bg-slate-800/50'}`}>
                
                {isSavedInDB && !isEvaluated && (
                  <div className="absolute top-0 right-0 bg-blue-400 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase text-blue-900 shadow-sm z-10">
                    Guardado
                  </div>
                )}

                {isEvaluated && (
                  <div className={`absolute top-0 right-0 text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase shadow-sm z-10 ${puntosGanados > 0 ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500/20 text-red-400 border-b border-l border-red-500/30'}`}>
                    {puntosGanados > 0 ? `🔥 +${puntosGanados} PTS` : '❌ 0 PTS'}
                  </div>
                )}

                {res ? (
                  <>
                    <p className={`text-[10px] font-black uppercase mb-0.5 tracking-[0.2em] ${isEvaluated ? 'text-slate-500' : 'text-blue-200'}`}>Pronóstico Serie</p>
                    <p className={`text-sm md:text-md font-black uppercase italic leading-tight truncate px-4 ${isEvaluated ? 'text-slate-300' : 'text-white'}`}>{res.winner}</p>
                    <p className={`text-3xl font-black mt-0.5 drop-shadow-md ${isEvaluated ? 'text-slate-600' : 'text-white'}`}>{res.score}</p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Toca para</p>
                    <p className="text-xs font-black text-slate-400 uppercase mt-1">Configurar</p>
                  </div>
                )}
              </div>
            </div>

            {isOpen && (
              <div className="p-6 bg-slate-950/50 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[0, 1, 2].map((idx) => {
                    const isGameLocked = s.games && s.games[idx] ? new Date() > new Date(s.games[idx].gameDate) : isLocked;
                    
                    // 🧾 LECTURA DEL RECIBO EXACTO PARA ESTE PARTIDO
                    const gameDetail = detail?.games?.[idx];
                    const ptsGanador = gameDetail?.ganador || 0;
                    const ptsPitcher = gameDetail?.pitcher || 0;

                    // Si detail existe, usamos la info exacta. Si no (boletas viejas), usamos fallback.
                    const hasGanadorHit = gameDetail ? ptsGanador > 0 : (puntosGanados > 0);
                    const hasPitcherHit = gameDetail ? ptsPitcher > 0 : (puntosGanados > 0);

                    return (
                      <div key={idx} className="bg-slate-900 border border-slate-800/50 rounded-[2rem] p-6 space-y-5 shadow-inner relative">
                        {isGameLocked && <div className="absolute inset-0 bg-slate-950/50 z-10 rounded-[2rem] pointer-events-none"></div>}
                        
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Juego {idx + 1}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase">
                            {formatDate(s.games && s.games[idx] ? s.games[idx].gameDate : s.firstGameTime)}
                          </p>
                        </div>
                        
                        <div className="flex gap-3 justify-center relative z-20">
                          {["V", "L"].map(v => {
                            const isSelected = formData.picks[s.id][idx] === v;
                            let buttonStyle = 'bg-slate-950 text-slate-700 hover:text-slate-300 border border-slate-800 disabled:opacity-50';
                            
                            if (isSelected) {
                               buttonStyle = isEvaluated && hasGanadorHit 
                                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                  : isEvaluated && !hasGanadorHit
                                  ? 'bg-red-500/10 border-red-500/30 text-red-500/50 scale-100'
                                  : 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] text-white scale-110';
                            }

                            return (
                              <button
                                key={v}
                                disabled={isGameLocked}
                                onClick={(e) => { e.stopPropagation(); handlePick(s.id, idx, v); }}
                                className={`w-14 h-14 flex items-center justify-center rounded-full text-sm font-black transition-all duration-300 disabled:cursor-not-allowed ${buttonStyle}`}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-800/50 relative z-20">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                            ¿El abridor se lleva la victoria?
                          </p>
                          <div className="flex gap-2 justify-center">
                            {["SI", "NO"].map(opt => {
                               const isSelected = formData.pitchers[s.id][idx] === opt;
                               let btnStyle = 'bg-slate-950 text-slate-600 hover:text-slate-300 border border-slate-800 disabled:opacity-50';
                               
                               if (isSelected) {
                                  btnStyle = isEvaluated && hasPitcherHit 
                                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                    : isEvaluated && !hasPitcherHit
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500/50'
                                    : 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105';
                               }

                               return (
                                <button
                                  key={opt}
                                  disabled={isGameLocked}
                                  onClick={(e) => { e.stopPropagation(); handlePitcher(s.id, idx, opt); }}
                                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 disabled:cursor-not-allowed ${btnStyle}`}
                                >
                                  {opt}
                                </button>
                               );
                            })}
                          </div>
                        </div>

                        {/* 🧾 NUEVO: TICKET DE PUNTOS POR PARTIDO (Solo se muestra si la serie terminó y el recibo existe) */}
                        {isEvaluated && detail && (
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/50">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${ptsGanador > 0 ? 'text-emerald-400' : 'text-red-400/50'}`}>
                              {ptsGanador > 0 ? `✓ Partido: +${ptsGanador}` : '❌ Partido: 0'}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${ptsPitcher > 0 ? 'text-emerald-400' : 'text-red-400/50'}`}>
                              {ptsPitcher > 0 ? `✓ Abridor: +${ptsPitcher}` : '❌ Abridor: 0'}
                            </span>
                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>

                {/* 🧾 NUEVO: TICKET PLENO DE SERIE */}
                {isEvaluated && detail && (detail.serie.winner > 0 || detail.serie.exact > 0) && (
                  <div className="mt-6 flex justify-center">
                     <div className="bg-emerald-900/20 border border-emerald-500/30 px-6 py-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                       <span className="text-xl">🔥</span>
                       <div>
                         <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Bonus de Serie Acertada</p>
                         <p className="text-emerald-200 text-xs font-bold text-center">+{detail.serie.winner + detail.serie.exact} PTS</p>
                       </div>
                     </div>
                  </div>
                )}

                {!isLocked && (
                  <button 
                    onClick={() => handleSave(s)}
                    disabled={isSaving === s.id}
                    className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSaving === s.id ? "Procesando..." : "✓ Confirmar Pronóstico"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}