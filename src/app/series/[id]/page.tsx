// src/app/series/[id]/page.tsx
import { fetchWeekendSeries } from "@/lib/mlb";
import SeriesCard from "@/components/SeriesCard";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

// En Next.js moderno, los parámetros de la URL se reciben así
export default async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Obtenemos el ID de la serie desde la URL (ej: 123-456)
  const { id } = await params;

  // 2. Buscamos los datos de esa serie en particular
  const seriesList = await fetchWeekendSeries();
  const seriesData = seriesList.find((s: any) => s.id === id);

  // Si alguien pone una URL vieja o inventada, lo mandamos al inicio
  if (!seriesData) {
    redirect("/");
  }

  // 3. Buscamos si el usuario ya votó ESTA serie
  const { userId } = await auth();
  let userPredictions: any[] = [];
  
  if (userId) {
    userPredictions = await db.prediction.findMany({
      where: { 
        userId: userId,
        series: { mlbSeriesId: id } // Solo traemos la predicción de este partido
      },
      include: { series: true }
    });
  }

  return (
    <main className="min-h-screen p-4 md:p-8 pt-4 max-w-4xl mx-auto">
      {/* Botón Volver */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 mb-8 font-bold uppercase text-xs tracking-widest transition-colors"
      >
        <span>←</span> Volver a los partidos
      </Link>
      
      {/* Renderizamos la tarjeta mágica que ya armamos */}
      <SeriesCard s={seriesData} userPredictions={userPredictions} />
    </main>
  );
}