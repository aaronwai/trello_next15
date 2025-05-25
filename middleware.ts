import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Handle public routes
  if (isPublicRoute(req)) return NextResponse.next();

  // 2. Authenticate the request (NEW v6 SYNTAX)
  const { userId, orgId } = await auth();

  // 3. Unauthenticated users
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 4. Authenticated but no org selected
  if (!orgId && !req.nextUrl.pathname.startsWith("/select-org")) {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }

  // 5. Add security headers (optional)
  const response = NextResponse.next();
  response.headers.set("x-auth-user", userId);
  return response;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
