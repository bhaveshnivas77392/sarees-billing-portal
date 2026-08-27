// START GENAI
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { BranchInventoryTable } from "@/components/BranchInventoryTable";
import { IconPlus, IconPrinter } from "@/components/Icons";

export default async function BranchStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: branchId } = await params;

  const rawStocks = await prisma.stock.findMany({
    where: { branchId },
    include: { saree: true },
    orderBy: { saree: { name: "asc" } },
  });

  const stocks = rawStocks.map((s) => ({
    id: s.id,
    quantity: s.quantity,
    saree: {
      id: s.saree.id,
      sku: s.saree.sku,
      name: s.saree.name,
      fabric: s.saree.fabric,
      color: s.saree.color,
      category: s.saree.category,
      costPrice: Number(s.saree.costPrice),
      sellingPrice: Number(s.saree.sellingPrice),
      imageUrl: s.saree.imageUrl,
    },
  }));

  return (
    <div className="space-y-5">
      <RealtimeRefresher watch={[{ table: "stocks", filter: `branch_id=eq.${branchId}` }]} />

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Branch Stock Inventory</h2>
          <p className="text-xs text-gray-500">Live on-hand sarees count and barcode label printing</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/branch/${branchId}/batch-labels`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-slate-50"
          >
            <IconPrinter className="h-4 w-4 text-rose-600" /> Batch Print Sheet
          </Link>
          <Link
            href={`/branch/${branchId}/add-stock`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
          >
            <IconPlus className="h-4 w-4" /> Add New Stock
          </Link>
        </div>
      </div>

      {/* Rich Interactive Table with Filters and Edit Modal */}
      <BranchInventoryTable branchId={branchId} initialStocks={stocks} />
    </div>
  );
}
// END GENAI
