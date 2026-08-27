// START GENAI
import { prisma } from "@/lib/prisma";
import { transferStock } from "@/lib/actions/transfers";
import { SubmitButton } from "@/components/SubmitButton";
import { IconShare, IconStore, IconBox } from "@/components/Icons";

export default async function TransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;

  const [branches, currentBranchStocks, recentTransfers] = await Promise.all([
    prisma.branch.findMany({ where: { id: { not: branchId } }, orderBy: { name: "asc" } }),
    prisma.stock.findMany({
      where: { branchId, quantity: { gt: 0 } },
      include: { saree: true },
      orderBy: { saree: { name: "asc" } },
    }),
    prisma.transferRequest.findMany({
      where: { OR: [{ sourceBranchId: branchId }, { targetBranchId: branchId }] },
      include: { sourceBranch: true, targetBranch: true, saree: true, createdBy: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Inter-Branch Stock Transfer</h2>
        <p className="text-xs text-gray-500">Dispatch sarees from this branch to another showroom branch</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* TRANSFER FORM (5 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-5 h-fit">
          <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <IconShare className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dispatch Stock</h3>
              <p className="text-[11px] text-gray-500">Atomic real-time quantity transfer</p>
            </div>
          </div>

          <form action={transferStock} className="space-y-4">
            <input type="hidden" name="sourceBranchId" value={branchId} />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Destination Branch</label>
              <select
                name="targetBranchId"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Select Saree to Dispatch</label>
              <select
                name="sareeId"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                {currentBranchStocks.map((s) => (
                  <option key={s.saree.id} value={s.saree.id}>
                    {s.saree.name} ({s.saree.sku}) — {s.quantity} on hand
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Quantity to Transfer</label>
              <input
                type="number"
                name="quantity"
                defaultValue="1"
                min="1"
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Transfer Note (Optional)</label>
              <input
                type="text"
                name="note"
                placeholder="e.g. Urgent customer requirement"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <SubmitButton pendingText="Transferring..." className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-black transition active:scale-[0.98]">
              Dispatch Transfer
            </SubmitButton>
          </form>
        </section>

        {/* RECENT TRANSFERS AUDIT (7 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-7">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <IconBox className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900">Transfer Manifest &amp; Log</h3>
                <p className="text-[11px] text-gray-500">Inbound &amp; outbound transfer history</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 bg-slate-50 font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Saree</th>
                  <th className="px-3 py-2.5">Direction</th>
                  <th className="px-3 py-2.5">Qty</th>
                  <th className="px-3 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransfers.map((t) => {
                  const isOut = t.sourceBranchId === branchId;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        <div>{t.saree.name}</div>
                        <span className="font-mono text-[10px] text-gray-400">{t.saree.sku}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            → Out to {t.targetBranch.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ← In from {t.sourceBranch.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">{t.quantity}</td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-500">{t.createdAt.toLocaleDateString()}</td>
                    </tr>
                  );
                })}

                {recentTransfers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                      No stock transfers recorded for this branch yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
// END GENAI
