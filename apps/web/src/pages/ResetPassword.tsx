import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { authClient } from "../lib/auth";
import { AuthShell, authInputClass, authPrimaryButtonClass, EyeIcon } from "./auth-shell";

const RESET_PASSWORD_PATH = "/reset-password";
const linkClass = "font-medium text-[#F1F1EF]";

/**
 * One route, three entry states: no token → ask for a link; `token` → set a new
 * password; `error` (or a token rejected on submit) → the link is dead, ask again.
 */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [tokenRejected, setTokenRejected] = useState(false);
  const invalid = params.has("error") || tokenRejected;

  if (token && !invalid) {
    return <NewPasswordForm token={token} onTokenRejected={() => setTokenRejected(true)} />;
  }
  return <RequestLinkForm invalid={invalid} />;
}

function RequestLinkForm({ invalid }: { invalid: boolean }) {
  const { t } = useLingui();
  const location = useLocation();
  const [email, setEmail] = useState<string>(location.state?.email ?? "");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
    });
    setPending(false);
    if (result.error) {
      setError(t`Could not send the link. Try again.`);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title={<Trans>Check your email</Trans>}>
        <p role="status" className="w-full text-center text-[16px] leading-relaxed text-[#8C8C86]">
          <Trans>
            If an account exists for {email}, we sent a link to reset your password. It works for
            one hour.
          </Trans>
        </p>
        <p className="mt-[30px] text-[16px] text-[#8C8C86]">
          <Link to="/sign-in" className={linkClass}>
            <Trans>Back to sign in</Trans>
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={invalid ? <Trans>This link has expired</Trans> : <Trans>Reset your password</Trans>}
      onSubmit={submit}
    >
      {invalid ? (
        <p
          role="status"
          className="mb-4 w-full text-center text-[16px] leading-relaxed text-[#8C8C86]"
        >
          <Trans>Reset links work once and for one hour. Enter your email to get a new one.</Trans>
        </p>
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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "reset-error" : undefined}
          className={`mt-2 ${authInputClass}`}
        />
      </label>
      {error ? (
        <p id="reset-error" role="alert" className="mt-3 w-full text-sm text-[#E5696B]">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? <Trans>Working…</Trans> : <Trans>Send reset link</Trans>}
      </button>
      <p className="mt-[30px] text-[16px] text-[#8C8C86]">
        <Link to="/sign-in" className={linkClass}>
          <Trans>Back to sign in</Trans>
        </Link>
      </p>
    </AuthShell>
  );
}

function NewPasswordForm({
  token,
  onTokenRejected,
}: {
  token: string;
  onTokenRejected: () => void;
}) {
  const { t } = useLingui();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      if (result.error.code === "INVALID_TOKEN") {
        onTokenRejected();
        return;
      }
      setError(result.error.message ?? t`Could not reset your password`);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell title={<Trans>Password updated</Trans>}>
        <p
          role="status"
          className="mb-[18px] w-full text-center text-[16px] leading-relaxed text-[#8C8C86]"
        >
          <Trans>You’ve been signed out everywhere. Sign in with your new password.</Trans>
        </p>
        <Link to="/sign-in" replace className={authPrimaryButtonClass}>
          <Trans>Sign in</Trans>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={<Trans>Choose a new password</Trans>} onSubmit={submit}>
      <div className="w-full text-[16px] text-[#8C8C86]">
        <label htmlFor="new-password">
          <Trans>New password</Trans>
        </label>
        <div className="relative mt-2">
          <input
            id="new-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t`Password`}
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={128}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "new-password-hint reset-error" : "new-password-hint"}
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
        <p
          id="new-password-hint"
          className={`mt-2 text-sm ${password.length >= 8 ? "text-[#8C8C86]" : "text-[#6C6C70]"}`}
        >
          <Trans>At least 8 characters</Trans>
        </p>
      </div>
      {error ? (
        <p id="reset-error" role="alert" className="mt-3 w-full text-sm text-[#E5696B]">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={authPrimaryButtonClass}>
        {pending ? <Trans>Working…</Trans> : <Trans>Update password</Trans>}
      </button>
    </AuthShell>
  );
}
