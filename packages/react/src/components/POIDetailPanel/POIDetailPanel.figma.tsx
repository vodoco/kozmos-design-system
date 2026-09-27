import figma from "@figma/code-connect";
import { POIDetailPanel, type POIDetailPanelProps } from "./POIDetailPanel";

const poiDetailPanelUrl =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8103";

// What the caller supplies, typed from the component's own props so the
// example type-checks against them; Code Connect renders the names as written.
declare const poi: POIDetailPanelProps["poi"];
declare const actionLabels: POIDetailPanelProps["actionLabels"];
declare const runAction: POIDetailPanelProps["onAction"];
declare const dismiss: NonNullable<POIDetailPanelProps["onClose"]>;

figma.connect(POIDetailPanel, poiDetailPanelUrl, {
  props: {
    presentation: figma.enum("Presentation", {
      Inline: "inline",
      Sheet: "sheet",
      Panel: "panel",
    }),
  },
  // poi is a POIPresentation from @kozmos-ds/product-contracts: the title,
  // subtitle and description shown in Figma are fields of it, not separate
  // props, so the example passes the object rather than the text bindings.
  example: ({ presentation }) => (
    <POIDetailPanel
      poi={poi}
      presentation={presentation}
      actionLabels={actionLabels}
      onAction={(action, poiId) => runAction(action, poiId)}
      onClose={() => dismiss()}
      closeLabel="Close"
    />
  ),
});
