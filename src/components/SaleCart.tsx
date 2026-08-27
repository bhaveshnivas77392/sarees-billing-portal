// START GENAI
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "@/lib/actions/billing";
import { BarcodeCameraScanner } from "@/components/BarcodeCameraScanner";
import { Spinner } from "@/components/Spinner";
import { ExpandableImage } from "@/components/ExpandableImage";
import { DynamicUpiQr } from "@/components/DynamicUpiQr";
import { triggerScanSuccess, triggerScanError } from "@/lib/feedback";
import { PaymentMode } from "@prisma/client";
import {
  IconBarcode,
  IconCamera,
  IconCart,
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconUser,
  IconPhone,
  IconSparkles,
  IconTag,
  IconClose,
  IconCheck,
} from "@/components/Icons";

export type CatalogItem = {
  sareeId: string;
  sku: string;
  name: string;
  price: number;
  available: number;
  imageUrl: string | null;
  fabric?: string | null;
  color?: string | null;
  category?: string | null;
};

type CartLine = {
  sareeId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  available: number;
  imageUrl: string | null;
};

const DISCOUNT_PRESETS = [
  { label: "₹50", type: "flat", val: 50 },
  { label: "₹100", type: "flat", val: 100 },
  { label: "5%", type: "percent", val: 0.05 },
  { label: "10%", type: "percent", val: 0.1 },
];

export function SaleCart({ branchId, catalog }: { branchId: string; catalog: CatalogItem[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanValue, setScanValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [historyData, setHistoryData] = useState<{
    found: boolean;
    customerName: string;
    totalSpent: number;
    totalOrders: number;
    recentSales: { id: string; date: string; branchName: string; amount: number; items: string }[];
  } | null>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [upiReference, setUpiReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePhoneChange(phone: string) {
    setCustomerPhone(phone);
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      try {
        const res = await fetch(`/api/customer-history?phone=${cleanPhone}`);
        const data = await res.json();
        if (data.found) {
          setHistoryData(data);
          if (!customerName && data.customerName) {
            setCustomerName(data.customerName);
          }
        } else {
          setHistoryData(null);
        }
      } catch {
        setHistoryData(null);
      }
    } else {
      setHistoryData(null);
    }
  }

  const bySku = useMemo(() => new Map(catalog.map((c) => [c.sku.toLowerCase(), c])), [catalog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category.trim());
      else if (item.fabric) set.add(item.fabric.trim());
    });
    return ["All", ...Array.from(set)];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalog.filter((item) => {
      const matchesCat =
        selectedCategory === "All" ||
        item.category === selectedCategory ||
        item.fabric === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.color && item.color.toLowerCase().includes(q)) ||
        (item.fabric && item.fabric.toLowerCase().includes(q))
      );
    });
  }, [catalog, searchQuery, selectedCategory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addItem(item: CatalogItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.sareeId === item.sareeId);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty + 1 > item.available) {
        setError(`Only ${item.available} units of "${item.name}" available in stock.`);
        triggerScanError();
        return prev;
      }
      setError(null);
      triggerScanSuccess();
      if (existing) {
        return prev.map((l) => (l.sareeId === item.sareeId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          sareeId: item.sareeId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: 1,
          available: item.available,
          imageUrl: item.imageUrl,
        },
      ];
    });
  }

  function addBySku(sku: string) {
    const trimmed = sku.trim().toLowerCase();
    const item = bySku.get(trimmed);
    if (!item) {
      setError(`No saree found with barcode/SKU "${sku}"`);
      triggerScanError();
      return;
    }
    addItem(item);
  }

  function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (scanValue) addBySku(scanValue);
    setScanValue("");
    inputRef.current?.focus();
  }

  function updateQuantity(sareeId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.sareeId !== sareeId) return l;
          const newQty = l.quantity + delta;
          if (newQty > l.available) {
            setError(`Cannot exceed ${l.available} units available in stock.`);
            triggerScanError();
            return l;
          }
          return { ...l, quantity: newQty };
        })
        .filter((l) => l.quantity > 0),
    );
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (confirm("Are you sure you want to clear the current cart?")) {
      setCart([]);
      setDiscount(0);
    }
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const totalItemCount = cart.reduce((sum, l) => sum + l.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  function applyPresetDiscount(preset: (typeof DISCOUNT_PRESETS)[0]) {
    if (preset.type === "flat") {
      setDiscount(Math.min(subtotal, preset.val));
    } else {
      setDiscount(Math.round(subtotal * preset.val));
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (paymentMode === "SPLIT" && cashAmount + upiAmount !== finalTotal) {
      setError(`Split payment sum (₹${cashAmount + upiAmount}) must equal Grand Total (₹${finalTotal}).`);
      triggerScanError();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await checkout({
        branchId,
        cart: cart.map((l) => ({ sareeId: l.sareeId, quantity: l.quantity })),
        discount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMode,
        cashPaid: paymentMode === "SPLIT" ? cashAmount : paymentMode === "CASH" ? finalTotal : undefined,
        upiPaid: paymentMode === "SPLIT" ? upiAmount : paymentMode === "UPI" ? finalTotal : undefined,
        upiReference: upiReference.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        triggerScanError();
        setSubmitting(false);
      } else {
        triggerScanSuccess();
        router.push(`/branch/${branchId}/sale/${result.saleId}/receipt`);
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      triggerScanError();
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT COLUMN: Barcode Scanner + Catalog Browser (7 Cols) */}
      <div className="space-y-4 lg:col-span-7">
        {/* Scanner Bar */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-rose-500">
                <IconBarcode className="h-5 w-5" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                placeholder="Scan barcode or type SKU (press Enter)..."
                className="w-full rounded-xl border border-gray-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 transition focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 active:scale-95 cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95 cursor-pointer"
            >
              <IconCamera className="h-4 w-4 text-rose-600" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </form>

          {error && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 cursor-pointer">
                <IconClose className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Catalog Search & Category Filters */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by name, fabric, color..."
                className="w-full rounded-xl border border-gray-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-gray-900 placeholder-gray-400 transition focus:border-rose-500 focus:bg-white focus:outline-none"
              />
            </div>
            <span className="text-xs font-medium text-gray-500 self-end sm:self-auto">
              {filteredCatalog.length} items available
            </span>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 font-medium transition cursor-pointer ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Catalog Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCatalog.map((item) => {
              const inCartQty = cart.find((l) => l.sareeId === item.sareeId)?.quantity ?? 0;
              const isLowStock = item.available <= 3;
              return (
                <div
                  key={item.sareeId}
                  onClick={() => addItem(item)}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 transition cursor-pointer select-none hover:border-rose-300 hover:shadow-md ${
                    inCartQty > 0 ? "border-rose-500 bg-rose-50/30 ring-1 ring-rose-500" : "border-gray-200 bg-white"
                  }`}
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 mb-2">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          <IconTag className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                      {inCartQty > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow">
                          {inCartQty}
                        </span>
                      )}
                      {isLowStock && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                          {item.available} left
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-xs font-semibold text-gray-900 group-hover:text-rose-700">
                      {item.name}
                    </p>
                    <p className="font-mono text-[10px] text-gray-500">{item.sku}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                    <span className="text-sm font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
                    <span className="rounded-lg bg-gray-100 p-1 text-gray-600 group-hover:bg-rose-600 group-hover:text-white transition">
                      <IconPlus className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCatalog.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-gray-400">
                No matching sarees found in this branch inventory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sticky Cart, Payment Options & Bill Summary (5 Cols) */}
      <div className="lg:col-span-5">
        <div className="sticky top-4 space-y-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <IconCart className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Current Bill</h3>
                  <p className="text-[11px] text-gray-500">{totalItemCount} sarees in cart</p>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-medium text-gray-400 hover:text-red-600 transition cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
              {cart.map((line) => (
                <div
                  key={line.sareeId}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-slate-50/60 p-2 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {line.imageUrl ? (
                      <ExpandableImage
                        src={line.imageUrl}
                        alt={line.name}
                        className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 text-[10px] text-gray-500 font-mono">
                        {line.sku.slice(0, 4)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{line.name}</p>
                      <p className="text-[11px] text-gray-500">
                        ₹{line.price} × {line.quantity} ={" "}
                        <span className="font-semibold text-gray-800">
                          ₹{(line.price * line.quantity).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.sareeId, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition cursor-pointer"
                    >
                      {line.quantity === 1 ? <IconTrash className="h-3.5 w-3.5" /> : <IconMinus className="h-3.5 w-3.5" />}
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-gray-900">{line.quantity}</span>
                    <button
                      type="button"
                      disabled={line.quantity >= line.available}
                      onClick={() => updateQuantity(line.sareeId, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition disabled:opacity-40 cursor-pointer"
                    >
                      <IconPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                    <IconBarcode className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Cart is empty</p>
                  <p className="text-[11px] text-gray-400 max-w-[180px]">Scan barcode or tap any saree to bill.</p>
                </div>
              )}
            </div>

            {/* Customer Phone & History Lookup */}
            <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                      <IconUser className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-slate-50/50 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400">
                      <IconPhone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="Phone (10 digits)"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-slate-50/50 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Purchase History Badge */}
                {historyData && historyData.found && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-2 text-[11px] text-indigo-900 animate-fadeIn">
                    <div className="flex items-center justify-between font-semibold">
                      <span>📇 Returning Customer ({historyData.totalOrders} previous visits)</span>
                      <span className="font-mono font-bold">Total: ₹{historyData.totalSpent.toLocaleString()}</span>
                    </div>
                    {historyData.recentSales[0] && (
                      <p className="text-[10px] text-indigo-600 truncate mt-0.5">
                        Last bought: {historyData.recentSales[0].items} on {historyData.recentSales[0].date}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Discount Section with Quick Presets */}
              <div className="rounded-xl bg-slate-50/80 p-2 border border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-600 flex items-center gap-1 text-[11px]">
                    <IconSparkles className="h-3.5 w-3.5 text-amber-500" /> Discount
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-[10px]">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="w-14 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-right font-mono text-xs font-semibold text-gray-800 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {DISCOUNT_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPresetDiscount(p)}
                      className="flex-1 rounded-md bg-white border border-gray-200 py-1 text-[10px] font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition active:scale-95 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["CASH", "UPI", "CARD", "SPLIT"] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPaymentMode(mode);
                        if (mode === "SPLIT") {
                          setCashAmount(Math.round(finalTotal / 2));
                          setUpiAmount(finalTotal - Math.round(finalTotal / 2));
                        }
                      }}
                      className={`rounded-xl py-1.5 text-xs font-bold transition cursor-pointer text-center ${
                        paymentMode === mode
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Dynamic UPI QR Display */}
                {paymentMode === "UPI" && finalTotal > 0 && (
                  <div className="mt-3">
                    <DynamicUpiQr amount={finalTotal} />
                    <input
                      type="text"
                      placeholder="Optional UPI Ref / UTR No."
                      value={upiReference}
                      onChange={(e) => setUpiReference(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Split Payment Inputs */}
                {paymentMode === "SPLIT" && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-slate-50 p-2.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Cash Paid:</span>
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          value={cashAmount || ""}
                          onChange={(e) => setCashAmount(Number(e.target.value))}
                          className="w-20 rounded border border-gray-300 bg-white px-2 py-1 font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">UPI / GPay Paid:</span>
                      <div className="flex items-center gap-1">
                        <span>₹</span>
                        <input
                          type="number"
                          value={upiAmount || ""}
                          onChange={(e) => setUpiAmount(Number(e.target.value))}
                          className="w-20 rounded border border-gray-300 bg-white px-2 py-1 font-mono font-bold"
                        />
                      </div>
                    </div>
                    {upiAmount > 0 && <DynamicUpiQr amount={upiAmount} />}
                  </div>
                )}
              </div>
            </div>

            {/* Bill Totals & Checkout Button */}
            <div className="mt-3 border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Subtotal ({totalItemCount} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-medium">
                  <span>Discount Applied</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-dashed border-gray-200 pt-2">
                <span>Grand Total</span>
                <span className="text-rose-700 font-mono text-lg">₹{finalTotal.toLocaleString()}</span>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || submitting}
                onClick={handleCheckout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Sale &amp; Print Bill</span>
                    <span className="font-mono text-xs opacity-90">(₹{finalTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Barcode Scanner Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <IconCamera className="h-5 w-5 text-rose-600" /> Camera Barcode Scanner
              </h3>
              <button
                type="button"
                onClick={() => setCameraOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <BarcodeCameraScanner
              onScan={(sku) => {
                addBySku(sku);
                setCameraOpen(false);
              }}
              onClose={() => setCameraOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
// END GENAI
