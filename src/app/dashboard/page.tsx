// START GENAI
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";

const ACCENTS = [
  { border: "border-t-rose-500", chip: "bg-rose-100 text-rose-700" },
  { border: "border-t-amber-500", chip: "bg-amber-100 text-amber-700" },
  { border: "border-t-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
];

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

  const totals = branchSummaries.reduce(
    (acc, b) => ({
      units: acc.units + b.totalUnits,
      value: acc.value + b.stockValue,
      salesTotal: acc.salesTotal + b.todaySalesTotal,
      salesCount: acc.salesCount + b.todaySalesCount,
      lowStock: acc.lowStock + b.lowStockCount,
    }),
    { units: 0, value: 0, salesTotal: 0, salesCount: 0, lowStock: 0 },
  );

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <RealtimeRefresher watch={[{ table: "stocks" }, { table: "sales" }]} />

      <p className="mb-6 text-gray-500">Welcome back — here&apos;s how all {branches.length} branches are doing on {today}.</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={<BoxIcon />} accent="bg-rose-500" label="Units in stock" value={totals.units.toLocaleString()} />
        <StatTile icon={<CoinIcon />} accent="bg-amber-500" label="Stock value" value={`₹${totals.value.toFixed(0)}`} />
        <StatTile icon={<CartIcon />} accent="bg-emerald-500" label="Sales today" value={`₹${totals.salesTotal.toFixed(0)}`} sub={`${totals.salesCount} bills`} />
        <StatTile
          icon={<AlertIcon />}
          accent={totals.lowStock > 0 ? "bg-red-500" : "bg-gray-400"}
          label="Low stock alerts"
          value={totals.lowStock}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {branchSummaries.map(({ branch, totalUnits, stockValue, lowStockCount, todaySalesTotal, todaySalesCount }, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <div
              key={branch.id}
              className={`rounded-lg border border-t-4 bg-white p-5 shadow-sm transition hover:shadow-md ${accent.border}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${accent.chip}`}>
                    <StoreIcon />
                  </span>
                  <h2 className="font-semibold text-gray-900">{branch.name}</h2>
                </div>
                <Link href={`/branch/${branch.id}`} className="text-xs text-rose-600 hover:underline">
                  Open branch →
                </Link>
              </div>
              <dl className="space-y-1 text-sm">
                <Row label="Units in stock" value={totalUnits} />
                <Row label="Stock value" value={`₹${stockValue.toFixed(2)}`} />
                <Row label="Low stock items" value={lowStockCount} emphasize={lowStockCount > 0} />
                <Row label="Sales today" value={`₹${todaySalesTotal.toFixed(2)} (${todaySalesCount})`} />
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({
  icon,
  accent,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white ${accent}`}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
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

function BoxIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-3-3.5c0 1.1 1.34 2 3 2s3-.9 3-2-1.34-1.5-3-1.5-3-.9-3-2 1.34-2 3-2 3 .9 3 2" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 4.6A1 1 0 005.6 19H17M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1-5h16l1 5M4 9h16v10a1 1 0 01-1 1H5a1 1 0 01-1-1V9zM9 20v-6h6v6" />
    </svg>
  );
}
// END GENAI
