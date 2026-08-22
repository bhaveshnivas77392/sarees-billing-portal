// START GENAI
import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { toAppSession } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = toAppSession(user);

  if (pathname === "/") {
    const home = session.role === "OWNER" ? "/dashboard" : `/branch/${session.branchId}`;
    return NextResponse.redirect(new URL(home, request.url));
  }

  // MANAGER/STAFF are confined to their own branch; OWNER can go anywhere.
  if (session.role !== "OWNER" && pathname.startsWith("/branch/")) {
    const branchIdInPath = pathname.split("/")[2];
    if (branchIdInPath !== session.branchId) {
      return NextResponse.redirect(new URL(`/branch/${session.branchId}`, request.url));
    }
  }

  if (session.role !== "OWNER" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL(`/branch/${session.branchId}`, request.url));
  }

  return response;
}

// API routes handle their own auth (session checks in server actions, header checks for
// admin endpoints) rather than being redirected to /login like page navigations. Static
// assets (anything with a file extension - icons, manifest.json, images) are excluded
// wholesale rather than by name, since a request for e.g. /saree-logo.png on the
// unauthenticated login page would otherwise get redirected to /login instead of the image.
export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|.*\\..*).*)"],
};
// END GENAI
