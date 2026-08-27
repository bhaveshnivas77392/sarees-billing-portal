// START GENAI
import { prisma } from "@/lib/prisma";
import { submitDayClosure } from "@/lib/actions/dayClosure";
import { SubmitButton } from "@/components/SubmitButton";
import { IconSparkles, IconStore } from "@/components/Icons";

export default async function DayClosePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [salesToday, closures] = await Promise.all([
    prisma.sale.findMany({
      where: { branchId, createdAt: { gte: startOfToday } },
    }),
    prisma.dayClosure.findMany({
      where: { branchId },
      include: { closedBy: true },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  const totalSales = salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const cashSales = salesToday
    .filter((s) => s.paymentMode === "CASH" || s.paymentMode === "SPLIT")
    .reduce((sum, s) => sum + Number(s.cashPaid ?? (s.paymentMode === "CASH" ? s.totalAmount : 0)), 0);
  const upiSales = salesToday
    .filter((s) => s.paymentMode === "UPI" || s.paymentMode === "SPLIT")
    .reduce((sum, s) => sum + Number(s.upiPaid ?? (s.paymentMode === "UPI" ? s.totalAmount : 0)), 0);
  const cardSales = salesToday
    .filter((s) => s.paymentMode === "CARD")
    .reduce((sum, s) => sum + Number(s.cardPaid ?? s.totalAmount), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Shift Close &amp; Cash Drawer Reconciliation</h2>
        <p className="text-xs text-gray-500">Tally end-of-day physical drawer cash against register bills</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* DAY SUMMARY FORM (6 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-6 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Today&apos;s Billed Collection</h3>
            <p className="text-[11px] text-gray-500">{salesToday.length} bills completed today</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 border border-gray-100">
              <span className="text-gray-500">Total Billed:</span>
              <p className="text-lg font-bold text-gray-900 font-mono">₹{totalSales.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
              <span className="text-amber-700">Cash Billed:</span>
              <p className="text-lg font-bold text-amber-950 font-mono">₹{cashSales.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3 border border-indigo-100">
              <span className="text-indigo-700">UPI / QR Billed:</span>
              <p className="text-lg font-bold text-indigo-950 font-mono">₹{upiSales.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
              <span className="text-emerald-700">Card Billed:</span>
              <p className="text-lg font-bold text-emerald-950 font-mono">₹{cardSales.toLocaleString()}</p>
            </div>
          </div>

          <form action={submitDayClosure} className="space-y-4 pt-2 border-t border-gray-100">
            <input type="hidden" name="branchId" value={branchId} />
            <input type="hidden" name="totalSales" value={totalSales} />
            <input type="hidden" name="cashSales" value={cashSales} />
            <input type="hidden" name="upiSales" value={upiSales} />
            <input type="hidden" name="cardSales" value={cardSales} />

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Actual Physical Cash Counted in Drawer (₹)
              </label>
              <input
                type="number"
                step="0.01"
                name="actualCash"
                defaultValue={cashSales}
                required
                className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-sm font-bold focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Closing Remarks / Discrepancy Note</label>
              <input
                type="text"
                name="note"
                placeholder="e.g. Petty cash ₹200 withdrawn for store cleaning"
                className="w-full rounded-xl border border-gray-200 p-2 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <SubmitButton pendingText="Submitting closure..." className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-black transition active:scale-[0.98]">
              Submit Shift Close &amp; Lock Day Report
            </SubmitButton>
          </form>
        </section>

        {/* PAST DAY CLOSURE RECORDS (6 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-6 h-fit">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <IconStore className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Shift Closures</h3>
              <p className="text-[11px] text-gray-500">Day-end reconciliation history</p>
            </div>
          </div>

          <div className="space-y-3">
            {closures.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-slate-50/60 p-3 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{c.date.toLocaleDateString()}</span>
                  <span className="font-mono text-emerald-700">Total: ₹{Number(c.totalSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Cash in Drawer: ₹{Number(c.actualCashInDrawer).toLocaleString()}</span>
                  <span className={Number(c.discrepancy) === 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                    {Number(c.discrepancy) === 0 ? "Balanced (₹0)" : `Diff: ₹${Number(c.discrepancy).toLocaleString()}`}
                  </span>
                </div>
                {c.note && <p className="text-[10px] text-gray-400 italic">Note: {c.note}</p>}
                <p className="text-[10px] text-gray-400">Closed by: {c.closedBy.name}</p>
              </div>
            ))}

            {closures.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-400">No shift closures submitted yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
// END GENAI
