// START GENAI
"use client";

import { useState } from "react";

export function ImageUploadField() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Photo (optional)</label>
      <div className="flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-16 w-16 rounded-md border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed text-xs text-gray-400">
            No photo
          </div>
        )}
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="w-full text-sm text-gray-600"
        />
      </div>
    </div>
  );
}
// END GENAI
