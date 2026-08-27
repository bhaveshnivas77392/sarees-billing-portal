// START GENAI
import { prisma } from "@/lib/prisma";
import { SaleCart } from "@/components/SaleCart";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;

  // Show every saree design (across all branches), not just this branch's positive-stock
  // subset - staff can browse the full catalog and pick visually. available reflects only
  // this branch's stock, so 0-stock-here items still show but can't actually be sold here.
  const sarees = await prisma.saree.findMany({
    include: { stocks: { where: { branchId } } },
    orderBy: { name: "asc" },
  });

  const catalog = sarees.map((s) => ({
    sareeId: s.id,
    sku: s.sku,
    name: s.name,
    fabric: s.fabric,
    color: s.color,
    category: s.category,
    price: Number(s.sellingPrice),
    available: s.stocks[0]?.quantity ?? 0,
    imageUrl: s.imageUrl,
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
