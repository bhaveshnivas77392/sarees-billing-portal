// START GENAI
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateSku } from "@/lib/sku";

function assertCanEditBranch(sessionBranchId: string | null, role: string, branchId: string) {
  if (role !== "OWNER" && sessionBranchId !== branchId) {
    throw new Error("Not authorized for this branch");
  }
}

/** Creates a brand-new saree design and records its first stock receipt for a branch. */
export async function createSareeWithStock(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const branchId = String(formData.get("branchId"));
  assertCanEditBranch(session.branchId, session.role, branchId);

  const name = String(formData.get("name")).trim();
  const fabric = String(formData.get("fabric") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;
  const costPrice = Number(formData.get("costPrice"));
  const sellingPrice = Number(formData.get("sellingPrice"));
  const quantity = Number(formData.get("quantity"));

  if (!name || quantity <= 0 || Number.isNaN(costPrice) || Number.isNaN(sellingPrice)) {
    throw new Error("Missing or invalid saree details");
  }

  const saree = await prisma.saree.create({
    data: { sku: generateSku(), name, fabric, color, category, costPrice, sellingPrice },
  });

  await prisma.$transaction([
    prisma.stock.create({ data: { sareeId: saree.id, branchId, quantity } }),
    prisma.stockMovement.create({
      data: {
        sareeId: saree.id,
        branchId,
        type: "PURCHASE_IN",
        quantity,
        createdBy: session.id,
        note: "Initial stock on saree creation",
      },
    }),
  ]);

  revalidatePath(`/branch/${branchId}`);
  redirect(`/branch/${branchId}/label/${saree.id}`);
}

/** Receives more stock for a saree design that already exists at this branch (or is new to it). */
export async function addStockToExisting(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const branchId = String(formData.get("branchId"));
  const sareeId = String(formData.get("sareeId"));
  const quantity = Number(formData.get("quantity"));

  assertCanEditBranch(session.branchId, session.role, branchId);
  if (!sareeId || quantity <= 0) throw new Error("Missing or invalid stock details");

  await prisma.$transaction([
    prisma.stock.upsert({
      where: { sareeId_branchId: { sareeId, branchId } },
      update: { quantity: { increment: quantity } },
      create: { sareeId, branchId, quantity },
    }),
    prisma.stockMovement.create({
      data: { sareeId, branchId, type: "PURCHASE_IN", quantity, createdBy: session.id },
    }),
  ]);

  revalidatePath(`/branch/${branchId}`);
}
// END GENAI
