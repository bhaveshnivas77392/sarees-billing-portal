// START GENAI
import { prisma } from "@/lib/prisma";
import { ReturnProcessorClient } from "./ReturnProcessorClient";
import { IconShare, IconSparkles } from "@/components/Icons";

export default async function ReturnsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ billNo?: string }>;
}) {
  const { id: branchId } = await params;
  const { billNo } = await searchParams;

  let sale = null;
  if (billNo) {
    const cleanId = billNo.replace("#", "").trim().toLowerCase();
    const allSales = await prisma.sale.findMany({
      where: { branchId },
      include: {
        items: { include: { saree: true } },
        cashier: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    sale = allSales.find((s) => s.id.toLowerCase().startsWith(cleanId)) ?? null;
  }

  const pastReturns = await prisma.returnRecord.findMany({
    where: { branchId },
    include: {
      sale: true,
      processedBy: true,
      items: { include: { saree: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Saree Returns &amp; Exchange Desk</h2>
        <p className="text-xs text-gray-500">Look up previous sales, process customer exchanges, and restore inventory</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* SEARCH & RETURN PROCESSOR (7 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-7 space-y-4">
          <form className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">Find Invoice / Bill Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="billNo"
                defaultValue={billNo ?? ""}
                placeholder="e.g. 8-digit Bill ID (e.g. 5D8F2A1C)"
                className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                Find Bill
              </button>
            </div>
          </form>

          {billNo && !sale && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              No matching invoice found for &ldquo;{billNo}&rdquo; in this branch.
            </div>
          )}

          {sale && (
            <ReturnProcessorClient branchId={branchId} sale={sale} />
          )}
        </section>

        {/* RECENT RETURNS AUDIT (5 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-5 h-fit">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <IconSparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Exchange Logs</h3>
              <p className="text-[11px] text-gray-500">Last 10 processed returns</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {pastReturns.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 bg-slate-50/60 p-2.5 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Bill #{r.sale.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-rose-700 font-mono">Refund: ₹{Number(r.refundAmount).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  {r.items.map((i) => `${i.saree.name} (${i.quantity}x)`).join(", ")}
                </div>
                {r.reason && <p className="text-[10px] text-gray-400 italic">Reason: {r.reason}</p>}
                <p className="text-[10px] text-gray-400">Processed: {r.createdAt.toLocaleDateString()} by {r.processedBy.name}</p>
              </div>
            ))}

            {pastReturns.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-400">No returns processed yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
// END GENAI
