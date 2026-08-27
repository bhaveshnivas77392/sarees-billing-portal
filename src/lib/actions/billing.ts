// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PaymentMode } from "@prisma/client";

export type CartLine = { sareeId: string; quantity: number };

export type CheckoutInput = {
  branchId: string;
  cart: CartLine[];
  discount: number;
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  cashPaid?: number;
  upiPaid?: number;
  cardPaid?: number;
  upiReference?: string;
};

export type CheckoutResult =
  | { ok: true; saleId: string }
  | { ok: false; error: string };

export async function checkout(
  branchIdOrInput: string | CheckoutInput,
  maybeCart?: CartLine[],
  maybeDiscount?: number,
  maybeCustomerName?: string,
  maybeCustomerPhone?: string,
): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not signed in" };

  let branchId: string;
  let cart: CartLine[];
  let discount: number;
  let customerName: string | undefined;
  let customerPhone: string | undefined;
  let paymentMode: PaymentMode = "CASH";
  let cashPaid: number | undefined;
  let upiPaid: number | undefined;
  let cardPaid: number | undefined;
  let upiReference: string | undefined;

  if (typeof branchIdOrInput === "object") {
    branchId = branchIdOrInput.branchId;
    cart = branchIdOrInput.cart;
    discount = branchIdOrInput.discount;
    customerName = branchIdOrInput.customerName;
    customerPhone = branchIdOrInput.customerPhone;
    paymentMode = branchIdOrInput.paymentMode ?? "CASH";
    cashPaid = branchIdOrInput.cashPaid;
    upiPaid = branchIdOrInput.upiPaid;
    cardPaid = branchIdOrInput.cardPaid;
    upiReference = branchIdOrInput.upiReference;
  } else {
    branchId = branchIdOrInput;
    cart = maybeCart ?? [];
    discount = maybeDiscount ?? 0;
    customerName = maybeCustomerName;
    customerPhone = maybeCustomerPhone;
  }

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
          paymentMode,
          cashPaid: cashPaid ?? (paymentMode === "CASH" ? finalTotal : null),
          upiPaid: upiPaid ?? (paymentMode === "UPI" ? finalTotal : null),
          cardPaid: cardPaid ?? (paymentMode === "CARD" ? finalTotal : null),
          upiReference: upiReference || null,
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
