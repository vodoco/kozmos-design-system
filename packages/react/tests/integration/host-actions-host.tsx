import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { POIDetailPanel, POIResultCard, ThemeProvider } from "@kozmos-ds/react";
import { Calendar } from "@kozmos-ds/icons";
import type {
  POIAction,
  POIHostActionPresentation,
  POIPresentation,
} from "@kozmos-ds/product-contracts";

/**
 * The product's own actions in the built package, for
 * scripts/check-host-actions.mjs (GAP-028, GAP-130): a selected result with
 * Go, Details and the product's two, and a details card whose strip ends with
 * the product's hand-off, each in a card of the given width and direction.
 * Every press is written to `window.hostActions.pressed`.
 */
interface Mount {
  part: "result" | "details";
  width: number;
  dir?: "ltr" | "rtl";
  /** The product's words, so a translation that wraps can be read. */
  labels?: string[];
}

const poi: POIPresentation = {
  id: "trattoria/1",
  name: "Trattoria Uno",
  categoryLabel: "Restaurant",
  floorLabel: "Level 2",
  media: [],
  actions: ["navigate", "favourite", "share", "order"],
};

const actionLabels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order ahead",
};

const pressed: string[] = [];
let root: Root | null = null;

function mount({ part, width, dir = "ltr", labels }: Mount) {
  pressed.length = 0;
  root?.unmount();
  root = createRoot(document.getElementById("fixture")!);
  const host = (ids: [string, string, string?], icons: [string, string?]) =>
    ids.map(
      (id, index): POIHostActionPresentation => ({
        id: id!,
        label: labels?.[index] ?? id!,
        iconName: icons[index],
        disabled: index === 2,
      }),
    );
  const onHostAction = (actionId: string, poiId: string) =>
    pressed.push(`${actionId} ${poiId}`);
  flushSync(() =>
    root!.render(
      <ThemeProvider theme="light" dir={dir}>
        <div style={{ width, padding: 16 }} id="frame">
          {part === "result" ? (
            <POIResultCard
              id="card"
              poi={poi}
              result={{
                poiId: poi.id,
                resultIndex: 1,
                selected: true,
                featured: false,
                actions: [
                  { action: "navigate", label: "Go", primary: true },
                  { action: "details", label: "Details" },
                ],
                hostActions: host(
                  ["reserve", "menu", "waitlist"],
                  ["calendar"],
                ),
              }}
              onSelect={() => pressed.push("select")}
              onAction={(action) => pressed.push(`action ${action}`)}
              onHostAction={onHostAction}
              hostActionIcons={{ calendar: Calendar }}
            />
          ) : (
            <POIDetailPanel
              id="card"
              poi={poi}
              actionLabels={actionLabels}
              onAction={(action) => pressed.push(`action ${action}`)}
              details={{
                supplementaryActions: [{ action: "call", label: "Call" }],
                hostActions: host(
                  ["open-in-app", "feedback", "later"],
                  ["map-01"],
                ),
              }}
              onSupplementaryAction={() => pressed.push("supplementary")}
              onHostAction={onHostAction}
            />
          )}
        </div>
      </ThemeProvider>,
    ),
  );
}

declare global {
  interface Window {
    hostActions: { mount: typeof mount; pressed: string[] };
  }
}
window.hostActions = { mount, pressed };
