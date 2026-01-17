import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // 檢查是否是登入頁面
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next()
  }

  // 檢查是否是 API 路由或靜態資源
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // 檢查是否有認證 cookie
  const authToken = request.cookies.get("auth-token")

  if (!authToken || authToken.value !== "authenticated") {
    // 未認證，重定向到登入頁面
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 已認證，允許訪問
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
