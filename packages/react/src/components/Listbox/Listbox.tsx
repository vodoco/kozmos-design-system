import React from "react";
import { OptionRow } from "./OptionRow";
import { orderByGroup, renderOptionGroups } from "./option-groups";
import { cn } from "../../utils";
import { useInputModality } from "../../utils/input-modality";
import { type ComboboxOption } from "../Combobox";

export interface ListboxProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  defaultValue?: string | string[];
  disabled?: boolean;
  multiple?: boolean;
  onValueChange?: (value: string | string[], option: ComboboxOption) => void;
  options: ComboboxOption[];
  value?: string | string[];
}

function asValueArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function firstEnabledIndex(options: ComboboxOption[], selected?: string[]) {
  // A chosen option is where the list starts, as the WAI-ARIA listbox has it.
  const chosen = options.findIndex(
    (option) => !option.disabled && selected?.includes(option.value),
  );
  return chosen >= 0 ? chosen : options.findIndex((option) => !option.disabled);
}

function nextEnabledIndex(
  options: ComboboxOption[],
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

export const Listbox = React.forwardRef<HTMLDivElement, ListboxProps>(
  (
    {
      className,
      defaultValue,
      disabled,
      id,
      multiple,
      onBlur,
      onFocus,
      onKeyDown,
      onValueChange,
      options: givenOptions,
      value,
      ...props
    },
    ref,
  ) => {
    // In the order they are drawn: under their groups (GAP-192).
    const options = React.useMemo(
      () => orderByGroup(givenOptions),
      [givenOptions],
    );
    const defaultListboxId = React.useId();
    // The active row's keyboard ring (owned-selection.css), while the list
    // has focus: its active row stays marked when it has not.
    const modality = useInputModality();
    const [focused, setFocused] = React.useState(false);
    const listboxId = id || defaultListboxId;
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      string | string[] | undefined
    >(defaultValue ?? (multiple ? [] : ""));
    const selectedValues = asValueArray(value ?? uncontrolledValue);
    const selectedSet = React.useMemo(
      () => new Set(selectedValues),
      [selectedValues],
    );
    const [activeIndex, setActiveIndex] = React.useState(() =>
      firstEnabledIndex(options, selectedValues),
    );
    const activeOptionId =
      activeIndex >= 0 && options[activeIndex]
        ? `${listboxId}-option-${activeIndex}`
        : undefined;

    React.useEffect(() => {
      setActiveIndex(firstEnabledIndex(options, selectedValues));
      // Only for new options; a choice does not move the active one.
    }, [options]);

    React.useEffect(() => {
      const root = rootRef.current;
      if (root && root.ownerDocument.activeElement === root && activeOptionId) {
        root.ownerDocument
          .getElementById(activeOptionId)
          ?.scrollIntoView?.({ block: "nearest" });
      }
    }, [activeOptionId]);

    const commitOption = (option: ComboboxOption) => {
      if (disabled || option.disabled) return;

      const nextValue = multiple
        ? selectedSet.has(option.value)
          ? selectedValues.filter(
              (selectedValue) => selectedValue !== option.value,
            )
          : [...selectedValues, option.value]
        : option.value;

      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue, option);
    };

    return (
      <div
        ref={setRef}
        id={listboxId}
        role="listbox"
        aria-activedescendant={activeOptionId}
        aria-disabled={disabled || undefined}
        aria-multiselectable={multiple || undefined}
        tabIndex={disabled ? -1 : 0}
        data-modality={focused ? modality : undefined}
        className={cn("kozmos-reset kozmos-listbox", className)}
        onFocus={(event) => {
          onFocus?.(event);
          setFocused(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setFocused(false);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => nextEnabledIndex(options, current, 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => nextEnabledIndex(options, current, -1));
          } else if (event.key === "Home") {
            event.preventDefault();
            setActiveIndex(firstEnabledIndex(options));
          } else if (event.key === "End") {
            event.preventDefault();
            setActiveIndex(nextEnabledIndex(options, 0, -1));
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const option = options[activeIndex];
            if (option) commitOption(option);
          }
        }}
        {...props}
      >
        {renderOptionGroups(
          options,
          (option) => option.group,
          listboxId,
          (option, index) => {
            const selected = selectedSet.has(option.value);
            const active = index === activeIndex;

            return (
              <OptionRow
                key={option.value}
                id={`${listboxId}-option-${index}`}
                option={option}
                selected={selected}
                active={active}
                disabled={disabled || option.disabled}
                onMouseEnter={() => {
                  if (!disabled && !option.disabled) setActiveIndex(index);
                }}
                onClick={() => {
                  if (disabled || option.disabled) return;
                  // The list, not the row's parent: in a group that is the
                  // group.
                  rootRef.current?.focus();
                  setActiveIndex(index);
                  commitOption(option);
                }}
              />
            );
          },
        )}
      </div>
    );
  },
);

Listbox.displayName = "Listbox";
