// START GENAI
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IconSparkles, IconCheck } from "@/components/Icons";

export function DynamicUpiQr({
  amount,
  shopName,
  upiId,
}: {
  amount: number;
  shopName?: string;
  upiId?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const activeShopName = shopName ?? process.env.NEXT_PUBLIC_SHOP_NAME ?? "Sri Laxmi Narasimha Silk Sarees";
  const activeUpiId = upiId ?? process.env.NEXT_PUBLIC_UPI_ID ?? "srilaxminarasimhasarees@okaxis";

  const cleanShopName = encodeURIComponent(activeShopName);
  // Standard NPCI UPI payload spec
  const upiPayload = `upi://pay?pa=${activeUpiId}&pn=${cleanShopName}&am=${amount.toFixed(2)}&cu=INR`;

  useEffect(() => {
    if (amount <= 0) return;
    QRCode.toDataURL(upiPayload, {
      width: 220,
      margin: 1,
      color: {
        dark: "#1e1b4b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [amount, upiPayload]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white p-4 text-center">
      <div className="mb-2 flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-0.5 text-[11px] font-bold text-indigo-700">
        <IconSparkles className="h-3 w-3" /> Live Dynamic UPI QR (0% Fees)
      </div>
      <p className="text-[11px] text-gray-500 mb-2">Scan with GPay, PhonePe, Paytm, or BHIM</p>

      {qrDataUrl ? (
        <div className="rounded-xl border border-indigo-200 bg-white p-2.5 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="UPI Payment QR" className="h-40 w-40" />
        </div>
      ) : (
        <div className="h-40 w-40 flex items-center justify-center bg-gray-100 rounded-xl text-xs text-gray-400">
          Generating QR...
        </div>
      )}

      <div className="mt-2.5">
        <span className="font-mono text-base font-extrabold text-indigo-950">₹{amount.toLocaleString()}</span>
        <p className="font-mono text-[10px] text-gray-400 mt-0.5">{activeUpiId}</p>
      </div>
    </div>
  );
}
// END GENAI
