import React from "react";
import { Send01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface AIInputBarProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Called with the trimmed text. Never called with an empty string. */
  onSubmit: (value: string) => void;
  placeholder?: string;
  sendLabel?: string;
  inputLabel?: string;
  disabled?: boolean;
  /** Inside the field, before the send button — a voice control, for example. */
  trailing?: React.ReactNode;
}

/**
 * Text in, question out.
 *
 * A form rather than an input and a button, so Enter submits the way every
 * other field on the platform does. Voice is Nice-to-have C in MAP-474 and out
 * of scope, so the microphone is a `trailing` slot a product fills rather than
 * a control this owns.
 */
const AIInputBar = React.forwardRef<HTMLFormElement, AIInputBarProps>(
  (
    {
      className,
      value,
      onValueChange,
      onSubmit,
      placeholder = "Ask anything",
      sendLabel = "Send",
      inputLabel = "Ask the assistant",
      disabled,
      trailing,
      ...props
    },
    ref,
  ) => {
    const trimmed = value.trim();
    const canSend = !disabled && trimmed.length > 0;

    return (
      <form
        className={cn(
          "flex items-center gap-2 border-t border-border px-4 py-3",
          className,
        )}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSend) return;
          onSubmit(trimmed);
        }}
        ref={ref}
        {...props}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-pill border border-border bg-card px-4 py-2">
          <input
            aria-label={inputLabel}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            type="text"
            value={value}
          />
          {trailing}
        </div>
        <button
          aria-label={sendLabel}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSend}
          type="submit"
        >
          <Send01 aria-hidden="true" className="h-5 w-5" />
        </button>
      </form>
    );
  },
);
AIInputBar.displayName = "AIInputBar";

export { AIInputBar };
