// Kbd's recipe: a key drawn as a key (GAP-156), for every framework that
// draws one. "Press Esc to clear" draws Esc as a key cap, and a screen reader
// reads it by the key's name, "Escape". React's `Kbd` and Vue's `KozmosKbd`
// both draw their caps from it and read each key by `kbdKeyName`.
// Framework-free (`recipes.framework-free.test.ts`). Line comments, not a doc
// comment: React's declarations carry `kbdKeyName`, and a doc comment here
// would be copied onto it.

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

// Inline boxes all the way down, never flex: a flex item is a block, and
// copied text breaks a line around each block, so "Press Esc to clear" was
// copied across three lines. 20 tall: a 16 line, a pixel of padding and a
// pixel of border above and below.
/** One key's cap. */
export const KBD_CAP_CLASS =
  "inline-block min-w-5 rounded-marker border border-border bg-muted px-1 py-px text-center align-middle font-sans text-xs font-medium leading-4 text-foreground";

// The name a screen reader reads where the glyph differs: never drawn, and
// never copied, so copying the hint copies what it shows.
/** The name read where a cap's glyph differs from it. */
export const KBD_NAME_CLASS = "sr-only select-none";

/** A combination's outer `<kbd>`, holding a `<kbd>` per key. */
export const KBD_COMBINATION_CLASS =
  "inline-block align-middle font-sans text-xs";

/** The "+" drawn between a combination's keys. */
export const KBD_JOIN_CLASS = "mx-1 text-muted-foreground";
