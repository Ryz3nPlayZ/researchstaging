import { type NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'research_token';

// Routes that are accessible without auth
const PUBLIC_PATHS = [
    '/login',
    '/signup',
    '/callback',
    '/auth/callback',
    '/terms',
    '/privacy',
];

// Routes only admins can access
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip Next.js internals and static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.') // static files (favicon, images, etc.)
    ) {
        return NextResponse.next();
    }

    // Always allow OAuth callback — never gate it behind auth
    if (pathname === '/callback' || pathname.startsWith('/callback/') || pathname === '/auth/callback') {
        return NextResponse.next();
    }

    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    // Redirect unauthenticated users away from protected routes
    if (!isPublic && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages (but NOT the callback)
    if (isPublic && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Admin paths: we let the page/layout handle the admin check (since we
    // can't verify the JWT at edge without the secret). The backend will reject
    // any non-admin API calls with 403.
    void ADMIN_PATHS; // unused at edge — handled server-side

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimisation)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
