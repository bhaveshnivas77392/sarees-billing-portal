// START GENAI
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresher } from "@/components/RealtimeRefresher";
import { ExpandableImage } from "@/components/ExpandableImage";

const LOW_STOCK_THRESHOLD = 3;

export default async function BranchStockPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id: branchId } = await params;
  const { q } = await searchParams;

  const stocks = await prisma.stock.findMany({
    where: {
      branchId,
      ...(q
        ? {
            saree: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { color: { contains: q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: { saree: true },
    orderBy: { saree: { name: "asc" } },
  });

  return (
    <div>
      <RealtimeRefresher watch={[{ table: "stocks", filter: `branch_id=eq.${branchId}` }]} />
      <form className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, SKU, or color..."
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
        />
      </form>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">Saree</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stocks.map((s) => (
              <tr key={s.id} className={s.quantity <= LOW_STOCK_THRESHOLD ? "bg-amber-50" : ""}>
                <td className="px-4 py-2">
                  {s.saree.imageUrl ? (
                    <ExpandableImage src={s.saree.imageUrl} alt={s.saree.name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
                      No photo
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{s.saree.name}</div>
                  <div className="text-xs text-gray-500">
                    {[s.saree.fabric, s.saree.color, s.saree.category].filter(Boolean).join(" · ")}
                  </div>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-gray-600">{s.saree.sku}</td>
                <td className="px-4 py-2">₹{s.saree.sellingPrice.toString()}</td>
                <td className="px-4 py-2">
                  <span className={s.quantity <= LOW_STOCK_THRESHOLD ? "font-semibold text-amber-700" : ""}>
                    {s.quantity}
                  </span>
                  {s.quantity <= LOW_STOCK_THRESHOLD && (
                    <span className="ml-2 text-xs text-amber-600">Low stock</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/branch/${branchId}/label/${s.saree.id}`}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Print label
                  </Link>
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No sarees found. Use &ldquo;Add Stock&rdquo; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// END GENAI
