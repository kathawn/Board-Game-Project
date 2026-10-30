import { getStaffToken, logoutStaff, STAFF_COOKIE } from "@/lib/auth/staff";

export async function POST(request: Request) {
  logoutStaff(getStaffToken(request));
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": `${STAFF_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0` } },
  );
}
