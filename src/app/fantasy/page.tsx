// src/app/fantasy/page.tsx
"use client";
import { useState, useEffect } from "react";
import { saveFantasyTeam, getMyFantasyTeam } from "@/app/actions";
import { fetchAllMLBTeams, fetchTeamRoster } from "@/lib/mlbFantasy";
import { toast } from "sonner";

// --- CONFIGURACIÓN DEL CAMPO (9 POSICIONES, DH EN VEZ DE P) ---
const POSITIONS_CONFIG = [
  { id: 0, label: "C", name: "Catcher", top: '82%', left: '50%' },
  { id: 1, label: "1B", name: "Primera Base", top: '55%', left: '72%' },
  { id: 2, label: "2B", name: "Segunda Base", top: '38%', left: '62%' },
  { id: 3, label: "3B", name: "Tercera Base", top: '55%', left: '28%' },
  { id: 4, label: "SS", name: "Shortstop", top: '38%', left: '38%' },
  { id: 5, label: "LF", name: "Left Fielder", top: '22%', left: '25%' },
  { id: 6, label: "CF", name: "Center Fielder", top: '15%', left: '50%' },
  { id: 7, label: "RF", name: "Right Fielder", top: '22%', left: '75%' },
  { id: 8, label: "DH", name: "Designado", top: '82%', left: '25%' },
];

export default function FantasyPage() {
  const [fieldPlayers, setFieldPlayers] = useState<(string | null)[]>(Array(9).fill(null));
  const [isPending, setIsPending] = useState(false);
  const [isFieldLoading, setIsFieldLoading] = useState(true);
  
  // Estado para el jugador que tenemos "agarrado" para ubicar
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
    // Si el que toco es el mismo que ya tengo seleccionado, lo deselecciono (limpio)
    if (selectedFromList?.id === player.id) {
      setSelectedFromList(null);
      toast.dismiss(); // Cierra el mensajito de arriba
      return;
    }

    setSelectedFromList({ ...player, teamName: selectedTeamName });
    toast.info(`Seleccionaste a ${player.name}`, { 
      description: "Ahora tocá una posición en el diamante para ubicarlo." 
    });
  };

 const handlePlaceInField = (index: number) => {
    // CASO A: No tengo a nadie seleccionado en la lista, pero la base está ocupada -> LIMPIAR BASE
    if (!selectedFromList) {
      if (fieldPlayers[index]) {
        const removedPlayer = fieldPlayers[index];
        const newField = [...fieldPlayers];
        newField[index] = null; // Quitamos al jugador
        setFieldPlayers(newField);
        toast.success("Posición liberada", { description: `${removedPlayer} volvió al banco.` });
      } else {
        toast.error("Primero elegí un jugador de la lista de la derecha");
      }
      return;
    }

    // CASO B: Tengo a alguien seleccionado -> UBICAR O REEMPLAZAR
    const teamToValidate = selectedFromList.teamName;
    const countFromSameTeam = fieldPlayers.filter(p => p && p.includes(`(${teamToValidate}`)).length;
    
    if (countFromSameTeam >= 3) {
      const isReplacingSameTeam = fieldPlayers[index] && fieldPlayers[index]?.includes(`(${teamToValidate}`);
      if (!isReplacingSameTeam) {
        toast.error(`Límite alcanzado`, { description: `Ya tenés 3 jugadores de los ${teamToValidate}.` });
        return;
      }
    }

    const newField = [...fieldPlayers];
    newField[index] = `${selectedFromList.name} (${selectedFromList.teamName} - ${selectedFromList.positionAbbr})`;
    setFieldPlayers(newField);
    setSelectedFromList(null); // Soltamos al jugador después de ubicarlo
    toast.success(`${selectedFromList.name} ubicado.`);
  };

  const handleSave = async () => {
    if (fieldPlayers.some(p => !p)) {
      toast.error("Equipo incompleto");
      return;
    }
    setIsPending(true);
    const res = await saveFantasyTeam(fieldPlayers as string[]);
    if (res.success) toast.success("¡Novenita Guardada!");
    setIsPending(false);
  };

  const totalPoints = playerPoints.reduce((acc, curr) => acc + curr, 0);

  return (
    <main className="min-h-screen p-4 md:p-8 pt-8 max-w-7xl mx-auto text-slate-100 bg-slate-950">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black italic uppercase text-white tracking-tighter">
          Mi <span className="text-blue-500">Draf</span> Ideal
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
          Máximo 3 jugadores por equipo | DH Incluido
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        {/* DIAMANTE */}
        <div className="xl:col-span-2 relative aspect-[4/3] bg-emerald-950 rounded-[3rem] border-4 border-emerald-900 shadow-2xl overflow-hidden p-4">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
             <div className="w-full h-full border-[10px] border-emerald-700 rounded-full scale-110"></div>
          </div>
          {isFieldLoading ? (
             <div className="absolute inset-0 flex items-center justify-center font-black uppercase text-emerald-800 animate-pulse">Cargando diamante...</div>
          ) : (
            POSITIONS_CONFIG.map((pos) => (
              <button 
                key={pos.id}
                onClick={() => handlePlaceInField(pos.id)}
                className="absolute group z-10 -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className={`w-28 h-20 rounded-2xl p-2 flex flex-col items-center justify-center text-center border-2 transition-all ${
                  fieldPlayers[pos.id] 
                    ? 'bg-slate-900 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                    : selectedFromList ? 'bg-blue-600/20 border-blue-400 animate-pulse' : 'bg-emerald-900/80 border-emerald-700 hover:border-emerald-500'
                }`}>
                  <span className={`text-[9px] font-black uppercase ${fieldPlayers[pos.id] ? 'text-blue-400' : 'text-emerald-600'}`}>{pos.label}</span>
                  <p className={`text-[11px] font-bold leading-tight line-clamp-2 ${fieldPlayers[pos.id] ? 'text-white' : 'text-emerald-800'}`}>{fieldPlayers[pos.id] || pos.name}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* LISTA DERECHA */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 flex flex-col h-[650px] shadow-2xl">
          <h2 className="text-xl font-black uppercase mb-6 tracking-tight">Mercado de <span className="text-blue-500">Pases</span></h2>
          <select 
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white mb-4 outline-none focus:border-blue-500 transition-all"
          >
            <option value="">-- Elegir Equipo MLB --</option>
            {allTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <div className="space-y-2 flex-grow overflow-y-auto pr-2 border-t border-slate-800 pt-4">
            {isRosterLoading ? (
                <div className="text-center py-10 text-xs font-black uppercase text-slate-700 animate-pulse">Buscando Rosters...</div>
            ) : currentRoster.map((p) => (
              <button 
                key={p.id} 
                onClick={() => handleSelectFromList(p)} 
                className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all ${selectedFromList?.id === p.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
              >
                <span className="text-sm font-bold truncate">{p.name} ({p.positionAbbr})</span>
                <span>{selectedFromList?.id === p.id ? '🎯' : '＋'}</span>
              </button>
            ))}
          </div>
          <button onClick={handleSave} disabled={isPending} className="w-full py-4 rounded-xl font-black uppercase bg-blue-600 hover:bg-blue-500 mt-4 shadow-lg disabled:opacity-50">
            {isPending ? "Guardando..." : "Confirmar Alineación"}
          </button>
        </div>
      </div>

      {/* --- TABLA DE PUNTUACIÓN Y TOTAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-xl font-black uppercase italic tracking-tight">Resumen de <span className="text-blue-500">Puntuación</span></h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Jugador Seleccionado</th>
                <th className="px-6 py-4 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {POSITIONS_CONFIG.map((pos, index) => (
                <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-black text-blue-500 text-sm">{pos.label}</td>
                  <td className="px-6 py-4">
                    <span className={fieldPlayers[index] ? "text-slate-100 font-bold" : "text-slate-600 italic text-sm"}>
                      {fieldPlayers[index] || "Posición vacía"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                    {playerPoints[index]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-600 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-[0_0_40px_rgba(37,99,235,0.2)] h-fit lg:h-full">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-2">Puntaje Total del Equipo</p>
          <div className="text-7xl font-black italic tracking-tighter text-white mb-4">
            {totalPoints}
          </div>
          <div className="w-full h-1 bg-blue-400/30 rounded-full mb-4"></div>
          <p className="text-xs font-bold text-blue-100 uppercase leading-relaxed">
            Sumá puntos por cada Home Run, Carrera Impulsada y Victoria de tus elegidos.
          </p>
        </div>
      </div>
    </main>
  );
}