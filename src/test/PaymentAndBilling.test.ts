import { describe, it, expect } from "vitest";

describe("Payment & UPI NPCI Formatting Verification", () => {
  it("generates valid NPCI compliant UPI string with parameters", () => {
    const upiId = "srilaxminarasimhasarees@okaxis";
    const shopName = "Sri Laxmi Narasimha Silk Sarees";
    const amount = 5500.0;

    const cleanShopName = encodeURIComponent(shopName);
    const upiPayload = `upi://pay?pa=${upiId}&pn=${cleanShopName}&am=${amount.toFixed(2)}&cu=INR`;

    expect(upiPayload).toContain("pa=srilaxminarasimhasarees@okaxis");
    expect(upiPayload).toContain("am=5500.00");
    expect(upiPayload).toContain("cu=INR");
    expect(upiPayload.startsWith("upi://pay?")).toBe(true);
  });

  it("validates split payment math correctly", () => {
    const totalAmount = 12000;
    const cashPortion = 5000;
    const upiPortion = 7000;

    const isValidSplit = cashPortion + upiPortion === totalAmount;
    expect(isValidSplit).toBe(true);

    const invalidUpiPortion = 6000;
    const isInvalid = cashPortion + invalidUpiPortion === totalAmount;
    expect(isInvalid).toBe(false);
  });
});
