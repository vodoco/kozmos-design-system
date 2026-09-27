import React from "react";
import type { CategoryPresentation } from "@kozmos-ds/product-contracts";
import { Counter } from "../Counter";
import type { CategoryTint } from "./CategoryTint";
import { cn } from "../../utils";

export interface CategoryTileProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onSelect"
> {
  category: CategoryPresentation;
  icon: React.ReactNode;
  onSelect: (categoryId: string) => void;
  /** The category's colours, as the chosen-category field wears them: the
   *  accent takes the icon and the selection's stroke, the inked fill the
   *  counter; the square stays neutral. */
  tint?: CategoryTint;
}

const CategoryTile = React.forwardRef<HTMLButtonElement, CategoryTileProps>(
  (
    {
      className,
      category,
      icon,
      onSelect,
      tint,
      type = "button",
      disabled: disabledProp,
      ...props
    },
    ref,
  ) => {
    const disabled = category.disabled || disabledProp;
    const tinted = tint
      ? ({
          "--kozmos-category-tint": tint.accent,
          color: "var(--kozmos-category-tint)",
          ...(category.selected
            ? {
                borderColor: "var(--kozmos-category-tint)",
                backgroundColor:
                  "color-mix(in srgb, var(--kozmos-category-tint) 5%, transparent)",
              }
            : {}),
        } as React.CSSProperties)
      : undefined;

    return (
      <button
        ref={ref}
        aria-pressed={category.selected}
        className={cn(
          "kozmos-category-tile flex w-full flex-col items-center gap-1.5 rounded-control bg-transparent p-1 text-center text-[11px] font-normal leading-[14px] text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-category-id={category.id}
        disabled={disabled}
        onClick={() => onSelect(category.id)}
        type={type}
        {...props}
      >
        {/* The icon's square: 64, radius Control, the container edge; the
            selection shows on it. The label sits under it, two lines at most.

            An img is sized like an svg, as CategoryField already does: a
            category symbol is the venue taxonomy's published artwork, which
            arrives as a URL rather than a component, and the PNG behind it is a
            2x asset — unsized it draws at its natural size and breaks the
            square. The comment stays out here on purpose: check-component-
            contracts matches `className={cn(` against the string that follows
            it, so a comment between them reads as a missing contract. */}
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-control border bg-background text-primary transition-colors [&>svg]:h-6 [&>svg]:w-6 [&>img]:h-6 [&>img]:w-6",
            category.selected
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border",
          )}
          style={tinted}
        >
          {icon}
          {category.resultCount !== undefined && (
            // The count: the system's counter, brand tone, four beyond the
            // square's top and right edges so the icon stays clear. An absolute
            // offset counts from inside the 1px border, so five here is four
            // past the visible edge.
            <Counter
              className="absolute -right-[5px] -top-[5px]"
              style={
                tint
                  ? { backgroundColor: tint.fill, color: tint.onFill }
                  : undefined
              }
              tone="brand"
            >
              {category.resultCount}
            </Counter>
          )}
        </span>
        {/* break-words lets a long Latin word wrap rather than overflow;
            break-keep stops CJK breaking mid-word, which is what line-clamp
            alone does to Japanese - "レストラン" split across two lines reads as
            two words that do not exist. Both, because a venue has categories
            in more than one script. */}
        <span className="line-clamp-2 max-w-full break-words [word-break:keep-all] text-balance">
          {category.label}
        </span>
        {category.resultCountLabel && (
          // The count's spoken form; the counter itself is drawn in the square.
          <span className="sr-only">{category.resultCountLabel}</span>
        )}
      </button>
    );
  },
);

CategoryTile.displayName = "CategoryTile";

export { CategoryTile };
