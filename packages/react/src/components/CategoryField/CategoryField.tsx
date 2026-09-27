import type { CategoryTint } from "../CategoryTile/CategoryTint";
import React from "react";
import { X } from "@kozmos-ds/icons";
import { cn } from "../../utils";

export interface CategoryFieldProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** The category's name. */
  label: string;
  /** How many places it holds; omitted, no pill. */
  count?: number;
  /**
   * The category's colour as a CSS colour, normally a token variable such
   * as `var(--semantics-data-yellow)`; the theme's colour by default.
   */
  tint?: CategoryTint;
  /** The category's icon, drawn at 28 in the colour; decorative, since the label names it. */
  icon?: React.ReactNode;
  clearLabel?: string;
  onClear?: () => void;
  countLabel?: (count: number) => string;
  /**
   * What sits at the end of the search row — the assistant's button, in the
   * SDK's sheet. The same slot `SearchBar` has, because the field takes the
   * search bar's place when a category is chosen and the row around it does
   * not change.
   *
   * The field is a block-level flex box, so on its own it fills its parent;
   * dropped into a row of the caller's it shrinks to its content and will not
   * grow. Storybook's example knew to pass `flex-1` through `className`; an
   * integrator will not. With this set the row is the component's.
   */
  trailing?: React.ReactNode;
  /** Classes for the row `trailing` creates, not for the field inside it. */
  rowClassName?: string;
}

/**
 * The search field's form once a quick-access category is chosen — the
 * prototype's, measured: 48 tall, the control radius, the category's colour
 * at 12 % with a 1-pixel border of it, the icon at 28 in the colour, the name
 * at 15 semibold in the foreground, a 22-tall count pill filled with the
 * colour, a 32 clear at the trailing edge with its cross in the foreground, in
 * a 44 hit area as the search bar's clear is.
 * It takes the field's place in the search row. The name and the cross are
 * in the foreground because the category colour on its own wash fails 4.5:1
 * for seven of the eight tints (Olcay, 2026-09-21).
 *
 * Mirrors `KozmosCategoryField` on iOS and Compose.
 */
const CategoryField = React.forwardRef<HTMLDivElement, CategoryFieldProps>(
  (
    {
      className,
      label,
      count,
      tint = {
        accent: "var(--primitives-colors-theme-500)",
        fill: "var(--components-primary-buttons-themed-button-background-idle)",
        onFill:
          "var(--components-primary-buttons-themed-button-foreground-content-idle)",
      },
      icon,
      clearLabel = "Clear category",
      onClear,
      countLabel = (n) => `${n} places`,
      style,
      trailing,
      rowClassName,
      ...props
    },
    ref,
  ) => {
    const field = (
      <div
        ref={ref}
        role="group"
        aria-label={
          count === undefined ? label : `${label}, ${countLabel(count)}`
        }
        className={cn(
          "kozmos-reset kozmos-category-field flex h-12 min-w-0 items-center gap-2 rounded-control border pl-3 pr-0.5 text-foreground",
          // In a row the field takes what is left; `min-w-0` is already on it,
          // so a long category name truncates instead of widening the row.
          trailing && "w-auto flex-1",
          className,
        )}
        style={
          {
            "--kozmos-category-tint": tint.accent,
            borderColor: "var(--kozmos-category-tint)",
            background:
              "color-mix(in srgb, var(--kozmos-category-tint) 12%, transparent)",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center [&>svg]:h-7 [&>svg]:w-7 [&>img]:h-7 [&>img]:w-7"
            style={{ color: "var(--kozmos-category-tint)" }}
          >
            {icon}
          </span>
        )}
        <span className="min-w-0 truncate text-[15px] font-semibold">
          {label}
        </span>
        {count !== undefined && (
          <span
            className="inline-flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded-pill px-1.5 text-xs font-semibold"
            style={{ background: tint.fill, color: tint.onFill }}
            aria-label={countLabel(count)}
          >
            {count}
          </span>
        )}
        <span className="flex-1" />
        {/* The clear: a 32 circle to see, the 44 button around it to hit, as
          the search bar's (Olcay, 2026-09-21). The field's trailing padding
          is 2, so the circle sits 8 from the edge, where the prototype
          measured it; the focus ring is the circle's. */}
        <button
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
          className="kozmos-reset group flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-transparent p-0 text-current focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill group-focus-visible:ring-2 group-focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </span>
        </button>
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
CategoryField.displayName = "CategoryField";
export { CategoryField };
