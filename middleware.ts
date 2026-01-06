import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
    "/",
    "/home",
    // Allow access to all processing pages without auth
    "/image-compressor",
    "/background-remover", 
    "/image-optimizer",
    "/social-resizer",
    "/passport-maker",
    "/format-converter"
])

const isPublicApiRoute = createRouteMatcher([
    // Allow image processing APIs without auth (rate limited)
    "/api/image-compress",
    "/api/background-remove",
    "/api/image-optimize",
    "/api/social-resize",
    "/api/passport-resize",
    "/api/format-convert"
])

export default clerkMiddleware(async (auth, req) => {
    const {userId} = await auth();
    const currentUrl = new URL(req.url)
    const isAccessingDashboard = currentUrl.pathname === "/home"

    // If user is logged in and accessing sign-in/sign-up, redirect intelligently
    if(userId && (currentUrl.pathname === "/sign-in" || currentUrl.pathname === "/sign-up")) {
        // Check if there's a redirect URL in the query params
        const redirectTo = currentUrl.searchParams.get('redirect_url');
        if (redirectTo && isPublicRoute({url: redirectTo} as any)) {
            return NextResponse.redirect(new URL(redirectTo, req.url));
        }
        return NextResponse.redirect(new URL("/home", req.url))
    }
    
    // Allow public routes without authentication
    if(isPublicRoute(req) || isPublicApiRoute(req)){
        return NextResponse.next()
    }
    
    // If user is not logged in and trying to access a protected route
    if(!userId && !isPublicRoute(req)){
        return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};