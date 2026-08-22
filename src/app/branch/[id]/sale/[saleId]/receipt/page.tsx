// START GENAI
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string; saleId: string }>;
}) {
  const { saleId } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { saree: true } }, branch: true, cashier: true },
  });
  if (!sale) notFound();

  const subtotal = sale.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);

  return (
    <div>
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>

      <div className="mx-auto max-w-sm rounded-lg border bg-white p-6 font-mono text-sm print:border-none">
        <p className="text-center text-base font-semibold">
          {process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sarees Billing Portal"}
        </p>
        <p className="text-center text-xs text-gray-500">{sale.branch.name}</p>
        <p className="mt-2 text-xs text-gray-500">
          {sale.createdAt.toLocaleString()} · Bill #{sale.id.slice(0, 8).toUpperCase()}
        </p>
        <p className="text-xs text-gray-500">Cashier: {sale.cashier.name}</p>
        {sale.customerName && <p className="text-xs text-gray-500">Customer: {sale.customerName}</p>}

        <hr className="my-3 border-dashed" />

        {sale.items.map((item) => (
          <div key={item.id} className="mb-1 flex justify-between">
            <span>
              {item.saree.name} x{item.quantity}
            </span>
            <span>₹{Number(item.lineTotal).toFixed(2)}</span>
          </div>
        ))}

        <hr className="my-3 border-dashed" />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Discount</span>
          <span>-₹{Number(sale.discount).toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>₹{Number(sale.totalAmount).toFixed(2)}</span>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">Thank you for shopping with us!</p>
      </div>
    </div>
  );
}
// END GENAI
