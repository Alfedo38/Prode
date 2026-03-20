// src/app/reglas/page.tsx
import Link from "next/link";

export default function ReglasPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100 pb-20">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* CABECERA */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 mb-8 font-bold uppercase text-xs tracking-widest transition-colors">
            <span>←</span> Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            Manual del <span className="text-blue-500">Mánager</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
            Sistema de puntuación y reglamento oficial
          </p>
        </div>

        <div className="space-y-6">
          
          {/* REGLA 1: LA BOLETA (PARTIDOS Y SERIE) */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3 mb-6">
              1. La Boleta <span className="text-blue-500">Maestra</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium mb-6">
              El objetivo principal es predecir los resultados de las series de fin de semana de la MLB. Los puntos se dividen en dos categorías: por partido individual y por el resultado global de la serie.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800/50 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-white uppercase text-sm">Ganador del Partido</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Acertar V o L por juego</p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 font-black px-3 py-1 rounded-lg border border-emerald-500/30">+1 PT</span>
              </div>
              
              <div className="bg-slate-950 border border-slate-800/50 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-white uppercase text-sm">Ganador de la Serie</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Quién gana más juegos</p>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 font-black px-3 py-1 rounded-lg border border-emerald-500/30">+1 PT</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/50 p-5 rounded-2xl flex justify-between items-center md:col-span-2 border-l-4 border-l-blue-500">
                <div>
                  <p className="font-bold text-white uppercase text-sm">Resultado Exacto de la Serie</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Ej: Acertar que termina 2-1 a favor del Local</p>
                </div>
                <span className="bg-blue-500/20 text-blue-400 font-black px-3 py-1 rounded-lg border border-blue-500/30">+3 PTS</span>
              </div>
            </div>
          </section>

          {/* REGLA 2: EL PITCHER (SÍ / NO) */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl">
            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3 mb-6">
              2. El Factor <span className="text-amber-500">Pitcher</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium mb-6">
              La pregunta más difícil tiene la mayor recompensa. Debes decidir si el lanzador abridor (Starting Pitcher) del equipo ganador se anotará oficialmente la victoria en sus estadísticas personales, o si la victoria se la llevará el bullpen.
            </p>

            <div className="bg-slate-950 border border-slate-800/50 p-5 rounded-2xl flex justify-between items-center border-l-4 border-l-amber-500">
              <div>
                <p className="font-bold text-white uppercase text-sm">Acierto de Decisión (SÍ / NO)</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Se evalúa usando la decisión oficial de la MLB</p>
              </div>
              <span className="bg-amber-500/20 text-amber-500 font-black px-3 py-1 rounded-lg border border-amber-500/30">+3 PTS</span>
            </div>
          </section>

          {/* REGLA 3: EL CANDADO */}
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl">
            <h2 className="text-2xl font-black uppercase italic text-white flex items-center gap-3 mb-4">
              3. Cierre de <span className="text-red-500">Apuestas 🔒</span>
            </h2>
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
              <p className="text-red-200 text-sm md:text-base font-medium">
                Las predicciones de una serie se bloquean automáticamente en el momento exacto en que comienza el <strong className="text-red-400">Juego 1</strong>. Una vez que la bola está en juego, no podrás modificar tus selecciones ni las respuestas de los pitchers para esa serie.
              </p>
            </div>
          </section>

          {/* REGLA 4: FANTASY Y SALAS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-black uppercase italic text-white mb-4">
                El <span className="text-emerald-500">Fantasy</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                Arma tu alineación de 9 jugadores activos. Todos los días a la mañana, el sistema revisará cómo rindieron tus jugadores en la vida real y te otorgará puntos según sus estadísticas (Hits, Home Runs, Carreras).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-xl">
              <h2 className="text-xl font-black uppercase italic text-white mb-4">
                Salas <span className="text-blue-500">Privadas</span>
              </h2>
              <p className="text-slate-400 text-sm font-medium">
                Ve a tu perfil para crear una Sala Privada. Comparte el código de 6 dígitos con tus amigos para que se unan. Podrán ver una tabla de posiciones exclusiva solo con los miembros de ese grupo.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}