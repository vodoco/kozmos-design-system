import { render, screen, waitFor } from "@testing-library/react";
import type { POIAction, POIPresentation } from "@kozmos-ds/product-contracts";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdaptiveMapShell } from "./AdaptiveMapShell/AdaptiveMapShell";
import { POIDetailPanel } from "./POIDetailPanel/POIDetailPanel";
import { RoutePreviewPanel } from "./RoutePreviewPanel/RoutePreviewPanel";
import { Spinner } from "./Spinner/Spinner";

// GAP-226: a screen reader says a change inside a live region that is
// already there, and may say nothing for a region inserted together with
// its words (GAP-224). Each part's `status` and `alert` box is mounted
// before its words arrive, empty, and the words are put into it: the box
// that holds them is the one that was there before them.

/** Every live region in the document, as it is now. */
const regions = () => [
  ...document.querySelectorAll<HTMLElement>('[role="status"],[role="alert"]'),
];

/** The live region that holds `words`; it must be one of `before`, and was empty then. */
function expectSaidInARegionMountedBefore(
  words: string,
  role: "status" | "alert",
  before: { node: HTMLElement; text: string }[],
) {
  const holder = regions().find(
    (node) =>
      node.getAttribute("role") === role && node.textContent?.includes(words),
  );
  expect(holder, `no ${role} region says "${words}"`).toBeTruthy();
  const was = before.find((entry) => entry.node === holder);
  expect(
    was,
    `the ${role} region saying "${words}" was inserted with it`,
  ).toBeTruthy();
  expect(was!.text, "the region already held words").toBe("");
  expect(holder).toHaveAttribute(
    "aria-live",
    role === "alert" ? "assertive" : "polite",
  );
}

const snapshot = () =>
  regions().map((node) => ({ node, text: node.textContent ?? "" }));

describe("live regions are mounted before their words (GAP-226)", () => {
  describe("RoutePreviewPanel", () => {
    const panel = (
      props: Partial<React.ComponentProps<typeof RoutePreviewPanel>>,
    ) => (
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={[]}
        status="ready"
        {...props}
      />
    );

    it("says a calculating status in the status region it already had", () => {
      const { rerender } = render(panel({}));
      const before = snapshot();
      rerender(
        panel({ status: "calculating", statusContent: "Calculating routes…" }),
      );
      expectSaidInARegionMountedBefore("Calculating routes…", "status", before);
    });

    it("says an error in the alert region it already had, after a status", () => {
      const { rerender } = render(
        panel({ status: "calculating", statusContent: "Calculating routes…" }),
      );
      const before = snapshot();
      rerender(panel({ status: "error", statusContent: "No route found." }));
      expectSaidInARegionMountedBefore("No route found.", "alert", before);
    });

    it("says its notice in the region it already had", () => {
      const { rerender } = render(panel({}));
      const before = snapshot();
      rerender(panel({ alert: "Lift out of service" }));
      expectSaidInARegionMountedBefore("Lift out of service", "status", before);
    });
  });

  describe("AdaptiveMapShell", () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
        390,
      );
      vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(
        600,
      );
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("says the map's status, then its error, in regions it already had", () => {
      const { rerender } = render(
        <AdaptiveMapShell map={<div />} mapStatus="ready" />,
      );
      const ready = snapshot();
      rerender(
        <AdaptiveMapShell
          map={<div />}
          mapStatus="loading"
          mapStatusContent="Loading the map"
        />,
      );
      expectSaidInARegionMountedBefore("Loading the map", "status", ready);
      const loading = snapshot();
      rerender(
        <AdaptiveMapShell
          map={<div />}
          mapStatus="error"
          mapStatusContent="The map could not load"
        />,
      );
      expectSaidInARegionMountedBefore(
        "The map could not load",
        "alert",
        loading,
      );
    });
  });

  describe("POIDetailPanel", () => {
    const labels: Record<POIAction, string> = {
      navigate: "Go",
      favourite: "Favourite",
      bookmark: "Bookmark",
      share: "Share",
      order: "Order",
    };
    const poi: POIPresentation = {
      id: "burger-king",
      name: "Burger King",
      floorId: "1",
      floorLabel: "First floor",
      media: [],
      actions: ["navigate", "share", "order"],
    };

    it("says an action's message, and its error, in regions it already had", () => {
      const { rerender } = render(
        <POIDetailPanel poi={poi} actionLabels={labels} onAction={vi.fn()} />,
      );
      const before = snapshot();
      rerender(
        <POIDetailPanel
          poi={poi}
          actionLabels={labels}
          onAction={vi.fn()}
          actionStates={{
            share: { message: "Link copied" },
            order: {
              message: "Ordering is unavailable.",
              messageTone: "error",
            },
          }}
        />,
      );
      expectSaidInARegionMountedBefore("Link copied", "status", before);
      expectSaidInARegionMountedBefore(
        "Ordering is unavailable.",
        "alert",
        before,
      );
    });
  });

  describe("Spinner", () => {
    // A spinner is mounted when a wait starts, so its region cannot be
    // there before it: it is mounted empty, and its words are put into it
    // after, which is what the first markup it is drawn with shows.
    it("is mounted with an empty status, and says its label after", async () => {
      expect(renderToStaticMarkup(<Spinner label="Saving" />)).not.toContain(
        "Saving",
      );
      render(<Spinner label="Saving" />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("");
      await waitFor(() => expect(status).toHaveTextContent("Saving"));
    });
  });
});
