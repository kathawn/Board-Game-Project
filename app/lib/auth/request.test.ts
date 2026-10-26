import { describe, test, expect } from "vitest";
import { createSessionStore } from "./session";
import { getSessionEmail } from "./request";

describe("getSessionEmail", () => {
  test("resolves the account email from a session cookie on the request", () => {
    const sessions = createSessionStore();
    const token = sessions.create("an@example.com");
    const request = new Request("http://localhost/api/profile", {
      headers: { cookie: `session=${token}` },
    });

    expect(getSessionEmail(request, sessions)).toBe("an@example.com");
  });

  test("returns undefined when there is no session cookie", () => {
    const sessions = createSessionStore();
    const request = new Request("http://localhost/api/profile");

    expect(getSessionEmail(request, sessions)).toBeUndefined();
  });

  test("returns undefined when the session cookie does not resolve to an account", () => {
    const sessions = createSessionStore();
    const request = new Request("http://localhost/api/profile", {
      headers: { cookie: "session=khong-hop-le" },
    });

    expect(getSessionEmail(request, sessions)).toBeUndefined();
  });
});
