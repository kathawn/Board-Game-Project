import { describe, test, expect } from "vitest";

const productsRequest = (query: string) =>
  new Request(`http://localhost/api/products${query}`);

describe("GET /api/products (FR-BH-02)", () => {
  test("returns 200 with all products when no query is given", async () => {
    const { GET } = await import("./route");
    const response = await GET(productsRequest(""));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("filters by name keyword via the q query param", async () => {
    const { GET } = await import("./route");
    const response = await GET(productsRequest("?q=catan"));
    const body = await response.json();

    expect(body.map((p: { slug: string }) => p.slug)).toEqual(["catan"]);
  });

  test("filters by category via the danhMuc query param", async () => {
    const { GET } = await import("./route");
    const response = await GET(productsRequest("?danhMuc=Chi%E1%BA%BFn%20thu%E1%BA%ADt%20-%20Thu%20th%E1%BA%ADp"));
    const body = await response.json();

    expect(body.map((p: { slug: string }) => p.slug)).toEqual(["splendor"]);
  });

  test("filters by price range (giaMin/giaMax) against giaNiemYet when loai is absent or 'ban'", async () => {
    const { GET } = await import("./route");
    const response = await GET(productsRequest("?giaMin=440000&giaMax=460000"));
    const body = await response.json();

    expect(body.map((p: { slug: string }) => p.slug)).toEqual(["co-ty-phu"]);
  });

  test("filters by price range against the day-1 rent price when loai=thue", async () => {
    const { GET } = await import("./route");
    const response = await GET(productsRequest("?loai=thue&giaMin=25000&giaMax=30000"));
    const body = await response.json();

    expect(body.map((p: { slug: string }) => p.slug)).toEqual(["coup"]);
  });

  test("ignores a non-numeric giaMin/giaMax instead of relying on NaN comparison semantics", async () => {
    const { GET } = await import("./route");
    const withInvalidMin = await (await GET(productsRequest("?giaMin=abc"))).json();
    const withNoMin = await (await GET(productsRequest(""))).json();

    expect(withInvalidMin.map((p: { slug: string }) => p.slug).sort()).toEqual(
      withNoMin.map((p: { slug: string }) => p.slug).sort(),
    );
  });
});
