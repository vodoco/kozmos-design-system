import React, { forwardRef } from "react";
import { SearchMd as Search, X } from "@kozmos-ds/icons";
import { cva } from "class-variance-authority";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

const searchBarVariants = cva(
  "flex items-center w-full rounded-control bg-background shadow-floating px-3 h-11 border border-input transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
  {
    variants: {
      variant: {
        floating: "w-full", // Top-level structural coordinates are explicitly delegated natively to the `MapOverlay` container primitive
        inline: "relative",
      },
    },
    defaultVariants: {
      variant: "inline",
    },
  },
);

export interface SearchBarProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  /** The clear button's accessible name. Defaults to "Clear search". */
  clearLabel?: string;
  containerClassName?: string;
  variant?: "floating" | "inline";
  /**
   * What sits at the end of the search row — the assistant's button, in the
   * SDK's sheet.
   *
   * The field is `w-full` and always has been, so a caller composing the pair
   * in a row of their own got the field on one line and the button on the
   * next, unless they happened to know to pass `flex-1` through
   * `containerClassName`. Storybook's example knew; the reference site's did
   * not, and neither will an integrator's. So the row is the component's, not
   * the caller's: with this set the field and what follows it cannot be put on
   * separate lines.
   */
  trailing?: React.ReactNode;
  /** Classes for the row `trailing` creates, not for the field inside it. */
  rowClassName?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      className,
      containerClassName,
      rowClassName,
      trailing,
      variant,
      value,
      onChange,
      onClear,
      placeholder = "Search...",
      /**
       * The clear button's accessible name. Story 2 reads this interface in
       * other languages, and a fixed English string is a control a visitor
       * cannot hear in theirs.
       */
      clearLabel = "Clear search",
      type = "search",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();

    const field = (
      <div
        className={cn(
          searchBarVariants({ variant }),
          // In a row the field takes what is left, and `min-w-0` lets it be
          // narrower than the text inside it — without that a long placeholder
          // pushes the row wider than its container and the wrap comes back by
          // another door.
          trailing && "w-auto min-w-0 flex-1",
          containerClassName,
        )}
        role="search"
      >
        <Search
          aria-hidden="true"
          className="h-[18px] w-[18px] text-muted-foreground me-2 shrink-0"
        />
        <input
          ref={ref}
          className={cn(
            "min-w-0 flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted-foreground",
            className,
          )}
          aria-label={ariaLabel ?? placeholder}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              trackEvent("SearchBar", "search_initiated", { query: value });
            }
            props.onKeyDown?.(e);
          }}
          {...props}
        />
        {value && value.length > 0 && (
          <button
            onClick={() => {
              trackEvent("SearchBar", "search_cleared");
              onChange?.("");
              onClear?.();
            }}
            className="kozmos-search-clear ms-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={clearLabel}
            type="button"
          >
            {/* A 24 grey circle to see; the 44 button around it to hit. */}
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-pill bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          </button>
        )}
      </div>
    );

    if (!trailing) return field;

    return (
      <div
        className={cn(
          "kozmos-search-row flex w-full min-w-0 items-center gap-2",
          rowClassName,
        )}
      >
        {field}
        {/* A row, not a box: the slot takes more than one control in the
            prototype — the assistant beside Filters — and two inline-flex
            buttons in a plain div touch, with none of the row's gap. */}
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
