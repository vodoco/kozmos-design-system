import { useEffect, useState } from "react";
import { Button, Stack, Text } from "@kozmos-ds/react";

type CopyStatus = "idle" | "copied" | "failed";

const statusText: Record<CopyStatus, string> = {
  idle: "",
  copied: "Copied",
  failed: "Copy failed",
};

/**
 * A button that puts text on the clipboard and says so. The status is a
 * polite live region, so a screen reader hears it without losing its place.
 */
export function CopyButton({
  text,
  label,
  children = "Copy",
  variant = "ghost",
  size = "sm",
}: {
  text: string;
  /** The accessible name: what is copied. */
  label: string;
  children?: React.ReactNode;
  variant?: "ghost" | "outline" | "secondary";
  size?: "sm" | "default";
}) {
  const [status, setStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <Stack direction="row" align="center" gap={2}>
      <Text as="span" size="sm" color="muted" aria-live="polite">
        {statusText[status]}
      </Text>
      <Button size={size} variant={variant} aria-label={label} onClick={copy}>
        {children}
      </Button>
    </Stack>
  );
}
