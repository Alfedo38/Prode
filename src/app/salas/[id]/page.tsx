// src/app/salas/[id]/page.tsx
import db from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function SalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const resolvedParams = await params;
  const salaId = resolvedParams.id;

  // 1. Buscamos la sala y sus miembros
  const sala = await db.league.findUnique({
    where: { id: salaId },
    include: { members: true }
  });

  if (!sala) redirect("/perfil");

  // Seguridad: Verificamos que el usuario pertenezca a esta sala
  const soyMiembro = sala.members.some(m => m.userId === userId);
  if (!soyMiembro) redirect("/perfil");

  // 2. Buscamos los puntos de todos los miembros
  const memberIds = sala.members.map(m => m.userId);
  const predicciones = await db.prediction.findMany({
    where: { userId: { in: memberIds } }
  });

  // 3. Traemos los nombres y fotos desde Clerk
  const client = await clerkClient();
  const usersData = await client.users.getUserList({ userId: memberIds });

  // 4. Calculamos el Ranking de esta Sala (Datos puros)
  const ranking = sala.members.map(member => {
    // Filtramos los pronósticos solo de este jugador
    const userPreds = predicciones.filter(p => p.userId === member.userId);
    const puntos = userPreds.reduce((sum, p) => sum + p.pointsEarned, 0);
    const efectividad = userPreds.length > 0 ? Math.round((puntos / (userPreds.length * 14)) * 100) : 0;
    
    // Buscamos su perfil de Clerk
    const clerkUser = usersData.data.find(u => u.id === member.userId);
    
    return {
      id: member.userId,
      nombre: clerkUser?.firstName || clerkUser?.username || "Mánager",
      imagen: clerkUser?.imageUrl || "",
      puntos: puntos,
      efectividad: efectividad,
      esCreador: member.userId === sala.ownerId
    };
  }).sort((a, b) => b.puntos - a.puntos); // Ordenamos de mayor a menor puntaje

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <Link href="/perfil" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 font-bold uppercase text-xs tracking-widest transition-colors">
          <span>←</span> Volver a mi perfil
        </Link>

        {/* --- CABECERA DE LA SALA --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              {sala.name}
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex gap-3">
              <span>👥 {ranking.length} Mánagers</span>
              <span>•</span>
              <span className="text-blue-500">CÓDIGO: {sala.inviteCode}</span>
            </p>
          </div>
        </div>

        {/* --- TABLA DE POSICIONES (DATOS PUROS) --- */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800/50 bg-slate-950/30 flex justify-between items-center">
            <h2 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
              Tabla de <span className="text-blue-500">Posiciones</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-800/50">
            {ranking.map((jugador, index) => (
              <div 
                key={jugador.id} 
                className={`flex items-center gap-4 p-4 md:p-6 transition-colors ${jugador.id === userId ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'}`}
              >
                {/* Posición */}
                <div className="w-8 md:w-12 text-center">
                  <span className={`text-xl md:text-2xl font-black italic ${
                    index === 0 ? 'text-amber-500' : 
                    index === 1 ? 'text-slate-300' : 
                    index === 2 ? 'text-amber-700' : 'text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Avatar y Nombre */}
                <div className="flex-1 flex items-center gap-4">
                  {jugador.imagen ? (
                    <Image src={jugador.imagen} alt={jugador.nombre} width={48} height={48} className="rounded-xl border border-slate-700 shadow-md" />
                  ) : (
                    <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700"></div>
                  )}
                  <div>
                    <p className="font-black text-sm md:text-lg text-white uppercase flex items-center gap-2">
                      {jugador.nombre}
                      {jugador.esCreador && <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-sm tracking-widest">CREADOR</span>}
                      {jugador.id === userId && <span className="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-sm tracking-widest">TÚ</span>}
                    </p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                      Efectividad: {jugador.efectividad}%
                    </p>
                  </div>
                </div>

                {/* Puntos */}
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-black italic text-blue-500 drop-shadow-sm">{jugador.puntos}</p>
                  <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest mt-0.5">PTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}