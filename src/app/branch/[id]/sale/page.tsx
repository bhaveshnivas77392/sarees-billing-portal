// START GENAI
import { prisma } from "@/lib/prisma";
import { SaleCart } from "@/components/SaleCart";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;

  const stocks = await prisma.stock.findMany({
    where: { branchId, quantity: { gt: 0 } },
    include: { saree: true },
    orderBy: { saree: { name: "asc" } },
  });

  const catalog = stocks.map((s) => ({
    sareeId: s.sareeId,
    sku: s.saree.sku,
    name: s.saree.name,
    fabric: s.saree.fabric,
    color: s.saree.color,
    category: s.saree.category,
    price: Number(s.saree.sellingPrice),
    available: s.quantity,
    imageUrl: s.saree.imageUrl,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Billing Counter &amp; Point of Sale</h2>
          <p className="text-xs text-gray-500">Scan barcode or select saree items from the catalog below</p>
        </div>
      </div>
      <SaleCart branchId={branchId} catalog={catalog} />
    </div>
  );
}
// END GENAI
