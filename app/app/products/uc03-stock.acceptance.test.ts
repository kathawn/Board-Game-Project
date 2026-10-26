import { describe, test, expect } from "vitest";
import { PRODUCTS } from "@/lib/products";

const getStock = async (slug: string, query: string) => {
  const { GET } = await import("../api/products/[slug]/stock/route");
  const response = await GET(new Request(`http://localhost/api/products/${slug}/stock${query}`), {
    params: Promise.resolve({ slug }),
  });
  return { status: response.status, body: await response.json() };
};

describe("UC-03 Đặt mua sản phẩm — acceptance (FR-BH-04, SC-02)", () => {
  test("a customer checking out an in-stock product within the available quantity is allowed to proceed", async () => {
    const product = PRODUCTS.find((p) => p.soLuongTon >= 2)!;

    const { status, body } = await getStock(product.slug, `?soLuong=${product.soLuongTon}`);

    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  test("a customer trying to check out a product that is completely sold out is rejected with a clear message naming the product", async () => {
    const soldOut = PRODUCTS.find((p) => p.soLuongTon === 0)!;

    const { status, body } = await getStock(soldOut.slug, "?soLuong=1");

    expect(status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error).toContain(soldOut.ten);
    expect(body.error).toContain("hết hàng");
  });

  test("a customer trying to buy more units than are currently available is rejected, not silently capped or allowed", async () => {
    const limited = PRODUCTS.find((p) => p.soLuongTon > 0)!;

    const { status, body } = await getStock(limited.slug, `?soLuong=${limited.soLuongTon + 1}`);

    expect(status).toBe(409);
    expect(body.ok).toBe(false);
  });

  test("checkout against a product that no longer exists in the catalog is rejected, not silently treated as in-stock", async () => {
    const { status, body } = await getStock("khong-ton-tai-trong-catalog", "?soLuong=1");

    expect(status).toBe(404);
    expect(body.error).toBeTruthy();
  });

  test("a tampered or malformed quantity (non-numeric, zero, negative) never results in a false 'in stock' approval", async () => {
    const product = PRODUCTS.find((p) => p.soLuongTon > 0)!;

    const nonNumeric = await getStock(product.slug, "?soLuong=abc");
    const zero = await getStock(product.slug, "?soLuong=0");
    const negative = await getStock(product.slug, "?soLuong=-3");

    expect(nonNumeric.status).toBe(409);
    expect(zero.status).toBe(409);
    expect(negative.status).toBe(409);
  });
});
