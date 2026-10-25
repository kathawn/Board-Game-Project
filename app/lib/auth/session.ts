import { randomBytes } from "node:crypto";

export interface SessionStore {
  create(email: string): string;
  resolve(token: string): string | undefined;
}

export function createSessionStore(): SessionStore {
  const sessions = new Map<string, string>();

  return {
    create(email) {
      const token = randomBytes(24).toString("hex");
      sessions.set(token, email);
      return token;
    },
    resolve(token) {
      return sessions.get(token);
    },
  };
}
