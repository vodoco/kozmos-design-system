import "react";

// Lets `style` pass CSS custom properties — the one thing the site's rule
// allows it to carry — without a cast (scripts/check-ds-only.mjs).
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
