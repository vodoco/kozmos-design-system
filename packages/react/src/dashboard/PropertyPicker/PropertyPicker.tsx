import React from "react";
import { clsx } from "clsx";
import { Plus } from "@kozmos-ds/icons";
import { Button } from "../../components/Button/Button";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { Listbox } from "../../components/Listbox/Listbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/Popover/Popover";
import { Search } from "../../components/Search/Search";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/Tabs/Tabs";

/**
 * A property a product can add to a form: data, already in the page's
 * language. `type` is what the property holds, as the product names it
 * ("Text", "Boolean", "Hyperlink"), and is drawn beside its name.
 */
export interface PropertyPickerProperty {
  /** Stable and unique among the properties; what `onSelect` hands back. */
  id: string;
  /** What the search finds it by, and what the row says. */
  name: string;
  /** What it holds, in the page's language ("Text", "Enum", "Image"). */
  type: string;
  /** What it means, in a sentence: drawn after its type, and read with it. */
  description?: string;
  /**
   * Suggested for what is being edited (a Booth's five). Suggested
   * properties are listed first, under the Suggested tab, and never again
   * under Others.
   */
  suggested?: boolean;
}

export interface PropertyPickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect" | "children"
> {
  /** The properties that can still be added: leave out those already on the form. */
  properties: PropertyPickerProperty[];
  /** Called with the property chosen. The picker closes, and the focus goes back to its button. */
  onSelect: (property: PropertyPickerProperty) => void;
  /**
   * Called by the "Custom field" action, drawn after the list, always, while
   * this is given. The picker closes as it does on a choice.
   */
  onCustomField?: () => void;
  /** Open, controlled. Pair with `onOpenChange`. */
  open?: boolean;
  /** Open as it first draws, uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** The button's words, and the popup's name. Default "Add additional field". */
  label?: string;
  /** The search field's label. Default "Search properties". */
  searchLabel?: string;
  /** Default "Search". */
  searchPlaceholder?: string;
  /** The search's clear button's name. Default "Clear search". */
  clearSearchLabel?: string;
  /** The suggested properties' tab and group. Default "Suggested". */
  suggestedLabel?: string;
  /** Every other property's tab and group. Default "Others". */
  othersLabel?: string;
  /** The list's name while it is not a tab's. Default "Properties". */
  listLabel?: string;
  /** Said and shown when the search finds nothing. Default "No properties match". */
  emptyTitle?: string;
  /** Under the empty title. Default none. */
  emptyDescription?: string;
  /** The custom field action's words. Default "Custom field". */
  customFieldLabel?: string;
}

type Tab = "suggested" | "others";

/** A property as a Listbox option: its type, then its description, under its name. */
function toOption(property: PropertyPickerProperty, group?: string) {
  const description = property.description?.trim();
  return {
    value: property.id,
    label: property.name,
    description: description
      ? `${property.type} · ${description}`
      : property.type,
    group,
  };
}

/**
 * Pointr Cloud's "+ Add additional field" (CLOUD-UI-003): a subtle Button
 * the width of its form that opens a search over the properties a product
 * can add, under Suggested and Others tabs while anything is suggested, and
 * a "Custom field" action after the list.
 */
export const PropertyPicker = React.forwardRef<
  HTMLDivElement,
  PropertyPickerProps
>(
  (
    {
      properties,
      onSelect,
      onCustomField,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      disabled,
      label = "Add additional field",
      searchLabel = "Search properties",
      searchPlaceholder = "Search",
      clearSearchLabel = "Clear search",
      suggestedLabel = "Suggested",
      othersLabel = "Others",
      listLabel = "Properties",
      emptyTitle = "No properties match",
      emptyDescription,
      customFieldLabel = "Custom field",
      className,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = openProp ?? uncontrolledOpen;
    const [query, setQuery] = React.useState("");
    const [tab, setTab] = React.useState<Tab>("suggested");
    const searchRef = React.useRef<HTMLInputElement | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);
    const listId = React.useId();

    const setOpen = (next: boolean) => {
      // Each opening starts afresh: no query, the Suggested tab.
      if (next && !open) {
        setQuery("");
        setTab("suggested");
      }
      if (openProp === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };

    const suggested = properties.filter((property) => property.suggested);
    const others = properties.filter((property) => !property.suggested);
    // Case-insensitive, on the name only, as Cloud's search is.
    const needle = query.trim().toLocaleLowerCase();
    const searching = needle.length > 0;
    const matches = (list: PropertyPickerProperty[]) =>
      list.filter((property) =>
        property.name.toLocaleLowerCase().includes(needle),
      );

    // Browsing with suggestions: a tab each. Searching: one list across both,
    // under their groups while both have matches. Nothing suggested: one list.
    const withTabs = !searching && suggested.length > 0;
    const shown: ReturnType<typeof toOption>[] = searching
      ? suggested.length > 0
        ? [
            ...matches(suggested).map((p) => toOption(p, suggestedLabel)),
            ...matches(others).map((p) => toOption(p, othersLabel)),
          ]
        : matches(others).map((p) => toOption(p))
      : withTabs
        ? (tab === "suggested" ? suggested : others).map((p) => toOption(p))
        : others.map((p) => toOption(p));

    const choose = (id: string) => {
      const property = properties.find((candidate) => candidate.id === id);
      if (!property) return;
      onSelect(property);
      setOpen(false);
    };

    const listKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const list = event.currentTarget;
      if (
        event.key === "ArrowUp" &&
        list.getAttribute("aria-activedescendant") === `${list.id}-option-0`
      ) {
        // Up from the first option goes back to the search, as it came.
        event.preventDefault();
        searchRef.current?.focus();
      } else if (
        event.key.length === 1 &&
        event.key !== " " &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        // Typing in the list types in the search.
        searchRef.current?.focus();
      }
    };

    const list =
      shown.length > 0 ? (
        <Listbox
          ref={listRef}
          id={listId}
          className="kozmos-property-picker-list"
          aria-label={
            withTabs
              ? tab === "suggested"
                ? suggestedLabel
                : othersLabel
              : listLabel
          }
          options={shown}
          value=""
          onValueChange={(_value, option) => choose(option.value)}
          onKeyDown={listKeyDown}
        />
      ) : null;

    return (
      <div
        ref={ref}
        className={clsx("kozmos-property-picker", className)}
        {...props}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="subtle"
              disabled={disabled}
              className="kozmos-property-picker-trigger"
            >
              <Plus aria-hidden="true" />
              {label}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label={label}
            className="kozmos-property-picker-popup"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              searchRef.current?.focus();
            }}
          >
            <Search
              ref={searchRef}
              label={searchLabel}
              placeholder={searchPlaceholder}
              clearable
              clearLabel={clearSearchLabel}
              autoComplete="off"
              aria-controls={shown.length > 0 ? listId : undefined}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" && listRef.current) {
                  // Down from the search goes into the list, at its first option.
                  event.preventDefault();
                  listRef.current.focus();
                }
              }}
            />
            {withTabs ? (
              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as Tab)}
                className="kozmos-property-picker-tabs"
              >
                <TabsList className="kozmos-property-picker-tab-list">
                  <TabsTrigger value="suggested">{suggestedLabel}</TabsTrigger>
                  <TabsTrigger value="others">{othersLabel}</TabsTrigger>
                </TabsList>
                {/* The list in it takes the focus, so the panel takes none. */}
                <TabsContent
                  value="suggested"
                  tabIndex={-1}
                  className="kozmos-property-picker-panel"
                >
                  {tab === "suggested" ? list : null}
                </TabsContent>
                <TabsContent
                  value="others"
                  tabIndex={-1}
                  className="kozmos-property-picker-panel"
                >
                  {tab === "others" ? list : null}
                </TabsContent>
              </Tabs>
            ) : (
              list
            )}
            {/* A status region, there before its words, so the empty result is heard. */}
            <div role="status" className="kozmos-property-picker-status">
              {searching && shown.length === 0 ? (
                <EmptyState
                  size="compact"
                  title={emptyTitle}
                  description={emptyDescription}
                />
              ) : null}
            </div>
            {onCustomField ? (
              <Button
                type="button"
                variant="ghost"
                className="kozmos-property-picker-custom"
                onClick={() => {
                  onCustomField();
                  setOpen(false);
                }}
              >
                <Plus aria-hidden="true" />
                {customFieldLabel}
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);

PropertyPicker.displayName = "PropertyPicker";
