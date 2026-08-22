// START GENAI
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RegisterUserResult = { ok: true } | { ok: false; error: string };

/** Owner-only: creates a login for a new manager/staff (or another owner). */
export async function registerUser(formData: FormData): Promise<RegisterUserResult> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") return { ok: false, error: "Only the owner can register users" };

  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const name = String(formData.get("name")).trim();
  const role = String(formData.get("role"));
  const branchId = role === "OWNER" ? null : String(formData.get("branchId") || "") || null;

  if (!email || !name || password.length < 8) {
    return { ok: false, error: "Name, email, and a password of at least 8 characters are required" };
  }
  if (role !== "OWNER" && !branchId) {
    return { ok: false, error: "Managers and staff must be assigned to a branch" };
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, branchId },
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Could not create login" };
  }

  await prisma.user.create({
    data: { id: data.user.id, email, name, role: role as never, branchId },
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}
// END GENAI
