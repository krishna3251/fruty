import { useRef, useState, type FormEvent } from "react";
import { useSignIn, SignIn } from "@clerk/react";
import { Eye, EyeOff } from "lucide-react";
export type RecoveryClient = Pick<
  ReturnType<typeof useSignIn>["signIn"],
  "create" | "resetPasswordEmailCode" | "reset" | "status"
>;
export function RecoveryForm({
  client,
  initialEmail = "",
  onBack,
}: {
  client: RecoveryClient;
  initialEmail?: string;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<
    "email" | "code" | "password" | "done" | "additional"
  >("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const pending = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    setError("");
    if (step === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (step === "email" && Date.now() < retryAt) {
      setError("Wait 30 seconds before requesting another code.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (step === "email") {
        setRetryAt(Date.now() + 30000);
        const created = await client.create({ identifier: email.trim() });
        if (created.error) {
          // Never disclose whether the address exists. Only enumeration errors use a neutral response.
          const reason = (created.error as { errors?: { code: string }[] })
            .errors?.[0]?.code;
          if (
            [
              "form_identifier_not_found",
              "form_identifier_not_found_or_incorrect_password",
            ].includes(reason || "")
          ) {
            setStep("code");
            return;
          }
          throw Error(
            "Recovery could not start. Check your connection and try again, or use Google if that is your sign-in method.",
          );
        }
        const sent = await client.resetPasswordEmailCode.sendCode();
        if (sent.error)
          throw Error(
            "The recovery service could not send a code. Try again later or return to sign-in for another method.",
          );
        setStep("code");
      } else if (step === "code") {
        if (!/^\d{6}$/.test(code))
          throw Error("Enter the six-digit code from your email.");
        const checked = await client.resetPasswordEmailCode.verifyCode({
          code,
        });
        if (checked.error || client.status !== "needs_new_password")
          throw Error(
            "The code is invalid or expired. Check it or request a new code.",
          );
        setStep("password");
        setCode("");
      } else if (step === "password") {
        if (password.length < 8)
          throw Error(
            "Use at least 8 characters. A longer, unique passphrase is safer.",
          );
        const updated = await client.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        });
        if (updated.error)
          throw Error(
            "The password could not be accepted. Use a stronger unique password and try again. If your recovery expired, request a new code.",
          );
        setPassword("");
        if (client.status === "complete") {
          await client.reset();
          setStep("done");
        } else setStep("additional");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn’t connect. Please try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (step === "additional")
    return (
      <>
        <p role="status">
          Complete the additional verification required by your account.
        </p>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          forceRedirectUrl="/account"
        />
      </>
    );
  return (
    <section className="password-recovery" aria-labelledby="recovery-heading">
      <h2 id="recovery-heading">
        {step === "done" ? "Password updated." : "Let’s get you back in."}
      </h2>
      {step === "done" ? (
        <>
          <p role="status">
            Clerk confirmed your new password. Sign in again to continue.
          </p>
          <button className="button primary" onClick={onBack}>
            Return to sign in
          </button>
        </>
      ) : (
        <>
          <p>
            Recover securely with an email code. If you normally use Google, you
            can also return to sign in and choose Google.
          </p>
          <form onSubmit={submit} aria-busy={busy}>
            <p id="recovery-error" className="form-error" role="alert">
              {error}
            </p>
            {step === "email" && (
              <label>
                Account email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  aria-describedby="recovery-error"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {step === "code" && (
              <>
                <p role="status">
                  If this account is eligible, check its email for a recovery
                  code. This notice does not confirm delivery or whether an
                  account exists.
                </p>
                <label>
                  Email recovery code
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-describedby="recovery-error"
                  />
                </label>
              </>
            )}
            {step === "password" && (
              <>
                <label>
                  New password
                  <div className="recovery-password">
                    <input
                      required
                      type={visible ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={256}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-describedby="recovery-guidance recovery-error"
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={
                        visible ? "Hide new password" : "Show new password"
                      }
                      aria-pressed={visible}
                      onClick={() => setVisible((v) => !v)}
                    >
                      {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </label>
                <p id="recovery-guidance">
                  Use at least 8 characters. Choose a long, unique passphrase.
                  Clerk also checks its password policy.
                </p>
              </>
            )}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Connecting securely…"
                : step === "email"
                  ? "Request recovery code"
                  : step === "code"
                    ? "Verify recovery code"
                    : "Update password"}
            </button>
          </form>
          {step !== "email" && (
            <button
              className="text-link"
              disabled={busy}
              onClick={() => {
                setStep("email");
                setCode("");
                setPassword("");
                setError("");
              }}
            >
              Request a new code or change email
            </button>
          )}
          <button className="text-link" disabled={busy} onClick={onBack}>
            Back to sign in
          </button>
        </>
      )}
    </section>
  );
}
export default function PasswordRecovery({
  initialEmail,
  onBack,
}: {
  initialEmail: string;
  onBack: () => void;
}) {
  const { signIn } = useSignIn();
  return (
    <RecoveryForm client={signIn} initialEmail={initialEmail} onBack={onBack} />
  );
}
