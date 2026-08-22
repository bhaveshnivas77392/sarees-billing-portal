// START GENAI
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string; sareeId: string }>;
}) {
  const { sareeId } = await params;
  const saree = await prisma.saree.findUnique({ where: { id: sareeId } });
  if (!saree) notFound();

  return (
    <div>
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>
      <div className="inline-block rounded-lg border bg-white p-4 text-center print:border-none">
        <p className="font-semibold text-gray-900">{saree.name}</p>
        <p className="text-sm text-gray-600">₹{saree.sellingPrice.toString()}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/barcode/${saree.sku}`} alt={saree.sku} className="mx-auto mt-2" />
      </div>
    </div>
  );
}
// END GENAI
