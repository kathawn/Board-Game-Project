import { describe, test, expect } from "vitest";
import { PRODUCTS } from "@/lib/products";

const getProductDetail = async (slug: string) => {
  const { GET } = await import("../api/products/[slug]/route");
  const response = await GET(new Request(`http://localhost/api/products/${slug}`), {
    params: Promise.resolve({ slug }),
  });
  return { status: response.status, body: await response.json() };
};

describe("UC-02 Xem chi tiết sản phẩm — acceptance (FR-BH-03, SC-01)", () => {
  test("a customer opening a product's detail page sees the full components checklist declared for that product, nothing dropped", async () => {
    const product = PRODUCTS.find((p) => p.slug === "catan")!;

    const { status, body } = await getProductDetail("catan");

    expect(status).toBe(200);
    expect(body.linhKien).toEqual(product.linhKien);
    expect(body.linhKien.length).toBe(product.linhKien.length);
  });

  test("the checklist correctly flags which components are độc bản (unique, non-replaceable) per BRU-04, for every product in the catalog", async () => {
    for (const product of PRODUCTS) {
      const { body } = await getProductDetail(product.slug);

      expect(body.linhKien.every((item: { ten: string; docBan: boolean }) =>
        product.linhKien.some((p) => p.ten === item.ten && p.docBan === item.docBan),
      )).toBe(true);
    }
  });

  test("opening the detail page for a product that doesn't exist in the catalog is rejected with 404, not a crash or an empty 200", async () => {
    const { status, body } = await getProductDetail("khong-ton-tai-trong-catalog");

    expect(status).toBe(404);
    expect(body.error).toBeTruthy();
  });

  test("the detail endpoint returns every product field a customer would need to see on the page (name, price, player count, image), not just the checklist", async () => {
    const { status, body } = await getProductDetail("uno");

    expect(status).toBe(200);
    expect(body.ten).toBe("UNO");
    expect(body.giaNiemYet).toBeGreaterThan(0);
    expect(body.soNguoiMin).toBeGreaterThan(0);
    expect(body.anh).toBeTruthy();
  });
});
