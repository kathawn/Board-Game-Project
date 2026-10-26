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

describe("updateProfile (FR-BH-10)", () => {
  let auth: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    auth = createAuthService(createInMemoryAccountStore(), createSessionStore());
    await auth.register({ email: "an@example.com", password: "matkhau123" });
  });

  test("saves hoTen/sdt/diaChi for an existing account", async () => {
    const result = await auth.updateProfile("an@example.com", {
      hoTen: "Nguyễn Thị An",
      sdt: "0901234567",
      diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    });

    expect(result).toEqual({
      ok: true,
      profile: {
        email: "an@example.com",
        hoTen: "Nguyễn Thị An",
        sdt: "0901234567",
        diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      },
    });
  });

  test("a later update does not wipe a previous update's fields when only called again with new values", async () => {
    await auth.updateProfile("an@example.com", {
      hoTen: "Nguyễn Thị An",
      sdt: "0901234567",
      diaChi: "Địa chỉ cũ",
    });

    const result = await auth.updateProfile("an@example.com", {
      hoTen: "Nguyễn Thị An",
      sdt: "0909999999",
      diaChi: "Địa chỉ mới",
    });

    expect(result).toEqual({
      ok: true,
      profile: {
        email: "an@example.com",
        hoTen: "Nguyễn Thị An",
        sdt: "0909999999",
        diaChi: "Địa chỉ mới",
      },
    });
  });

  test("rejects updating a profile for an email that is not registered", async () => {
    const result = await auth.updateProfile("khongtontai@example.com", {
      hoTen: "X",
      sdt: "0900000000",
      diaChi: "Y",
    });

    expect(result).toEqual({ ok: false, error: "Không tìm thấy tài khoản." });
  });
});

describe("getProfile (FR-BH-10)", () => {
  let auth: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    auth = createAuthService(createInMemoryAccountStore(), createSessionStore());
    await auth.register({ email: "an@example.com", password: "matkhau123" });
  });

  test("returns the current profile for a registered account", async () => {
    const result = await auth.getProfile("an@example.com");

    expect(result).toEqual({
      ok: true,
      profile: { email: "an@example.com", hoTen: "", sdt: "", diaChi: "" },
    });
  });

  test("rejects getting a profile for an email that is not registered", async () => {
    const result = await auth.getProfile("khongtontai@example.com");

    expect(result).toEqual({ ok: false, error: "Không tìm thấy tài khoản." });
  });
});

describe("changePassword (FR-BH-10, BR-14)", () => {
  let auth: ReturnType<typeof createAuthService>;

  beforeEach(async () => {
    auth = createAuthService(createInMemoryAccountStore(), createSessionStore());
    await auth.register({ email: "an@example.com", password: "matkhau123" });
  });

  test("changes the password when the old password is correct", async () => {
    const result = await auth.changePassword("an@example.com", {
      oldPassword: "matkhau123",
      newPassword: "matkhaumoi456",
    });

    expect(result).toEqual({ ok: true });

    const loginWithNew = await auth.login({ email: "an@example.com", password: "matkhaumoi456" });
    expect(loginWithNew.ok).toBe(true);
  });

  test("rejects the change when the old password is wrong, and leaves the password unchanged", async () => {
    const result = await auth.changePassword("an@example.com", {
      oldPassword: "saimatkhau",
      newPassword: "matkhaumoi456",
    });

    expect(result).toEqual({ ok: false, error: "Mật khẩu hiện tại không đúng." });

    const loginWithOld = await auth.login({ email: "an@example.com", password: "matkhau123" });
    expect(loginWithOld.ok).toBe(true);
  });
});
