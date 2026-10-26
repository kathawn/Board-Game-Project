import { sessionStore } from "./server";

/** Extracts the `session` cookie from a Request and resolves it to the logged-in customer's email, or undefined. */
export function resolveSessionEmail(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return undefined;

  return sessionStore.resolve(match[1]);
}
