import React from "react";
import { OptionRow } from "./OptionRow";
import {
  groupOf,
  orderByGroup,
  renderOptionGroups,
  scrollOptionIntoView,
} from "./option-groups";
import { nextEnabledIndex } from "../../recipes/option";
import {
  asValueArray,
  firstEnabledIndex,
  LISTBOX_CLASS,
  LISTBOX_EMBEDDED_CLASS,
  listboxNextValue,
  listboxOptionId as optionIdIn,
  listboxRowId,
} from "../../recipes/listbox";
import { cn } from "../../utils";
import { useInputModality } from "../../utils/input-modality";
import { type ComboboxOption } from "../Combobox";

export interface ListboxProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  /**
   * The active option's value, for a product that moves it (GAP-260): a
   * search field that drives the list as a combobox, focus staying in the
   * field, which points at the active option with `aria-activedescendant`
   * (`listboxOptionId` gives its id). `null` is no active option. With
   * `onActiveValueChange`; unset, the list keeps its own.
   */
  activeValue?: string | null;
  /**
   * Called with the option the list would make active: by the arrows, Home
   * and End while the list has focus, by the pointer, and by a choice.
   */
  onActiveValueChange?: (value: string | null) => void;
  defaultValue?: string | string[];
  disabled?: boolean;
  /**
   * Draws no panel of its own (GAP-271): no border, surface, shadow or
   * padding, for a list inside a container that is the box, a Dialog, a
   * Popover or a Card, such as Switch client's. The rows, their fills and
   * the keyboard are as they are; the focus ring still shows.
   */
  embedded?: boolean;
  multiple?: boolean;
  onValueChange?: (value: string | string[], option: ComboboxOption) => void;
  options: ComboboxOption[];
  value?: string | string[];
}

/**
 * The id of the option `value` names in a Listbox whose `id` is
 * `listboxId`, for a field's `aria-activedescendant` (GAP-260); undefined
 * for a value it does not list. Options are drawn under their groups, so
 * pass the same options the Listbox is given.
 */
export function listboxOptionId(
  listboxId: string,
  options: ComboboxOption[],
  value: string | null | undefined,
) {
  return optionIdIn(listboxId, options, value);
}

export const Listbox = React.forwardRef<HTMLDivElement, ListboxProps>(
  (
    {
      activeValue,
      className,
      defaultValue,
      disabled,
      embedded = false,
      id,
      multiple,
      onBlur,
      onFocus,
      onKeyDown,
      onActiveValueChange,
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
    const [ownActiveIndex, setOwnActiveIndex] = React.useState(() =>
      firstEnabledIndex(options, selectedValues),
    );
    // A product's active option wins (GAP-260): the list then only asks for
    // a move, through onActiveValueChange.
    const activeControlled = activeValue !== undefined;
    const activeIndex = activeControlled
      ? options.findIndex((option) => option.value === activeValue)
      : ownActiveIndex;
    const setActiveIndex = (next: number | ((current: number) => number)) => {
      const index = typeof next === "function" ? next(activeIndex) : next;
      if (!activeControlled) setOwnActiveIndex(index);
      if (index !== activeIndex)
        onActiveValueChange?.(options[index]?.value ?? null);
    };
    const activeOptionId =
      activeIndex >= 0 && options[activeIndex]
        ? listboxRowId(listboxId, activeIndex)
        : undefined;

    // New options move the active one in the render that brings them, so no
    // commit names a stale option (GAP-231). A choice does not move it, nor
    // does a host passing equal options anew: the list is known by the values
    // it draws, not by identity.
    const drawnList = React.useMemo(
      () => JSON.stringify(options.map((option) => option.value)),
      [options],
    );
    const [activeFor, setActiveFor] = React.useState(drawnList);
    if (activeControlled) {
      // The product's: nothing is moved here.
      if (activeFor !== drawnList) setActiveFor(drawnList);
    } else if (activeFor !== drawnList) {
      setActiveFor(drawnList);
      setOwnActiveIndex(firstEnabledIndex(options, selectedValues));
    } else if (!options[activeIndex] || options[activeIndex].disabled) {
      // The active option can no longer be chosen (a limit the product
      // draws with `disabled`): the next enabled one, on from it, takes over,
      // or none when none is enabled.
      const next =
        activeIndex >= 0
          ? nextEnabledIndex(options, activeIndex, 1)
          : firstEnabledIndex(options, selectedValues);
      if (next !== activeIndex) setOwnActiveIndex(next);
    }

    // The active option is kept in view while the list has focus, and,
    // when a product moves it, wherever focus is: in the field driving it.
    React.useEffect(() => {
      const root = rootRef.current;
      if (
        root &&
        (activeControlled || root.ownerDocument.activeElement === root) &&
        activeOptionId
      ) {
        scrollOptionIntoView(root.ownerDocument.getElementById(activeOptionId));
      }
    }, [activeOptionId, activeControlled]);

    const commitOption = (option: ComboboxOption) => {
      if (disabled || option.disabled) return;

      const nextValue = listboxNextValue(
        selectedValues,
        option.value,
        multiple,
      );

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
        data-embedded={embedded || undefined}
        className={cn(
          LISTBOX_CLASS,
          embedded && LISTBOX_EMBEDDED_CLASS,
          className,
        )}
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
            setActiveIndex(nextEnabledIndex(options, activeIndex, 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(nextEnabledIndex(options, activeIndex, -1));
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
        {renderOptionGroups(options, groupOf, listboxId, (option, index) => {
          const selected = selectedSet.has(option.value);
          const active = index === activeIndex;

          return (
            <OptionRow
              key={option.value}
              id={listboxRowId(listboxId, index)}
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
        })}
      </div>
    );
  },
);

Listbox.displayName = "Listbox";
