import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./lib/constants";
import { readSessionToken } from "./lib/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const esEmprendedor = pathname.startsWith("/emprendedor");
  const esAdmin = pathname.startsWith("/admin");
  if (!esEmprendedor && !esAdmin) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  const permitido =
    (esEmprendedor && session?.rol === "emprendedor") ||
    (esAdmin && session?.rol === "admin");
  if (permitido) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/ingreso";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/emprendedor/:path*", "/admin/:path*"],
};
