"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="font-black italic text-xl tracking-tighter uppercase">
          MLB <span className="text-blue-500">PRODE</span>
        </Link>

        {/* Links del Menú */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm font-bold uppercase transition-colors ${pathname === "/" ? "text-blue-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            Partidos
          </Link>
          <Link 
            href="/ranking" 
            className={`text-sm font-bold uppercase transition-colors ${pathname === "/ranking" ? "text-blue-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            Ranking
          </Link>
<Link 
            href="/fantasy" 
            className={`text-sm font-bold uppercase transition-colors ${pathname === "/fantasy" ? "text-blue-500" : "text-slate-400 hover:text-slate-200"}`}
          >
            Mi Equipo
          </Link>
          
          {/* Foto de Perfil */}
          <div className="ml-2 pl-6 border-l border-slate-800">
            <UserButton />
          </div>
        </div>

      </div>
    </nav>
  );
}