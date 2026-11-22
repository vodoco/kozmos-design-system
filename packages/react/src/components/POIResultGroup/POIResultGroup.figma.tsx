import figma from "@figma/code-connect";
import { POIResultGroup, type POIResultGroupProps } from "./POIResultGroup";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const branches: POIResultGroupProps["items"];
declare const selectPoi: POIResultGroupProps["onSelect"];

/**
 * Figma Code Connect: POIResultGroup (GAP-206)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17557
 *
 * State is defaultExpanded: Collapsed shows the representative, Expanded
 * every branch. Hide Text is hideLabel. Show More Text is drawn from
 * showMoreLabel(hidden), a function of the count, so it is left to its
 * default here. Each member is a POIResultCard row from items.
 */
figma.connect(
  POIResultGroup,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17557",
  {
    props: {
      defaultExpanded: figma.enum("State", {
        Collapsed: undefined,
        Expanded: true,
      }),
      hideLabel: figma.string("Hide Text"),
    },
    example: ({ defaultExpanded, hideLabel }) => (
      <POIResultGroup
        items={branches}
        defaultExpanded={defaultExpanded}
        hideLabel={hideLabel}
        label="Starbucks"
        onSelect={(poiId) => selectPoi(poiId)}
      />
    ),
  },
);
