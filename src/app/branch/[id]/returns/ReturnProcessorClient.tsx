// START GENAI
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processReturn } from "@/lib/actions/returns";
import { Spinner } from "@/components/Spinner";

export function ReturnProcessorClient({
  branchId,
  sale,
}: {
  branchId: string;
  sale: {
    id: string;
    customerName: string | null;
    customerPhone: string | null;
    totalAmount: unknown;
    createdAt: Date;
    items: {
      id: string;
      sareeId: string;
      quantity: number;
      unitPrice: unknown;
      lineTotal: unknown;
      saree: { name: string; sku: string };
    }[];
  };
}) {
  const router = useRouter();
  const [returnQty, setReturnQty] = useState<{ [sareeId: string]: number }>({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleQtyChange(sareeId: string, val: number, max: number) {
    const clamped = Math.max(0, Math.min(val, max));
    setReturnQty((prev) => ({ ...prev, [sareeId]: clamped }));
  }

  const itemsToReturn = sale.items
    .filter((item) => (returnQty[item.sareeId] ?? 0) > 0)
    .map((item) => {
      const qty = returnQty[item.sareeId];
      const unit = Number(item.unitPrice);
      return {
        sareeId: item.sareeId,
        quantity: qty,
        refundAmount: unit * qty,
      };
    });

  const totalRefund = itemsToReturn.reduce((sum, i) => sum + i.refundAmount, 0);

  async function handleProcess() {
    if (itemsToReturn.length === 0) {
      setError("Please select at least 1 saree to return.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await processReturn({
        saleId: sale.id,
        branchId,
        items: itemsToReturn,
        reason: reason.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error ?? "Return processing failed");
        setLoading(false);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError("Network error processing return.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center text-emerald-900 space-y-2">
        <h4 className="font-bold text-base">Return Processed Successfully!</h4>
        <p className="text-xs text-emerald-700">Inventory was restored and return voucher logged.</p>
        <button
          onClick={() => {
            setSuccess(false);
            setReturnQty({});
          }}
          className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
        >
          Process Another Return
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-slate-50/50 p-4 space-y-4 text-xs">
      <div className="flex justify-between border-b border-gray-200 pb-2.5">
        <div>
          <p className="font-bold text-gray-900">Original Invoice #{sale.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-gray-500 text-[11px]">{new Date(sale.createdAt).toLocaleDateString()} {sale.customerName ? `· ${sale.customerName}` : ""}</p>
        </div>
        <div className="text-right">
          <span className="font-mono font-bold text-sm text-gray-900">₹{Number(sale.totalAmount).toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-semibold text-gray-700">Select Items to Return / Exchange:</label>
        {sale.items.map((item) => {
          const current = returnQty[item.sareeId] ?? 0;
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-gray-200 p-2.5">
              <div>
                <p className="font-bold text-gray-900">{item.saree.name}</p>
                <p className="text-[11px] text-gray-400 font-mono">
                  {item.saree.sku} · Bought: {item.quantity} pcs @ ₹{Number(item.unitPrice)}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-gray-500">Return Qty:</label>
                <input
                  type="number"
                  min="0"
                  max={item.quantity}
                  value={current}
                  onChange={(e) => handleQtyChange(item.sareeId, parseInt(e.target.value, 10) || 0, item.quantity)}
                  className="w-14 rounded-lg border border-gray-300 p-1 text-center font-bold"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="block font-semibold text-gray-700 mb-1">Reason for Return / Exchange:</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Size/Color exchange, Defect, Gift return"
          className="w-full rounded-xl border border-gray-200 bg-white p-2 text-xs"
        />
      </div>

      {error && <p className="text-red-600 text-xs font-semibold">{error}</p>}

      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
        <div>
          <span className="text-gray-500">Total Refund / Exchange Credit:</span>
          <p className="text-base font-extrabold text-rose-700 font-mono">₹{totalRefund.toLocaleString()}</p>
        </div>

        <button
          type="button"
          disabled={loading || totalRefund <= 0}
          onClick={handleProcess}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-black transition active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          {loading && <Spinner />}
          {loading ? "Processing..." : "Confirm Return & Restore Stock"}
        </button>
      </div>
    </div>
  );
}
// END GENAI
