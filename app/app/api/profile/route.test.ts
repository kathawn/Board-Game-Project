import { describe, test, expect, beforeEach } from "vitest";

const registerAndGetCookie = async () => {
  const { POST: registerPOST } = await import("../auth/register/route");
  const response = await registerPOST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
    })
  );
  const setCookie = response.headers.get("set-cookie")!;
  return setCookie.split(";")[0];
};

describe("GET /api/profile (FR-BH-10)", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("returns 200 and the current account's profile when logged in", async () => {
    const cookie = await registerAndGetCookie();
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/profile", { headers: { cookie } })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      profile: { email: "an@example.com", hoTen: "", sdt: "", diaChi: "" },
    });
  });

  test("returns 401 when there is no valid session", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/profile"));

    expect(response.status).toBe(401);
  });
});

describe("PATCH /api/profile (FR-BH-10)", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("returns 200 and the saved profile when logged in", async () => {
    const cookie = await registerAndGetCookie();
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          hoTen: "Nguyễn Thị An",
          sdt: "0901234567",
          diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      profile: {
        email: "an@example.com",
        hoTen: "Nguyễn Thị An",
        sdt: "0901234567",
        diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      },
    });
  });

  test("returns 401 when there is no valid session", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hoTen: "X", sdt: "Y", diaChi: "Z" }),
      })
    );

    expect(response.status).toBe(401);
  });
});
