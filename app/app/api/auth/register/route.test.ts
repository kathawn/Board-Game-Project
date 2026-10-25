import { describe, test, expect, beforeEach } from "vitest";

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("returns 200 and a session cookie for a new account", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("session=");
  });

  test("returns 409 when the email is already registered", async () => {
    const { POST } = await import("./route");
    const makeRequest = () =>
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "an@example.com", password: "matkhau123" }),
      });

    await POST(makeRequest());
    const response = await POST(makeRequest());

    expect(response.status).toBe(409);
  });
});
