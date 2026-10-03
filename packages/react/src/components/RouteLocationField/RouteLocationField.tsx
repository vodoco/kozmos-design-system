import React from "react";
import { cn } from "../../utils";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { X } from "@kozmos-ds/icons";
import { Combobox, type ComboboxOption } from "../Combobox";

export type RouteLocationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error";

export interface RouteLocationFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  label: string;
  /** A host-resolved place. Its value is a stable entity ID, never the query. */
  location: ComboboxOption | null;
  query: string;
  options: ComboboxOption[];
  /** Local substring filtering by default. Host preserves the supplied search results and ranking. */
  filterMode?: "local" | "host";
  onQueryChange: (query: string) => void;
  onSelect: (location: ComboboxOption) => void;
  /** Host clears the resolved identity/query and owns focus restoration. */
  onClear: () => void;
  onChooseMap?: () => void;
  status?: RouteLocationStatus;
  /** Localized explanation of loading, empty or error state. */
  statusText?: string;
  placeholder?: string;
  clearLabel?: string;
  openLabel?: string;
  closeLabel?: string;
  mapLabel?: string;
  emptyText?: string;
  disabled?: boolean;
}

/** Controlled place search or resolved-place display, without routing or asynchronous request ownership. */
export const RouteLocationField = React.forwardRef<
  HTMLDivElement,
  RouteLocationFieldProps
>(
  (
    {
      label,
      location,
      query,
      options,
      filterMode = "local",
      onQueryChange,
      onSelect,
      onClear,
      onChooseMap,
      status = "idle",
      statusText,
      placeholder = "Search for a place",
      clearLabel = "Clear location",
      openLabel = "Open options",
      closeLabel = "Close options",
      mapLabel = "Select from the map",
      emptyText = "No locations found",
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const allowed = status === "idle" || status === "ready";
    const counts = new Map<string, number>();
    for (const option of options)
      counts.set(option.value, (counts.get(option.value) ?? 0) + 1);
    const suggestions = allowed
      ? options.filter(
          (option) => option.value.trim() && counts.get(option.value) === 1,
        )
      : [];
    const message =
      statusText ??
      (status === "loading"
        ? "Searching locations…"
        : status === "error"
          ? "Locations are unavailable"
          : status === "empty"
            ? emptyText
            : undefined);
    return (
      <div
        {...props}
        ref={ref}
        className={cn("flex min-w-0 flex-col gap-2 text-foreground", className)}
      >
        {location ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-control border border-border p-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="kozmos-muted-text min-w-0 text-sm [overflow-wrap:anywhere]">
                {label}
              </span>
              <IconButton
                type="button"
                variant="outline"
                className="shrink-0"
                aria-label={clearLabel}
                disabled={disabled}
                onClick={onClear}
              >
                <X aria-hidden="true" />
              </IconButton>
            </div>
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <p className="m-0 text-base font-semibold">{location.label}</p>
              {location.description && (
                <p className="kozmos-muted-text m-0 text-sm">
                  {location.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <Combobox
            includeValueInAnalytics={false}
            label={label}
            value=""
            inputValue={query}
            onInputValueChange={onQueryChange}
            options={suggestions}
            filterOption={filterMode === "host" ? () => true : undefined}
            onValueChange={(_, option) => {
              if (!disabled && allowed && option && !option.disabled)
                onSelect(option);
            }}
            clearable={false}
            openLabel={openLabel}
            closeLabel={closeLabel}
            disabled={disabled}
            placeholder={placeholder}
            status={status === "error" ? "error" : "default"}
            helperText={message}
            emptyText={message ?? emptyText}
          />
        )}
        {!location && query && (
          <Button
            type="button"
            className="h-auto min-h-11 whitespace-normal [overflow-wrap:anywhere]"
            variant="outline"
            disabled={disabled}
            onClick={onClear}
          >
            {clearLabel}
          </Button>
        )}
        {onChooseMap && (
          <Button
            type="button"
            className="h-auto min-h-11 whitespace-normal [overflow-wrap:anywhere]"
            variant="outline"
            disabled={disabled}
            onClick={onChooseMap}
          >
            {mapLabel}
          </Button>
        )}
      </div>
    );
  },
);
RouteLocationField.displayName = "RouteLocationField";
