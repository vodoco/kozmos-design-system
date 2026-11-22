import figma from "@figma/code-connect";
import { EmptyState } from "../EmptyState/EmptyState";
import { POIResultList, type POIResultListProps } from "./POIResultList";

const poiResultListUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8171";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const items: POIResultListProps["items"];
declare const selectedPoiId: POIResultListProps["selectedPoiId"];
declare const selectPoi: POIResultListProps["onSelect"];

// Empty's EmptyState is drawn only by a mapping, which Code Connect does not
// collect imports from: it is listed here.
figma.connect(POIResultList, poiResultListUrl, {
  imports: ["import { POIResultList, EmptyState } from '@kozmos-ds/react';"],
  props: {
    resultCountLabel: figma.string("Result Count Text"),
    emptyState: figma.enum("Content", {
      Basic: undefined,
      Selected: undefined,
      Empty: <EmptyState title="No results" />,
    }),
  },
  example: ({ resultCountLabel, emptyState }) => (
    <POIResultList
      items={items}
      resultCountLabel={resultCountLabel}
      selectedPoiId={selectedPoiId}
      onSelect={(poiId) => selectPoi(poiId)}
      emptyState={emptyState}
      label="Search results"
    />
  ),
});
