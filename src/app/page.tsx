// src/app/page.tsx
import { fetchWeekendSeries } from "@/lib/mlb";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import Link from "next/link";

export default async function Home() {
  const series = await fetchWeekendSeries();
  const { userId } = await auth();

  // Buscamos qué series ya votó el usuario para ponerle un tilde
  let userPredictions: any[] = [];
  if (userId) {
    userPredictions = await db.prediction.findMany({
      where: { userId: userId },
      include: { series: true }
    });
  }

  return (
    <main className="min-h-screen p-4 md:p-8 pt-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black italic uppercase text-white">
          Series del <span className="text-blue-500">Fin de Semana</span>
        </h2>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">
          Elegí una serie para dejar tu pronóstico
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {series.length > 0 ? (
          series.map((s: any) => {
            const hasVoted = userPredictions.some(p => p.series?.mlbSeriesId === s.id);

            return (
              <Link href={`/series/${s.id}`} key={s.id} className="block group">
                <div className={`rounded-2xl border p-6 transition-all duration-300 ${hasVoted ? 'bg-slate-900 border-blue-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'}`}>
                  
                  {hasVoted && (
                    <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md mb-4 inline-block">
                      Pronóstico Guardado
                    </span>
                  )}

                  <div className="flex justify-between items-center gap-4 mt-2">
                    <div className="text-center flex-1">
                      <h3 className="text-lg font-black italic uppercase text-slate-300">{s.awayTeam}</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Visitante</p>
                    </div>
                    <div className="text-slate-700 font-black italic">VS</div>
                    <div className="text-center flex-1">
                      <h3 className="text-lg font-black italic uppercase text-slate-300">{s.homeTeam}</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Local</p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-widest group-hover:text-blue-300 transition-colors">
                      {hasVoted ? "Ver mi pronóstico →" : "Ingresar pronóstico →"}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-2 text-center py-20 text-slate-600 font-bold uppercase tracking-widest">
            Buscando series...
          </div>
        )}
      </section>
    </main>
  );
}