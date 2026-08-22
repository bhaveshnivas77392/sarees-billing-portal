// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type CartLine = { sareeId: string; quantity: number };

export type CheckoutResult =
  | { ok: true; saleId: string }
  | { ok: false; error: string };

export async function checkout(
  branchId: string,
  cart: CartLine[],
  discount: number,
  customerName: string,
  customerPhone: string,
): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in" };
  if (session.role !== "OWNER" && session.branchId !== branchId) {
    return { ok: false, error: "Not authorized for this branch" };
  }
  if (cart.length === 0) return { ok: false, error: "Cart is empty" };

  try {
    const saleId = await prisma.$transaction(async (tx) => {
      const sarees = await tx.saree.findMany({
        where: { id: { in: cart.map((c) => c.sareeId) } },
      });
      const sareeById = new Map(sarees.map((s) => [s.id, s]));

      let totalAmount = 0;
      const lineData = [];

      for (const line of cart) {
        const saree = sareeById.get(line.sareeId);
        if (!saree) throw new Error(`Unknown saree ${line.sareeId}`);

        // Guard the decrement itself (rather than check-then-write) so two simultaneous
        // scans of the last unit can't both succeed and push quantity negative.
        const decremented = await tx.stock.updateMany({
          where: { sareeId: line.sareeId, branchId, quantity: { gte: line.quantity } },
          data: { quantity: { decrement: line.quantity } },
        });
        if (decremented.count === 0) {
          throw new Error(`Not enough stock for ${saree.name}`);
        }

        const unitPrice = Number(saree.sellingPrice);
        const lineTotal = unitPrice * line.quantity;
        totalAmount += lineTotal;

        lineData.push({ sareeId: line.sareeId, quantity: line.quantity, unitPrice, lineTotal });
        await tx.stockMovement.create({
          data: {
            sareeId: line.sareeId,
            branchId,
            type: "SALE_OUT",
            quantity: line.quantity,
            createdBy: session.id,
          },
        });
      }

      const finalTotal = Math.max(0, totalAmount - discount);

      const sale = await tx.sale.create({
        data: {
          branchId,
          cashierId: session.id,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          discount,
          totalAmount: finalTotal,
          items: { create: lineData },
        },
      });

      return sale.id;
    });

    return { ok: true, saleId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Checkout failed" };
  }
}
// END GENAI
