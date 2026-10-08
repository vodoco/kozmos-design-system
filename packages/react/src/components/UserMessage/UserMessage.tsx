import React from "react";
import { cn } from "../../utils";

export interface UserMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Who is speaking, for a screen reader: read before the words, never
   * drawn. Side and fill tell the visitor's turn from the assistant's, and a
   * screen reader hears neither (row 61). English by default — the product
   * has the language. An empty string leaves it out, for a product that
   * names the speaker in words everyone can see.
   */
  speakerLabel?: string;
}

/**
 * The visitor's turn. Filled and right-aligned against the assistant's
 * outlined, left-aligned bubble — Story 5 AC2 asks only that the two be
 * visually distinct, and side plus fill distinguishes them without relying on
 * colour alone.
 */
const UserMessage = React.forwardRef<HTMLDivElement, UserMessageProps>(
  ({ className, children, speakerLabel = "You said", ...props }, ref) => (
    <div
      className={cn("flex w-full justify-end", className)}
      ref={ref}
      {...props}
    >
      {/* The visitor's bubble is a prominent fill: the theme fill with the
          theme foreground on it, the same in both themes (decision 59). */}
      <div className="max-w-[85%] rounded-container bg-theme-fill px-4 py-3 text-sm text-theme-fill-foreground">
        {/* The space keeps the label a word of its own in WebKit, which runs
            a hidden span into the text after it; it is never drawn. */}
        {speakerLabel && (
          <>
            <span className="sr-only">{speakerLabel}</span>{" "}
          </>
        )}
        {children}
      </div>
    </div>
  ),
);
UserMessage.displayName = "UserMessage";

export { UserMessage };
