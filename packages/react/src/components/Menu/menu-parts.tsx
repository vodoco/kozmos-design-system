import React from "react";
import { LinkExternal01 } from "@kozmos-ds/icons";
import {
  MENU_EXTERNAL_END_CLASS,
  MENU_EXTERNAL_ICON_CLASS,
  MENU_EXTERNAL_LABEL,
  menuTargetKeepsTab,
} from "../../recipes/menu";

// The classes Menu's parts draw with, shared with ContextMenu's (GAP-155): a
// context menu is Menu's panel and rows, opened where it is asked for. They
// live in the shared recipe, which Vue's parts draw with too.
export {
  menuContentClass,
  menuIndicatorClass,
  menuIndicatorItemClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  menuShortcutClass,
  menuSubIconClass,
  menuSubTriggerClass,
} from "../../recipes/menu";

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
  if (menuTargetKeepsTab(target)) return children;
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
  label = MENU_EXTERNAL_LABEL,
}: {
  label?: string;
}) {
  return (
    <>
      {/* At the row's end, a gap from its words however narrow the menu,
          pointing to the end: mirrored right to left, as Link's is. */}
      <span className={MENU_EXTERNAL_END_CLASS} aria-hidden="true">
        <LinkExternal01
          aria-hidden="true"
          className={MENU_EXTERNAL_ICON_CLASS}
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
