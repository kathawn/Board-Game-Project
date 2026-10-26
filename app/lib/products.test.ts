import { describe, test, expect } from "vitest";
import { filterProducts, getProductBySlug, PRODUCTS } from "./products";

describe("filterProducts (FR-BH-02)", () => {
  test("returns all products when no filter is given", () => {
    const result = filterProducts(PRODUCTS, {});

    expect(result).toHaveLength(PRODUCTS.length);
  });

  test("matches products whose name contains the keyword, case-insensitively", () => {
    const result = filterProducts(PRODUCTS, { q: "catan" });

    expect(result.map((p) => p.slug)).toEqual(["catan"]);
  });

  test("filters by exact category", () => {
    const result = filterProducts(PRODUCTS, { danhMuc: "Bài - Gia đình" });

    expect(result.map((p) => p.slug).sort()).toEqual(["exploding-kittens", "uno"]);
  });

  test("filters by sale price range (loai=ban) using giaNiemYet", () => {
    const result = filterProducts(PRODUCTS, { loai: "ban", giaMin: 440000, giaMax: 460000 });

    expect(result.map((p) => p.slug)).toEqual(["co-ty-phu"]);
  });

  test("filters by rent price range (loai=thue) using the day-1 rent price, not the sale price", () => {
    // Splendor's sale price (480000) falls inside 400000-500000, but its day-1
    // rent price (10% of 480000 = 48000) does not — only Coup's (28000) does.
    const result = filterProducts(PRODUCTS, { loai: "thue", giaMin: 25000, giaMax: 30000 });

    expect(result.map((p) => p.slug)).toEqual(["coup"]);
  });

  test("combines keyword, category, and price filters together", () => {
    const result = filterProducts(PRODUCTS, {
      q: "o",
      danhMuc: "Chiến thuật - Thu thập",
      loai: "ban",
      giaMin: 0,
      giaMax: 1000000,
    });

    expect(result.map((p) => p.slug)).toEqual(["splendor"]);
  });

  test("returns an empty list when nothing matches", () => {
    const result = filterProducts(PRODUCTS, { q: "khong-ton-tai" });

    expect(result).toEqual([]);
  });
});

describe("getProductBySlug (FR-BH-03)", () => {
  test("returns the product with a full linhKien checklist when the slug exists", () => {
    const result = getProductBySlug("catan");

    expect(result?.slug).toBe("catan");
    expect(result?.linhKien).toEqual(PRODUCTS.find((p) => p.slug === "catan")?.linhKien);
  });

  test("returns undefined when no product matches the slug", () => {
    const result = getProductBySlug("khong-ton-tai");

    expect(result).toBeUndefined();
  });
});
