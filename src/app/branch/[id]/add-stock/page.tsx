// START GENAI
import { prisma } from "@/lib/prisma";
import { createSareeWithStock, addStockToExisting } from "@/lib/actions/inventory";
import { ImageUploadField } from "@/components/ImageUploadField";
import { SubmitButton } from "@/components/SubmitButton";
import { RestockSearchSelector } from "@/components/RestockSearchSelector";
import { IconSparkles, IconBox } from "@/components/Icons";

export default async function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;
  const rawSarees = await prisma.saree.findMany({ orderBy: { name: "asc" } });

  const sarees = rawSarees.map((s) => ({
    id: s.id,
    sku: s.sku,
    name: s.name,
    sellingPrice: Number(s.sellingPrice),
    imageUrl: s.imageUrl,
    fabric: s.fabric,
    color: s.color,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Stock Inward &amp; Intake</h2>
        <p className="text-xs text-gray-500">Register new saree designs or replenish existing branch stock</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* NEW SAREE CARD (7 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-7">
          <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <IconSparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">New Saree Design</h3>
              <p className="text-[11px] text-gray-500">Creates SKU, barcode, and assigns initial stock</p>
            </div>
          </div>

          <form action={createSareeWithStock} className="space-y-4">
            <input type="hidden" name="branchId" value={branchId} />
            
            <Field label="Design / Saree Name" name="name" placeholder="e.g. Kanjeevaram Royal Pattu" required />
            
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fabric Material" name="fabric" placeholder="e.g. Pure Silk, Georgette" />
              <Field label="Color / Shade" name="color" placeholder="e.g. Crimson Red, Mustard" />
            </div>

            <Field label="Collection / Category" name="category" placeholder="e.g. Bridal, Festive, Daily Wear" />
            
            <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-3">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">Saree Photograph</label>
              <ImageUploadField />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Cost Price (₹)" name="costPrice" type="number" step="0.01" placeholder="1500" required />
              <Field label="Selling Price (₹)" name="sellingPrice" type="number" step="0.01" placeholder="2500" required />
              <Field label="Qty to Inward" name="quantity" type="number" defaultValue="1" min="1" required />
            </div>

            <SubmitButton pendingText="Creating design & label..." className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-3 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-700 hover:to-rose-800 transition active:scale-[0.98]">
              Create &amp; Print Barcode Label
            </SubmitButton>
          </form>
        </section>

        {/* RESTOCK CARD (5 COLS) */}
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs md:col-span-5 h-fit">
          <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <IconBox className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-900">Restock Existing Design</h3>
              <p className="text-[11px] text-gray-500">Quickly search by SKU / Barcode ID or design name</p>
            </div>
          </div>

          <form action={addStockToExisting} className="space-y-4">
            <input type="hidden" name="branchId" value={branchId} />
            
            <RestockSearchSelector sarees={sarees} />

            <Field label="Quantity Received" name="quantity" type="number" defaultValue="1" min="1" required />

            <SubmitButton pendingText="Adding stock..." className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-black transition active:scale-[0.98]">
              Add to Branch Stock
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  step,
  min,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
  min?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 shadow-xs transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
      />
    </div>
  );
}
// END GENAI
