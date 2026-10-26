import { describe, test, expect, beforeEach } from "vitest";

const registerAndGetCookie = async () => {
  const { POST: registerPOST } = await import("../register/route");
  const response = await registerPOST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
    })
  );
  return response.headers.get("set-cookie")!.split(";")[0];
};

describe("POST /api/auth/logout", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("returns 200 and clears the session cookie", async () => {
    const cookie = await registerAndGetCookie();
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  test("the session token no longer works after logging out", async () => {
    const cookie = await registerAndGetCookie();
    const { POST: logout } = await import("./route");
    const { GET: getProfile } = await import("../../profile/route");

    await logout(new Request("http://localhost/api/auth/logout", { method: "POST", headers: { cookie } }));

    const response = await getProfile(new Request("http://localhost/api/profile", { headers: { cookie } }));
    expect(response.status).toBe(401);
  });
});
