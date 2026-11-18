import React from "react";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { Chip, ChipGroup } from "../Chip";
import { FieldWrapper } from "../FieldWrapper";
import { FieldPopupStatus } from "../Combobox/field-popup";
import { type InputStatus } from "../Input/inputVariants";

/**
 * A field that takes free text and holds each entry as a removable Chip
 * inside it (GAP-222, decision 216): keywords, aliases, e-mail addresses.
 * MultiSelect picks only from its `options`; ChipInput takes what the
 * visitor types. Enter or a comma adds the text as an entry, Backspace in
 * the empty field removes the last one, and each chip has a remove button.
 */
export interface ChipInputProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange"
> {
  /** The entries, controlled. */
  value?: string[];
  /** The entries at first, when the field holds its own. */
  defaultValue?: string[];
  /** Called with every entry after one is added or removed. */
  onValueChange?: (value: string[]) => void;
  /** The text being typed, controlled. */
  inputValue?: string;
  /** The text at first, when the field holds its own. */
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean | string;
  helperText?: string;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  status?: InputStatus;
  wrapperClassName?: string;
  /** The `id` of the text input, which the label names. */
  inputId?: string;
  /** Each chip's remove button's name, in the product's language. "Remove {entry}" by default. */
  removeLabel?: (entry: string) => string;
  /** Said politely when an entry is added. "{entry} added" by default. */
  addedLabel?: (entry: string) => string;
  /** Said politely when an entry is removed. "{entry} removed" by default. */
  removedLabel?: (entry: string) => string;
  /**
   * Said politely when the typed entry is already in the field, which keeps
   * the text and adds nothing. "{entry} is already added" by default.
   */
  duplicateLabel?: (entry: string) => string;
}

const NO_ENTRIES: string[] = [];

/** Text pasted or typed with commas or line breaks in it, as entries. */
function splitEntries(text: string) {
  return text
    .split(/[,\n\r]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const ChipInput = React.forwardRef<HTMLDivElement, ChipInputProps>(
  (
    {
      addedLabel = (entry) => `${entry} added`,
      className,
      defaultInputValue = "",
      defaultValue = NO_ENTRIES,
      disabled,
      duplicateLabel = (entry) => `${entry} is already added`,
      error,
      helperText,
      inputId: inputIdProp,
      inputValue,
      label,
      onInputValueChange,
      onValueChange,
      placeholder,
      readOnly,
      removeLabel = (entry) => `Remove ${entry}`,
      removedLabel = (entry) => `${entry} removed`,
      required,
      status = "default",
      value,
      wrapperClassName,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": callerDescribedBy,
      "aria-invalid": callerInvalid,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const defaultInputId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const inputId = inputIdProp || defaultInputId;
    const [heldValue, setHeldValue] = React.useState(defaultValue);
    const [heldText, setHeldText] = React.useState(defaultInputValue);
    const entries = value ?? heldValue;
    const text = inputValue ?? heldText;
    const locked = Boolean(disabled || readOnly);
    // What the status region says. The same words twice in a row would not
    // be read again, so every other message carries a no-break space.
    const [said, setSaid] = React.useState({ words: "", odd: false });
    const say = (words: string) =>
      setSaid((last) => ({
        words: last.odd ? words : `${words}\u00a0`,
        odd: !last.odd,
      }));
    const resolvedStatus: InputStatus = error ? "error" : status;
    const describedBy =
      error && typeof error === "string"
        ? errorId
        : helperText
          ? helperId
          : undefined;

    const setText = (next: string) => {
      if (inputValue === undefined) setHeldText(next);
      onInputValueChange?.(next);
    };

    const commit = (next: string[]) => {
      if (value === undefined) setHeldValue(next);
      onValueChange?.(next);
    };

    /**
     * Adds each new entry; one already in the field is not added again, and
     * the text that held it stays, so nothing typed is lost unseen.
     */
    const add = (candidates: string[], rest: string) => {
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
      if (added.length > 0) {
        commit(next);
        for (const entry of added)
          trackEvent("ChipInput", "entry_added", { value: entry });
      }
      setText(duplicate !== null ? duplicate : rest);
      if (duplicate !== null) say(duplicateLabel(duplicate));
      else if (added.length > 0) say(added.map(addedLabel).join(", "));
    };

    const remove = (entry: string) => {
      if (locked) return;
      commit(entries.filter((current) => current !== entry));
      say(removedLabel(entry));
      trackEvent("ChipInput", "entry_removed", { value: entry });
    };

    return (
      <FieldWrapper
        className={wrapperClassName}
        error={error}
        errorId={errorId}
        helperId={helperId}
        helperText={helperText}
        inputId={inputId}
        label={label}
        required={required}
        status={resolvedStatus}
      >
        <div
          ref={ref}
          className={cn(
            // MultiSelect's field, with no clear and no open: chips and the
            // input wrap inside it, and the field rings for its input.
            "kozmos-chip-input relative flex min-h-field w-full cursor-text items-center gap-2 rounded-control border border-input bg-background px-2 py-1 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            resolvedStatus === "error" &&
              "border-destructive focus-within:ring-destructive",
            resolvedStatus === "warning" &&
              "border-warning focus-within:ring-warning",
            resolvedStatus === "success" &&
              "border-success focus-within:ring-success",
            disabled &&
              "cursor-not-allowed bg-muted text-muted-foreground opacity-80",
            className,
          )}
          data-slot="chip-input"
          onClick={() => inputRef.current?.focus()}
          {...props}
        >
          <ChipGroup className="min-w-0 flex-1 gap-1.5">
            {entries.map((entry) => (
              <Chip
                key={entry}
                size="sm"
                selected
                disabled={locked}
                removeLabel={removeLabel(entry)}
                onRemove={() => {
                  remove(entry);
                  // Its button goes with the chip: the field keeps focus.
                  inputRef.current?.focus();
                }}
              >
                {entry}
              </Chip>
            ))}
            <input
              ref={inputRef}
              id={inputId}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
              aria-invalid={resolvedStatus === "error" ? true : callerInvalid}
              aria-required={required || undefined}
              autoComplete="off"
              // MultiSelect's input: the same height, padding and placeholder.
              className="kozmos-reset kozmos-multiselect-input"
              disabled={disabled}
              enterKeyHint="enter"
              placeholder={entries.length > 0 ? "" : placeholder}
              readOnly={readOnly}
              value={text}
              onChange={(event) => {
                const next = event.target.value;
                // A comma typed, or text pasted with commas or line breaks,
                // adds what comes before the last one; what follows stays.
                if (/[,\n\r]/.test(next)) {
                  const parts = next.split(/[,\n\r]/);
                  const rest = parts.pop() ?? "";
                  add(splitEntries(parts.join(",")), rest.trimStart());
                } else {
                  setText(next);
                }
              }}
              onPaste={(event) => {
                // A single-line input drops line breaks from what is pasted,
                // so a pasted list is read here, before it is: each line or
                // comma-separated part is an entry, and the last stays typed.
                const pasted = event.clipboardData.getData("text");
                if (locked || !/[,\n\r]/.test(pasted)) return;
                event.preventDefault();
                const parts = `${text}${pasted}`.split(/[,\n\r]/);
                const rest = parts.pop() ?? "";
                add(splitEntries(parts.join(",")), rest.trimStart());
              }}
              onKeyDown={(event) => {
                if (locked || event.nativeEvent.isComposing) return;
                if (event.key === "Enter") {
                  const entry = text.trim();
                  // An empty field leaves Enter to the form.
                  if (!entry) return;
                  event.preventDefault();
                  add([entry], "");
                } else if (event.key === "Backspace" && text === "") {
                  const last = entries[entries.length - 1];
                  if (last !== undefined) {
                    event.preventDefault();
                    remove(last);
                  }
                }
              }}
            />
          </ChipGroup>
        </div>
        <FieldPopupStatus message={said.words || undefined} />
      </FieldWrapper>
    );
  },
);

ChipInput.displayName = "ChipInput";
