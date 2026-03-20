// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Prode", href: "/series" },
  { name: "Ranking", href: "/ranking" },
    { name: "Fantasy", href: "/fantasy" },
    { name: "Mi Perfil", href: "/perfil" },
    { name: "Reglas", href: "/reglas" }
  ];

  return (
    <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic">
            M
          </div>
          <span className="text-xl font-black italic uppercase tracking-tighter text-white">
            MLB <span className="text-blue-500">Prode</span>
          </span>
        </Link>

        {/* Links de navegación */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive 
                    ? "text-blue-500 scale-105 drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

   {/* Perfil del Usuario (Clerk) */}
        <div className="flex items-center gap-4">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-10 h-10 border-2 border-slate-800 shadow-lg"
              }
            }}
          />
        </div>
      </div>

      {/* Menú Mobile (Versión simple abajo del logo en celulares) */}
      <div className="md:hidden flex justify-center gap-6 pb-4 border-t border-slate-800/30 pt-3">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`text-[10px] font-black uppercase tracking-widest ${
              pathname === link.href ? "text-blue-500" : "text-slate-500"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}