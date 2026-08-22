// START GENAI
/**
 * Creates the 3 branches and one login per role, both in Supabase Auth (with
 * role/branchId in app_metadata, used by middleware) and mirrored into the
 * app's `users` table (used for foreign keys on sales/stock movements).
 *
 * Run once against a fresh Supabase project: npm run seed
 */
import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

function randomPassword() {
  return randomBytes(12).toString("base64url");
}

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const BRANCHES = [
  { name: "Branch 1", address: "" },
  { name: "Branch 2", address: "" },
  { name: "Branch 3", address: "" },
];

async function upsertAuthUser(email: string, name: string, role: string, branchId: string | null) {
  const password = randomPassword();
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, branchId },
  });

  if (error && !error.message.includes("already registered")) {
    throw error;
  }

  const authUser =
    created?.user ??
    (await supabaseAdmin.auth.admin.listUsers()).data.users.find((u) => u.email === email);

  if (!authUser) throw new Error(`Could not find or create auth user ${email}`);

  await prisma.user.upsert({
    where: { id: authUser.id },
    update: { name, role: role as never, branchId },
    create: { id: authUser.id, email, name, role: role as never, branchId },
  });

  const passwordNote = created ? password : "(already existed - password unchanged)";
  console.log(`✓ ${role.padEnd(7)} ${email} (password: ${passwordNote})`);
}

async function main() {
  const branches = [];
  for (const b of BRANCHES) {
    const existing = await prisma.branch.findFirst({ where: { name: b.name } });
    branches.push(existing ?? (await prisma.branch.create({ data: b })));
  }

  await upsertAuthUser("owner@shop.test", "Shop Owner", "OWNER", null);

  for (const branch of branches) {
    const slug = branch.name.toLowerCase().replace(/\s+/g, "");
    await upsertAuthUser(`manager.${slug}@shop.test`, `${branch.name} Manager`, "MANAGER", branch.id);
    await upsertAuthUser(`staff.${slug}@shop.test`, `${branch.name} Staff`, "STAFF", branch.id);
  }

  console.log("\nSeed complete. Change these passwords after first login.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
// END GENAI
