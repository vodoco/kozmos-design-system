import figma from "@figma/code-connect";
import { POIResultCard, type POIResultCardProps } from "./POIResultCard";

const poiResultCardUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8150";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const poi: POIResultCardProps["poi"];
declare const result: POIResultCardProps["result"];
declare const selectPoi: POIResultCardProps["onSelect"];
declare const runHostAction: NonNullable<POIResultCardProps["onHostAction"]>;

figma.connect(POIResultCard, poiResultCardUrl, {
  props: {
    featuredLabel: figma.enum("State", {
      Default: undefined,
      Selected: undefined,
      Featured: "Featured",
      Unavailable: undefined,
    }),
  },
  // State reads off result.selected, result.featured and result.available —
  // fields of the POIResultPresentation rather than props of their own. Host
  // Action is one of result.hostActions (GAP-028), which onHostAction runs.
  example: ({ featuredLabel }) => (
    <POIResultCard
      poi={poi}
      result={result}
      featuredLabel={featuredLabel}
      selectionLabel="Show on map"
      onSelect={(poiId) => selectPoi(poiId)}
      onHostAction={(actionId, poiId) => runHostAction(actionId, poiId)}
    />
  ),
});
