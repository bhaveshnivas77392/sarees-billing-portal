// START GENAI
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { IconBox, IconStore, IconAlert, IconSparkles, IconCart, IconShare } from "@/components/Icons";

const ACCENTS = [
  { border: "border-t-rose-500", chip: "bg-rose-50 text-rose-700", badge: "bg-rose-100 text-rose-800" },
  { border: "border-t-amber-500", chip: "bg-amber-50 text-amber-700", badge: "bg-amber-100 text-amber-800" },
  { border: "border-t-emerald-500", chip: "bg-emerald-50 text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "today" } = await searchParams;
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });

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

      const salesAgg = await prisma.sale.aggregate({
        where: { branchId: branch.id, ...(startDate ? { createdAt: { gte: startDate } } : {}) },
        _sum: { totalAmount: true },
        _count: true,
      });

      return {
        branch,
        totalUnits,
        stockValue,
        lowStockCount,
        salesTotal: Number(salesAgg._sum.totalAmount ?? 0),
        salesCount: salesAgg._count,
      };
    }),
  );

  const totals = branchSummaries.reduce(
    (acc, b) => ({
      units: acc.units + b.totalUnits,
      value: acc.value + b.stockValue,
      salesTotal: acc.salesTotal + b.salesTotal,
      salesCount: acc.salesCount + b.salesCount,
      lowStock: acc.lowStock + b.lowStockCount,
    }),
    { units: 0, value: 0, salesTotal: 0, salesCount: 0, lowStock: 0 },
  );

  const todayText = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <RealtimeRefresher watch={[{ table: "stocks" }, { table: "sales" }]} />

      {/* Header Banner & Date Filter Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-xs mb-2">
            Live Retail Business Intelligence
          </span>
          <h2 className="text-xl font-bold">Multi-Branch Performance Analytics</h2>
          <p className="text-xs text-rose-100/80 mt-1">Live metrics across {branches.length} showroom branches · {todayText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex rounded-xl bg-black/30 p-1 backdrop-blur-xs border border-white/10 text-xs">
            <Link
              href="/dashboard?range=today"
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                range === "today" ? "bg-rose-600 text-white font-bold" : "text-rose-200 hover:text-white"
              }`}
            >
              Today
            </Link>
            <Link
              href="/dashboard?range=week"
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                range === "week" ? "bg-rose-600 text-white font-bold" : "text-rose-200 hover:text-white"
              }`}
            >
              Last 7 Days
            </Link>
            <Link
              href="/dashboard?range=month"
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                range === "month" ? "bg-rose-600 text-white font-bold" : "text-rose-200 hover:text-white"
              }`}
            >
              Last 30 Days
            </Link>
            <Link
              href="/dashboard?range=all"
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                range === "all" ? "bg-rose-600 text-white font-bold" : "text-rose-200 hover:text-white"
              }`}
            >
              All Time
            </Link>
          </div>

          {/* Export to CSV Button */}
          <a
            href={`/api/export-sales?range=${range}`}
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-rose-900 shadow-sm transition hover:bg-rose-50 active:scale-95 cursor-pointer"
          >
            <IconShare className="h-4 w-4 text-rose-700" /> Export CSV
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<IconBox className="h-5 w-5" />}
          iconBg="bg-rose-50 text-rose-600"
          label="Total On-Hand Stock"
          value={`${totals.units.toLocaleString()} Units`}
          sub={`${branches.length} active branches`}
        />
        <StatTile
          icon={<IconSparkles className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-600"
          label="Total Stock Value"
          value={`₹${totals.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="At purchase cost"
        />
        <StatTile
          icon={<IconCart className="h-5 w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          label={`${range === "today" ? "Today's" : "Period"} Sales Revenue`}
          value={`₹${totals.salesTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${totals.salesCount} bills completed`}
        />
        <StatTile
          icon={<IconAlert className="h-5 w-5" />}
          iconBg={totals.lowStock > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"}
          label="Low Stock Warnings"
          value={totals.lowStock}
          sub={totals.lowStock > 0 ? "Needs urgent replenishment" : "Inventory levels healthy"}
        />
      </div>

      {/* Branch Breakdown Grid */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Branch-wise Performance</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {branchSummaries.map(
            ({ branch, totalUnits, stockValue, lowStockCount, salesTotal, salesCount }, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <div
                  key={branch.id}
                  className={`rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition hover:shadow-md ${accent.border} border-t-4 flex flex-col justify-between`}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.chip}`}>
                          <IconStore className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{branch.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {branch.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </div>

                    <dl className="space-y-2 text-xs divide-y divide-gray-50">
                      <div className="pt-2 flex justify-between">
                        <dt className="text-gray-500">Units in Stock</dt>
                        <dd className="font-bold text-gray-900">{totalUnits}</dd>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <dt className="text-gray-500">Stock Value</dt>
                        <dd className="font-bold text-gray-900">₹{stockValue.toLocaleString()}</dd>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <dt className="text-gray-500">Low Stock Items</dt>
                        <dd className={`font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
                          {lowStockCount}
                        </dd>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <dt className="text-gray-500">Sales ({range})</dt>
                        <dd className="font-bold text-emerald-700">
                          ₹{salesTotal.toLocaleString()} ({salesCount} bills)
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    <Link
                      href={`/branch/${branch.id}`}
                      className="flex-1 text-center rounded-xl bg-slate-50 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 hover:text-rose-800"
                    >
                      Open POS →
                    </Link>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-500 truncate">{label}</p>
        <p className="text-lg font-extrabold text-gray-900">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}
// END GENAI
