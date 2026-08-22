// START GENAI
import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Uses the service-role key - never import this from a Client Component. */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
// END GENAI
