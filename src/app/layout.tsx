// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer"; // <-- Corregido (faltaba la comilla final)
import './globals.css';

// Actualizamos el título de la pestaña por el nuevo nombre
export const metadata = {
  title: 'Prode de Béisbol',
  description: 'Pronósticos de fin de semana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        {/* Agregamos flex y min-h-screen para que el Footer vaya al fondo */}
        <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
          
          <Navbar />
          
          {/* El flex-1 empuja el Footer hacia abajo si la página es corta */}
          <div className="flex-1">
            {children}
          </div>

          <Footer /> {/* <-- Corregido (se había colado un punto suelto) */}
          
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}