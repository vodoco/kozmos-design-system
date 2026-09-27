import { useState, type FormEvent } from "react";
import { Button, Input, Text } from "@kozmos-ds/react";
import { AuthError, signIn } from "../cloud/session";
import { POINTR } from "../mock/pointrConfig";
import "./Login.css";

/**
 * Sign in to the real Pointr Cloud instance.
 *
 * The background deliberately contains no artwork or ambient motion. The logo stays static while
 * the proposition and authentication form share one short entrance, then everything remains still.
 *
 * ⚠️ **The password has a deliberately short lifetime.** It lives in a controlled input only
 * while someone is typing and is cleared the moment the request resolves either way. `session.ts`
 * never stores or logs it.
 */
export function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = !!POINTR.baseUrl && !!POINTR.client;
  const instance = POINTR.baseUrl.replace(/^https?:\/\//, "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      setPassword("");
      onDone();
    } catch (err) {
      setPassword(""); // a failed attempt must not leave it sitting there
      setError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong signing in.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="ms-login-page">
      <div className="ms-login-layout">
        <section className="ms-login-story" aria-labelledby="ms-login-title">
          <div className="ms-login-copy">
            <img
              className="ms-login-logo"
              src="/pointr-cloud-logo.svg"
              alt="Pointr Cloud"
              width={112}
              height={114}
            />
            <div className="ms-login-kicker">Pointr · Connected venues</div>
            <h1 id="ms-login-title" className="ms-login-title">
              <span className="ms-login-title-line ms-login-title-line--first">
                <span className="ms-login-title-line-inner">
                  Turn your venues
                </span>
              </span>
              <span className="ms-login-title-line ms-login-title-line--second">
                <span className="ms-login-title-line-inner">
                  into connected
                </span>
              </span>
              <span className="ms-login-title-line ms-login-title-line--third">
                <span className="ms-login-title-line-inner">experiences.</span>
              </span>
            </h1>
            <p className="ms-login-lede">
              Pointr brings maps, positioning, wayfinding and location services
              together to make every venue feel seamlessly connected.
            </p>
          </div>
        </section>

        <section className="ms-login-auth-shell">
          <form
            className="ms-login-card"
            onSubmit={submit}
            aria-busy={busy}
            aria-labelledby="ms-login-form-title"
            aria-describedby={error ? "ms-login-error" : undefined}
          >
            <Text
              as="h2"
              id="ms-login-form-title"
              className="ms-login-card-title"
            >
              Sign in
            </Text>

            <label className="ms-login-field">
              Email
              <Input
                className="ms-login-input"
                type="email"
                name="username"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@pointr.tech"
              />
            </label>

            <label className="ms-login-field">
              Password
              <Input
                className="ms-login-input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
            </label>

            {/* Announced, not just coloured — an authentication failure must never be visual-only. */}
            {error && (
              <div
                id="ms-login-error"
                className="ms-login-alert ms-login-alert--error"
                role="alert"
              >
                {error}
              </div>
            )}
            {!configured && (
              <div
                className="ms-login-alert ms-login-alert--neutral"
                role="alert"
              >
                This build has no Pointr connection configured, so there is
                nothing to sign in to.
              </div>
            )}

            <Button
              className="ms-login-submit"
              type="submit"
              disabled={busy || !configured}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>

            <Text className="ms-login-privacy">
              Your session lasts until you close this tab. Nothing is stored on
              this machine.
            </Text>

            {configured && (
              <div
                className="ms-login-instance"
                title={`Pointr Cloud instance: ${instance}`}
              >
                <span className="ms-login-instance-dot" aria-hidden="true" />
                Connected to {instance}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
