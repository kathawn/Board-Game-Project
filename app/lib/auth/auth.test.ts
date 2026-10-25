import { describe, test, expect, beforeEach } from "vitest";
import { createAuthService } from "./auth";
import { createInMemoryAccountStore } from "./store";
import { createSessionStore } from "./session";

describe("register", () => {
  let auth: ReturnType<typeof createAuthService>;
  let sessions: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    sessions = createSessionStore();
    auth = createAuthService(createInMemoryAccountStore(), sessions);
  });

  test("new account can log in immediately after registering", async () => {
    await auth.register({ email: "an@example.com", password: "matkhau123" });

    const result = await auth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
  });

  test("registering issues a session token for the new account", async () => {
    const result = await auth.register({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(sessions.resolve(result.token)).toBe("an@example.com");
    }
  });

  test("rejects registering an email that is already in use", async () => {
    await auth.register({ email: "an@example.com", password: "matkhau123" });

    const result = await auth.register({ email: "an@example.com", password: "matkhaukhac" });

    expect(result).toEqual({ ok: false, error: "Email đã được sử dụng." });
  });

  test("treats emails differing only by case/whitespace as the same account", async () => {
    await auth.register({ email: "an@example.com", password: "matkhau123" });

    const result = await auth.register({ email: " An@Example.com ", password: "matkhaukhac" });

    expect(result).toEqual({ ok: false, error: "Email đã được sử dụng." });
  });
});

describe("login", () => {
  let auth: ReturnType<typeof createAuthService>;
  let sessions: ReturnType<typeof createSessionStore>;

  beforeEach(async () => {
    sessions = createSessionStore();
    auth = createAuthService(createInMemoryAccountStore(), sessions);
    await auth.register({ email: "an@example.com", password: "matkhau123" });
  });

  test("rejects wrong password", async () => {
    const result = await auth.login({ email: "an@example.com", password: "saimatkhau" });

    expect(result.ok).toBe(false);
  });

  test("successful login issues a session token", async () => {
    const result = await auth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(sessions.resolve(result.token)).toBe("an@example.com");
    }
  });

  test("rejects unknown email", async () => {
    const result = await auth.login({ email: "unknown@example.com", password: "matkhau123" });

    expect(result.ok).toBe(false);
  });

  test("logs in with an email differing only by case/whitespace from the registered one", async () => {
    const result = await auth.login({ email: " An@Example.com ", password: "matkhau123" });

    expect(result.ok).toBe(true);
  });

  test("locks the account after 5 consecutive failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await auth.login({ email: "an@example.com", password: "saimatkhau" });
    }

    const result = await auth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result).toEqual({ ok: false, error: "Tài khoản đã bị tạm khoá, vui lòng thử lại sau 15 phút." });
  });

  test("allows login again once the 15-minute lockout has elapsed", async () => {
    let currentTime = 0;
    const clockedAuth = createAuthService(createInMemoryAccountStore(), createSessionStore(), () => currentTime);
    await clockedAuth.register({ email: "an@example.com", password: "matkhau123" });

    for (let i = 0; i < 5; i++) {
      await clockedAuth.login({ email: "an@example.com", password: "saimatkhau" });
    }
    currentTime = 15 * 60 * 1000 + 1;

    const result = await clockedAuth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
  });

  test("after a lockout expires, a single wrong attempt does not immediately re-lock the account", async () => {
    let currentTime = 0;
    const clockedAuth = createAuthService(createInMemoryAccountStore(), createSessionStore(), () => currentTime);
    await clockedAuth.register({ email: "an@example.com", password: "matkhau123" });

    for (let i = 0; i < 5; i++) {
      await clockedAuth.login({ email: "an@example.com", password: "saimatkhau" });
    }
    currentTime = 15 * 60 * 1000 + 1;
    await clockedAuth.login({ email: "an@example.com", password: "saimatkhau" });

    const result = await clockedAuth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
  });

  test("a successful login resets the failed-attempt counter", async () => {
    await auth.login({ email: "an@example.com", password: "saimatkhau" });
    await auth.login({ email: "an@example.com", password: "saimatkhau" });
    await auth.login({ email: "an@example.com", password: "matkhau123" });

    for (let i = 0; i < 4; i++) {
      await auth.login({ email: "an@example.com", password: "saimatkhau" });
    }
    const result = await auth.login({ email: "an@example.com", password: "matkhau123" });

    expect(result.ok).toBe(true);
  });
});
