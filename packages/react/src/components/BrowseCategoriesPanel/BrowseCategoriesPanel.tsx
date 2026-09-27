import React from "react";
import type { CategoryPresentation } from "@kozmos-ds/product-contracts";
import { cn } from "../../utils";
import { CategoryTile } from "../CategoryTile";
import type { CategoryTint } from "../CategoryTile/CategoryTint";

export interface BrowseCategoriesPanelProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  categories: readonly CategoryPresentation[];
  onSelect: (categoryId: string) => void;
  renderIcon: (category: CategoryPresentation) => React.ReactNode;
  /** A category's colours for its tile, or undefined for the theme's. */
  tint?: (category: CategoryPresentation) => CategoryTint | undefined;
  label?: string;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
}

const BrowseCategoriesPanel = React.forwardRef<
  HTMLElement,
  BrowseCategoriesPanelProps
>(
  (
    {
      className,
      categories,
      onSelect,
      renderIcon,
      tint,
      label = "Browse categories",
      search,
      actions,
      emptyState,
      ...props
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        aria-label={label}
        className={cn(
          "flex min-h-0 min-w-0 w-full flex-col bg-background text-foreground",
          className,
        )}
        {...props}
      >
        {(search || actions) && (
          <header className="flex items-center gap-2 border-b border-border p-4">
            {search && <div className="min-w-0 flex-1">{search}</div>}
            {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {categories.length === 0 ? (
            <div className="rounded-container border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              {emptyState}
            </div>
          ) : (
            // Four across, 8 apart, and rows 12 apart: the prototype's grid
            // (row-gap 12px, column-gap 8px, measured on 2026-09-22). The rows
            // were 8 apart until then.
            <ul className="m-0 grid list-none grid-cols-4 gap-x-2 gap-y-3 p-0">
              {categories.map((category) => (
                <li className="min-w-0" key={category.id}>
                  <CategoryTile
                    category={category}
                    icon={renderIcon(category)}
                    onSelect={onSelect}
                    tint={tint?.(category)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  },
);

BrowseCategoriesPanel.displayName = "BrowseCategoriesPanel";

export { BrowseCategoriesPanel };
