import React from "react";
import { LinkExternal01 } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { useKozmosAnalytics } from "../../utils/analytics";

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "default" | "subtle";
  /**
   * The link opens in a new tab (GAP-202, decision 122): `target="_blank"`
   * and `rel="noopener noreferrer"`, a caller's own `target` and `rel`
   * still winning; a new-tab icon at the link's inline end, sized and
   * coloured with its text, which never wraps onto a line of its own; and
   * `externalLabel`, read after the link's name.
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
    return (
      <a
        ref={ref}
        href={href}
        target={target ?? (external ? "_blank" : undefined)}
        rel={rel ?? (external ? "noopener noreferrer" : undefined)}
        onClick={(e) => {
          trackEvent("Link", "link_clicked", { href });
          onClick?.(e);
        }}
        className={cn(
          "font-medium hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-marker",
          variant === "default" && "text-primary",
          variant === "subtle" && "text-muted-foreground hover:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
        {external && (
          // A no-break space joins the icon to the link's last word, so the
          // icon never wraps onto a line alone, and is the gap before it. It
          // also parts the name from the announcement where WebKit runs a
          // visually hidden span into the text before it.
          <span className="kozmos-link-external">
            {"\u00a0"}
            <LinkExternal01
              aria-hidden="true"
              size="1em"
              className="kozmos-link-external-icon kozmos-rtl-mirror"
            />
            {externalLabel ? (
              <span className="kozmos-link-external-label">
                {externalLabel}
              </span>
            ) : null}
          </span>
        )}
      </a>
    );
  },
);
Link.displayName = "Link";

export { Link };
