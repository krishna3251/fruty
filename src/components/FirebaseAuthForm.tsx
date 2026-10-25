import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Mail, ArrowUpRight } from "lucide-react";
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  reset: (email: string) => Promise<void>;
  google?: () => Promise<void>;
  error: (error: unknown) => string;
}
export default function FirebaseAuthForm({
  actions,
  signup = false,
}: {
  actions: AuthActions;
  signup?: boolean;
}) {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "reset">(
    signup ? "sign-up" : "sign-in",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const pending = useRef(false);
  const run = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await action();
    } catch (e) {
      setError(actions.error(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "sign-up" && name.trim().length < 2) {
      setError("Enter your name (at least two characters).");
      return;
    }
    if (mode !== "reset" && password.length < (mode === "sign-up" ? 8 : 1)) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    void run(async () => {
      if (mode === "reset") {
        if (Date.now() < retryAt) {
          setError("Wait 60 seconds before requesting another email.");
          return;
        }
        setRetryAt(Date.now() + 60000);
        await actions.reset(email.trim());
        setStatus(
          "If this address is eligible, check its inbox and spam folder for a password reset link. This notice does not confirm delivery or whether an account exists.",
        );
      } else if (mode === "sign-up")
        await actions.signUp(name.trim(), email.trim(), password);
      else await actions.signIn(email.trim(), password);
    });
  }
  const change = (next: typeof mode) => {
    setMode(next);
    setPassword("");
    setVisible(false);
    setError("");
    setStatus("");
  };
  return (
    <section className="firebase-auth" aria-labelledby="firebase-auth-title">
      <span className="eyebrow">YOUR TROPICAL FEAST ACCOUNT</span>
      <h2 id="firebase-auth-title">
        {mode === "reset"
          ? "Let’s get you back in."
          : mode === "sign-up"
            ? "Make room for a little tang."
            : "Welcome to your pantry."}
      </h2>
      <p>
        {mode === "reset"
          ? "We’ll ask Firebase to email a secure password reset link."
          : "Your favourite jars, saved for next time."}
      </p>
      <p id="firebase-error" className="form-error" role="alert">
        {error}
      </p>
      <p id="firebase-status" role="status">
        {status}
      </p>
      {actions.google && mode !== "reset" && (
        <>
          <button
            className="button outline google-signin"
            disabled={busy}
            onClick={() => void run(actions.google!)}
          >
            <span aria-hidden="true">G</span> Continue with Google{" "}
            <ArrowUpRight size={16} />
          </button>
          <p className="auth-divider">or use your email</p>
        </>
      )}
      <form onSubmit={submit} aria-busy={busy}>
        {mode === "sign-up" && (
          <label>
            Your name
            <input
              required
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>
        )}
        <label>
          Email address
          <input
            required
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            aria-describedby="firebase-error firebase-status"
          />
        </label>
        {mode !== "reset" && (
          <>
            <label>
              Password
              <div className="recovery-password">
                <input
                  required
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "sign-up" ? "new-password" : "current-password"
                  }
                  minLength={mode === "sign-up" ? 8 : 1}
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  aria-describedby="firebase-password-guidance firebase-error"
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible((v) => !v)}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>
            {mode === "sign-up" ? (
              <p id="firebase-password-guidance">
                Use at least 8 characters and a long, unique passphrase.
                Firebase enforces the configured password policy.
              </p>
            ) : (
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => change("reset")}
              >
                Forgot password?
              </button>
            )}
          </>
        )}
        <button className="button primary" disabled={busy}>
          <Mail size={17} />
          {busy
            ? "Connecting securely…"
            : mode === "reset"
              ? "Send password reset link"
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
        </button>
      </form>
      <button
        className="text-link"
        disabled={busy}
        onClick={() => change(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "New here? Create an account" : "Back to sign in"}
      </button>
      <p className="account-privacy">
        No account needed to shop. Essential sign-in storage is separate from
        optional analytics.
      </p>
    </section>
  );
}
