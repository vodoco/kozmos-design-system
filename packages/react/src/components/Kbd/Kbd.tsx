import React from "react";
import { cn } from "../../utils";

// A key drawn as a key (GAP-156): "Press Esc to clear" draws Esc as a key
// cap, and a screen reader reads it by the key's name, "Escape".

/** Glyphs, read by their names. */
const SYMBOL_NAMES: Record<string, string> = {
  "⌘": "Command",
  "⌥": "Option",
  "⇧": "Shift",
  "⌃": "Control",
  "↵": "Enter",
  "⏎": "Enter",
  "⌫": "Backspace",
  "⌦": "Delete",
  "⇥": "Tab",
  "↑": "Up arrow",
  "↓": "Down arrow",
  "←": "Left arrow",
  "→": "Right arrow",
  "␣": "Space",
  "⇪": "Caps lock",
};

/** Short names, read in full, whatever their case. */
const WORD_NAMES: Record<string, string> = {
  esc: "Escape",
  ctrl: "Control",
  cmd: "Command",
  opt: "Option",
  bksp: "Backspace",
  del: "Delete",
  pgup: "Page up",
  pgdn: "Page down",
  ins: "Insert",
  win: "Windows",
};

/**
 * What a key is read as: "Esc" is "Escape", "⌘" "Command". A key Kozmos has
 * no name for is read as written. The names are English.
 */
export function kbdKeyName(key: string): string {
  return SYMBOL_NAMES[key] ?? WORD_NAMES[key.toLowerCase()] ?? key;
}

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** One key, as it is drawn: "Esc", "⌘", "K". */
  children?: React.ReactNode;
  /**
   * A combination, drawn as keys joined by "+": `["Ctrl", "C"]`, read
   * "Control+C". Given, it is drawn instead of `children`.
   */
  keys?: readonly string[];
  /**
   * What a screen reader hears instead of the keys' names: the product's
   * own words for them. By default each key is read by its name, in English.
   */
  label?: string;
}

const capClass =
  "inline-flex h-5 min-w-5 align-middle items-center justify-center rounded-marker border border-border bg-muted px-1 font-sans text-xs font-medium leading-none text-foreground";

/** One cap: its glyph drawn, its name read where the two differ. */
const Cap = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { glyph: React.ReactNode; read?: string }
>(({ glyph, read, className, ...props }, ref) => {
  const spoken =
    read ?? (typeof glyph === "string" ? kbdKeyName(glyph) : undefined);
  const differs = spoken !== undefined && spoken !== glyph;
  return (
    <kbd ref={ref} className={cn(capClass, className)} {...props}>
      {differs ? (
        <>
          <span aria-hidden="true">{glyph}</span>
          <span className="sr-only">{spoken}</span>
        </>
      ) : (
        glyph
      )}
    </kbd>
  );
});
Cap.displayName = "KbdCap";

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, keys, label, ...props }, ref) => {
    // One key given as `keys` is one key.
    if (!keys || keys.length === 1) {
      return (
        <Cap
          ref={ref}
          glyph={keys ? keys[0] : children}
          read={label}
          className={className}
          {...props}
        />
      );
    }
    // A combination is a <kbd> of <kbd>s, as HTML writes one.
    const drawn = keys.map((key, index) => (
      <React.Fragment key={`${index}-${key}`}>
        {index > 0 ? <span className="text-muted-foreground">+</span> : null}
        {label === undefined ? (
          <Cap glyph={key} />
        ) : (
          <kbd className={capClass}>{key}</kbd>
        )}
      </React.Fragment>
    ));
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 align-middle font-sans text-xs",
          className,
        )}
        {...props}
      >
        {label === undefined ? (
          drawn
        ) : (
          <>
            <span aria-hidden="true" className="inline-flex items-center gap-1">
              {drawn}
            </span>
            <span className="sr-only">{label}</span>
          </>
        )}
      </kbd>
    );
  },
);
Kbd.displayName = "Kbd";

export { Kbd };
