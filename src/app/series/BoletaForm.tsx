// src/app/series/BoletaForm.tsx
"use client";
import { useState } from "react";
import { toast } from "sonner";
import { savePrediction } from "@/app/actions";

const formatDate = (dateString: string) => {
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
};

export default function BoletaForm({ seriesList, userPredictions, pitchersBySeries }: { seriesList: any[], userPredictions: any[], pitchersBySeries: any }) {
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
        const isSavedInDB = userPredictions.some(p => p.series?.mlbSeriesId === s.id || p.seriesId === s.id);

        return (
          <div key={s.id} className={`bg-slate-900 border rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-2xl ${isSavedInDB ? 'border-blue-500/40' : 'border-slate-800'}`}>
            
            {/* --- CABECERA (SIEMPRE VISIBLE) --- */}
            <div 
              onClick={() => setExpandedId(isOpen ? null : s.id)}
              className="p-4 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex-1 flex items-center justify-between px-8 bg-slate-950/50 rounded-full h-24 border border-slate-800/30">
                <div className="text-center flex-1 min-w-0">
                  <p className="text-lg md:text-xl font-black uppercase text-white truncate">{s.awayTeam}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Visitante</p>
                </div>
                <span className="text-slate-800 font-black italic text-xl px-4 shrink-0">VS</span>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-lg md:text-xl font-black uppercase text-blue-500 truncate">{s.homeTeam}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Local</p>
                </div>
                <span className={`ml-6 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {/* CARD AZUL RESULTADO (¡Restaurada a su antigua gloria!) */}
              <div className={`w-full md:w-64 h-24 rounded-[1.8rem] flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden ${res ? 'bg-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)]' : 'bg-slate-800/50'}`}>
                
                {/* Cartelito de guardado si está en la base de datos */}
                {isSavedInDB && (
                  <div className="absolute top-0 right-0 bg-blue-400 text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase text-blue-900 shadow-sm z-10">
                    Guardado
                  </div>
                )}
                
                {res ? (
                  <>
                    <p className="text-[10px] font-black uppercase text-blue-200 mb-0.5 tracking-[0.2em]">Gana la Serie</p>
                    <p className="text-sm md:text-md font-black uppercase italic text-white leading-tight truncate px-4">{res.winner}</p>
                    <p className="text-3xl font-black text-white mt-0.5 drop-shadow-md">{res.score}</p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Toca para</p>
                    <p className="text-xs font-black text-slate-400 uppercase mt-1">Configurar</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- CONTENIDO DESPLEGABLE (LOS 3 PARTIDOS) --- */}
            {isOpen && (
              <div className="p-6 bg-slate-950/50 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800/50 rounded-[2rem] p-6 space-y-5 shadow-inner">
                      
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Juego {idx + 1}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">
                          {formatDate(s.games && s.games[idx] ? s.games[idx].gameDate : s.firstGameTime)}
                        </p>
                      </div>
                      
                      {/* Votación V/L */}
                      <div className="flex gap-3 justify-center">
                        {["V", "L"].map(v => (
                          <button
                            key={v}
                            onClick={(e) => { e.stopPropagation(); handlePick(s.id, idx, v); }}
                            className={`w-14 h-14 flex items-center justify-center rounded-full text-sm font-black transition-all duration-300 ${formData.picks[s.id][idx] === v ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] text-white scale-110' : 'bg-slate-950 text-slate-700 hover:text-slate-300 border border-slate-800'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>

                      {/* Selector de Pitcher */}
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-col items-center">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Pitcher Ganador Previsto</p>
                          <select 
                            onClick={(e) => e.stopPropagation()}
                            value={formData.pitchers[s.id][idx] || ""}
                            onChange={(e) => handlePitcher(s.id, idx, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-300 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none text-center"
                          >
                            <option value="">-- Seleccionar Lanzador --</option>
                            {pitchersBySeries[s.id] && pitchersBySeries[s.id].map((p: any) => (
                              <option key={p.id} value={p.name}>{p.name} ({p.teamAbbr})</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[8px] text-amber-500/80 font-black uppercase text-center leading-tight">
                          ⚠️ Debe ser el abridor oficial (+3 pts)
                        </p>
                      </div>

                    </div>
                  ))}
                </div>

                {/* BOTÓN DE GUARDAR */}
                <button 
                  onClick={() => handleSave(s)}
                  disabled={isSaving === s.id}
                  className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSaving === s.id ? "Procesando..." : "✓ Confirmar Pronóstico"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}