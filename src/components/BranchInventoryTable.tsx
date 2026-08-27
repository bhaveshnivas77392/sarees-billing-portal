// START GENAI
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ExpandableImage } from "@/components/ExpandableImage";
import { EditSareeModal, SareeEditData } from "@/components/EditSareeModal";
import { IconSearch, IconPrinter, IconAlert, IconBox } from "@/components/Icons";

export type StockRow = {
  id: string;
  quantity: number;
  saree: {
    id: string;
    sku: string;
    name: string;
    fabric: string | null;
    color: string | null;
    category: string | null;
    costPrice: number;
    sellingPrice: number;
    imageUrl: string | null;
  };
};

const LOW_STOCK_THRESHOLD = 3;

export function BranchInventoryTable({
  branchId,
  initialStocks,
}: {
  branchId: string;
  initialStocks: StockRow[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "ample">("all");
  const [selectedFabric, setSelectedFabric] = useState<string>("All");
  const [editingSaree, setEditingSaree] = useState<SareeEditData | null>(null);

  const fabrics = useMemo(() => {
    const set = new Set<string>();
    initialStocks.forEach((s) => {
      if (s.saree.fabric) set.add(s.saree.fabric.trim());
    });
    return ["All", ...Array.from(set)];
  }, [initialStocks]);

  const filteredStocks = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return initialStocks.filter((s) => {
      // Stock filter
      if (stockFilter === "low" && s.quantity > LOW_STOCK_THRESHOLD) return false;
      if (stockFilter === "ample" && s.quantity <= LOW_STOCK_THRESHOLD) return false;

      // Fabric filter
      if (selectedFabric !== "All" && s.saree.fabric !== selectedFabric) return false;

      // Search term
      if (!q) return true;
      return (
        s.saree.name.toLowerCase().includes(q) ||
        s.saree.sku.toLowerCase().includes(q) ||
        (s.saree.color && s.saree.color.toLowerCase().includes(q)) ||
        (s.saree.category && s.saree.category.toLowerCase().includes(q))
      );
    });
  }, [initialStocks, searchTerm, stockFilter, selectedFabric]);

  const totalUnits = initialStocks.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = initialStocks.filter((s) => s.quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="space-y-4">
      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-1/2">
        <div
          onClick={() => setStockFilter("all")}
          className={`flex items-center gap-3 rounded-2xl border p-3 shadow-xs cursor-pointer transition ${
            stockFilter === "all" ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500" : "border-gray-200/80 bg-white"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <IconBox className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Designs</p>
            <p className="text-base font-bold text-gray-900">{initialStocks.length}</p>
          </div>
        </div>

        <div
          onClick={() => setStockFilter("ample")}
          className={`flex items-center gap-3 rounded-2xl border p-3 shadow-xs cursor-pointer transition ${
            stockFilter === "ample" ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500" : "border-gray-200/80 bg-white"
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IconBox className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Total Units</p>
            <p className="text-base font-bold text-gray-900">{totalUnits}</p>
          </div>
        </div>

        <div
          onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
          className={`col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border p-3 shadow-xs cursor-pointer transition ${
            stockFilter === "low" ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-500" : "border-gray-200/80 bg-white"
          }`}
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${lowStockCount > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
            <IconAlert className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-gray-500">Low Stock (&le;3)</p>
            <p className={`text-base font-bold ${lowStockCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
              {lowStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <IconSearch className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, saree name, color, or fabric..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-gray-900 placeholder-gray-400 shadow-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Fabric Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto text-xs scrollbar-none">
          {fabrics.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFabric(f)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition cursor-pointer ${
                selectedFabric === f ? "bg-slate-900 text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-slate-50/80 font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3.5 w-16">Preview</th>
                <th className="px-4 py-3.5">Saree Details</th>
                <th className="px-4 py-3.5">Barcode / SKU</th>
                <th className="px-4 py-3.5">Selling Price</th>
                <th className="px-4 py-3.5">On-Hand Qty</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStocks.map((s) => {
                const isLow = s.quantity <= LOW_STOCK_THRESHOLD;
                return (
                  <tr key={s.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      {s.saree.imageUrl ? (
                        <ExpandableImage
                          src={s.saree.imageUrl}
                          alt={s.saree.name}
                          className="h-12 w-12 rounded-xl object-cover border border-gray-100 shadow-xs"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-medium text-gray-400">
                          No photo
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 text-sm">{s.saree.name}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-gray-500">
                        {s.saree.fabric && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700 font-medium">
                            {s.saree.fabric}
                          </span>
                        )}
                        {s.saree.color && (
                          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700 font-medium">
                            {s.saree.color}
                          </span>
                        )}
                        {s.saree.category && (
                          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-rose-700 font-medium">
                            {s.saree.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                        {s.saree.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-sm">
                      ₹{s.saree.sellingPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isLow ? "text-amber-600" : "text-gray-900"}`}>
                          {s.quantity}
                        </span>
                        {isLow && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSaree(s.saree)}
                          className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition hover:bg-slate-100 cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <Link
                          href={`/branch/${branchId}/label/${s.saree.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                        >
                          <IconPrinter className="h-3.5 w-3.5 text-rose-600" />
                          Label
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No sarees found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Saree Modal */}
      {editingSaree && (
        <EditSareeModal
          branchId={branchId}
          saree={editingSaree}
          onClose={() => setEditingSaree(null)}
        />
      )}
    </div>
  );
}
// END GENAI
