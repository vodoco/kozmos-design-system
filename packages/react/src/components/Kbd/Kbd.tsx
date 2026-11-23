import React from "react";
import { cn } from "../../utils";
import {
  KBD_CAP_CLASS,
  KBD_COMBINATION_CLASS,
  KBD_JOIN_CLASS,
  KBD_NAME_CLASS,
  kbdKeyName,
} from "../../recipes/kbd";

// A key drawn as a key (GAP-156): "Press Esc to clear" draws Esc as a key
// cap, and a screen reader reads it by the key's name, "Escape". The caps'
// classes and the names are shared with Vue's KozmosKbd (recipes/kbd.ts).
export { kbdKeyName } from "../../recipes/kbd";

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

const capClass = KBD_CAP_CLASS;
const nameClass = KBD_NAME_CLASS;

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
          <span className={nameClass}>{spoken}</span>
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
        {index > 0 ? <span className={KBD_JOIN_CLASS}>+</span> : null}
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
        className={cn(KBD_COMBINATION_CLASS, className)}
        {...props}
      >
        {label === undefined ? (
          drawn
        ) : (
          <>
            <span aria-hidden="true">{drawn}</span>
            <span className={nameClass}>{label}</span>
          </>
        )}
      </kbd>
    );
  },
);
Kbd.displayName = "Kbd";

export { Kbd };
