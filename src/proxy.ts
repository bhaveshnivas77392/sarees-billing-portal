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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
// END GENAI
