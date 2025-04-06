import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get("session_id")?.value
  const path = request.nextUrl.pathname

  // Protected routes
  const protectedRoutes = ["/dashboard", "/expenses", "/income", "/budgets", "/goals"]

  // Auth routes
  const authRoutes = ["/login", "/register"]

  // Check if the route is protected and user is not logged in
  if (protectedRoutes.some((route) => path.startsWith(route)) && !sessionId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check if the route is auth and user is logged in
  if (authRoutes.includes(path) && sessionId) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/income/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/login",
    "/register",
  ],
}

