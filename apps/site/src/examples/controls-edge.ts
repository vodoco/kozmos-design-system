import { useCallback, useState } from "react";
import type { AdaptiveMapLayoutSnapshot } from "@kozmos-ds/react";

/**
 * The inline edge the map shell sets its controls against: across the map
 * from a side panel — the inline start, since these examples leave the
 * panel at the end — and the inline end over a bottom sheet, where a thumb
 * reaches (AdaptiveMapShell, `controlsOnLeft`).
 *
 * The shell anchors its controls there but does not say which edge it is
 * (GAP-92), so an example with a column of controls reads the presentation
 * from `onLayoutChange` and lines the column up on that edge. A control that
 * widens to say its new mode then grows away from the edge, and the floor
 * selector above it stays where it was.
 */
export function useControlsEdge() {
  const [edge, setEdge] = useState<"start" | "end">("start");
  const onLayoutChange = useCallback(
    (layout: AdaptiveMapLayoutSnapshot) =>
      setEdge(layout.presentation === "bottom" ? "end" : "start"),
    [],
  );
  return { edge, onLayoutChange };
}
