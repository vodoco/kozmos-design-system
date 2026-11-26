import React from "react";
import { mergeAriaIds } from "../../utils";
import {
  addEntries,
  CHIP_FIELD_GROUP_CLASS,
  CHIP_FIELD_INPUT_CLASS,
  chipInputDefaults,
  chipInputFieldClass,
  ENTRY_BREAK,
  nextSaid,
  readEntries,
} from "../../recipes/multi-select";
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

export const ChipInput = React.forwardRef<HTMLDivElement, ChipInputProps>(
  (
    {
      addedLabel = chipInputDefaults.addedLabel,
      className,
      defaultInputValue = "",
      defaultValue = NO_ENTRIES,
      disabled,
      duplicateLabel = chipInputDefaults.duplicateLabel,
      error,
      helperText,
      inputId: inputIdProp,
      inputValue,
      label,
      onInputValueChange,
      onValueChange,
      placeholder,
      readOnly,
      removeLabel = chipInputDefaults.removeLabel,
      removedLabel = chipInputDefaults.removedLabel,
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
    const say = (words: string) => setSaid((last) => nextSaid(last, words));
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
      const { next, added, duplicate, text } = addEntries(
        entries,
        candidates,
        rest,
      );
      if (added.length > 0) {
        commit(next);
        for (const entry of added)
          trackEvent("ChipInput", "entry_added", { value: entry });
      }
      setText(text);
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
          className={chipInputFieldClass(resolvedStatus, disabled, className)}
          data-slot="chip-input"
          onClick={() => inputRef.current?.focus()}
          {...props}
        >
          <ChipGroup className={CHIP_FIELD_GROUP_CLASS}>
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
              className={CHIP_FIELD_INPUT_CLASS}
              disabled={disabled}
              enterKeyHint="enter"
              placeholder={entries.length > 0 ? "" : placeholder}
              readOnly={readOnly}
              value={text}
              onChange={(event) => {
                const next = event.target.value;
                // A comma typed, or text pasted with commas or line breaks,
                // adds what comes before the last one; what follows stays.
                if (ENTRY_BREAK.test(next)) {
                  const read = readEntries(next);
                  add(read.entries, read.rest);
                } else {
                  setText(next);
                }
              }}
              onPaste={(event) => {
                // A single-line input drops line breaks from what is pasted,
                // so a pasted list is read here, before it is: each line or
                // comma-separated part is an entry, and the last stays typed.
                const pasted = event.clipboardData.getData("text");
                if (locked || !ENTRY_BREAK.test(pasted)) return;
                event.preventDefault();
                const read = readEntries(`${text}${pasted}`);
                add(read.entries, read.rest);
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
