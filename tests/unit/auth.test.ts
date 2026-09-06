import { describe, expect, it, beforeEach } from "vitest";
import { usernameSchema, signupSchema } from "@/modules/auth/domain/validation";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { assertAdmin, assertUser } from "@/modules/auth/server/requireAuth";
import { authOptions, type AuthSession } from "@/modules/auth/server/auth";
import { UnauthorizedError, ForbiddenError } from "@/server/middleware/errors";
const session = (role: string) => ({ user: { id: "test", role } }) as AuthSession;
describe("application authentication rules", () => {
  it("validates usernames and preserves display case", () => {
    expect(usernameSchema.parse(" Sinless777 ")).toBe("Sinless777");
    for (const name of ["", "  ", "ab", "x".repeat(33), "a b", "a.b", "a@b"])
      expect(usernameSchema.safeParse(name).success).toBe(false);
    expect(usernameSchema.safeParse("Hero_One-2").success).toBe(true);
  });
  it("validates confirmation without trimming passwords", () => {
    const data = {
      username: "Hero",
      email: "hero@example.test",
      password: " password ",
      confirmPassword: " password ",
    };
    expect(signupSchema.parse(data).password).toBe(data.password);
    expect(signupSchema.safeParse({ ...data, confirmPassword: "password" }).success).toBe(false);
  });
  it("derives authorization from the server session", () => {
    expect(() => assertUser(null)).toThrow(UnauthorizedError);
    expect(() => assertAdmin(null)).toThrow(UnauthorizedError);
    expect(() => assertAdmin(session("user"))).toThrow(ForbiddenError);
    expect(() => assertAdmin(session("user,admin"))).toThrow(ForbiddenError);
    expect(assertAdmin(session("admin")).user.role).toBe("admin");
  });
  it("fails closed on missing secret or unsafe base URL", () => {
    expect(() => authOptions({})).toThrow("BETTER_AUTH_SECRET");
    expect(() =>
      authOptions({ BETTER_AUTH_SECRET: "x".repeat(32), BETTER_AUTH_URL: "http://example.com" }),
    ).toThrow("HTTPS");
  });
});
describe("auth modal controller", () => {
  beforeEach(() => useAuthModal.getState().close());
  it("switches modes and closes without holding session data", () => {
    useAuthModal.getState().openSignup();
    expect(useAuthModal.getState()).toMatchObject({ isOpen: true, mode: "signup" });
    useAuthModal.getState().openLogin();
    expect(useAuthModal.getState()).toMatchObject({ isOpen: true, mode: "login" });
    useAuthModal.getState().close();
    expect(useAuthModal.getState().isOpen).toBe(false);
  });
});
