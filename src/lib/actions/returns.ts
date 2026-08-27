// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export type ReturnInput = {
  saleId: string;
  branchId: string;
  items: { sareeId: string; quantity: number; refundAmount: number }[];
  reason?: string;
};

export async function processReturn(input: ReturnInput) {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in" };

  if (session.role !== "OWNER" && session.branchId !== input.branchId) {
    return { ok: false, error: "Not authorized for this branch" };
  }
  if (input.items.length === 0) {
    return { ok: false, error: "No items selected for return" };
  }

  try {
    const returnRecordId = await prisma.$transaction(async (tx) => {
      let totalRefund = 0;

      for (const item of input.items) {
        totalRefund += item.refundAmount;

        // 1. Increment branch stock
        await tx.stock.upsert({
          where: { sareeId_branchId: { sareeId: item.sareeId, branchId: input.branchId } },
          update: { quantity: { increment: item.quantity } },
          create: { sareeId: item.sareeId, branchId: input.branchId, quantity: item.quantity },
        });

        // 2. Audit Stock Movement (RETURN_IN)
        await tx.stockMovement.create({
          data: {
            sareeId: item.sareeId,
            branchId: input.branchId,
            type: "RETURN_IN",
            quantity: item.quantity,
            note: `Returned from Bill #${input.saleId.slice(0, 8).toUpperCase()}. Reason: ${input.reason ?? "Customer Exchange"}`,
            createdBy: session.id,
          },
        });
      }

      // 3. Create Return Record
      const record = await tx.returnRecord.create({
        data: {
          saleId: input.saleId,
          branchId: input.branchId,
          processedById: session.id,
          refundAmount: totalRefund,
          reason: input.reason || null,
          items: {
            create: input.items.map((i) => ({
              sareeId: i.sareeId,
              quantity: i.quantity,
              refundAmount: i.refundAmount,
            })),
          },
        },
      });

      return record.id;
    });

    revalidatePath(`/branch/${input.branchId}`);
    revalidatePath(`/branch/${input.branchId}/returns`);
    return { ok: true, returnRecordId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Return processing failed" };
  }
}
// END GENAI
