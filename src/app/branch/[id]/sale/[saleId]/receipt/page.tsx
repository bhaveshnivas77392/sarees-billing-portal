// START GENAI
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { IconPrinter, IconPlus, IconStore, IconShare } from "@/components/Icons";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string; saleId: string }>;
}) {
  const { id: branchId, saleId } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: { include: { saree: true } }, branch: true, cashier: true },
  });
  if (!sale) notFound();

  const subtotal = sale.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const totalUnits = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  // WhatsApp Share URL generator
  const shopTitle = process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees";
  const waText = encodeURIComponent(
    `*Invoice from ${shopTitle}*\nBranch: ${sale.branch.name}\nBill #${sale.id.slice(0, 8).toUpperCase()}\nDate: ${sale.createdAt.toLocaleDateString()}\n\n` +
      sale.items.map((i) => `• ${i.saree.name} (${i.quantity}x) - ₹${Number(i.lineTotal).toFixed(0)}`).join("\n") +
      `\n\nSubtotal: ₹${subtotal.toFixed(0)}\nDiscount: ₹${Number(sale.discount).toFixed(0)}\n*Grand Total: ₹${Number(sale.totalAmount).toFixed(0)}*\n\nThank you for visiting us!`
  );
  const waUrl = sale.customerPhone
    ? `https://wa.me/${sale.customerPhone.replace(/\D/g, "")}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <PrintButton />
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-xs transition hover:bg-emerald-100 active:scale-95"
          >
            <IconShare className="h-4 w-4 text-emerald-600" /> Share Bill on WhatsApp
          </a>
        </div>
        <Link
          href={`/branch/${branchId}/sale`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 active:scale-95"
        >
          <IconPlus className="h-4 w-4" /> Next Bill
        </Link>
      </div>

      {/* Modern Thermal-Optimized Receipt Paper Card */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm font-mono text-xs print:border-none print:shadow-none print:p-0">
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-gray-300">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            {shopTitle}
          </h2>
          <p className="text-gray-600 font-sans text-xs mt-0.5">{sale.branch.name}</p>
          {sale.branch.address && <p className="text-gray-400 text-[10px]">{sale.branch.address}</p>}
        </div>

        {/* Meta Info */}
        <div className="py-3 border-b border-dashed border-gray-300 space-y-1 text-gray-600">
          <div className="flex justify-between">
            <span>Bill No:</span>
            <span className="font-bold text-gray-900">#{sale.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Date &amp; Time:</span>
            <span>{sale.createdAt.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.cashier.name}</span>
          </div>
          {sale.customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold text-gray-900">{sale.customerName}</span>
            </div>
          )}
          {sale.customerPhone && (
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{sale.customerPhone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <span className="font-bold text-gray-900">{sale.paymentMode}</span>
          </div>
          {sale.upiReference && (
            <div className="flex justify-between">
              <span>UPI Ref / UTR:</span>
              <span className="font-mono text-gray-800">{sale.upiReference}</span>
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="py-3 border-b border-dashed border-gray-300 space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase">
            <span>Item / Design</span>
            <span>Amount</span>
          </div>
          {sale.items.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex justify-between text-gray-900 font-medium">
                <span className="truncate max-w-[200px]">{item.saree.name}</span>
                <span>₹{Number(item.lineTotal).toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>SKU: {item.saree.sku}</span>
                <span>
                  ₹{Number(item.unitPrice).toFixed(0)} × {item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-3 border-b border-dashed border-gray-300 space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Total Items ({totalUnits} pcs)</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Special Discount</span>
              <span>-₹{Number(sale.discount).toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1">
            <span>NET AMOUNT PAID</span>
            <span className="text-base font-bold text-rose-700">₹{Number(sale.totalAmount).toFixed(0)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center text-gray-400 text-[11px] space-y-1">
          <p className="font-semibold text-gray-600">Thank you for shopping with us!</p>
          <p className="text-[10px]">Goods once sold can be exchanged within 7 days with this bill.</p>
        </div>
      </div>
    </div>
  );
}
// END GENAI
