import { authService } from "@/lib/auth/server";

export async function POST(request: Request) {
  const { email, password, hoTen } = await request.json();
  const result = await authService.register({ email, password, hoTen });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": `session=${result.token}; HttpOnly; Path=/; SameSite=Lax` } }
  );
}
