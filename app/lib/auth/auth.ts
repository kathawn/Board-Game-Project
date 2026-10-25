import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AccountStore } from "./store";
import type { SessionStore } from "./session";

export type AuthResult = { ok: true; token: string } | { ok: false; error: string };

export type AuthService = {
  register(input: { email: string; password: string }): Promise<AuthResult>;
  login(input: { email: string; password: string }): Promise<AuthResult>;
};

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(":");
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(derivedHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function createAuthService(
  store: AccountStore,
  sessions: SessionStore,
  now: () => number = Date.now
): AuthService {
  return {
    async register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      if (store.get(normalizedEmail)) {
        return { ok: false, error: "Email đã được sử dụng." };
      }

      store.save({
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        failedAttempts: 0,
        lockedUntil: null,
      });
      return { ok: true, token: sessions.create(normalizedEmail) };
    },

    async login({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const account = store.get(normalizedEmail);
      if (!account) {
        return { ok: false, error: "Email hoặc mật khẩu không đúng." };
      }

      const lockoutActive = account.lockedUntil !== null && now() < account.lockedUntil;
      if (lockoutActive) {
        return { ok: false, error: "Tài khoản đã bị tạm khoá, vui lòng thử lại sau 15 phút." };
      }
      const lockoutExpired = account.lockedUntil !== null && now() >= account.lockedUntil;
      const attemptsBeforeThisTry = lockoutExpired ? 0 : account.failedAttempts;

      if (!verifyPassword(password, account.passwordHash)) {
        const failedAttempts = attemptsBeforeThisTry + 1;
        const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? now() + LOCKOUT_DURATION_MS : null;
        store.save({ ...account, failedAttempts, lockedUntil });
        return { ok: false, error: "Email hoặc mật khẩu không đúng." };
      }

      store.save({ ...account, failedAttempts: 0, lockedUntil: null });
      return { ok: true, token: sessions.create(normalizedEmail) };
    },
  };
}
