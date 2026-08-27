// START GENAI
"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateSareeDetails(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const sareeId = formData.get("sareeId") as string;
  const branchId = formData.get("branchId") as string;
  const name = formData.get("name") as string;
  const fabric = (formData.get("fabric") as string) || null;
  const color = (formData.get("color") as string) || null;
  const category = (formData.get("category") as string) || null;
  const costPrice = parseFloat(formData.get("costPrice") as string);
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string);

  await prisma.saree.update({
    where: { id: sareeId },
    data: {
      name,
      fabric,
      color,
      category,
      costPrice,
      sellingPrice,
    },
  });

  revalidatePath(`/branch/${branchId}`);
}
// END GENAI
