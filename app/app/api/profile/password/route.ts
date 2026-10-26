import { authService, sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";

export async function POST(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { oldPassword, newPassword } = await request.json();
  const result = await authService.changePassword(email, { oldPassword, newPassword });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true });
}
