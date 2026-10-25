import { describe, test, expect, beforeEach } from "vitest";

const registerRequest = (email: string, password: string) =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

const loginRequest = (email: string, password: string) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

describe("UC-01 Đăng ký/Đăng nhập — acceptance (FR-BH-01)", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("a customer can register with email+password and is logged in immediately, with no separate activation step", async () => {
    const { POST: register } = await import("../api/auth/register/route");
    const { POST: login } = await import("../api/auth/login/route");

    const registerResponse = await register(registerRequest("khach@example.com", "MatKhau123"));
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.headers.get("set-cookie")).toContain("session=");

    const loginResponse = await login(loginRequest("khach@example.com", "MatKhau123"));
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("set-cookie")).toContain("session=");
  });

  test("5 consecutive wrong-password attempts locks the account for 15 minutes, then a correct password succeeds after the window", async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();

    // Rebuild the service with a controllable clock to exercise the full UC-01 flow
    // (register -> 5 failed logins -> locked -> wait -> succeed) without a real 15-minute sleep.
    const { createAuthService } = await import("@/lib/auth/auth");
    const { createInMemoryAccountStore } = await import("@/lib/auth/store");
    const { createSessionStore } = await import("@/lib/auth/session");

    let currentTime = 0;
    const auth = createAuthService(createInMemoryAccountStore(), createSessionStore(), () => currentTime);

    const registerResult = await auth.register({ email: "khach2@example.com", password: "MatKhau123" });
    expect(registerResult.ok).toBe(true);

    for (let i = 0; i < 5; i++) {
      const attempt = await auth.login({ email: "khach2@example.com", password: "saimatkhau" });
      expect(attempt.ok).toBe(false);
    }

    const lockedAttempt = await auth.login({ email: "khach2@example.com", password: "MatKhau123" });
    expect(lockedAttempt).toEqual({
      ok: false,
      error: "Tài khoản đã bị tạm khoá, vui lòng thử lại sau 15 phút.",
    });

    currentTime = 15 * 60 * 1000 + 1;

    const afterLockout = await auth.login({ email: "khach2@example.com", password: "MatKhau123" });
    expect(afterLockout.ok).toBe(true);
  });
});
