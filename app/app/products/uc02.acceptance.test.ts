import { describe, test, expect } from "vitest";
import { PRODUCTS } from "@/lib/products";

const getProducts = async (query: string) => {
  const { GET } = await import("../api/products/route");
  const response = await GET(new Request(`http://localhost/api/products${query}`));
  return { status: response.status, body: (await response.json()) as { slug: string }[] };
};

describe("UC-02 Xem danh sách sản phẩm — acceptance (FR-BH-02, SC-01)", () => {
  test("a customer browsing the catalog with no filter sees every product in the system", async () => {
    const { status, body } = await getProducts("");

    expect(status).toBe(200);
    expect(body.map((p) => p.slug).sort()).toEqual(PRODUCTS.map((p) => p.slug).sort());
  });

  test("a customer searches by name, filters by category, and narrows by sale price range in one request — exactly the matching products come back, nothing else", async () => {
    const { status, body } = await getProducts(
      "?q=o&danhMuc=Chi%E1%BA%BFn%20thu%E1%BA%ADt%20-%20Thu%20th%E1%BA%ADp&giaMin=0&giaMax=1000000",
    );

    expect(status).toBe(200);
    expect(body.map((p) => p.slug)).toEqual(["splendor"]);
  });

  test("switching to the rental view (trạng thái = thuê) prices the same catalog by BRU-02's day-1 rent rate instead of the sale price, changing which products fall inside a given price range", async () => {
    const saleView = await getProducts("?giaMin=25000&giaMax=30000");
    const rentalView = await getProducts("?loai=thue&giaMin=25000&giaMax=30000");

    // At sale prices, nothing in the catalog costs 25k-30k VNĐ outright.
    expect(saleView.body).toEqual([]);
    // At the day-1 rent rate (10% of giá niêm yết — BRU-02), Coup (280.000đ sale -> 28.000đ/ngày) falls in range.
    expect(rentalView.body.map((p) => p.slug)).toEqual(["coup"]);
  });

  test("a keyword with no matching product returns an empty catalog, not an error", async () => {
    const { status, body } = await getProducts("?q=khong-co-game-nao-ten-nhu-vay");

    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  test("a malformed price query param does not crash the endpoint or corrupt the result set", async () => {
    const { status, body } = await getProducts("?giaMin=not-a-number");

    expect(status).toBe(200);
    expect(body.map((p) => p.slug).sort()).toEqual(PRODUCTS.map((p) => p.slug).sort());
  });
});
