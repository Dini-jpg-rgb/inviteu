import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;
  const userRole = request.cookies.get("role")?.value || "";

  // 1. Rute Terlindungi untuk Partner
  const isPartnerRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invitations") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/profile");

  const isAdminRoute = pathname.startsWith("/admin");
  const isDesignerRoute = pathname.startsWith("/designer");

  if (pathname === "/logout") {
    return NextResponse.next();
  }

  // 2. Akses halaman Login/Register diizinkan langsung agar pengguna dapat melihat form masuk/daftar
  // Tidak ada auto-redirect paksa ke dashboard agar halaman login dan register selalu dapat diakses

  // 3. Jika rute butuh autentikasi dan token belum ada
  if (isPartnerRoute || isAdminRoute || isDesignerRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-Based Access Control (RBAC) Logic
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isDesignerRoute && userRole !== "designer" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      isPartnerRoute &&
      userRole !== "partner" &&
      userRole !== "customer" &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
