import React from "react";
import { DismissableLayer } from "@radix-ui/react-dismissable-layer";
import { ChevronDown, X } from "@kozmos-ds/icons";
import { cn, mergeAriaIds } from "../../utils";
import { OptionRow } from "../Listbox/OptionRow";
import { useKozmosAnalytics } from "../../utils/analytics";
import { FieldWrapper } from "../FieldWrapper";
import { inputVariants, type InputStatus } from "../Input/Input";

export interface ComboboxOption {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
}

export interface ComboboxPopupAction {
  /** Stable nonblank identity. All commands sharing a duplicate ID are omitted. */
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onAction: () => void;
}
const NO_ACTIONS: ComboboxPopupAction[] = [];
type PopupEntry =
  | { kind: "value"; option: ComboboxOption; disabled?: boolean }
  | { kind: "action"; action: ComboboxPopupAction; disabled?: boolean };

function entryKey(entry: PopupEntry) {
  return entry.kind === "value"
    ? `value:${entry.option.value}`
    : `action:${entry.action.id}`;
}

export interface ComboboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "children" | "defaultValue" | "onChange" | "value"
> {
  clearable?: boolean;
  clearLabel?: string;
  openLabel?: string;
  closeLabel?: string;
  /** Keep legacy generic analytics by default; sensitive place pickers must omit values. */
  includeValueInAnalytics?: boolean;
  defaultInputValue?: string;
  defaultValue?: string;
  emptyText?: string;
  error?: boolean | string;
  filterOption?: (option: ComboboxOption, inputValue: string) => boolean;
  helperText?: string;
  inputValue?: string;
  label?: string;
  onInputValueChange?: (value: string) => void;
  onValueChange?: (value: string, option?: ComboboxOption) => void;
  options: ComboboxOption[];
  /** Unfiltered action choices after suggestions. Share arrow/Enter navigation, but never become a value/query. */
  popupActions?: ComboboxPopupAction[];
  /** Inline participates in a sheet's scroll/layout instead of overlaying later fields. */
  popupLayout?: "overlay" | "inline";
  status?: InputStatus;
  value?: string;
  wrapperClassName?: string;
}

function defaultFilterOption(option: ComboboxOption, inputValue: string) {
  const query = inputValue.trim().toLowerCase();
  if (!query) return true;
  return (
    option.label.toLowerCase().includes(query) ||
    option.value.toLowerCase().includes(query) ||
    option.description?.toLowerCase().includes(query)
  );
}

function nextEnabledIndex(
  options: { disabled?: boolean }[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) return -1;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index =
      (currentIndex + direction * offset + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }

  return -1;
}

function firstEnabledIndex(options: { disabled?: boolean }[]) {
  return options.findIndex((option) => !option.disabled);
}

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      className,
      clearable = true,
      clearLabel = "Clear selection",
      openLabel = "Open options",
      closeLabel = "Close options",
      includeValueInAnalytics = true,
      defaultInputValue,
      defaultValue,
      disabled,
      emptyText = "No results found",
      error,
      filterOption = defaultFilterOption,
      helperText,
      id,
      inputValue,
      label,
      onBlur,
      onFocus,
      onInputValueChange,
      onKeyDown,
      onValueChange,
      options,
      popupActions = NO_ACTIONS,
      popupLayout = "overlay",
      placeholder = "Select option",
      readOnly,
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
    const rootRef = React.useRef<HTMLDivElement>(null);
    const defaultInputId = React.useId();
    const errorId = React.useId();
    const helperId = React.useId();
    const listboxId = React.useId();
    const inputId = id || defaultInputId;
    const [open, setOpen] = React.useState(false);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(
      defaultValue || "",
    );
    const selectedValue = value ?? uncontrolledValue;
    const selectedOption = options.find(
      (option) => option.value === selectedValue,
    );
    const previousSelection = React.useRef({
      value: selectedValue,
      label: selectedOption?.label,
    });
    const [uncontrolledInputValue, setUncontrolledInputValue] = React.useState(
      defaultInputValue ?? selectedOption?.label ?? "",
    );
    const visibleInputValue = inputValue ?? uncontrolledInputValue;
    const filteredOptions = React.useMemo(
      () => options.filter((option) => filterOption(option, visibleInputValue)),
      [filterOption, options, visibleInputValue],
    );
    const validActions = React.useMemo(() => {
      const counts = new Map<string, number>();
      for (const action of popupActions)
        counts.set(action.id, (counts.get(action.id) ?? 0) + 1);
      return popupActions.filter(
        (action) => action.id.trim() && counts.get(action.id) === 1,
      );
    }, [popupActions]);
    const entries = React.useMemo<PopupEntry[]>(
      () => [
        ...filteredOptions.map((option) => ({
          kind: "value" as const,
          option,
          disabled: option.disabled,
        })),
        ...validActions.map((action) => ({
          kind: "action" as const,
          action,
          disabled: action.disabled,
        })),
      ],
      [filteredOptions, validActions],
    );
    const [activeKey, setActiveKey] = React.useState<string | null>(() => {
      const first = entries[firstEnabledIndex(entries)];
      return first ? entryKey(first) : null;
    });
    const activeIndex = entries.findIndex(
      (entry) => !entry.disabled && entryKey(entry) === activeKey,
    );
    const setActiveIndex = (next: number | ((current: number) => number)) => {
      setActiveKey((previous) => {
        const current = entries.findIndex(
          (entry) => !entry.disabled && entryKey(entry) === previous,
        );
        const index = typeof next === "function" ? next(current) : next;
        return entries[index] ? entryKey(entries[index]) : null;
      });
    };
    const previousQuery = React.useRef(visibleInputValue);
    const resolvedStatus: InputStatus = error ? "error" : status;
    const supportingText =
      typeof error === "string" && error ? error : helperText;
    const showEmptyText = emptyText !== supportingText;
    const hasPopupContent = entries.length > 0 || showEmptyText;
    const describedBy =
      error && typeof error === "string"
        ? errorId
        : helperText
          ? helperId
          : undefined;
    const activeOption = activeIndex >= 0 ? entries[activeIndex] : null;
    const activeOptionId =
      open && activeOption ? `${inputId}-option-${activeIndex}` : undefined;
    const listboxOpen = open && entries.length > 0;

    React.useEffect(() => {
      if (activeOptionId)
        rootRef.current?.ownerDocument
          .getElementById(activeOptionId)
          ?.scrollIntoView?.({ block: "nearest" });
    }, [activeOptionId]);
    const canClear =
      clearable && !disabled && !readOnly && Boolean(visibleInputValue);

    React.useEffect(() => {
      if (disabled || readOnly) setOpen(false);
    }, [disabled, readOnly]);

    React.useEffect(() => {
      const previous = previousSelection.current;
      if (
        inputValue === undefined &&
        (previous.value !== selectedValue ||
          previous.label !== selectedOption?.label)
      ) {
        setUncontrolledInputValue(selectedOption?.label ?? "");
      }
      previousSelection.current = {
        value: selectedValue,
        label: selectedOption?.label,
      };
    }, [inputValue, selectedValue, selectedOption?.label]);

    React.useEffect(() => {
      const queryChanged = previousQuery.current !== visibleInputValue;
      previousQuery.current = visibleInputValue;
      setActiveKey((previous) => {
        if (
          !queryChanged &&
          entries.some(
            (entry) => !entry.disabled && entryKey(entry) === previous,
          )
        )
          return previous;
        const first = entries[firstEnabledIndex(entries)];
        return first ? entryKey(first) : null;
      });
    }, [entries, visibleInputValue]);

    React.useEffect(() => {
      if (!open) return undefined;

      const handlePointerDown = (event: MouseEvent) => {
        // A host toolbar may preserve input focus for its own clear/cancel action.
        if (event.defaultPrevented) return;
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    const setInputValue = (nextValue: string) => {
      if (inputValue === undefined) {
        setUncontrolledInputValue(nextValue);
      }
      onInputValueChange?.(nextValue);
    };

    const selectOption = (option: ComboboxOption | null) => {
      if (!option || option.disabled || disabled || readOnly) return;
      if (value === undefined) {
        setUncontrolledValue(option.value);
      }
      setInputValue(option.label);
      setOpen(false);
      trackEvent(
        "Combobox",
        "option_selected",
        includeValueInAnalytics ? { value: option.value } : undefined,
      );
      onValueChange?.(option.value, option);
    };
    const selectEntry = (entry: PopupEntry | null) => {
      if (!entry || entry.disabled || disabled || readOnly) return;
      if (entry.kind === "value") return selectOption(entry.option);
      rootRef.current?.querySelector("input")?.focus();
      setOpen(false);
      entry.action.onAction();
    };

    const clearSelection = () => {
      if (value === undefined) {
        setUncontrolledValue("");
      }
      setInputValue("");
      setOpen(false);
      trackEvent("Combobox", "selection_cleared", {});
      onValueChange?.("", undefined);
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
          ref={rootRef}
          className="relative"
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !open) return;
            // This field owns the open popup's Escape, including a host veto or
            // IME cancellation. Don't let a bubble-based parent dismiss too.
            event.stopPropagation();
            if (event.defaultPrevented || event.nativeEvent.isComposing) return;
            event.preventDefault();
            rootRef.current?.querySelector("input")?.focus();
            setOpen(false);
          }}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setOpen(false);
          }}
        >
          <div className="relative">
            <input
              ref={ref}
              id={inputId}
              role="combobox"
              aria-autocomplete="list"
              aria-controls={listboxOpen ? listboxId : undefined}
              aria-expanded={listboxOpen}
              aria-haspopup="listbox"
              aria-activedescendant={open ? activeOptionId : undefined}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={mergeAriaIds(callerDescribedBy, describedBy)}
              aria-invalid={resolvedStatus === "error" ? true : callerInvalid}
              autoComplete="off"
              className={cn(
                inputVariants({ status: resolvedStatus }),
                canClear ? "pe-24" : "pe-12",
                className,
              )}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              required={required}
              value={visibleInputValue}
              onBlur={onBlur}
              onFocus={(event) => {
                if (!readOnly && !disabled) setOpen(true);
                onFocus?.(event);
              }}
              onChange={(event) => {
                setInputValue(event.target.value);
                if (!open) setOpen(true);
              }}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (
                  event.defaultPrevented ||
                  disabled ||
                  readOnly ||
                  event.nativeEvent.isComposing
                )
                  return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) =>
                    nextEnabledIndex(entries, current, 1),
                  );
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) =>
                    nextEnabledIndex(entries, current, -1),
                  );
                } else if (event.key === "Home") {
                  setActiveIndex(firstEnabledIndex(entries));
                } else if (event.key === "End") {
                  setActiveIndex(nextEnabledIndex(entries, 0, -1));
                } else if (event.key === "Enter" && open) {
                  event.preventDefault();
                  selectEntry(activeOption);
                }
              }}
              {...props}
            />
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center">
              {canClear && (
                <button
                  type="button"
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground ring-offset-background hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={clearLabel}
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-control text-muted-foreground ring-offset-background hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={open ? closeLabel : openLabel}
                disabled={disabled || readOnly}
                onClick={() => setOpen((current) => !current)}
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    open && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          {open && (
            // Join Core overlays' layer ordering without moving focus out of
            // the combobox input. No onDismiss: keyboard dismissal belongs to
            // the field's bubble handler (after host/IME handling), not Radix's
            // document capture handler. Existing blur/outside handling remains.
            <DismissableLayer asChild>
              <div
                data-combobox-popup=""
                className={cn(
                  hasPopupContent &&
                    "mt-1 max-h-64 w-full overflow-auto rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay",
                  hasPopupContent &&
                    popupLayout === "overlay" &&
                    "absolute z-50",
                )}
              >
                {filteredOptions.length === 0 &&
                  validActions.length > 0 &&
                  showEmptyText && (
                    <div
                      role="status"
                      className="px-3 py-2 text-sm text-muted-foreground"
                    >
                      {emptyText}
                    </div>
                  )}
                <div
                  id={listboxOpen ? listboxId : undefined}
                  role={
                    listboxOpen
                      ? "listbox"
                      : showEmptyText
                        ? "status"
                        : undefined
                  }
                  aria-label={listboxOpen ? (ariaLabel ?? label) : undefined}
                  aria-labelledby={listboxOpen ? ariaLabelledBy : undefined}
                >
                  {entries.length === 0
                    ? showEmptyText && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {emptyText}
                        </div>
                      )
                    : entries.map((entry, index) => {
                        if (entry.kind === "action")
                          return (
                            <div
                              key={`action:${entry.action.id}`}
                              role="option"
                              id={`${inputId}-option-${index}`}
                              aria-selected={false}
                              aria-disabled={entry.disabled || undefined}
                              data-active={
                                index === activeIndex && !entry.disabled
                                  ? "true"
                                  : undefined
                              }
                              className={cn(
                                "kozmos-reset kozmos-option min-h-11 items-center",
                                index === filteredOptions.length &&
                                  "border-t border-border",
                              )}
                              onMouseEnter={() => {
                                if (!entry.disabled) setActiveIndex(index);
                              }}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => selectEntry(entry)}
                            >
                              {entry.action.icon && (
                                <span aria-hidden="true" className="shrink-0">
                                  {entry.action.icon}
                                </span>
                              )}
                              <span className="min-w-0 flex-1 whitespace-normal font-medium [overflow-wrap:anywhere]">
                                {entry.action.label}
                              </span>
                            </div>
                          );
                        const option = entry.option;
                        const selected = option.value === selectedValue;
                        const active = index === activeIndex;

                        return (
                          <OptionRow
                            key={`value:${option.value}`}
                            id={`${inputId}-option-${index}`}
                            option={option}
                            selected={selected}
                            active={active}
                            disabled={option.disabled}
                            onMouseEnter={() => {
                              if (!option.disabled) setActiveIndex(index);
                            }}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectEntry(entry)}
                          />
                        );
                      })}
                </div>
              </div>
            </DismissableLayer>
          )}
        </div>
      </FieldWrapper>
    );
  },
);

Combobox.displayName = "Combobox";
