import type { ReactNode } from "react";
import { Box, Separator } from "@kozmos-ds/react";

/**
 * One of the home page's full-width bands, plain or muted. A muted band is
 * tinted and has a hairline at each edge: in the dark theme its tint is
 * 1.04:1 against the page, and the hairlines are what set it apart. They are
 * Separators because the provider's preflight zeroes a box's own border
 * (GAPS.md, GAP-52). The last band above the footer leaves out its bottom
 * hairline: the footer's own rule is that edge, and two would run parallel.
 */
export function Band({
  muted = false,
  last = false,
  children,
}: {
  muted?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  if (!muted) return <Box className="site-band">{children}</Box>;
  return (
    <>
      <Separator />
      <Box className="site-band site-band-muted">{children}</Box>
      {last ? null : <Separator />}
    </>
  );
}
