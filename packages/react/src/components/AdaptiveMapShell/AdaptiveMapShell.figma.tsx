import figma from "@figma/code-connect";
import { LogOut01 } from "@kozmos-ds/icons";
import { MapControlButton } from "../MapControlButton/MapControlButton";
import { MapControlsGroup } from "../MapControlsGroup/MapControlsGroup";
import { MapStatusPill } from "../MapStatusPill/MapStatusPill";
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
      controlsTopStart={
        <MapControlButton
          icon={<LogOut01 />}
          label="Exit building"
          presentation="labelled"
        />
      }
      status={<MapStatusPill tone="progress">Calculating route</MapStatusPill>}
      topBar={<SearchBar />}
    />
  ),
});
