import { NextResponse, NextRequest } from "next/server";

const protectedRoutes = ["/profile", "/confirmation", "/dnd/create-campaign"];

export function middleware(request: NextRequest) {
  const memberCookie = request.cookies.get("member")?.value;
  const sessionCookie = request.cookies.get("session")?.value;
  const { pathname, searchParams } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !sessionCookie) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/ticket")) {
    const hasTicketAccess = memberCookie === "true";
    const token = searchParams.get("token");

    if (hasTicketAccess) {
      return NextResponse.redirect(
        new URL(`/admin/ticket?token=${token}`, request.url),
      );
    } else {
      return NextResponse.next();
    }
  }

  if (pathname.startsWith("/admin")) {
    const isAdmin = memberCookie === "true";
    if (isAdmin) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/ticket/:path*",
    "/profile/:path*",
    "/confirmation/:path*",
    "/dnd/create-campaign/:path*",
    "/dnd/checkout/:path*",
  ],
};
