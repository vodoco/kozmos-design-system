import "./SignIn.css";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  Box,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Checkbox,
  Heading,
  Input,
  OTPInput,
  PasswordInput,
  Stack,
  Text,
} from "@kozmos-ds/react";
import { useFocusOnChange } from "../focus";

type Step = "credentials" | "code" | "done";

/** The code that signs in; any other six digits are refused. Invented. */
const CODE = "123456";
const PHONE = "+44 ••• 2231";
const RESEND_SECONDS = 20;

function emailError(value: string) {
  if (!value.trim()) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Enter an email address, like name@example.com.";
  return undefined;
}

function passwordError(value: string) {
  if (!value) return "Enter your password.";
  if (value.length < 12) return "Use at least 12 characters.";
  return undefined;
}

export default function SignIn() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keep, setKeep] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [note, setNote] = useState<string>();
  // Each step replaces the last, so its heading takes focus (../focus.ts).
  const stepHeading = useFocusOnChange(step);

  // The resend link waits: one second at a time, until it is allowed.
  useEffect(() => {
    if (step !== "code" || resendIn === 0) return;
    const timer = window.setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, resendIn]);

  const emailProblem = emailError(email);
  const passwordProblem = passwordError(password);

  function submitCredentials() {
    setSubmitted(true);
    setNote(undefined);
    if (emailProblem || passwordProblem) return;
    // A product asks its server; the example pretends for a moment.
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setStep("code");
      setResendIn(RESEND_SECONDS);
    }, 600);
  }

  function verify() {
    if (code.length < 6) {
      setCodeError("Enter the six digits.");
      return;
    }
    if (code !== CODE) {
      setCodeError("That code did not match. Check the message and try again.");
      return;
    }
    setCodeError(undefined);
    setStep("done");
  }

  function reset() {
    setStep("credentials");
    setEmail("");
    setPassword("");
    setSubmitted(false);
    setCode("");
    setCodeError(undefined);
    setNote(undefined);
  }

  return (
    <Box className="ex-signin">
      <Card className="ex-signin-card">
        {step === "credentials" ? (
          <>
            <CardHeader>
              <Heading
                level={2}
                ref={stepHeading}
                tabIndex={-1}
                className="ex-signin-title"
              >
                Sign in to Venue Manager
              </Heading>
              <CardDescription>
                The console for the venues you manage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="ex-signin-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  submitCredentials();
                }}
              >
                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={submitted ? emailProblem : undefined}
                />
                <PasswordInput
                  label="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  helperText="At least 12 characters."
                  error={submitted ? passwordProblem : undefined}
                />
                <Checkbox
                  label="Keep me signed in on this device"
                  checked={keep}
                  onCheckedChange={(value) => setKeep(value === true)}
                />
                <Button
                  type="submit"
                  isLoading={checking}
                  className="ex-signin-wide"
                >
                  Continue
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() =>
                    setNote(
                      "Password help is not connected in this example; a product sends a reset link.",
                    )
                  }
                >
                  Forgotten your password?
                </Button>
                {/* Always on the page, so a screen reader hears each note
                    put in it; empty, it takes no room. */}
                <Text
                  size="sm"
                  color="muted"
                  role="status"
                  className="ex-signin-live"
                >
                  {note}
                </Text>
              </form>
            </CardContent>
          </>
        ) : step === "code" ? (
          <>
            <CardHeader>
              <Heading
                level={2}
                ref={stepHeading}
                tabIndex={-1}
                className="ex-signin-title"
              >
                Check your phone
              </Heading>
              <CardDescription>
                We sent a six-digit code to {PHONE}. It is valid for ten
                minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="ex-signin-form"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  verify();
                }}
              >
                <OTPInput
                  label="Verification code"
                  length={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError(undefined);
                  }}
                  error={codeError}
                  helperText={`${code.length} of 6 digits`}
                />
                <Button type="submit" className="ex-signin-wide">
                  Verify
                </Button>
                <Stack direction="row" align="center" justify="between" gap={2}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("credentials");
                      setCode("");
                      setCodeError(undefined);
                    }}
                  >
                    Use a different email
                  </Button>
                  {resendIn > 0 ? (
                    <Text size="sm" color="muted" aria-live="polite">
                      Resend in {resendIn} s
                    </Text>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setResendIn(RESEND_SECONDS);
                        setNote("A new code is on its way.");
                      }}
                    >
                      Resend the code
                    </Button>
                  )}
                </Stack>
                {/* Always on the page, so a screen reader hears each note
                    put in it; empty, it takes no room. */}
                <Text
                  size="sm"
                  color="muted"
                  role="status"
                  className="ex-signin-live"
                >
                  {note}
                </Text>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <Heading
                level={2}
                ref={stepHeading}
                tabIndex={-1}
                className="ex-signin-title"
              >
                Signed in
              </Heading>
              <CardDescription>
                {keep
                  ? "This device stays signed in."
                  : "Until you close the tab."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack gap={4}>
                {/* A status that was expected is announced politely. */}
                <Alert variant="success" live="polite">
                  <AlertDescription>
                    <Text as="span" weight="semibold">
                      Welcome back.
                    </Text>{" "}
                    You are signed in as {email.trim()}.
                  </AlertDescription>
                </Alert>
                <Heading level={3}>Your venues</Heading>
                <Text color="muted">
                  Riverside Centre and Harbour Terminal are waiting on the
                  dashboard.
                </Text>
                <Button variant="outline" onClick={reset}>
                  Sign out
                </Button>
              </Stack>
            </CardContent>
          </>
        )}
      </Card>
    </Box>
  );
}
