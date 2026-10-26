import { sessionStore } from "@/lib/auth/server";
import { getSessionToken } from "@/lib/auth/request";

export async function POST(request: Request) {
  const token = getSessionToken(request);
  if (token) {
    sessionStore.revoke(token);
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": "session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0" } }
  );
}
