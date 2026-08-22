// START GENAI
import { prisma } from "@/lib/prisma";
import { createSareeWithStock, addStockToExisting } from "@/lib/actions/inventory";
import { ImageUploadField } from "@/components/ImageUploadField";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;
  const sarees = await prisma.saree.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">New saree design</h2>
        <form action={createSareeWithStock} className="space-y-3">
          <input type="hidden" name="branchId" value={branchId} />
          <Field label="Name" name="name" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fabric" name="fabric" />
            <Field label="Color" name="color" />
          </div>
          <Field label="Category" name="category" />
          <ImageUploadField />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Cost price" name="costPrice" type="number" step="0.01" required />
            <Field label="Selling price" name="sellingPrice" type="number" step="0.01" required />
            <Field label="Quantity" name="quantity" type="number" defaultValue="1" required />
          </div>
          <SubmitButton pendingText="Creating...">Create &amp; print barcode label</SubmitButton>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Restock an existing design</h2>
        <form action={addStockToExisting} className="space-y-3">
          <input type="hidden" name="branchId" value={branchId} />
          <label className="block text-sm font-medium text-gray-700">Saree</label>
          <select
            name="sareeId"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {sarees.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.sku})
              </option>
            ))}
          </select>
          <Field label="Quantity received" name="quantity" type="number" defaultValue="1" required />
          <SubmitButton pendingText="Adding..." className="w-full rounded-md bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-900 disabled:opacity-60">
            Add to stock
          </SubmitButton>
        </form>
      </section>
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
      />
    </div>
  );
}
// END GENAI
