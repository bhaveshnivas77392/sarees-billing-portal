import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SaleCart, CatalogItem } from "@/components/SaleCart";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/actions/billing", () => ({
  checkout: vi.fn().mockResolvedValue({ ok: true, saleId: "test-sale-123" }),
}));

describe("SaleCart UI & Modernized POS Component", () => {
  const sampleCatalog: CatalogItem[] = [
    {
      sareeId: "saree-1",
      name: "Kanjeevaram Royal Silk",
      sku: "KANJ-001",
      price: 5500,
      available: 5,
      imageUrl: null,
      fabric: "Pure Silk",
      color: "Crimson Red",
      category: "Bridal",
    },
    {
      sareeId: "saree-2",
      name: "Banarasi Gold Zari",
      sku: "BAN-002",
      price: 4200,
      available: 2,
      imageUrl: null,
      fabric: "Silk",
      color: "Gold",
      category: "Festive",
    },
  ];

  it("renders catalog items and category filters", () => {
    render(<SaleCart branchId="branch-1" catalog={sampleCatalog} />);

    expect(screen.getByText("Kanjeevaram Royal Silk")).toBeInTheDocument();
    expect(screen.getByText("Banarasi Gold Zari")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Bridal")).toBeInTheDocument();
  });

  it("adds item to cart on click and updates subtotal", () => {
    render(<SaleCart branchId="branch-1" catalog={sampleCatalog} />);

    const sareeCard = screen.getByText("Kanjeevaram Royal Silk");
    fireEvent.click(sareeCard);

    expect(screen.getByText("Current Bill")).toBeInTheDocument();
    expect(screen.getByText("1 sarees in cart")).toBeInTheDocument();
    expect(screen.getAllByText("₹5,500").length).toBeGreaterThanOrEqual(1);
  });

  it("applies discount presets accurately", () => {
    render(<SaleCart branchId="branch-1" catalog={sampleCatalog} />);

    fireEvent.click(screen.getByText("Kanjeevaram Royal Silk"));

    const tenPercentBtn = screen.getByRole("button", { name: "10%" });
    fireEvent.click(tenPercentBtn);

    expect(screen.getByText("Discount Applied")).toBeInTheDocument();
    expect(screen.getByText("-₹550")).toBeInTheDocument();
    expect(screen.getByText("₹4,950")).toBeInTheDocument();
  });

  it("filters items through the search bar", () => {
    render(<SaleCart branchId="branch-1" catalog={sampleCatalog} />);

    const searchInput = screen.getByPlaceholderText("Search catalog by name, fabric, color...");
    fireEvent.change(searchInput, { target: { value: "Banarasi" } });

    expect(screen.getByText("Banarasi Gold Zari")).toBeInTheDocument();
    expect(screen.queryByText("Kanjeevaram Royal Silk")).not.toBeInTheDocument();
  });

  it("supports switching payment modes to UPI", () => {
    render(<SaleCart branchId="branch-1" catalog={sampleCatalog} />);

    // Add item so finalTotal > 0
    fireEvent.click(screen.getByText("Kanjeevaram Royal Silk"));

    const upiButton = screen.getByRole("button", { name: "UPI" });
    fireEvent.click(upiButton);

    expect(screen.getByText(/Live Dynamic UPI QR/i)).toBeInTheDocument();
  });
});
