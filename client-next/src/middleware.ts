import { NextResponse, type NextRequest } from "next/server";

// 公開路由（未登入可訪問）
const PUBLIC_PREFIXES = ["/login", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("eds_session")?.value);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // 未登入訪問受保護路由 → 導向登入
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 已登入又回到登入頁 → 導向首頁
  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/users";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // 基本安全標頭（嚴格 CSP nonce 留待 Phase 3 hardening，避免破壞 antd CSS-in-JS）
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "same-origin");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
