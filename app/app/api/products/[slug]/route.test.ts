import { describe, test, expect } from "vitest";
import { PRODUCTS } from "@/lib/products";

const productRequest = (slug: string) =>
  new Request(`http://localhost/api/products/${slug}`);

const callGet = async (slug: string) => {
  const { GET } = await import("./route");
  return GET(productRequest(slug), { params: Promise.resolve({ slug }) });
};

describe("GET /api/products/:slug (FR-BH-03)", () => {
  test("returns 200 with the product body, including the full linhKien checklist, for a valid slug", async () => {
    const response = await callGet("catan");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.slug).toBe("catan");
    expect(body.linhKien).toEqual(PRODUCTS.find((p) => p.slug === "catan")?.linhKien);
  });

  test("returns 404 with an error body for a slug that does not exist", async () => {
    const response = await callGet("khong-ton-tai");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBeTruthy();
  });
});
