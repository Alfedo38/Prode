// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import Navbar from "@/components/Navbar"; // <-- 1. Importá el Navbar
import './globals.css'

export const metadata = {
  title: 'MLB Prode',
  description: 'Pronósticos de fin de semana',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-slate-950 text-slate-100">
          
          <Navbar /> {/* <-- 2. Ponelo justo adentro del body, arriba de los children */}
          
          {children}
          
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}