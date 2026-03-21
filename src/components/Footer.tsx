// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/50 pt-12 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          {/* Logo / Nombre del Proyecto (Cambiado a versión legal) */}
          <div className="flex items-center gap-2 grayscale opacity-50">
            <div className="w-6 h-6 bg-slate-700 rounded-md flex items-center justify-center font-black text-white italic text-xs">
              P
            </div>
            <span className="text-lg font-black italic uppercase tracking-tighter text-slate-400">
              Prode de <span className="text-slate-500">Béisbol</span>
            </span>
          </div>

          {/* Links útiles */}
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Link href="/reglas" className="hover:text-slate-300 transition-colors">Reglas del Juego</Link>
            <Link href="/#contacto" className="hover:text-slate-300 transition-colors">Contacto</Link>
          </div>
        </div>

        {/* === EL DISCLAIMER LEGAL IMPORTANTE === */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center md:text-left">
          <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">
            <strong className="text-slate-400">Aviso Legal (Disclaimer):</strong> Este sitio web es una plataforma de entretenimiento no comercial creada para fanáticos. 
            No estamos afiliados, asociados, autorizados, patrocinados ni respaldados oficialmente por Major League Baseball (MLB), 
            MLB Advanced Media, L.P., ni por ninguna de sus franquicias, equipos, jugadores o subsidiarias. 
            Todos los nombres de equipos, logos, marcas comerciales y estadísticas mencionados en esta plataforma son propiedad de sus respectivos dueños 
            y se utilizan únicamente con fines informativos y de identificación bajo la doctrina de "Uso Justo" (Fair Use).
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
            © {currentYear} Prode de Béisbol. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
}