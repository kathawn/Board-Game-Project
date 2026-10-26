import type { SessionStore } from "./session";

export function getSessionToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  return cookieHeader.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
}

export function getSessionEmail(request: Request, sessions: SessionStore): string | undefined {
  const token = getSessionToken(request);
  if (!token) return undefined;

  return sessions.resolve(token);
}
