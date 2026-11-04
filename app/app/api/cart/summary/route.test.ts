import { describe, test, expect, beforeEach } from "vitest";

describe("GET /api/cart/summary", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("khách chưa đăng nhập vẫn nhận 200 (không phải 401) với loggedIn=false và giỏ rỗng", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/cart/summary"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ loggedIn: false, items: [], rentalCount: 0 });
  });

  test("khách đã đăng nhập: loggedIn=true kèm giỏ mua và số dòng giỏ thuê", async () => {
    const { POST: registerPOST } = await import("../../auth/register/route");
    const registered = await registerPOST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "binh@example.com", password: "matkhau123" }),
      }),
    );
    const cookie = registered.headers.get("set-cookie")!.split(";")[0];
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/cart/summary", { headers: { cookie } }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ loggedIn: true, items: [], rentalCount: 0 });
  });
});
