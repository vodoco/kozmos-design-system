import { useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import {
  POIResultList,
  ThemeProvider,
  type POIResultListItem,
} from "@kozmos-ds/react";

/**
 * Interaction scenarios for scripts/check-react-interactions.mjs, built from
 * the package's public entry, never its source. The script mounts one per
 * page with `window.interactions.mount(name)` and drives it through the
 * handles each scenario leaves on `window.interactions`.
 */
type Handles = Record<string, (...args: never[]) => void>;

declare global {
  interface Window {
    interactions: {
      mount: (name: string) => void;
    } & Handles;
  }
}

const result = (id: string, index: number): POIResultListItem => {
  const poi: POIPresentation = {
    id,
    name: `Place ${index}`,
    floorId: "2",
    floorLabel: "Second floor",
    media: [],
    actions: ["navigate"],
  };
  return {
    poi,
    result: {
      poiId: id,
      resultIndex: index,
      selected: false,
      featured: false,
      floorId: "2",
    },
  };
};
const results = Array.from({ length: 12 }, (_, index) =>
  result(`poi-${index}`, index),
);

/**
 * F2: the list mounts with a selection and no results, as when a pin's tap
 * comes before the search has answered, in a 240px box that scrolls.
 */
function LateResults({ reveal: initialReveal }: { reveal: boolean }) {
  const [items, setItems] = useState<readonly POIResultListItem[]>([]);
  const [reveal, setReveal] = useState(initialReveal);
  Object.assign(window.interactions, {
    deliver: (count = results.length) => setItems(results.slice(0, count)),
    // A product that builds its items in render: a new array, the same results.
    rebuild: () =>
      setItems((current) => current.map((entry) => ({ ...entry }))),
    reveal: (on = true) => setReveal(on),
  });
  return (
    <div
      data-testid="scroller"
      style={{ height: 240, overflowY: "auto", width: 360 }}
    >
      <POIResultList
        items={items}
        onSelect={() => undefined}
        resultCountLabel={`${items.length} results`}
        scrollSelectedIntoView={reveal}
        selectedPoiId="poi-9"
      />
    </div>
  );
}

const scenarios: Record<string, () => ReactElement> = {
  "late-results": () => <LateResults reveal />,
  "reveal-later": () => <LateResults reveal={false} />,
};

window.interactions = {
  mount(name) {
    const scenario = scenarios[name];
    if (!scenario) throw new Error(`No scenario "${name}"`);
    createRoot(document.getElementById("fixture")!).render(
      <ThemeProvider theme="light">{scenario()}</ThemeProvider>,
    );
  },
};
