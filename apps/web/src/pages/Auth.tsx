import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth";
import { AuthShell, authInputClass, authPrimaryButtonClass, EyeIcon } from "./auth-shell";

const DUPLICATE_EMAIL_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
]);

export function AuthPage({ mode }: { mode: "in" | "up" }) {
  const { t } = useLingui();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [pending, setPending] = useState(false);
  const passwordFieldId = mode === "in" ? "current-password" : "new-password";
  const passwordDescribedBy =
    [mode === "up" ? "new-password-hint" : null, error ? "auth-error" : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const title =
    mode === "in" ? <Trans>Sign in to Sentra Bot</Trans> : <Trans>Create your Sentra Bot</Trans>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setDuplicateEmail(false);
    const result =
      mode === "up"
        ? await authClient.signUp.email({
            email,
            password,
            name: name || email.split("@")[0] || "User",
          })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      if (result.error.code && DUPLICATE_EMAIL_CODES.has(result.error.code)) {
        setDuplicateEmail(true);
        return;
      }
      setError(result.error.message ?? t`Could not continue`);
      return;
    }
    navigate(mode === "up" ? "/onboarding" : "/app");
  }

  return (
    <AuthShell title={title} onSubmit={submit}>
      {mode === "up" ? (
        <label className="mb-4 w-full text-[16px] text-[#8C8C86]">
          <Trans>Name</Trans>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t`Your name`}
            className={`mt-2 ${authInputClass}`}
          />
        </label>
      ) : null}
      <label className="w-full text-[16px] text-[#8C8C86]">
        <Trans>Email</Trans>
        <input
          id="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t`Your email address`}
          type="email"
          required
          aria-invalid={duplicateEmail ? true : undefined}
          aria-describedby={duplicateEmail ? "auth-error" : undefined}
          className={`mt-2 ${authInputClass}`}
        />
      </label>
      <div className="mt-4 w-full text-[16px] text-[#8C8C86]">
        <div className="flex items-baseline justify-between">
          <label htmlFor={passwordFieldId}>
            <Trans>Password</Trans>
          </label>
          {mode === "in" ? (
            <Link
              to="/reset-password"
              state={{ email }}
              className="text-[14px] hover:text-[#F1F1EF]"
            >
              <Trans>Forgot password?</Trans>
            </Link>
          ) : null}
        </div>
        <div className="relative mt-2">
          <input
            id={passwordFieldId}
            name="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t`Password`}
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={128}
            aria-invalid={error ? true : undefined}
            aria-describedby={passwordDescribedBy}
            className={`${authInputClass} pr-[52px]`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? t`Hide password` : t`Show password`}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-[18px] text-[#8C8C86] hover:text-[#F1F1EF]"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        {mode === "up" ? (
          <p
            id="new-password-hint"
            className={`mt-2 text-sm ${password.length >= 8 ? "text-[#8C8C86]" : "text-[#6C6C70]"}`}
          >
            <Trans>At least 8 characters</Trans>
          </p>
        ) : null}
      </div>
      {duplicateEmail ? (
        <p id="auth-error" role="alert" className="mt-3 w-full text-sm text-[#E5696B]">
          <Trans>An account with this email already exists.</Trans>{" "}
          <Link to="/sign-in" state={{ email }} className="font-medium text-[#F1F1EF]">
            <Trans>Sign in instead</Trans>
          </Link>
        </p>
      ) : error ? (
        <p id="auth-error" role="alert" className="mt-3 w-full text-sm text-[#E5696B]">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? (
          <Trans>Working…</Trans>
        ) : mode === "in" ? (
          <Trans>Continue with email</Trans>
        ) : (
          <Trans>Create account</Trans>
        )}
      </button>
      <p className="mt-[30px] text-[16px] text-[#8C8C86]">
        {mode === "in" ? (
          <>
            <Trans>Don’t have an account?</Trans>{" "}
            <Link to="/sign-up" className="font-medium text-[#F1F1EF]">
              <Trans>Sign up</Trans>
            </Link>
          </>
        ) : (
          <>
            <Trans>Already have an account?</Trans>{" "}
            <Link to="/sign-in" className="font-medium text-[#F1F1EF]">
              <Trans>Sign in</Trans>
            </Link>
          </>
        )}
      </p>
    </AuthShell>
  );
}
