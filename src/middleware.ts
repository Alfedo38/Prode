// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Definimos qué rutas NO necesitan estar logueado para entrar
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/',                // El Home es público para ver los partidos
  '/api/webhooks(.*)',// Webhooks de Clerk o pagos
  '/api/cron(.*)'     // ✅ Cubre /api/cron/update-scores y /api/cron/update-fantasy
]);

export default clerkMiddleware(async (auth, request) => {
  // 2. Si la ruta NO es pública (es decir, es privada), protegela con auth.protect()
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Ignora archivos internos de Next.js y archivos estáticos (imágenes, fuentes, etc.)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre ejecuta para las rutas de API
    '/(api|trpc)(.*)',
  ],
};