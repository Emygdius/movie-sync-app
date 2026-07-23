import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that ANYONE (guests & host) can access without signing in
const isPublicRoute = createRouteMatcher([
  '/',
  '/room(.*)', // Allows guests to freely open room links!
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is NOT public, require sign-in
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};