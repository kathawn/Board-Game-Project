import { authService } from "@/lib/auth/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const result = await authService.login({ email, password });

  if (!result.ok) {
    const isLocked = result.error.includes("tạm khoá");
    return Response.json({ error: result.error }, { status: isLocked ? 423 : 401 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": `session=${result.token}; HttpOnly; Path=/; SameSite=Lax` } }
  );
}
