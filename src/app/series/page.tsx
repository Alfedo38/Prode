// src/app/series/page.tsx
import { fetchWeekendSeries } from "@/lib/mlb";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import Link from "next/link";
import BoletaForm from "./BoletaForm";

export default async function SeriesPage() {
  const seriesList = await fetchWeekendSeries();
  const { userId } = await auth();

  let userPredictions: any[] = [];
  if (userId) {
    userPredictions = await db.prediction.findMany({
      where: { userId: userId },
      include: { series: true }
    });
  }

  return (
    <main className="min-h-screen p-4 md:p-8 pt-4 max-w-7xl mx-auto text-slate-100 bg-slate-950">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 mb-8 font-bold uppercase text-xs tracking-widest transition-colors">
        <span>←</span> Volver al inicio
      </Link>

      <div className="mb-10">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">
          Boleta <span className="text-blue-500">Maestra</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
          Completá tu jornada rápidamente y sumá puntos
        </p>
      </div>

      {/* Ya no pasamos pitchersBySeries, la Boleta se maneja sola */}
      <BoletaForm seriesList={seriesList} userPredictions={userPredictions} />
    </main>
  );
}