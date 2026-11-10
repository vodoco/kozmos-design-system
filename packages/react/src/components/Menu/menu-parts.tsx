import React from "react";
import { LinkExternal01 } from "@kozmos-ds/icons";

// The classes Menu's parts draw with, shared with ContextMenu's (GAP-155): a
// context menu is Menu's panel and rows, opened where it is asked for.

export const menuContentClass =
  "z-50 min-w-32 overflow-hidden rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

export const menuSubTriggerClass =
  "flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent";

export const menuItemClass =
  "relative flex cursor-default select-none items-center rounded-marker px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

/** A checkbox or radio item: its indicator sits in the inset at its start. */
export const menuIndicatorItemClass =
  "relative flex cursor-default select-none items-center rounded-marker py-1.5 ps-8 pe-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export const menuIndicatorClass =
  "absolute start-2 flex h-3.5 w-3.5 items-center justify-center";

export const menuLabelClass = "px-2 py-1.5 text-sm font-semibold";

export const menuSeparatorClass = "-mx-1 my-1 h-px bg-border";

export const menuShortcutClass = "ms-auto text-xs tracking-widest opacity-50";

export const menuSubIconClass = "kozmos-rtl-mirror ms-auto h-4 w-4";

export interface MenuItemExternalProps {
  /**
   * The item opens a page in a new tab, as Link's `external` (GAP-202,
   * decision 152): the new-tab icon at the item's inline end, and
   * `externalLabel` read after its name. With `asChild` around an `<a>`, the
   * link gets `target="_blank"` and `rel="noopener noreferrer"`, its own
   * `target` and `rel` still winning; a `target` that keeps it in this tab
   * (`_self`, `_parent`, `_top`) opens no new tab, so it adds none of these.
   * Without `asChild`, opening the page is `onSelect`'s.
   */
  external?: boolean;
  /**
   * What a screen reader hears after the item's name when `external`:
   * "Documentation opens in a new tab". English by default; pass the
   * product's own words. Empty, it says nothing more.
   */
  externalLabel?: string;
}

// A target that keeps the page in this tab, as Link reads it. An empty
// target is this tab too.
const SAME_TAB = /^(?:_self|_parent|_top)?$/i;

/**
 * An item's children with `external`'s icon and words, and, around a
 * caller's `<a>` (`asChild`), the link that opens the new tab.
 */
export function externalItemChildren({
  external,
  externalLabel,
  asChild,
  children,
}: MenuItemExternalProps & {
  asChild?: boolean;
  children?: React.ReactNode;
}): React.ReactNode {
  if (!external) return children;
  const decoration = (
    <ExternalDecoration key="kozmos-external" label={externalLabel} />
  );
  if (!asChild) {
    return (
      <>
        {children}
        {decoration}
      </>
    );
  }
  if (!React.isValidElement<ChildLinkProps>(children)) return children;
  const { target, rel } = children.props;
  if (target != null && SAME_TAB.test(target)) return children;
  return React.cloneElement(
    children,
    {
      target: target ?? "_blank",
      rel: rel ?? "noopener noreferrer",
    },
    children.props.children,
    decoration,
  );
}

interface ChildLinkProps {
  target?: string;
  rel?: string;
  children?: React.ReactNode;
}

function ExternalDecoration({
  label = "opens in a new tab",
}: {
  label?: string;
}) {
  return (
    <>
      {/* At the row's end, a gap from its words however narrow the menu,
          pointing to the end: mirrored right to left, as Link's is. */}
      <span className="ms-auto flex shrink-0 ps-2" aria-hidden="true">
        <LinkExternal01
          aria-hidden="true"
          className="kozmos-rtl-mirror h-4 w-4"
          data-kozmos-menu-external=""
        />
      </span>
      {label ? (
        // A no-break space parts the name from the words, where WebKit runs
        // a visually hidden span into the word before it, as Link's does.
        <span className="sr-only">
          {"\u00a0"}
          {label}
        </span>
      ) : null}
    </>
  );
}
