// START GENAI
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function BatchLabelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: branchId } = await params;
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) notFound();

  const stocks = await prisma.stock.findMany({
    where: { branchId, quantity: { gt: 0 } },
    include: { saree: true },
    orderBy: { saree: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Batch Barcode Label Sheet</h2>
          <p className="text-xs text-gray-500">A4 24-Up Sticker Grid layout for quick multi-saree tagging</p>
        </div>
        <PrintButton />
      </div>

      {/* 24-Up A4 Sticker Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3 print:gap-2">
        {stocks.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-3 text-center shadow-2xs print:border-gray-300 print:shadow-none print:break-inside-avoid"
          >
            <p className="truncate w-full text-[11px] font-bold text-gray-900">{s.saree.name}</p>
            <p className="text-[10px] font-mono text-gray-500">{s.saree.sku}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/barcode/${s.saree.sku}`} alt={s.saree.sku} className="my-1.5 h-9 object-contain" />
            <span className="font-mono text-xs font-extrabold text-gray-900">₹{Number(s.saree.sellingPrice).toLocaleString()}</span>
          </div>
        ))}

        {stocks.length === 0 && (
          <p className="col-span-full py-12 text-center text-xs text-gray-400">
            No stock available to generate batch barcode labels.
          </p>
        )}
      </div>
    </div>
  );
}
// END GENAI
