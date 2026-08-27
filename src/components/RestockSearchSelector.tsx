// START GENAI
"use client";

import { useState, useMemo } from "react";
import { IconSearch, IconBarcode, IconTag, IconCheck } from "@/components/Icons";

export type SareeOption = {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  imageUrl?: string | null;
  fabric?: string | null;
  color?: string | null;
};

export function RestockSearchSelector({ sarees }: { sarees: SareeOption[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(sarees[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return sarees;
    return sarees.filter(
      (s) =>
        s.sku.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.color && s.color.toLowerCase().includes(q)) ||
        (s.fabric && s.fabric.toLowerCase().includes(q))
    );
  }, [sarees, searchTerm]);

  const selectedSaree = useMemo(() => sarees.find((s) => s.id === selectedId), [sarees, selectedId]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="sareeId" value={selectedId} />

      {/* Instant Search Bar */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
          Find by SKU / Barcode ID or Saree Name
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-rose-500">
            <IconBarcode className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type SKU (e.g. SAR-61386) or name to search..."
            className="w-full rounded-xl border border-gray-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium text-gray-900 placeholder-gray-400 transition focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Saree List / Selector */}
      <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-gray-200 bg-slate-50/40 p-1.5">
        {filtered.map((s) => {
          const isSelected = s.id === selectedId;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`flex items-center justify-between gap-2 rounded-lg p-2 text-xs transition cursor-pointer select-none ${
                isSelected
                  ? "bg-rose-50 border border-rose-300 text-rose-950 font-semibold"
                  : "bg-white border border-gray-100 hover:bg-slate-50 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {s.sku}
                </span>
                <span className="truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-gray-900">₹{s.sellingPrice.toLocaleString()}</span>
                {isSelected && <IconCheck className="h-4 w-4 text-rose-600" />}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-6 text-center text-xs text-gray-400">
            No matching SKU or saree design found.
          </div>
        )}
      </div>

      {/* Selected Saree Preview Confirmation Badge */}
      {selectedSaree && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
          <div>
            <p className="font-bold">Selected: {selectedSaree.name}</p>
            <p className="font-mono text-[10px] text-emerald-700">SKU: {selectedSaree.sku}</p>
          </div>
          <span className="font-extrabold text-sm text-emerald-800">₹{selectedSaree.sellingPrice.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
// END GENAI
