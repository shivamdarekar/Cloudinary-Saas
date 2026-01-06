import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
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
    
    // Allow public routes without authentication
    if(isPublicRoute(req) || isPublicApiRoute(req)){
        return NextResponse.next()
    }
    
    // If user is not logged in and trying to access a protected route
    if(!userId && !isPublicRoute(req)){
        return NextResponse.redirect(new URL("/home", req.url))
    }

    return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};