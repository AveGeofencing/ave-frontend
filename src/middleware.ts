// // middleware.ts (at the root of your project, next to app/)
// import { NextRequest, NextResponse } from "next/server";

// const PUBLIC_ROUTES = ["/", "/register"];

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get("access_token")?.value;
//   const { pathname } = request.nextUrl;

//   const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

//   // No token + trying to access protected route → send to login
//   if (!token && !isPublicRoute) {
//     return NextResponse.redirect(new URL("/", request.url));
//   }

//   // Has token + on login page → send to dashboard
//   if (token && isPublicRoute) {
//     return NextResponse.redirect(new URL("/dashboard", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next|api|.*\\..*).*)"], // ignore Next.js internals and static files
// };