// src/app/fantasy/page.tsx
"use client";
import { useState, useEffect } from "react";
import { saveFantasyTeam, getMyFantasyTeam } from "@/app/actions";
import { fetchAllMLBTeams, fetchTeamRoster } from "@/lib/mlbFantasy";
import { toast } from "sonner";

// --- CONFIGURACIÓN DEL CAMPO (9 POSICIONES, DH EN VEZ DE P) ---
const POSITIONS_CONFIG = [
  { id: 0, label: "C", name: "Catcher", top: '85%', left: '50%' },
  { id: 1, label: "1B", name: "Primera Base", top: '55%', left: '75%' },
  { id: 2, label: "2B", name: "Segunda Base", top: '38%', left: '62%' },
  { id: 3, label: "3B", name: "Tercera Base", top: '55%', left: '25%' },
  { id: 4, label: "SS", name: "Shortstop", top: '38%', left: '38%' },
  { id: 5, label: "LF", name: "Left Fielder", top: '22%', left: '20%' },
  { id: 6, label: "CF", name: "Center Fielder", top: '15%', left: '50%' },
  { id: 7, label: "RF", name: "Right Fielder", top: '22%', left: '80%' },
  { id: 8, label: "DH", name: "Designado", top: '85%', left: '20%' },
];

export default function FantasyPage() {
  const [fieldPlayers, setFieldPlayers] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPending, setIsPending] = useState(false);
  const [isFieldLoading, setIsFieldLoading] = useState(true);
  
  // Estado para el jugador seleccionado
  const [selectedFromList, setSelectedFromList] = useState<any>(null);

  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");
  const [currentRoster, setCurrentRoster] = useState<any[]>([]);
  const [isRosterLoading, setIsRosterLoading] = useState(false);

  // Puntos individuales (por ahora en 0)
  const [playerPoints, setPlayerPoints] = useState<number[]>(Array(9).fill(0));

  useEffect(() => {
    async function initialLoad() {
      const team = await getMyFantasyTeam();
      if (team && team.playerNames) {
        setFieldPlayers(team.playerNames.split(","));
      }
      const teamsList = await fetchAllMLBTeams();
      setAllTeams(teamsList);
      setIsFieldLoading(false);
    }
    initialLoad();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    async function loadRoster() {
      setIsRosterLoading(true);
      const roster = await fetchTeamRoster(selectedTeamId!);
      const teamName = allTeams.find(t => t.id === selectedTeamId)?.name || "";
      setSelectedTeamName(teamName);
      setCurrentRoster(roster);
      setIsRosterLoading(false);
    }
    loadRoster();
  }, [selectedTeamId, allTeams]);

  const handleSelectFromList = (player: any) => {
    // Si toca el mismo, lo deselecciona
    if (selectedFromList?.id === player.id) {
      setSelectedFromList(null);
      return;
    }
    setSelectedFromList({ ...player, teamName: selectedTeamName });
  };

  const handlePlaceInField = (index: number) => {
    // CASO A: Limpiar base
    if (!selectedFromList) {
      if (fieldPlayers[index]) {
        const removedPlayer = fieldPlayers[index];
        const newField = [...fieldPlayers];
        newField[index] = null; 
        setFieldPlayers(newField);
        toast.success("Posición liberada", { description: `${removedPlayer} volvió al banco.` });
      } else {
        toast.error("Seleccioná un jugador", { description: "Primero elegí a alguien de la lista derecha."});
      }
      return;
    }

    // CASO B: Ubicar o Reemplazar
    const teamToValidate = selectedFromList.teamName;
    const countFromSameTeam = fieldPlayers.filter(p => p && p.includes(`(${teamToValidate}`)).length;
    
    if (countFromSameTeam >= 3) {
      const isReplacingSameTeam = fieldPlayers[index] && fieldPlayers[index]?.includes(`(${teamToValidate}`);
      if (!isReplacingSameTeam) {
        toast.error(`Límite alcanzado`, { description: `Ya tenés 3 jugadores de ${teamToValidate}.` });
        return;
      }
    }

    const newField = [...fieldPlayers];
    newField[index] = `${selectedFromList.name} (${selectedFromList.teamName} - ${selectedFromList.positionAbbr})`;
    setFieldPlayers(newField);
    setSelectedFromList(null); 
    toast.success(`${selectedFromList.name} ubicado correctamente.`);
  };

  const handleSave = async () => {
    if (fieldPlayers.some(p => !p)) {
      toast.error("Equipo incompleto", { description: "Llená las 9 posiciones antes de guardar." });
      return;
    }
    setIsPending(true);
    const res = await saveFantasyTeam(fieldPlayers as string[]);
    if (res.success) toast.success("¡Novenita Guardada con éxito!");
    else toast.error("Error", { description: "No se pudo guardar el equipo." });
    setIsPending(false);
  };

  const totalPoints = playerPoints.reduce((acc, curr) => acc + curr, 0);

  return (
    <main className="min-h-screen p-4 md:p-8 pt-8 max-w-7xl mx-auto text-slate-100 bg-slate-950">
      
      {/* --- CABECERA --- */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter">
          Mi <span className="text-blue-500">Draft</span> Ideal
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
          Máximo 3 jugadores por equipo | DH Incluido
        </p>
      </div>

      {/* --- CARTEL DE JUGADOR EN MANO (UX MEJORADA) --- */}
      {selectedFromList && (
        <div className="bg-blue-600 border border-blue-400 text-white p-4 md:p-6 rounded-[2rem] mb-8 flex flex-col md:flex-row justify-between items-center animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all">
          <div className="text-center md:text-left mb-2 md:mb-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Jugador Seleccionado</p>
            <p className="text-2xl md:text-3xl font-black italic uppercase leading-none mt-1">
              {selectedFromList.name} <span className="text-lg font-bold text-blue-300 ml-2">({selectedFromList.positionAbbr})</span>
            </p>
          </div>
          <div className="bg-blue-950/50 px-6 py-3 rounded-full border border-blue-400/50">
            <p className="text-xs font-black uppercase tracking-widest text-blue-100">
              👇 Tocá una posición vacía para ubicarlo
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        {/* --- DIAMANTE RESPONSIVE --- */}
        <div className="xl:col-span-2 relative aspect-square md:aspect-[4/3] bg-emerald-950/20 rounded-[3rem] border border-emerald-900/50 shadow-2xl overflow-hidden p-4">
          
          {/* Dibujo del campo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
             <div className="w-[80%] h-[80%] border-4 border-emerald-700 rotate-45 transform origin-center"></div>
             <div className="absolute w-[120%] h-[120%] border-4 border-emerald-800 rounded-full scale-110 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>

          {isFieldLoading ? (
             <div className="absolute inset-0 flex items-center justify-center font-black uppercase tracking-widest text-emerald-600/50 animate-pulse">
               Dibujando diamante...
             </div>
          ) : (
            POSITIONS_CONFIG.map((pos) => (
              <button 
                key={pos.id}
                onClick={() => handlePlaceInField(pos.id)}
                className="absolute group z-10 -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 hover:z-20"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-20 rounded-full md:rounded-2xl p-1 md:p-2 flex flex-col items-center justify-center text-center border-2 transition-all ${
                  fieldPlayers[pos.id] 
                    ? 'bg-slate-900 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : selectedFromList 
                      ? 'bg-blue-900/40 border-blue-400 animate-pulse' 
                      : 'bg-slate-950/80 border-slate-700 hover:border-slate-500'
                }`}>
                  <span className={`text-[8px] md:text-[9px] font-black uppercase mb-0.5 ${fieldPlayers[pos.id] ? 'text-blue-400' : 'text-slate-500'}`}>
                    {pos.label}
                  </span>
                  
                  {fieldPlayers[pos.id] ? (
                    <p className="text-[8px] sm:text-[9px] md:text-[11px] font-bold leading-tight line-clamp-2 text-white px-1">
                      {fieldPlayers[pos.id]?.split(' (')[0]} {/* Solo muestra el nombre para ahorrar espacio */}
                    </p>
                  ) : (
                    <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-slate-600 hidden md:block">
                      Vacío
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* --- LISTA DERECHA (MERCADO) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col h-[600px] md:h-[650px] shadow-2xl">
          <h2 className="text-2xl font-black italic uppercase mb-1 tracking-tight text-white">Mercado <span className="text-blue-500">Libre</span></h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Buscá a tu estrella</p>
          
          <select 
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-white mb-4 outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">-- Seleccionar Franquicia --</option>
            {allTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          
          <div className="space-y-2 flex-grow overflow-y-auto pr-2 border-t border-slate-800 pt-4 custom-scrollbar">
            {isRosterLoading ? (
                <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-slate-600 animate-pulse">
                  Buscando Roster Oficial...
                </div>
            ) : currentRoster.map((p) => (
              <button 
                key={p.id} 
                onClick={() => handleSelectFromList(p)} 
                className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all group ${selectedFromList?.id === p.id ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase truncate">{p.name}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${selectedFromList?.id === p.id ? 'text-blue-200' : 'text-slate-600'}`}>
                    {p.positionAbbr}
                  </span>
                </div>
                <span className={`text-xl font-black transition-transform ${selectedFromList?.id === p.id ? 'rotate-45' : 'group-hover:scale-125'}`}>
                  {selectedFromList?.id === p.id ? '✕' : '＋'}
                </span>
              </button>
            ))}
          </div>

          <button onClick={handleSave} disabled={isPending} className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-white mt-6 shadow-2xl disabled:opacity-50 transition-all active:scale-95">
            {isPending ? "Procesando Contrato..." : "Confirmar Alineación"}
          </button>
        </div>
      </div>

      {/* --- TABLA DE PUNTUACIÓN Y TOTAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 flex justify-between items-end">
            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Rendimiento <span className="text-blue-500">Semanal</span></h3>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Estadísticas en vivo</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-950 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em]">
                  <th className="px-8 py-5">Pos</th>
                  <th className="px-8 py-5">Jugador Titular</th>
                  <th className="px-8 py-5 text-right">Fantasypoints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {POSITIONS_CONFIG.map((pos, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-8 py-5 font-black text-blue-500 text-sm">{pos.label}</td>
                    <td className="px-8 py-5">
                      <span className={fieldPlayers[index] ? "text-slate-200 font-bold uppercase text-sm" : "text-slate-600 font-black uppercase text-[10px] tracking-widest"}>
                        {fieldPlayers[index] || "VACANTE"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black italic text-xl text-white">
                      {playerPoints[index]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-900 border border-blue-400/30 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(37,99,235,0.15)] h-fit lg:h-full">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-4">Puntaje Global</p>
          <div className="text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl">
            {totalPoints}
          </div>
          <div className="w-16 h-1 bg-blue-400/50 rounded-full my-8"></div>
          <p className="text-[10px] font-black text-blue-200/80 uppercase tracking-widest leading-loose">
            Los puntos se actualizan automáticamente al finalizar la jornada.
          </p>
        </div>

      </div>
    </main>
  );
}