// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar' // Importamos el Navbar
import './globals.css'

export const metadata = {
  title: 'MLB Prode',
  description: 'Pronósticos de fin de semana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="bg-slate-950 text-slate-100 min-h-screen">
          <Navbar /> {/* Lo ponemos arriba de todo */}
          {children}
          <Toaster theme="dark" position="bottom-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}