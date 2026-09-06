import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormField } from "@/ui/primitives/FormField";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { authClient } from "../client/authClient";
import { authError, refreshIdentity } from "../client/queries";
import { signupSchema } from "../domain/validation";
export function CredentialForm({
  signup,
  busy,
  setBusy,
}: {
  signup: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const locked = useRef(false);
  const queryClient = useQueryClient();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setErrors({});
    const parsed = signupSchema.safeParse(values);
    if (signup && !parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    const identifier = String(values["identifier"] ?? "").trim();
    const password = String(values["password"] ?? "");
    if (!signup && (!identifier || !password)) {
      setErrors({ form: "Enter your email or username and password." });
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const response =
        signup && parsed.success
          ? await authClient.signUp.email({
              name: parsed.data.username,
              username: parsed.data.username,
              displayUsername: parsed.data.username,
              email: parsed.data.email,
              password: parsed.data.password,
            })
          : identifier.includes("@")
            ? await authClient.signIn.email({ email: identifier, password, rememberMe: true })
            : await authClient.signIn.username({
                username: identifier,
                password,
                rememberMe: true,
              });
      if (response.error) {
        setErrors({
          form: authError(
            response.error,
            signup
              ? "Unable to create your account. Check your details and try again."
              : "Unable to sign in. Check your credentials and try again.",
          ),
        });
        return;
      }
      await refreshIdentity(queryClient);
      useAuthModal.getState().close();
      toast.success(signup ? "Welcome to the Codex." : "Welcome back.");
    } catch {
      setErrors({ form: "Unable to reach the service. Please try again." });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset disabled={busy}>
        {signup ? (
          <>
            <FormField
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              required
              maxLength={32}
              error={errors["username"]}
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              error={errors["email"]}
            />
          </>
        ) : (
          <FormField
            label="Email or username"
            name="identifier"
            autoComplete="username"
            autoFocus
            required
          />
        )}
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          required
          error={errors["password"]}
        />
        {signup && (
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            error={errors["confirmPassword"]}
          />
        )}
        {errors["form"] && (
          <p role="alert" className="auth-error">
            {errors["form"]}
          </p>
        )}
        <button className="auth-submit" type="submit">
          {busy ? "Please wait…" : signup ? "Create Account" : "Sign In"}
        </button>
      </fieldset>
    </form>
  );
}
