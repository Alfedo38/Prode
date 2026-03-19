import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/(.*)']);

// 1. Agregamos el "async" antes de (auth, req)
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // 2. Le sacamos los paréntesis a auth y le ponemos "await"
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};