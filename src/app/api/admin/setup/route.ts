// START GENAI
// TEMPORARY one-time setup endpoint - pushes schema + seed data to a fresh Supabase
// project from Vercel's network (works around a local network that can't reach Postgres
// directly). Protected by ADMIN_SETUP_SECRET. Delete this route once setup is done.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const SCHEMA_SQL = `
CREATE SCHEMA IF NOT EXISTS "public";
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_IN', 'SALE_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sarees" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fabric" TEXT,
    "color" TEXT,
    "category" TEXT,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sarees_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "saree_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "saree_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "saree_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "sarees_sku_key" ON "sarees"("sku");
CREATE UNIQUE INDEX "stocks_saree_id_branch_id_key" ON "stocks"("saree_id", "branch_id");
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_saree_id_fkey" FOREIGN KEY ("saree_id") REFERENCES "sarees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_saree_id_fkey" FOREIGN KEY ("saree_id") REFERENCES "sarees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_saree_id_fkey" FOREIGN KEY ("saree_id") REFERENCES "sarees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
`;

const REALTIME_SQL = [
  `alter publication supabase_realtime add table stocks;`,
  `alter publication supabase_realtime add table sales;`,
];

const BRANCH_NAMES = ["Branch 1", "Branch 2", "Branch 3"];
const SEED_PASSWORD = "ChangeMe123!";

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SETUP_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  for (const statement of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await prisma.$executeRawUnsafe(statement);
  }
  log.push("Schema created");

  for (const statement of REALTIME_SQL) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err) {
      log.push(`Realtime publication step skipped: ${err instanceof Error ? err.message : err}`);
    }
  }
  log.push("Realtime enabled");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  async function upsertUser(email: string, name: string, role: string, branchId: string | null) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      app_metadata: { role, branchId },
    });
    if (error && !error.message.includes("already registered")) throw error;

    const authUser =
      created?.user ??
      (await supabaseAdmin.auth.admin.listUsers()).data.users.find((u) => u.email === email);
    if (!authUser) throw new Error(`Could not find or create auth user ${email}`);

    await prisma.user.upsert({
      where: { id: authUser.id },
      update: { name, role: role as never, branchId },
      create: { id: authUser.id, email, name, role: role as never, branchId },
    });
    return email;
  }

  const branches = [];
  for (const name of BRANCH_NAMES) {
    branches.push(await prisma.branch.create({ data: { name } }));
  }
  log.push(`Created branches: ${branches.map((b) => b.name).join(", ")}`);

  const logins = [await upsertUser("owner@shop.test", "Shop Owner", "OWNER", null)];
  for (const branch of branches) {
    const slug = branch.name.toLowerCase().replace(/\s+/g, "");
    logins.push(await upsertUser(`manager.${slug}@shop.test`, `${branch.name} Manager`, "MANAGER", branch.id));
    logins.push(await upsertUser(`staff.${slug}@shop.test`, `${branch.name} Staff`, "STAFF", branch.id));
  }
  log.push(`Created logins (password "${SEED_PASSWORD}"): ${logins.join(", ")}`);

  return NextResponse.json({ ok: true, log });
}
// END GENAI
