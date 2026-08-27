// START GENAI
"use client";

import { useState } from "react";
import { updateSareeDetails } from "@/lib/actions/inventoryEdit";
import { SubmitButton } from "@/components/SubmitButton";
import { IconSparkles, IconClose } from "@/components/Icons";

export type SareeEditData = {
  id: string;
  sku: string;
  name: string;
  fabric: string | null;
  color: string | null;
  category: string | null;
  costPrice: number;
  sellingPrice: number;
};

export function EditSareeModal({
  branchId,
  saree,
  onClose,
}: {
  branchId: string;
  saree: SareeEditData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <IconSparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Edit Saree Design</h3>
              <p className="text-[11px] font-mono text-gray-400">SKU: {saree.sku}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await updateSareeDetails(formData);
            onClose();
          }}
          className="space-y-3.5 text-xs"
        >
          <input type="hidden" name="sareeId" value={saree.id} />
          <input type="hidden" name="branchId" value={branchId} />

          <div>
            <label className="mb-1 block font-semibold text-gray-700">Design / Saree Name</label>
            <input
              type="text"
              name="name"
              defaultValue={saree.name}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-gray-700">Fabric</label>
              <input
                type="text"
                name="fabric"
                defaultValue={saree.fabric ?? ""}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-gray-700">Color / Shade</label>
              <input
                type="text"
                name="color"
                defaultValue={saree.color ?? ""}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-gray-700">Category / Collection</label>
            <input
              type="text"
              name="category"
              defaultValue={saree.category ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-900 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-gray-700">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                name="costPrice"
                defaultValue={saree.costPrice}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono font-bold text-gray-900 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-gray-700">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                defaultValue={saree.sellingPrice}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono font-bold text-rose-700 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-100 py-2.5 font-bold text-gray-700 hover:bg-gray-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <SubmitButton pendingText="Saving changes..." className="flex-1 rounded-xl bg-slate-900 py-2.5 font-bold text-white shadow-md hover:bg-black transition cursor-pointer">
              Save Changes
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
// END GENAI
