// START GENAI
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim();

  if (!phone || phone.length < 4) {
    return NextResponse.json({ found: false, sales: [] });
  }

  const sales = await prisma.sale.findMany({
    where: { customerPhone: { contains: phone } },
    include: {
      branch: true,
      items: { include: { saree: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (sales.length === 0) {
    return NextResponse.json({ found: false, sales: [] });
  }

  const customerName = sales.find((s) => s.customerName)?.customerName ?? "";
  const totalSpent = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalOrders = sales.length;

  return NextResponse.json({
    found: true,
    customerName,
    totalSpent,
    totalOrders,
    recentSales: sales.map((s) => ({
      id: s.id,
      date: s.createdAt.toLocaleDateString(),
      branchName: s.branch.name,
      amount: Number(s.totalAmount),
      items: s.items.map((i) => `${i.saree.name} (${i.quantity}x)`).join(", "),
    })),
  });
}
// END GENAI
