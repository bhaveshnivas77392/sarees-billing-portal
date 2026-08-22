// START GENAI
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toAppSession, type AppSession } from "@/lib/auth";

export async function getSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? toAppSession(data.user) : null;
}
// END GENAI
