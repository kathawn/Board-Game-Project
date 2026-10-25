import { describe, test, expect, beforeEach } from "vitest";
import { createSessionStore } from "./session";

describe("session store", () => {
  let sessions: ReturnType<typeof createSessionStore>;

  beforeEach(() => {
    sessions = createSessionStore();
  });

  test("creates a token that resolves back to the account email", () => {
    const token = sessions.create("an@example.com");

    expect(sessions.resolve(token)).toBe("an@example.com");
  });

  test("unknown token resolves to undefined", () => {
    expect(sessions.resolve("not-a-real-token")).toBeUndefined();
  });

  test("two sessions for different accounts get different tokens", () => {
    const tokenA = sessions.create("an@example.com");
    const tokenB = sessions.create("binh@example.com");

    expect(tokenA).not.toBe(tokenB);
  });
});
