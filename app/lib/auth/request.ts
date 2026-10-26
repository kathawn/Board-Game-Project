import type { SessionStore } from "./session";

export function getSessionEmail(request: Request, sessions: SessionStore): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return undefined;

  return sessions.resolve(match[1]);
}
