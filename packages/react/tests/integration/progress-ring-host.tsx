import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  Progress,
  Text,
  ThemeProvider,
  type ProgressProps,
} from "@kozmos-ds/react";

/**
 * Progress's ring in the built package, for scripts/check-progress-ring.mjs
 * (decision 131, GAP-038): one ring on the page of a provider of the given
 * theme and direction, with the Level Manager's "11 Levels Added in total"
 * as its centre label when asked.
 */
interface Mount {
  theme: "light" | "dark";
  dir?: "ltr" | "rtl";
  size?: ProgressProps["size"];
  value: number | null;
  max?: number;
  /**
   * "levels" is the Level Manager's two lines in the hole; "beside" its
   * design beside the ring, Heading 4's size over xs muted; a string is
   * drawn as given.
   */
  label?: "levels" | "beside" | string;
  labelPlacement?: ProgressProps["labelPlacement"];
  tone?: ProgressProps["tone"];
  ariaLabel?: string;
  /** Read "11 of 15" rather than Radix's percentage. */
  countLabel?: boolean;
  /** Inside the config's reduced motion, as a DesignConfig provider marks it. */
  configReduced?: boolean;
}

let root: Root | null = null;
let last: Mount | null = null;
function mount(options: Mount) {
  last = options;
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  flushSync(() => root!.render(<Fixture {...options} />));
}

/** The same ring at another value, without remounting it. */
function update(value: number | null) {
  flushSync(() => root!.render(<Fixture {...last!} value={value} />));
}

function Fixture({
  theme,
  dir = "ltr",
  size = "lg",
  value,
  max = 100,
  label,
  labelPlacement,
  tone,
  ariaLabel,
  countLabel,
  configReduced = false,
}: Mount) {
  return (
    <ThemeProvider theme={theme}>
      <div
        id="surface"
        dir={dir}
        className="bg-background"
        style={{ padding: 24, width: 320 }}
        data-kozmos-motion={configReduced ? "reduced" : undefined}
      >
        <Progress
          id="ring"
          shape="circular"
          size={size}
          value={value}
          max={max}
          aria-label={ariaLabel}
          labelPlacement={labelPlacement}
          tone={tone}
          getValueLabel={
            countLabel ? (now, total) => `${now} of ${total}` : undefined
          }
          label={
            label === "levels" ? (
              <>
                <Text size="3xl" weight="semibold" align="center">
                  11
                </Text>
                <Text size="xs" color="muted" align="center">
                  Levels Added in total
                </Text>
              </>
            ) : label === "beside" ? (
              <>
                <Text size="xl" weight="bold">
                  2 Levels
                </Text>
                <Text size="xs" color="muted">
                  Added in total
                </Text>
              </>
            ) : (
              label
            )
          }
        />
      </div>
    </ThemeProvider>
  );
}

declare global {
  interface Window {
    progressRing: { mount: typeof mount; update: typeof update };
  }
}
window.progressRing = { mount, update };
