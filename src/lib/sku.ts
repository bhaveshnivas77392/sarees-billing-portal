// START GENAI
import { randomBytes } from "crypto";

/** Human-readable, barcode-safe SKU used both as the DB key and the Code128 barcode value. */
export function generateSku(): string {
  const random = randomBytes(5).toString("hex").toUpperCase();
  return `SAR-${random}`;
}
// END GENAI
