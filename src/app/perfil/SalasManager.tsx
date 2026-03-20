// src/app/perfil/SalasManager.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createLeague, joinLeague } from "@/app/actions";

export default function SalasManager({ misSalas }: { misSalas: any[] }) {
  const [loading, setLoading] = useState(false);

  const handleCrearSala = async () => {
    const nombre = window.prompt("Ingresá el nombre para tu nueva Sala de Amigos:");
    if (!nombre) return;

    setLoading(true);
    const res = await createLeague(nombre);
    if (res.success) {
      toast.success(`¡Sala "${nombre}" creada!`, {
        description: `El código de invitación es: ${res.league?.inviteCode}`
      });
    } else {
      toast.error("Error", { description: res.error });
    }
    setLoading(false);
  };

  const handleUnirseSala = async () => {
    const codigo = window.prompt("Ingresá el código secreto de la Sala (Ej: X7A9QB):");
    if (!codigo) return;

    setLoading(true);
    const res = await joinLeague(codigo);
    if (res.success) {
      toast.success("¡Adentro!", {
        description: `Te uniste con éxito a la sala.`
      });
    } else {
      toast.error("Error", { description: res.error });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
        Mis <span className="text-blue-500">Salas</span>
      </h2>
      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
        
        {/* LISTA DE SALAS REALES */}
        <div className="space-y-3 mb-6">
          {misSalas.length > 0 ? (
            misSalas.map((sala) => (
              <div key={sala.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/50 hover:border-blue-500/30 transition-colors">
                <div>
                  <p className="font-bold text-sm text-slate-200 uppercase">{sala.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 font-black">
                    Código: <span className="text-blue-400">{sala.inviteCode}</span>
                  </p>
                </div>
                {/* Acá en el futuro podemos poner un link para ver el ranking interno de la sala */}
                <span className="text-blue-500 text-sm font-black cursor-pointer">→</span>
              </div>
            ))
          ) : (
            <p className="text-center text-xs font-bold text-slate-500 py-2 uppercase tracking-widest">
              No estás en ninguna sala.
            </p>
          )}
        </div>

        {/* BOTONES INTERACTIVOS */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleCrearSala}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Procesando..." : "+ Crear Sala Privada"}
          </button>
          <button 
            onClick={handleUnirseSala}
            disabled={loading}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Unirse con Código"}
          </button>
        </div>
      </div>
    </div>
  );
}