import { authService, sessionStore } from "@/lib/auth/server";
import { getSessionEmail } from "@/lib/auth/request";

export async function GET(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const result = await authService.getProfile(email);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({ ok: true, profile: result.profile });
}

export async function PATCH(request: Request) {
  const email = getSessionEmail(request, sessionStore);
  if (!email) {
    return Response.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { hoTen, sdt, diaChi } = await request.json();
  const result = await authService.updateProfile(email, { hoTen, sdt, diaChi });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({ ok: true, profile: result.profile });
}
