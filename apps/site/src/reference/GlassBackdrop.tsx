import type { ReactNode } from "react";
import { Box } from "@kozmos-ds/react";

/** The category fills a backdrop can use. */
type Fill =
  | "blue"
  | "green"
  | "navy"
  | "orange"
  | "pink"
  | "red"
  | "turquoise"
  | "yellow";

/**
 * Colour for a glass part to sit on, so its blur and tint have something to
 * show: two of the category fills, one to each side, and the part centred
 * over them. `row` lays several parts side by side.
 */
export function GlassBackdrop({
  colours,
  row = false,
  children,
}: {
  colours: readonly [Fill, Fill];
  row?: boolean;
  children: ReactNode;
}) {
  return (
    <Box className="site-glass-stage">
      {colours.map((colour, index) => (
        <Box
          key={colour}
          className="site-blob"
          aria-hidden="true"
          style={{
            "--blob": `var(--semantics-category-fill-${colour})`,
            "--x": `${30 + index * 40}%`,
            "--y": "50%",
          }}
        />
      ))}
      <Box
        className={row ? "site-glass-card site-demo-row" : "site-glass-card"}
      >
        {children}
      </Box>
    </Box>
  );
}
