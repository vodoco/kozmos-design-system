import figma from "@figma/code-connect";
import { MapControlsGroup } from "../MapControlsGroup/MapControlsGroup";
import {
  POIDetailPanel,
  type POIDetailPanelProps,
} from "../POIDetailPanel/POIDetailPanel";
import { SearchBar } from "../SearchBar/SearchBar";
import {
  AdaptiveMapShell,
  type AdaptiveMapShellProps,
} from "./AdaptiveMapShell";

const adaptiveMapShellUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-7985";

// What the caller supplies, typed from the components' own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const mapCanvas: AdaptiveMapShellProps["map"];
declare const poiDetailPanelProps: POIDetailPanelProps;

figma.connect(AdaptiveMapShell, adaptiveMapShellUrl, {
  props: {
    panelPlacement: figma.enum("PanelPlacement", {
      Start: "start",
      End: "end",
    }),
    panelLabel: figma.string("Panel Label Text"),
  },
  example: ({ panelPlacement, panelLabel }) => (
    <AdaptiveMapShell
      map={mapCanvas}
      mapLabel="Venue map"
      panel={<POIDetailPanel {...poiDetailPanelProps} />}
      panelLabel={panelLabel}
      panelPlacement={panelPlacement}
      controls={<MapControlsGroup />}
      topBar={<SearchBar />}
    />
  ),
});
