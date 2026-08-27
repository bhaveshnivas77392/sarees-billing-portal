// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function transferStock(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const sourceBranchId = formData.get("sourceBranchId") as string;
  const targetBranchId = formData.get("targetBranchId") as string;
  const sareeId = formData.get("sareeId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const note = (formData.get("note") as string) || undefined;

  if (sourceBranchId === targetBranchId) {
    throw new Error("Source and destination branch cannot be the same.");
  }
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be at least 1.");
  }
  if (session.role !== "OWNER" && session.branchId !== sourceBranchId) {
    throw new Error("Not authorized to transfer stock from this branch.");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Decrement source branch stock
    const sourceStock = await tx.stock.updateMany({
      where: { sareeId, branchId: sourceBranchId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (sourceStock.count === 0) {
      throw new Error("Insufficient stock available in source branch for transfer.");
    }

    // 2. Increment target branch stock (upsert)
    await tx.stock.upsert({
      where: { sareeId_branchId: { sareeId, branchId: targetBranchId } },
      update: { quantity: { increment: quantity } },
      create: { sareeId, branchId: targetBranchId, quantity },
    });

    // 3. Log Stock Movement Audit (TRANSFER_OUT from source)
    await tx.stockMovement.create({
      data: {
        sareeId,
        branchId: sourceBranchId,
        type: "TRANSFER_OUT",
        quantity,
        note: `Transfer to Branch: ${targetBranchId}. ${note ?? ""}`,
        createdBy: session.id,
      },
    });

    // 4. Log Stock Movement Audit (TRANSFER_IN to target)
    await tx.stockMovement.create({
      data: {
        sareeId,
        branchId: targetBranchId,
        type: "TRANSFER_IN",
        quantity,
        note: `Transfer from Branch: ${sourceBranchId}. ${note ?? ""}`,
        createdBy: session.id,
      },
    });

    // 5. Create Transfer Request record
    await tx.transferRequest.create({
      data: {
        sourceBranchId,
        targetBranchId,
        sareeId,
        quantity,
        note,
        createdById: session.id,
      },
    });
  });

  revalidatePath(`/branch/${sourceBranchId}`);
  revalidatePath(`/branch/${sourceBranchId}/transfers`);
}
// END GENAI
