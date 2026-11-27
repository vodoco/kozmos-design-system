/**
 * MultiSelect's and ChipInput's recipe: the field their chips and input
 * wrap in, its status edges, the input, MultiSelect's popup, and how
 * ChipInput reads entries from what is typed or pasted, for every framework
 * that draws one. React's `MultiSelect` and `ChipInput` build their elements
 * from it, and so do Vue's `KozmosMultiSelect` and `KozmosChipInput`.
 * Framework-free (`recipes.framework-free.test.ts`).
 */
import { cn } from "../utils";
import { fieldActionsRoom } from "./combobox";

type ChipFieldStatus = "default" | "error" | "warning" | "success";

/** The field's edge and ring for its status, and the look of a disabled one. */
function chipFieldState(status: ChipFieldStatus, disabled?: boolean) {
  return [
    status === "error" && "border-destructive focus-within:ring-destructive",
    status === "warning" && "border-warning focus-within:ring-warning",
    status === "success" && "border-success focus-within:ring-success",
    disabled && "cursor-not-allowed bg-muted text-muted-foreground opacity-80",
  ];
}

/**
 * MultiSelect's field. kozmos-multiselect-field: the field rings for its
 * input alone, as Combobox's input does (owned-selection.css). Combobox's
 * room for its buttons (field-actions.ts): 96 or 48 in touch, 88 or 44 in
 * compact, after px-2.
 */
export function multiSelectFieldClass(
  status: ChipFieldStatus,
  disabled: boolean | undefined,
  withClear: boolean,
  className?: string,
) {
  return cn(
    "kozmos-multiselect-field relative flex min-h-field w-full items-center gap-2 rounded-control border border-input bg-background px-2 py-1 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    fieldActionsRoom(withClear),
    ...chipFieldState(status, disabled),
    className,
  );
}

/**
 * ChipInput's field: MultiSelect's, with no clear and no open. Chips and
 * the input wrap inside it, and the field rings for its input.
 */
export function chipInputFieldClass(
  status: ChipFieldStatus,
  disabled: boolean | undefined,
  className?: string,
) {
  return cn(
    "kozmos-chip-input relative flex min-h-field w-full cursor-text items-center gap-2 rounded-control border border-input bg-background px-2 py-1 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    ...chipFieldState(status, disabled),
    className,
  );
}

/** The ChipGroup the chips and the input share, inside the field. */
export const CHIP_FIELD_GROUP_CLASS = "min-w-0 flex-1 gap-1.5";
/** The input after the chips: the same height, padding and placeholder in both. */
export const CHIP_FIELD_INPUT_CLASS = "kozmos-reset kozmos-multiselect-input";
/** MultiSelect's popup, the listbox itself, which scrolls. */
export const MULTI_SELECT_POPUP_CLASS =
  "max-h-64 overflow-y-auto rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay";
/** The empty text, plain: the field's status says it aloud. */
export const MULTI_SELECT_EMPTY_CLASS =
  "px-3 py-2 text-sm text-muted-foreground";

/** What MultiSelect says by default when the selection reaches its limit. */
export const defaultMaxSelectedLabel = (max: number) =>
  `Limit of ${max} reached`;

/** Text pasted or typed with commas or line breaks in it, as entries. */
export function splitEntries(text: string) {
  return text
    .split(/[,\n\r]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Whether text holds an entry's end: a comma or a line break. */
export const ENTRY_BREAK = /[,\n\r]/;

/**
 * Text with a comma or line break in it, as ChipInput takes it: the entries
 * before the last break, and what follows it, still typed.
 */
export function readEntries(text: string) {
  const parts = text.split(ENTRY_BREAK);
  const rest = parts.pop() ?? "";
  return { entries: splitEntries(parts.join(",")), rest: rest.trimStart() };
}

/**
 * Adds each new entry to `entries`; one already there is not added again,
 * and the text that held it stays, so nothing typed is lost unseen. Says
 * what is next: the entries, those added, the text left, and the duplicate.
 */
export function addEntries(
  entries: string[],
  candidates: string[],
  rest: string,
) {
  const next = [...entries];
  const added: string[] = [];
  let duplicate: string | null = null;
  for (const entry of candidates) {
    if (next.includes(entry)) {
      duplicate = entry;
    } else {
      next.push(entry);
      added.push(entry);
    }
  }
  return {
    next,
    added,
    duplicate,
    text: duplicate !== null ? duplicate : rest,
  };
}

/**
 * What ChipInput's status region says next. The same words twice in a row
 * would not be read again, so every other message carries a no-break space.
 */
export function nextSaid(last: { words: string; odd: boolean }, words: string) {
  return { words: last.odd ? words : `${words}\u00a0`, odd: !last.odd };
}

/** ChipInput's words by default, in English. */
export const chipInputDefaults = {
  addedLabel: (entry: string) => `${entry} added`,
  duplicateLabel: (entry: string) => `${entry} is already added`,
  removeLabel: (entry: string) => `Remove ${entry}`,
  removedLabel: (entry: string) => `${entry} removed`,
};
