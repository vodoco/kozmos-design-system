import { useState } from "react";
import { Box, POIDetailPanel, Text } from "@kozmos-ds/react";
import type {
  POIAction,
  POISupplementaryAction,
} from "@kozmos-ds/product-contracts";
import { bookshop, bookshopDetails } from "../sample-data";
import type { DemoModule } from "../types";
import { bookshopMedia } from "./poi-media-gallery";

const actionLabels: Record<POIAction, string> = {
  navigate: "Directions",
  favourite: "Save",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};

function Inline() {
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState(
    "The actions report to onAction with the place’s id.",
  );
  return (
    <Box className="site-demo-column">
      <POIDetailPanel
        poi={bookshop}
        details={bookshopDetails}
        actionLabels={actionLabels}
        actionStates={{
          favourite: {
            pressed: saved,
            message: saved ? "Saved to your places" : undefined,
          },
        }}
        onAction={(action, poiId) => {
          if (action === "favourite") setSaved((value) => !value);
          setNote(`${actionLabels[action]} · ${poiId}`);
        }}
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

const supplementaryLabels: Record<POISupplementaryAction, string> = {
  book: "Reserve a copy",
  call: "Call the shop",
};

function Panel() {
  const [note, setNote] = useState(
    "A panel with photos, a close button and supplementary actions.",
  );
  return (
    <Box className="site-demo-column">
      <POIDetailPanel
        presentation="panel"
        servicesHeading="Services"
        tagsLabel="Labels"
        accessRestrictionsHeading="Access"
        actionsLabel="Actions for the bookshop"
        poi={{
          ...bookshop,
          media: bookshopMedia,
          accessRestrictions: "present",
          accessRestrictionsLabel: "Staff only after 20:00",
        }}
        details={{
          ...bookshopDetails,
          openingHours: bookshopDetails.openingHours
            ? { ...bookshopDetails.openingHours, label: "Hours" }
            : undefined,
          description: {
            preview:
              "New and second-hand books, with a reading corner by the window.",
            full: "New and second-hand books, with a reading corner by the window. Author events on Thursdays; the café serves until 19:30.",
          },
          supplementaryActions: [
            { action: "book", label: supplementaryLabels.book },
            { action: "call", label: supplementaryLabels.call },
          ],
        }}
        actionLabels={actionLabels}
        supplementaryActionStates={{
          call: {
            disabled: true,
            message: "Closed now",
            messageTone: "status",
          },
        }}
        onAction={(action) => setNote(`${actionLabels[action]}.`)}
        onSupplementaryAction={(action) =>
          setNote(`${supplementaryLabels[action]}.`)
        }
        onClose={() => setNote("Closed.")}
        closeLabel="Back to the list"
      />
      <Text size="sm" color="muted" aria-live="polite">
        {note}
      </Text>
    </Box>
  );
}

export const demos: DemoModule["demos"] = [
  {
    title: "The bookshop, inline",
    description:
      "A POIPresentation and its POIDetailsPresentation: travel estimate, summary, opening hours, services and tags. actionStates presses, disables, loads and messages each action.",
    Component: Inline,
  },
  {
    title: "As a panel, with photos and a longer read",
    description:
      "presentation=panel paints a surface with a close button; the description folds behind Read more; supplementary actions sit under the main ones. Its headings are props, so a second panel on the same page names its regions differently.",
    Component: Panel,
  },
];
