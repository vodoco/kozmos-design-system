import React from "react";
import { AlertTriangle, Check } from "@kozmos-ds/icons";
import { cn } from "../../utils";
import { SpinnerArc } from "../Spinner/SpinnerArc";

export interface MapStatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * How the pill reads (decision 39). Written out rather than named, so the
   * variant-parity check can read the axis.
   *
   * - `neutral`: the words alone — "Walking improves accuracy".
   * - `progress`: the system's arc turning in the theme's blue — "Calculating
   *   Precise Position", "Preparing Content", "Calculating step-free route".
   * - `success`: a check, and the words, in the success colour —
   *   "Established", "Up-to-date".
   * - `danger`: a warning triangle in the danger colour; the words stay ink —
   *   "Failed to Calculate Precise Position".
   * - `warning`: the surface itself fills with the SDK's bright amber, and the
   *   mark and the words are dark on it — "Turn Back".
   *
   * The product chooses the tone and when it shows; the pill only draws it.
   */
  tone?: "neutral" | "progress" | "success" | "danger" | "warning";
  /**
   * Replaces the tone's own mark: "No Bluetooth" passes `BluetoothOff`. It is
   * drawn at 24px in the tone's colour and never announced — the words say it.
   * `null` draws no mark at all.
   */
  icon?: React.ReactNode;
  /**
   * How loudly a change is announced: Alert's and Notice's three values.
   *
   * `polite`, the default and right for every tone, is `role="status"`: read
   * when the screen reader next pauses, so a change of state never cuts across
   * a route instruction being read. `assertive` is `role="alert"`, for a state
   * that cannot wait; `off` announces nothing, for words said elsewhere.
   */
  live?: "off" | "polite" | "assertive";
}

const ROLE = { polite: "status", assertive: "alert" } as const;

const MARK: Partial<Record<string, React.ReactNode>> = {
  progress: <SpinnerArc />,
  success: <Check />,
  danger: <AlertTriangle />,
  warning: <AlertTriangle />,
};

/**
 * One map status: a compact pill over the map, in one of five tones (decision
 * 39). PositionStatus, Downloading Content and Turn Back are all this part,
 * and so is the step-free route being calculated (GAP-102).
 *
 * It wears the map controls' surface (decision 40): the page's own, opaque,
 * with the Control corner, no edge, the map controls' three shadows and the
 * SDK's 32px blur, at least 48px tall. The surface and the tones are owned CSS
 * (`styles/owned-map-controls.css`), keyed to `data-tone`.
 *
 * With no words it draws nothing and keeps its live region, so a product that
 * keeps it rendered where it shows has its first words read too.
 */
const MapStatusPill = React.forwardRef<HTMLDivElement, MapStatusPillProps>(
  (
    { className, tone = "neutral", icon, live = "polite", children, ...props },
    ref,
  ) => {
    const mark = icon === undefined ? MARK[tone] : icon;
    const says = children != null && children !== false && children !== "";
    return (
      <div
        ref={ref}
        // `kozmos-reset`, as the Button recipe carries it: without it the
        // scoped compiler defaults, nearer by scope, reset the elevation the
        // owned surface rule sets, and the pill cast no shadow.
        className={cn(says && "kozmos-reset kozmos-map-status-pill", className)}
        data-tone={tone}
        role={live === "off" ? undefined : ROLE[live]}
        {...props}
      >
        {says && mark != null && mark !== false && (
          <span
            aria-hidden="true"
            className="kozmos-reset kozmos-map-status-pill-mark"
          >
            {mark}
          </span>
        )}
        {says && (
          <span className="kozmos-reset kozmos-map-status-pill-words">
            {children}
          </span>
        )}
      </div>
    );
  },
);
MapStatusPill.displayName = "MapStatusPill";

export { MapStatusPill };
