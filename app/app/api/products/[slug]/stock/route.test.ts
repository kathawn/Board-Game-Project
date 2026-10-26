import { describe, test, expect } from "vitest";

const stockRequest = (slug: string, soLuong: string | null) => {
  const url = new URL(`http://localhost/api/products/${slug}/stock`);
  if (soLuong !== null) url.searchParams.set("soLuong", soLuong);
  return new Request(url);
};

const callGet = async (slug: string, soLuong: string | null) => {
  const { GET } = await import("./route");
  return GET(stockRequest(slug, soLuong), { params: Promise.resolve({ slug }) });
};

describe("GET /api/products/:slug/stock (FR-BH-04)", () => {
  test("returns 200 { ok: true } when the product has enough stock for the requested quantity", async () => {
    const response = await callGet("catan", "2");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  test("returns 409 with a clear error when the product is out of stock", async () => {
    const response = await callGet("coup", "1");
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error).toContain("hết hàng");
  });

  test("returns 404 when the slug does not exist", async () => {
    const response = await callGet("khong-ton-tai", "1");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBeTruthy();
  });

  test("defaults soLuong to 1 when the query param is omitted", async () => {
    const response = await callGet("catan", null);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });

  test("returns 409 instead of 200 when soLuong is a non-numeric string", async () => {
    const response = await callGet("catan", "abc");
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
  });

  test("returns 409 instead of 200 when soLuong is zero", async () => {
    const response = await callGet("catan", "0");
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
  });

  test("returns 409 instead of 200 when soLuong is negative", async () => {
    const response = await callGet("catan", "-5");
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
  });
});
