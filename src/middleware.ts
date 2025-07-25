import { NextResponse, NextRequest } from "next/server";

// Middleware for /admin
// Middleware for /ticket
export function middleware(request: NextRequest) {
  const cookie = request.cookies.get("member")?.value;
  const url = request.nextUrl;

  if (url.pathname.startsWith("/ticket")) {
    const hasTicketAccess = cookie === "true";
    const token = url.searchParams.get("token");

    if (hasTicketAccess) {
      return NextResponse.redirect(
        new URL(`/admin/ticket?token=${token}`, request.url)
      );
    } else {
      return NextResponse.next();
    }
  }

  if (url.pathname.startsWith("/admin")) {
    const isAdmin = cookie === "true";
    if (isAdmin) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
}

export const config = {
  matcher: ["/admin/:path*", "/ticket/:path*"],
};
