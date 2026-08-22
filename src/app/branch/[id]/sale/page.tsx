// START GENAI
import { prisma } from "@/lib/prisma";
import { SaleCart } from "@/components/SaleCart";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;

  const stocks = await prisma.stock.findMany({
    where: { branchId, quantity: { gt: 0 } },
    include: { saree: true },
  });

  const catalog = stocks.map((s) => ({
    sareeId: s.sareeId,
    sku: s.saree.sku,
    name: s.saree.name,
    price: Number(s.saree.sellingPrice),
    available: s.quantity,
  }));

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">New Sale</h2>
      <SaleCart branchId={branchId} catalog={catalog} />
    </div>
  );
}
// END GENAI
