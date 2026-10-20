import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  // Hapus cookie sesi
  response.cookies.set("token", "", { path: "/", maxAge: 0 });
  response.cookies.set("role", "", { path: "/", maxAge: 0 });

  return response;
}
