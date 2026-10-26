import { describe, test, expect, beforeEach } from "vitest";

const registerRequest = (email: string, password: string) =>
  new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

const loginRequest = (email: string, password: string) =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

describe("UC-18 Cập nhật thông tin cá nhân — acceptance (FR-BH-10, BR-14)", () => {
  beforeEach(async () => {
    const { resetAuthForTests } = await import("@/lib/auth/server");
    resetAuthForTests();
  });

  test("a logged-in customer can view and update hoTen/sdt/diaChi, and the change is saved", async () => {
    const { POST: register } = await import("../api/auth/register/route");
    const { GET: getProfile, PATCH: patchProfile } = await import("../api/profile/route");

    const registerResponse = await register(registerRequest("khach@example.com", "MatKhau123"));
    const cookie = registerResponse.headers.get("set-cookie")!.split(";")[0];

    const initialProfile = await getProfile(
      new Request("http://localhost/api/profile", { headers: { cookie } })
    );
    expect(initialProfile.status).toBe(200);
    const initialBody = await initialProfile.json();
    expect(initialBody.profile).toEqual({
      email: "khach@example.com",
      hoTen: "",
      sdt: "",
      diaChi: "",
    });

    const updateResponse = await patchProfile(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          hoTen: "Nguyễn Thị An",
          sdt: "0901234567",
          diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        }),
      })
    );
    expect(updateResponse.status).toBe(200);

    const profileAfterUpdate = await getProfile(
      new Request("http://localhost/api/profile", { headers: { cookie } })
    );
    const bodyAfterUpdate = await profileAfterUpdate.json();
    expect(bodyAfterUpdate.profile).toEqual({
      email: "khach@example.com",
      hoTen: "Nguyễn Thị An",
      sdt: "0901234567",
      diaChi: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    });
  });

  test("a logged-in customer can change their password, then log in with the new password", async () => {
    const { POST: register } = await import("../api/auth/register/route");
    const { POST: login } = await import("../api/auth/login/route");
    const { POST: changePassword } = await import("../api/profile/password/route");

    const registerResponse = await register(registerRequest("khach2@example.com", "MatKhauCu123"));
    const cookie = registerResponse.headers.get("set-cookie")!.split(";")[0];

    const changeResponse = await changePassword(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ oldPassword: "MatKhauCu123", newPassword: "MatKhauMoi456" }),
      })
    );
    expect(changeResponse.status).toBe(200);

    const loginWithOld = await login(loginRequest("khach2@example.com", "MatKhauCu123"));
    expect(loginWithOld.status).toBe(401);

    const loginWithNew = await login(loginRequest("khach2@example.com", "MatKhauMoi456"));
    expect(loginWithNew.status).toBe(200);
  });

  test("changing the password is rejected when the current password is wrong, and the old password still works", async () => {
    const { POST: register } = await import("../api/auth/register/route");
    const { POST: login } = await import("../api/auth/login/route");
    const { POST: changePassword } = await import("../api/profile/password/route");

    const registerResponse = await register(registerRequest("khach3@example.com", "MatKhauDung123"));
    const cookie = registerResponse.headers.get("set-cookie")!.split(";")[0];

    const changeResponse = await changePassword(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ oldPassword: "SaiMatKhau", newPassword: "MatKhauMoi456" }),
      })
    );
    expect(changeResponse.status).toBe(400);

    const loginWithOriginal = await login(loginRequest("khach3@example.com", "MatKhauDung123"));
    expect(loginWithOriginal.status).toBe(200);
  });

  test("a customer who is not logged in cannot view or update a profile, nor change a password", async () => {
    const { GET: getProfile, PATCH: patchProfile } = await import("../api/profile/route");
    const { POST: changePassword } = await import("../api/profile/password/route");

    const getResponse = await getProfile(new Request("http://localhost/api/profile"));
    expect(getResponse.status).toBe(401);

    const patchResponse = await patchProfile(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hoTen: "X", sdt: "Y", diaChi: "Z" }),
      })
    );
    expect(patchResponse.status).toBe(401);

    const passwordResponse = await changePassword(
      new Request("http://localhost/api/profile/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword: "a", newPassword: "b" }),
      })
    );
    expect(passwordResponse.status).toBe(401);
  });
});
