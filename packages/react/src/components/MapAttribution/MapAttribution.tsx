import React from "react";
import { cn } from "../../utils";
import { Link } from "../Link";
import { safeHref } from "../../utils/safe-href";
import { pointrLogo } from "./pointr-logo";
import { MapShellAttributionCompactContext } from "../AdaptiveMapShell/map-shell-attribution";

/** Presentation data supplied by the host, in display order. IDs must be unique. */
export interface MapAttributionCredit {
  id: string;
  label: string;
  /** Absolute HTTP(S) destination. Unsupported URLs render as plain text. */
  href?: string;
}

export interface MapAttributionProps extends React.HTMLAttributes<HTMLElement> {
  credits: readonly MapAttributionCredit[];
  /** Replaces the bundled Pointr logo. Custom content owns accessibility and sizing. */
  brand?: React.ReactNode;
  /** Controls branding only, never the supplied credits. */
  showBrand?: boolean;
  /** Map uses transparent, haloed credits; surface uses an opaque themed background. */
  appearance?: "map" | "surface";
  /** Localized accessible name of the attribution region. */
  label?: string;
}

const useLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
// React 19 reads `inert` as a boolean; React 18 passes it on as a string.
const inert = (
  parseInt(React.version) > 18 ? { inert: true } : { inert: "" }
) as object;
/** Laid out where it would be drawn, but unseen and out of reach. */
const measuredOnly: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  visibility: "hidden",
};

/**
 * Provider-neutral map credits with independently optional branding.
 * No SDK detection, provider wording, dates or persistence are owned here.
 */
export const MapAttribution = React.forwardRef<
  HTMLElement,
  MapAttributionProps
>(
  (
    {
      credits,
      brand = (
        <img
          src={pointrLogo}
          alt="Pointr"
          width={98}
          height={34}
          className="h-auto max-w-full"
        />
      ),
      showBrand = true,
      appearance = "map",
      label = "Map attribution",
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // In a map shell with no room for the whole attribution, the brand goes
    // first: the credits are what a map provider's licence asks for
    // (decision 58).
    const compact = React.useContext(MapShellAttributionCompactContext);
    const hasBrand = showBrand && brand != null && brand !== false;
    const hasCredits = credits.length > 0;
    // The brand's box, which the shell measures to know whether the whole
    // attribution fits. Given way, it stays laid out at the width it would
    // have, out of flow, unseen and out of reach, so the shell can tell when
    // it fits again (GAP-135). With no credits it is the whole attribution.
    const brandBox = {
      "data-kozmos-attribution-brand": "",
      ...(compact && { "aria-hidden": true, ...inert }),
    };
    // The credits are one line that scrolls sideways when it is longer than
    // the space. Only then is it a tab stop, so that a keyboard can scroll it;
    // a line that fits would be an unnamed stop that does nothing. It is taken
    // out explicitly, since Firefox makes any scroll box with overflow a stop,
    // and the line's underline ink overflows it by a pixel.
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [overflows, setOverflows] = React.useState(false);
    useLayoutEffect(() => {
      const node = scrollRef.current;
      if (!node) return;
      const measure = () =>
        setOverflows(node.scrollWidth > node.clientWidth + 1);
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const sizes = new ResizeObserver(measure);
      sizes.observe(node);
      if (node.firstElementChild) sizes.observe(node.firstElementChild);
      return () => sizes.disconnect();
    }, [hasCredits]);
    if (!hasBrand && !hasCredits) return null;
    return (
      <section
        ref={ref}
        aria-label={label}
        data-appearance={appearance}
        className={cn(
          "kozmos-map-attribution max-w-full min-w-0 rounded-control text-center text-foreground",
          appearance === "surface" ? "bg-background p-2" : "px-2 pt-2",
          className,
        )}
        {...props}
        {...(!hasCredits && brandBox)}
        style={!hasCredits && compact ? { ...style, ...measuredOnly } : style}
      >
        {hasBrand && (
          <div
            className={cn("flex min-w-0 justify-center", hasCredits && "mb-1")}
            {...(hasCredits && brandBox)}
            style={
              hasCredits && compact
                ? {
                    ...measuredOnly,
                    paddingLeft: "inherit",
                    paddingRight: "inherit",
                  }
                : undefined
            }
          >
            {brand}
          </div>
        )}
        {hasCredits && (
          <div
            ref={scrollRef}
            className="kozmos-map-attribution-scroll"
            {...(overflows
              ? { tabIndex: 0, role: "group", "aria-label": label }
              : { tabIndex: -1 })}
          >
            <ul className="m-0 flex w-max min-w-full list-none items-center justify-center gap-x-1 p-0">
              {credits.map((credit) => {
                const href = safeHref(credit.href);
                return (
                  <li key={credit.id} className="shrink-0 whitespace-nowrap">
                    {href ? (
                      <Link
                        href={href}
                        className="inline-flex items-center justify-center whitespace-nowrap text-foreground underline"
                      >
                        <bdi>{credit.label}</bdi>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center">
                        <bdi>{credit.label}</bdi>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    );
  },
);
MapAttribution.displayName = "MapAttribution";
