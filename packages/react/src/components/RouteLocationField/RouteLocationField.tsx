import React from "react";
import { cn } from "../../utils";
import { Button } from "../Button";
import { MarkerPin01 } from "@kozmos-ds/icons";
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
  /** Begin replacing a resolved place. The host retains its identity until selection and owns focus. */
  onEdit?: () => void;
  /** While showing an unresolved draft, restore the host's retained place and focus. */
  onCancelEdit?: () => void;
  changeLabel?: string;
  cancelEditLabel?: string;
  clearSearchLabel?: string;
  onChooseMap?: () => void;
  /** A usable blue-dot position resolved by the host, or null when unavailable. No permission/position inference. */
  currentPosition?: ComboboxOption | null;
  currentPositionLabel?: string;
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
      onEdit,
      onCancelEdit,
      changeLabel = "Change",
      cancelEditLabel = "Cancel",
      clearSearchLabel = "Clear search",
      onChooseMap,
      currentPosition,
      currentPositionLabel = "Current position",
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
    const inputId = React.useId();
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
    const actions = (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {!location && query && (
          <Button
            type="button"
            className="h-auto min-h-11 max-w-full whitespace-normal [overflow-wrap:anywhere]"
            variant="ghost"
            disabled={disabled}
            onClick={onClear}
            onMouseDown={(event) => event.preventDefault()}
          >
            {clearSearchLabel}
          </Button>
        )}
        {!location && onCancelEdit && (
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-11 max-w-full whitespace-normal [overflow-wrap:anywhere]"
            disabled={disabled}
            onClick={onCancelEdit}
            onMouseDown={(event) => event.preventDefault()}
            aria-label={`${cancelEditLabel} ${label}`}
          >
            {cancelEditLabel}
          </Button>
        )}
      </div>
    );
    return (
      <div
        {...props}
        ref={ref}
        className={cn("flex min-w-0 flex-col gap-2 text-foreground", className)}
      >
        {location ? (
          <div
            className={cn(
              "min-w-0 gap-2 rounded-control border border-border p-3",
              onEdit
                ? "grid grid-cols-[minmax(0,1fr)_fit-content(50%)] gap-x-3"
                : "flex flex-col",
            )}
          >
            <div
              className={
                onEdit
                  ? "contents"
                  : "flex min-w-0 items-center justify-between gap-3"
              }
            >
              <span className="kozmos-muted-text min-w-0 text-sm [overflow-wrap:anywhere]">
                {label}
              </span>
              <Button
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto min-h-11 max-w-full shrink-0 whitespace-normal [overflow-wrap:anywhere]",
                  onEdit &&
                    "col-start-2 row-start-1 row-span-2 min-w-0 self-center",
                )}
                aria-label={onEdit ? `${changeLabel} ${label}` : clearLabel}
                disabled={disabled}
                onClick={onEdit ?? onClear}
              >
                {onEdit ? changeLabel : clearLabel}
              </Button>
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
          <>
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={inputId}
                className="kozmos-muted-text text-sm [overflow-wrap:anywhere]"
              >
                {label}
              </label>
              {actions}
            </div>
            <Combobox
              popupLayout="inline"
              id={inputId}
              includeValueInAnalytics={false}
              aria-label={label}
              value=""
              inputValue={query}
              onInputValueChange={onQueryChange}
              options={suggestions}
              popupActions={[
                ...(currentPosition?.value.trim() && !currentPosition.disabled
                  ? [
                      {
                        id: "current-position",
                        label: currentPositionLabel,
                        onAction: () => onSelect(currentPosition),
                      },
                    ]
                  : []),
                ...(onChooseMap
                  ? [
                      {
                        id: "choose-map",
                        label: mapLabel,
                        icon: <MarkerPin01 className="h-4 w-4" />,
                        onAction: onChooseMap,
                      },
                    ]
                  : []),
              ]}
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
          </>
        )}
      </div>
    );
  },
);
RouteLocationField.displayName = "RouteLocationField";
