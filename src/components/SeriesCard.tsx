"use client";
import { useState, useEffect } from "react";
import { savePrediction } from "@/app/actions";
import { toast } from "sonner";

export default function SeriesCard({ s, userPredictions }: { s: any, userPredictions: any[] }) {
  // 1. Agregamos este estado para arreglar el Hydration Error
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const existingPrediction = userPredictions?.find(
    (p) => p.series?.mlbSeriesId === s.id
  );

  const initialPicks = existingPrediction?.dailyPicks 
    ? existingPrediction.dailyPicks.split('-') 
    : [null, null, null];

  const [picks, setPicks] = useState<("home" | "away" | null)[]>(initialPicks as any);
  const [isPending, setIsPending] = useState(false);
  const [isSaved, setIsSaved] = useState(!!existingPrediction);

  const handlePick = (gameIndex: number, team: "home" | "away") => {
    const newPicks = [...picks];
    newPicks[gameIndex] = team;
    setPicks(newPicks);
    setIsSaved(false); 
  };

  const homeWins = picks.filter(p => p === 'home').length;
  const awayWins = picks.filter(p => p === 'away').length;
  const isComplete = picks.every(p => p !== null); 
  
  const finalWinner = homeWins > awayWins ? s.homeTeam : s.awayTeam;
  const finalScore = `${Math.max(homeWins, awayWins)}-${Math.min(homeWins, awayWins)}`;

  const handleConfirm = async () => {
    if (!isComplete) return;
    setIsPending(true);
    
    const res = await savePrediction(s, {
      winnerId: finalWinner,
      score: finalScore,
      dailyPicks: picks.join('-') 
    });

    if (res.success) {
      setIsSaved(true);
      toast.success("Pronóstico guardado", {
        description: `Tu predicción final: ${finalWinner} gana ${finalScore}`
      });
    } else {
      toast.error("Ups, algo falló al guardar el pronóstico.");
    }
    
    setIsPending(false);
  };

  const days = ["Juego 1", "Juego 2", "Juego 3"];

  // Para evitar que la UI salte feo antes de que monte el componente
  if (!mounted) return (
    <div className="rounded-[2rem] border border-slate-800 p-6 md:p-8 bg-slate-900 shadow-2xl animate-pulse h-96">
       <div className="h-4 bg-slate-800 rounded w-1/3 mx-auto mb-8"></div>
       <div className="space-y-4">
         {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl"></div>)}
       </div>
    </div>
  );

  return (
    <div className={`rounded-[2rem] border p-6 md:p-8 shadow-2xl transition-all relative overflow-hidden ${isSaved ? 'bg-slate-900 border-blue-500/50' : 'bg-slate-900 border-slate-800'}`}>
      
      {isSaved && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl z-10">
          Guardado
        </div>
      )}

      {/* Título de la Serie */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black italic uppercase text-slate-100">
          <span className="text-slate-500 text-sm">@</span> {s.homeTeam}
        </h3>
        <p className="text-xs font-bold text-slate-600 uppercase mt-1">Visitante: {s.awayTeam}</p>
      </div>

      {/* Lista de Partidos */}
      <div className="space-y-3 mb-8">
        {s.individualGames.map((gameDate: string, index: number) => {
          const date = new Date(gameDate);
          const dayName = date.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase();
          const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={index} className={`flex flex-col md:flex-row items-center justify-between p-3 rounded-xl border transition-all gap-4 ${picks[index] ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800/50'}`}>
              
              {/* Info del día (Ahora segura contra Hydration) */}
              <div className="flex-shrink-0 text-center md:text-left w-24">
                <p className="text-[10px] font-black text-blue-500 uppercase">{days[index]}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {dayName} {time}
                </p>
              </div>

              {/* Botones de Selección */}
              <div className="flex w-full gap-2">
                <button 
                  onClick={() => handlePick(index, 'away')}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-black uppercase transition-all border ${
                    picks[index] === 'away' 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {s.awayTeam.split(' ').pop()}
                </button>
                
                <div className="flex items-center text-[10px] font-bold text-slate-700">VS</div>

                <button 
                  onClick={() => handlePick(index, 'home')}
                  className={`flex-1 py-3 px-2 rounded-lg text-xs font-black uppercase transition-all border ${
                    picks[index] === 'home' 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {s.homeTeam.split(' ').pop()}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen Final */}
      <div className={`transition-all duration-300 ${isComplete ? 'opacity-100 h-auto' : 'opacity-50 h-auto pointer-events-none'}`}>
        {isComplete && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-center animate-in zoom-in duration-300">
             <p className="text-xs text-slate-400 font-bold uppercase mb-1">Resultado Calculado</p>
             <p className="text-xl font-black text-blue-400 uppercase italic tracking-tight">
               {finalWinner} GANA {finalScore}
             </p>
          </div>
        )}

        <button 
          onClick={handleConfirm}
          disabled={!isComplete || isPending || isSaved}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
            isSaved 
              ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-default"
              : (!isComplete || isPending)
                ? "bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          }`}
        >
          {isSaved ? "Pronóstico Confirmado" : !isComplete ? "Selecciona los 3 juegos" : isPending ? "Procesando..." : "Confirmar Pronóstico"}
        </button>
      </div>

    </div>
  );
}