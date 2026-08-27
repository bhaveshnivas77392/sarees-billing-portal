// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function submitDayClosure(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const branchId = formData.get("branchId") as string;
  const totalSales = parseFloat(formData.get("totalSales") as string);
  const cashSales = parseFloat(formData.get("cashSales") as string);
  const upiSales = parseFloat(formData.get("upiSales") as string);
  const cardSales = parseFloat(formData.get("cardSales") as string);
  const actualCash = parseFloat(formData.get("actualCash") as string);
  const note = (formData.get("note") as string) || undefined;

  const discrepancy = actualCash - cashSales;

  await prisma.dayClosure.create({
    data: {
      branchId,
      closedById: session.id,
      totalSales,
      cashSales,
      upiSales,
      cardSales,
      actualCashInDrawer: actualCash,
      discrepancy,
      note,
    },
  });

  revalidatePath(`/branch/${branchId}`);
  revalidatePath(`/branch/${branchId}/day-close`);
}
// END GENAI
