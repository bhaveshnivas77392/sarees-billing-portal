// START GENAI
import { NextResponse } from "next/server";
import bwipjs from "bwip-js/node";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> },
) {
  const { sku } = await params;

  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: sku,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not generate barcode" }, { status: 400 });
  }
}
// END GENAI
