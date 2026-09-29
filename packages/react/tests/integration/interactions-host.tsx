import { useState, type CSSProperties, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { POIPresentation } from "@kozmos-ds/product-contracts";
import {
  AICompanionPanel,
  AISearchButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  POIResultList,
  SegmentedControl,
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

/**
 * R1: a product holding the choice, starting with nothing chosen, as
 * `useState<string | undefined>()` does. The output says what the product
 * holds.
 */
function HeldChoice() {
  const [value, setValue] = useState<string | undefined>();
  return (
    <>
      <SegmentedControl
        items={[
          { value: "list", label: "List" },
          { value: "map", label: "Map" },
        ]}
        label="View"
        onValueChange={setValue}
        value={value}
      />
      <output data-testid="held">{value ?? "nothing"}</output>
    </>
  );
}

/**
 * R2: the assistant with a product's own key handler, which logs every key
 * and, when told to, keeps Escape for itself; and a draft field inside that
 * clears itself on Escape and says so, as a part with something of its own
 * to dismiss does.
 */
function AssistantEscape() {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [keys, setKeys] = useState<readonly string[]>([]);
  const [keepEscape, setKeepEscape] = useState(false);
  Object.assign(window.interactions, {
    keepEscape: (on = true) => setKeepEscape(on),
  });
  return (
    <div style={{ position: "relative", height: 400, width: 360 }}>
      <AICompanionPanel
        onClose={() => setOpen(false)}
        onKeyDown={(event) => {
          const { key } = event;
          setKeys((current) => [...current, key]);
          if (key === "Escape" && keepEscape) event.preventDefault();
        }}
        open={open}
      >
        <input
          aria-label="Draft"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !draft) return;
            event.preventDefault();
            setDraft("");
          }}
          value={draft}
        />
      </AICompanionPanel>
      <output data-testid="keys">{keys.join(" ")}</output>
    </div>
  );
}

type Placement = "cover" | "side" | "flow" | "fixed";

/** Where the panel is drawn: the placement its docs give, and three others. */
const placements: Record<Placement, CSSProperties> = {
  // `absolute inset-0` in its positioned frame, as AICompanionPanel.mdx has it.
  cover: { position: "absolute", inset: 0 },
  // Over half the frame: the other half is still there to use.
  side: { position: "absolute", top: 0, bottom: 0, right: 0, width: "50%" },
  // In flow, below the search, as the stories draw it in a frame of its own.
  flow: { height: 240 },
  // Over the whole viewport.
  fixed: { position: "fixed", inset: 0 },
};

/**
 * GAP-93: a phone's frame, the search beneath with its tiles and the AI
 * button, and the assistant over it; a toolbar before the frame and a link
 * after it, which are never covered.
 */
function AssistantCover({
  placement,
  mountOpen = false,
  focusUnderOnClose = false,
}: {
  placement: Placement;
  mountOpen?: boolean;
  /** onCloseAutoFocus puts focus on a tile the panel covered. */
  focusUnderOnClose?: boolean;
}) {
  const [open, setOpen] = useState(mountOpen);
  return (
    <>
      <button type="button">Toolbar</button>
      <div
        data-testid="frame"
        style={{
          position: "relative",
          width: 360,
          height: 560,
          overflow: "hidden",
          display: placement === "flow" ? "flex" : undefined,
          flexDirection: "column",
        }}
      >
        <div data-testid="search">
          <AISearchButton
            label="Ask the assistant"
            onClick={() => setOpen(true)}
          />
          <button type="button">Shops</button>
          <button type="button">Offices</button>
          <p aria-live="polite">3 places</p>
        </div>
        <AICompanionPanel
          onClose={() => setOpen(false)}
          onCloseAutoFocus={(event) => {
            if (!focusUnderOnClose) return;
            event.preventDefault();
            Array.from(
              document.querySelectorAll<HTMLButtonElement>(
                '[data-testid="search"] button',
              ),
            )
              .find((button) => button.textContent === "Shops")
              ?.focus();
          }}
          open={open}
          style={{ ...placements[placement], background: "white" }}
        >
          <input aria-label="Ask" />
          <Menu>
            <MenuTrigger asChild>
              <button type="button">Suggestions</button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem>Nearest restroom</MenuItem>
            </MenuContent>
          </Menu>
        </AICompanionPanel>
      </div>
      <button type="button">After the frame</button>
    </>
  );
}

const scenarios: Record<string, () => ReactElement> = {
  "late-results": () => <LateResults reveal />,
  "reveal-later": () => <LateResults reveal={false} />,
  "held-choice": () => <HeldChoice />,
  "assistant-escape": () => <AssistantEscape />,
  "assistant-cover": () => <AssistantCover placement="cover" />,
  "assistant-cover-focus-under": () => (
    <AssistantCover focusUnderOnClose placement="cover" />
  ),
  "assistant-cover-mounted-open": () => (
    <AssistantCover mountOpen placement="cover" />
  ),
  "assistant-side": () => <AssistantCover placement="side" />,
  "assistant-flow": () => <AssistantCover placement="flow" />,
  "assistant-fixed": () => <AssistantCover placement="fixed" />,
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
