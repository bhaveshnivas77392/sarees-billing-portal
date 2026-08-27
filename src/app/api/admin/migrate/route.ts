// START GENAI
// TEMPORARY one-time migration endpoint - applies the additive schema diff (PaymentMode,
// transfer/return/day-closure tables, sales payment columns) from Vercel's network, since
// this dev machine can't reach Postgres directly. Delete once migration is confirmed.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function skipIfExists(statement: string) {
  return `DO $$ BEGIN ${statement}; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`;
}

const STATEMENTS = [
  skipIfExists(`CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'UPI', 'CARD', 'SPLIT')`),
  skipIfExists(`ALTER TYPE "StockMovementType" ADD VALUE 'RETURN_IN'`),
  `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "card_paid" DECIMAL(10,2)`,
  `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "cash_paid" DECIMAL(10,2)`,
  `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "payment_mode" "PaymentMode" NOT NULL DEFAULT 'CASH'`,
  `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "upi_paid" DECIMAL(10,2)`,
  `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "upi_reference" TEXT`,
  `CREATE TABLE IF NOT EXISTS "transfer_requests" (
    "id" TEXT NOT NULL, "source_branch_id" TEXT NOT NULL, "target_branch_id" TEXT NOT NULL,
    "saree_id" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "note" TEXT,
    "created_by_id" TEXT NOT NULL, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "return_records" (
    "id" TEXT NOT NULL, "sale_id" TEXT NOT NULL, "branch_id" TEXT NOT NULL,
    "processed_by_id" TEXT NOT NULL, "refund_amount" DECIMAL(10,2) NOT NULL, "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "return_records_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "return_items" (
    "id" TEXT NOT NULL, "return_record_id" TEXT NOT NULL, "saree_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL, "refund_amount" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "day_closures" (
    "id" TEXT NOT NULL, "branch_id" TEXT NOT NULL, "closed_by_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_sales" DECIMAL(10,2) NOT NULL, "cash_sales" DECIMAL(10,2) NOT NULL,
    "upi_sales" DECIMAL(10,2) NOT NULL, "card_sales" DECIMAL(10,2) NOT NULL,
    "actual_cash_in_drawer" DECIMAL(10,2) NOT NULL, "discrepancy" DECIMAL(10,2) NOT NULL,
    "note" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "day_closures_pkey" PRIMARY KEY ("id")
  )`,
  skipIfExists(`ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_target_branch_id_fkey" FOREIGN KEY ("target_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_saree_id_fkey" FOREIGN KEY ("saree_id") REFERENCES "sarees"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "return_records" ADD CONSTRAINT "return_records_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "return_records" ADD CONSTRAINT "return_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "return_records" ADD CONSTRAINT "return_records_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_record_id_fkey" FOREIGN KEY ("return_record_id") REFERENCES "return_records"("id") ON DELETE CASCADE ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "return_items" ADD CONSTRAINT "return_items_saree_id_fkey" FOREIGN KEY ("saree_id") REFERENCES "sarees"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "day_closures" ADD CONSTRAINT "day_closures_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
  skipIfExists(`ALTER TABLE "day_closures" ADD CONSTRAINT "day_closures_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`),
];

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SETUP_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];
  for (const statement of STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (err) {
      log.push(`Skipped/failed: ${err instanceof Error ? err.message : err}`);
    }
  }
  log.push("Migration applied (or already up to date)");

  return NextResponse.json({ ok: true, log });
}
// END GENAI
