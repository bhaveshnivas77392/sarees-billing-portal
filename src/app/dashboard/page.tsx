// START GENAI
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/LogoutButton";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { TextilePattern } from "@/components/TextilePattern";

// Always reads fresh DB state - this dashboard must never be statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const branchSummaries = await Promise.all(
    branches.map(async (branch) => {
      const stocks = await prisma.stock.findMany({
        where: { branchId: branch.id },
        include: { saree: true },
      });

      const totalUnits = stocks.reduce((sum, s) => sum + s.quantity, 0);
      const stockValue = stocks.reduce(
        (sum, s) => sum + s.quantity * Number(s.saree.costPrice),
        0,
      );
      const lowStockCount = stocks.filter((s) => s.quantity <= 3).length;

      const todaySales = await prisma.sale.aggregate({
        where: { branchId: branch.id, createdAt: { gte: startOfToday } },
        _sum: { totalAmount: true },
        _count: true,
      });

      return {
        branch,
        totalUnits,
        stockValue,
        lowStockCount,
        todaySalesTotal: Number(todaySales._sum.totalAmount ?? 0),
        todaySalesCount: todaySales._count,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <RealtimeRefresher watch={[{ table: "stocks" }, { table: "sales" }]} />
      <header className="relative overflow-hidden bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white shadow-sm">
        <TextilePattern className="absolute inset-0 h-full w-full text-white/10" />
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-lg shadow" />
            <div>
              <p className="text-xs uppercase tracking-wide text-rose-100">
                {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sarees Billing Portal"}
              </p>
              <h1 className="text-lg font-semibold">Owner Dashboard</h1>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {branchSummaries.map(({ branch, totalUnits, stockValue, lowStockCount, todaySalesTotal, todaySalesCount }) => (
            <div
              key={branch.id}
              className="rounded-lg border border-t-4 border-t-rose-500 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{branch.name}</h2>
                <Link href={`/branch/${branch.id}`} className="text-xs text-rose-600 hover:underline">
                  Open branch →
                </Link>
              </div>
              <dl className="space-y-1 text-sm">
                <Row label="Units in stock" value={totalUnits} />
                <Row label="Stock value" value={`₹${stockValue.toFixed(2)}`} />
                <Row
                  label="Low stock items"
                  value={lowStockCount}
                  emphasize={lowStockCount > 0}
                />
                <Row label="Sales today" value={`₹${todaySalesTotal.toFixed(2)} (${todaySalesCount})`} />
              </dl>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string | number; emphasize?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className={emphasize ? "font-semibold text-amber-600" : "font-medium text-gray-900"}>{value}</dd>
    </div>
  );
}
// END GENAI
