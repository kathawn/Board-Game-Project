import { describe, test, expect, beforeEach } from "vitest";

const registerAndGetCookie = async () => {
  const { POST: registerPOST } = await import("../../auth/register/route");
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

describe("POST /api/profile/password (FR-BH-10, BR-14)", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("returns 200 when the old password is correct", async () => {
    const cookie = await registerAndGetCookie();
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ oldPassword: "matkhau123", newPassword: "matkhaumoi456" }),
      })
    );

    expect(response.status).toBe(200);
  });

  test("returns 400 when the old password is wrong", async () => {
    const cookie = await registerAndGetCookie();
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ oldPassword: "saimatkhau", newPassword: "matkhaumoi456" }),
      })
    );

    expect(response.status).toBe(400);
  });

  test("returns 401 when there is no valid session", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword: "matkhau123", newPassword: "matkhaumoi456" }),
      })
    );

    expect(response.status).toBe(401);
  });
});
