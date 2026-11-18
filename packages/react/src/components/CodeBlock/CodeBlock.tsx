import React from "react";
import { Check, Copy01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { IconButton } from "../IconButton/IconButton";

export interface CodeBlockProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onCopy"
> {
  /** The code, shown as written: every space and line kept, no colouring. */
  code: string;
  /**
   * The region's name, what a screen reader says it is: "mergedUnit JSON".
   * The product's words, in its own language.
   */
  label: string;
  /**
   * Long lines wrap (the default). `false` keeps each line whole and
   * scrolls the block sideways; the scroller is then reachable from the
   * keyboard, so its overflow can be read with the arrow keys.
   */
  wrap?: boolean;
  /** A copy button at the block's top end. Off by default. */
  copyable?: boolean;
  /** The copy button's name. Default "Copy". */
  copyLabel?: string;
  /** What is announced once the code is copied. Default "Copied". */
  copiedLabel?: string;
  /** Called with the code once it is copied. */
  onCopy?: (code: string) => void;
}

/**
 * A read-only block of code (GAP-216, decision 225): the code in the mono
 * family, on the muted surface, wrapped or scrolling sideways, with an
 * optional copy that says it copied. MAP-619's merged unit shows a custom
 * field's JSON in one. No syntax colouring: the code is plain text.
 *
 * A region named by `label`, holding a `<pre>` and its `<code>`.
 */
const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      className,
      code,
      label,
      wrap = true,
      copyable = false,
      copyLabel = "Copy",
      copiedLabel = "Copied",
      onCopy,
      ...props
    },
    ref,
  ) => {
    const [said, setSaid] = React.useState("");
    React.useEffect(() => {
      if (!said) return;
      const timer = setTimeout(setSaid, 2000, "");
      return () => clearTimeout(timer);
    }, [said]);
    const icon = "kozmos-reset kozmos-code-block-copy-icon";
    return (
      <div
        ref={ref}
        role="region"
        aria-label={label}
        data-wrap={wrap ? "true" : "false"}
        data-copyable={copyable ? "true" : undefined}
        className={cn("kozmos-code-block", className)}
        {...props}
      >
        <pre
          className="kozmos-code-block-pre"
          // Scrolling sideways, the box is a stop on the keyboard's way.
          tabIndex={wrap ? undefined : 0}
        >
          <code>{code}</code>
        </pre>
        {copyable ? (
          <>
            <IconButton
              type="button"
              size="sm"
              variant="ghost"
              aria-label={copyLabel}
              className="kozmos-code-block-copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                } catch {
                  return;
                }
                // The same words twice are not read twice: a second copy
                // changes them by a no-break space, as Input's copy does.
                setSaid((previous) =>
                  previous === copiedLabel
                    ? `${copiedLabel}\u00a0`
                    : copiedLabel,
                );
                onCopy?.(code);
              }}
            >
              {said ? (
                <Check className={icon} aria-hidden="true" />
              ) : (
                <Copy01 className={icon} aria-hidden="true" />
              )}
            </IconButton>
            {/* In the page from the start, so the change is read. */}
            <span className="sr-only" role="status" aria-live="polite">
              {said}
            </span>
          </>
        ) : null}
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
