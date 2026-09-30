import React from "react";
import { cn } from "../../utils";
import { Link } from "../Link";
import { pointrLogo } from "./pointr-logo";

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

function safeLink(href?: string): string | undefined {
  if (!href) return undefined;
  try {
    const url = new URL(href);
    return ["https:", "http:"].includes(url.protocol) && url.hostname
      ? href
      : undefined;
  } catch {
    return undefined;
  }
}

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
      ...props
    },
    ref,
  ) => {
    const visibleBrand = showBrand && brand != null && brand !== false;
    if (!visibleBrand && credits.length === 0) return null;
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
      >
        {visibleBrand && (
          <div
            className={cn(
              "flex min-w-0 justify-center",
              credits.length > 0 && "mb-1",
            )}
          >
            {brand}
          </div>
        )}
        {credits.length > 0 && (
          <div className="kozmos-map-attribution-scroll" tabIndex={0}>
            <ul className="m-0 flex w-max min-w-full list-none items-center justify-center gap-x-1 p-0">
              {credits.map((credit) => {
                const href = safeLink(credit.href);
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
