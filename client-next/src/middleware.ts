import { NextResponse, type NextRequest } from "next/server";

// 公開路由（未登入可訪問）
const PUBLIC_PREFIXES = ["/login", "/reset-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("JSESSIONID")?.value);
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  // 未登入訪問受保護路由 → 導向登入
  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // Note: 不在 middleware 做「已登入→強制離開 /login」的 redirect。
  // 原因：JSESSIONID 可能已過期，此時 getServerSession() 返回 null，
  // layout.tsx redirect to /login，若 middleware 再 redirect 回去就是無限 loop。
  // 「已登入訪問 /login 重導首頁」由登入頁 client-side 處理。

  const res = NextResponse.next();
  // 基本安全標頭（嚴格 CSP nonce 留待 Phase 3 hardening，避免破壞 antd CSS-in-JS）
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "same-origin");
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
