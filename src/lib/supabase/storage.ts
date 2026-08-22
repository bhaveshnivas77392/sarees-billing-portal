// START GENAI
import "server-only";
import { randomBytes } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "saree-images";

/** Uploads a saree photo and returns its public URL, or null if no file was given. */
export async function uploadSareeImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${randomBytes(12).toString("hex")}.${extension}`;

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
// END GENAI
