// START GENAI
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/lib/actions/billing";
import { BarcodeCameraScanner } from "@/components/BarcodeCameraScanner";

type CatalogItem = { sareeId: string; sku: string; name: string; price: number; available: number };
type CartLine = { sareeId: string; name: string; sku: string; price: number; quantity: number; available: number };

export function SaleCart({ branchId, catalog }: { branchId: string; catalog: CatalogItem[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanValue, setScanValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bySku = new Map(catalog.map((c) => [c.sku, c]));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addBySku(sku: string) {
    const item = bySku.get(sku.trim());
    if (!item) {
      setError(`No saree found for barcode "${sku}"`);
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.sareeId === item.sareeId);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty + 1 > item.available) {
        setError(`Only ${item.available} of ${item.name} left in stock`);
        return prev;
      }
      if (existing) {
        return prev.map((l) => (l.sareeId === item.sareeId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        { sareeId: item.sareeId, name: item.name, sku: item.sku, price: item.price, quantity: 1, available: item.available },
      ];
    });
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scanValue) addBySku(scanValue);
    setScanValue("");
    inputRef.current?.focus();
  }

  function updateQuantity(sareeId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.sareeId === sareeId ? { ...l, quantity: Math.min(quantity, l.available) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);
    const result = await checkout(
      branchId,
      cart.map((l) => ({ sareeId: l.sareeId, quantity: l.quantity })),
      discount,
      customerName,
      customerPhone,
    );
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/branch/${branchId}/sale/${result.saleId}/receipt`);
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <form onSubmit={handleScanSubmit} className="mb-3 flex gap-2">
          <input
            ref={inputRef}
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            placeholder="Scan or type barcode, then Enter"
            autoFocus
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setCameraOpen((v) => !v)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
          >
            {cameraOpen ? "Hide camera" : "Scan with camera"}
          </button>
        </form>

        {cameraOpen && (
          <div className="mb-3">
            <BarcodeCameraScanner
              onScan={(text) => {
                addBySku(text);
              }}
              onClose={() => setCameraOpen(false)}
            />
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Saree</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Line total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cart.map((l) => (
                <tr key={l.sareeId}>
                  <td className="px-4 py-2">{l.name}</td>
                  <td className="px-4 py-2">₹{l.price.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      max={l.available}
                      value={l.quantity}
                      onChange={(e) => updateQuantity(l.sareeId, Number(e.target.value))}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">₹{(l.price * l.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => updateQuantity(l.sareeId, 0)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Scan a saree&apos;s barcode to add it to the bill.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">Checkout</h2>

        <label className="mb-1 block text-xs font-medium text-gray-500">Customer name (optional)</label>
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-gray-500">Customer phone (optional)</label>
        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-xs font-medium text-gray-500">Discount (₹)</label>
        <input
          type="number"
          min={0}
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="mb-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 font-semibold text-gray-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || submitting}
          className="w-full rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Checkout & print bill"}
        </button>
      </div>
    </div>
  );
}
// END GENAI
