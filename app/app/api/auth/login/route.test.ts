import { describe, test, expect, beforeEach } from "vitest";

const registerAccount = async () => {
  const { POST: registerPOST } = await import("../register/route");
  await registerPOST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
    })
  );
};

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
    await registerAccount();
  });

  test("returns 200 and a session cookie for correct credentials", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("session=");
  });

  test("returns 401 for wrong password", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "an@example.com", password: "saimatkhau" }),
      })
    );

    expect(response.status).toBe(401);
  });

  test("returns 423 once the account is locked after 5 failed attempts", async () => {
    const { POST } = await import("./route");
    const wrongAttempt = () =>
      POST(
        new Request("http://localhost/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: "an@example.com", password: "saimatkhau" }),
        })
      );

    for (let i = 0; i < 5; i++) {
      await wrongAttempt();
    }
    const response = await wrongAttempt();

    expect(response.status).toBe(423);
  });
});
