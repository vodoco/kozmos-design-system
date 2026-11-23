import React from "react";
import { LinkExternal01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import {
  LINK_EXTERNAL_CLASS,
  LINK_EXTERNAL_ICON_CLASS,
  LINK_EXTERNAL_JOINER,
  LINK_EXTERNAL_LABEL_CLASS,
  LINK_NEW_TAB_REL,
  LINK_NEW_TAB_TARGET,
  linkClasses,
  linkOpensNewTab,
} from "../../recipes/link";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "default" | "subtle";
  /**
   * The link opens in a new tab (GAP-202, decision 122): `target="_blank"`
   * and `rel="noopener noreferrer"`, a caller's own `target` and `rel`
   * still winning; a new-tab icon at the link's inline end, sized and
   * coloured with its text, which never wraps onto a line of its own; and
   * `externalLabel`, read after the link's name. A caller's `target` that
   * keeps it in this tab (`_self`, `_parent`, `_top`) opens no new tab, so
   * it adds none of these.
   */
  external?: boolean;
  /**
   * What a screen reader hears after the link's name when `external`:
   * "Privacy Policy opens in a new tab". English by default; pass the
   * product's own words. An `aria-label` on the link replaces its content,
   * this announcement with it, so include it there.
   */
  externalLabel?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      className,
      variant = "default",
      external = false,
      externalLabel = "opens in a new tab",
      onClick,
      href,
      target,
      rel,
      children,
      ...props
    },
    ref,
  ) => {
    const { trackEvent } = useKozmosAnalytics();
    const newTab = linkOpensNewTab(external, target);
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? (newTab ? LINK_NEW_TAB_TARGET : undefined)}
        rel={rel ?? (newTab ? LINK_NEW_TAB_REL : undefined)}
        onClick={(e) => {
          trackEvent("Link", "link_clicked", { href });
          onClick?.(e);
        }}
        className={cn(...linkClasses(variant), className)}
        {...props}
      >
        {children}
        {newTab && (
          // The no-break space joins the icon to the link's last word
          // (LINK_EXTERNAL_JOINER).
          <span className={LINK_EXTERNAL_CLASS}>
            {LINK_EXTERNAL_JOINER}
            <LinkExternal01
              aria-hidden="true"
              size="1em"
              className={LINK_EXTERNAL_ICON_CLASS}
            />
            {externalLabel ? (
              <span className={LINK_EXTERNAL_LABEL_CLASS}>{externalLabel}</span>
            ) : null}
          </span>
        )}
      </a>
    );
  },
);
Link.displayName = "Link";

export { Link };
