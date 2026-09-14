import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const rol = (req.nextauth.token as any)?.rol;

    if (pathname.startsWith("/admin") && rol !== "ADMIN") {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/puntos/:path*",
    "/registros/:path*",
    "/api/admin/:path*",
  ],
};
