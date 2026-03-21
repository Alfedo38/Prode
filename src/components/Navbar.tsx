// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  const navLinks = [
    { name: "Prode", href: "/series" },
    { name: "Ranking", href: "/ranking" },
    { name: "Fantasy", href: "/fantasy" },
    { name: "Mi Perfil", href: "/perfil" },
    { name: "Reglas", href: "/reglas" }
  ];

  return (
    <nav className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* Logo - Identidad PRODEMLB */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-red-600 rounded-md rotate-[-15deg] flex items-center justify-center shadow-lg group-hover:rotate-0 transition-transform">
            <span className="text-white font-black text-2xl italic leading-none mt-[-2px]">P</span>
          </div>
          <span className="text-2xl font-black italic uppercase tracking-tighter text-white">
            PRODE<span className="text-red-500">MLB</span>
          </span>
        </Link>

        {/* Links de navegación (Desktop) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  isActive 
                    ? "text-red-500 scale-105 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Perfil del Usuario o Botón de Login (Clerk Seguro) */}
        <div className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-slate-800 shadow-lg"
                }
              }}
            />
          ) : (
            isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="bg-blue-900 text-white font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-[10px] hover:bg-blue-800 border border-blue-700 transition-colors shadow-lg">
                  Entrar
                </button>
              </SignInButton>
            )
          )}
        </div>
      </div>

      {/* Menú Mobile */}
      <div className="md:hidden flex flex-wrap justify-center gap-x-6 gap-y-3 pb-4 border-t border-slate-800/50 pt-3 px-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                isActive ? "text-red-500" : "text-slate-400"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}