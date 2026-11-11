import React from "react";
import { DismissableLayer } from "@radix-ui/react-dismissable-layer";
import { SearchMd as SearchIcon, X } from "@kozmos-ds/icons";
import { inputVariants } from "../Input/inputVariants";
import { cn, mergeAriaIds } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";
import { FieldWrapper } from "../FieldWrapper";
import { useUncontrolledValue } from "../FieldWrapper/characterCount";

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean | string;
  wrapperClassName?: string;
  /**
   * Draw a clear button at the field's end while it holds text (GAP-161).
   * Pressing it, or Escape in the field, empties the field through its own
   * `onChange`, calls `onClear` and puts the focus back in the field. Off
   * unless asked for.
   */
  clearable?: boolean;
  /** The clear button's name, in the page's language. Default "Clear search". */
  clearLabel?: string;
  /** Called once the field is cleared, after its `onChange`. */
  onClear?: () => void;
}

/**
 * Empties the field as typing would: through the value's own setter and an
 * input event, so React calls the field's `onChange` with "", controlled or
 * not, and a product's state follows. Setting `value` on the element alone
 * changed the DOM behind React's back.
 */
function emptyField(input: HTMLInputElement) {
  const setValue = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value",
  )?.set;
  if (setValue) setValue.call(input, "");
  else input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  (
    {
      className,
      wrapperClassName,
      error,
      label,
      id,
      clearable = false,
      clearLabel = "Clear search",
      onClear,
      onKeyDown,
      onFocus,
      onBlur,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    const { trackEvent } = useKozmosAnalytics();
    const mirror = useUncontrolledValue(props.value, props.defaultValue);
    const [focused, setFocused] = React.useState(false);
    const canClear =
      clearable &&
      !props.disabled &&
      !props.readOnly &&
      String(mirror.value ?? "").length > 0;
    const clear = () => {
      const input = inputRef.current;
      if (!input) return;
      emptyField(input);
      // The button goes with the text: the focus goes back to the field
      // before the product's callback, which may move it on deliberately.
      input.focus();
      onClear?.();
      trackEvent("Search", "search_cleared");
    };
    const errorId = React.useId();
    // Called on every render: `id || React.useId()` skipped the hook when a
    // caller passed an id, and a caller's id coming or going broke the hook
    // order.
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hasError = !!error;

    return (
      <FieldWrapper
        error={error}
        errorId={errorId}
        label={label}
        inputId={inputId}
        className={wrapperClassName}
      >
        <div className="relative flex items-center">
          {/* The icon is at the inline start, left or right as the field
              reads, and the text clears it there (owned CSS on
              kozmos-search-input): a physical left-3 / pl-9 kept both on the
              left in a right-to-left field. */}
          <SearchIcon className="absolute start-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
          <input
            ref={setRefs}
            id={inputId}
            className={cn(
              inputVariants({ error: hasError }),
              "kozmos-search-input",
              // Room for the clear, as Input keeps for its action: the
              // utility beats a caller's px-*, the owned rule holds where no
              // @scope rule reaches an <input> (WebKit).
              canClear &&
                "kozmos-input-with-action pe-[calc(var(--density-field-height-md,2.75rem)_+_0.25rem)]",
              className,
            )}
            type="search"
            {...props}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onInput={(event) => {
              mirror.onInput?.(event);
              props.onInput?.(event);
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              // Escape empties a field holding text, as the button does; an
              // empty field leaves the key to what holds it (a dialog closes).
              // Taken from the browser too, which empties a search field
              // itself in Chrome and Safari, past onClear.
              if (
                event.key === "Escape" &&
                canClear &&
                !event.defaultPrevented &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                clear();
              }
            }}
            // The caller's description is joined with the error's, and a
            // caller cannot clear an error the field is showing.
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={mergeAriaIds(
              ariaDescribedBy,
              hasError && typeof error === "string" ? errorId : undefined,
            )}
          />
          {canClear && focused ? (
            // While the field has the focus and Escape would clear it, the
            // field is the top dismissable layer, as Combobox's open list
            // is: a Dialog's or Popover's Escape, heard on the document
            // first, gives way to it, so the first Escape clears and the
            // next closes. It dismisses nothing itself (no onDismiss), and
            // goes with the text or the focus, so Escape elsewhere in the
            // dialog closes it as before.
            <DismissableLayer asChild>
              <span hidden />
            </DismissableLayer>
          ) : null}
          {canClear ? (
            // Drawn as Input's action is: as tall as the field, no fill at
            // rest, and hovered a fill 4 in from its edges (decision 164).
            <button
              type="button"
              aria-label={clearLabel}
              className="kozmos-reset kozmos-field-action kozmos-input-action"
              onClick={clear}
            >
              <X
                className="kozmos-reset kozmos-field-action-icon"
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      </FieldWrapper>
    );
  },
);
Search.displayName = "Search";

export { Search };
