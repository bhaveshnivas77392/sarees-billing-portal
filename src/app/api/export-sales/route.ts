// START GENAI
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "all";

  let startDate: Date | undefined;
  const now = new Date();

  if (range === "today") {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
  } else if (range === "month") {
    startDate = new Date();
    startDate.setMonth(now.getMonth() - 1);
  }

  const sales = await prisma.sale.findMany({
    where: startDate ? { createdAt: { gte: startDate } } : undefined,
    include: { branch: true, cashier: true, items: { include: { saree: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = [
    ["Invoice ID", "Branch", "Date & Time", "Cashier", "Customer Name", "Customer Phone", "Payment Mode", "Subtotal", "Discount", "Grand Total", "Items Summary"],
  ];

  for (const sale of sales) {
    const subtotal = sale.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const itemsSummary = sale.items.map((i) => `${i.saree.name} (${i.quantity}x)`).join(" ; ");
    rows.push([
      `#${sale.id.slice(0, 8).toUpperCase()}`,
      `"${sale.branch.name.replace(/"/g, '""')}"`,
      `"${sale.createdAt.toISOString()}"`,
      `"${sale.cashier.name.replace(/"/g, '""')}"`,
      `"${(sale.customerName ?? "").replace(/"/g, '""')}"`,
      `"${(sale.customerPhone ?? "").replace(/"/g, '""')}"`,
      sale.paymentMode,
      subtotal.toFixed(2),
      Number(sale.discount).toFixed(2),
      Number(sale.totalAmount).toFixed(2),
      `"${itemsSummary.replace(/"/g, '""')}"`,
    ]);
  }

  const csvContent = rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-report-${range}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
// END GENAI
