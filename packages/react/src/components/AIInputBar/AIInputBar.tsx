import React from "react";
import { Send01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface AIInputBarProps extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit"
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Called with the trimmed text. Never called with an empty string. */
  onSubmit: (value: string) => void;
  placeholder?: string;
  sendLabel?: string;
  inputLabel?: string;
  /**
   * Offline (Story 3 AC1), for one. The field shows it as well as the send
   * button: until row 59 only the button did, and the field looked ready to
   * type into. `trailing` is the product's, so disable it with the same flag.
   */
  disabled?: boolean;
  /** Inside the field, before the send button — a voice control, for example. */
  trailing?: React.ReactNode;
  /**
   * The text field itself, for a product that has to put focus there — when
   * the assistant opens, after a send, after an error. The component's own
   * ref stays the form's: moving it would break every caller holding one.
   */
  inputRef?: React.Ref<HTMLInputElement>;
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
      inputRef,
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
        {/* The pill draws the focus the input cannot. The input is
            outline-none, and until row 59 nothing showed in its place
            (WCAG 2.4.7); focus-within, as SearchBar draws it, rings the
            whole field, `trailing` included. At least 44 tall, level with
            send, as the prototype draws the two. */}
        <div
          className={cn(
            "flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-pill border border-border px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            // The Input family's disabled look, a muted fill rather than a
            // fade, on the field as well as the button.
            disabled ? "cursor-not-allowed bg-muted" : "bg-card",
          )}
        >
          <input
            aria-label={inputLabel}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
            disabled={disabled}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={value}
          />
          {trailing}
        </div>
        <button
          aria-label={sendLabel}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
