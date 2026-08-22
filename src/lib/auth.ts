// START GENAI
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type AppRole = "OWNER" | "MANAGER" | "STAFF";

export type AppSession = {
  id: string;
  email: string;
  role: AppRole;
  branchId: string | null;
};

/**
 * Role and branch are stored in Supabase's app_metadata (set by scripts/seed.ts via the
 * admin API) so middleware can read them straight from the JWT without a DB round-trip -
 * Prisma queries from Edge middleware would need Prisma Accelerate, which this OSS setup
 * doesn't assume.
 */
export function toAppSession(user: SupabaseUser): AppSession {
  return {
    id: user.id,
    email: user.email ?? "",
    role: (user.app_metadata?.role as AppRole) ?? "STAFF",
    branchId: (user.app_metadata?.branchId as string) ?? null,
  };
}
// END GENAI
