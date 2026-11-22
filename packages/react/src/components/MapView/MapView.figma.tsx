import figma from "@figma/code-connect";
import { MapOverlay, type MapOverlayProps } from "../MapOverlay/MapOverlay";
import { MapView } from "./MapView";

const mapViewUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1340-6854";

// What the caller supplies, typed from the component's own props so the
// example type-checks against it; Code Connect renders the name as written.
declare const overlayContent: MapOverlayProps["children"];

// Overlay's MapOverlay is drawn only by a mapping, which Code Connect does not
// collect imports from: it is listed here.
figma.connect(MapView, mapViewUrl, {
  imports: ["import { MapView, MapOverlay } from '@kozmos-ds/react';"],
  props: {
    children: figma.enum("Content", {
      Empty: undefined,
      Overlay: <MapOverlay position="top-left">{overlayContent}</MapOverlay>,
    }),
  },
  // The canvas itself is renderer output; attribution comes from the adapter.
  example: ({ children }) => <MapView mapLabel="Venue map">{children}</MapView>,
});
