import { fireEvent, render, screen } from "@testing-library/react";
import type { POIAction, POIPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIDetailPanel } from "./POIDetailPanel";

/**
 * GAP-178, the owner's rule (21 Oct): an `iconUrl` that is unsafe or fails to
 * load falls back to the `iconName`'s icon, on all three platforms, as
 * Compose's always has. The web drew no icon at all in both cases, so a tag
 * with taxonomy artwork that failed lost the glyph its name still had. A
 * summary fact falls back to its kind's glyph in the same way.
 */
const labels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};

const poi: POIPresentation = {
  id: "terminal-cafe",
  name: "Terminal café",
  floorId: "1",
  floorLabel: "First floor",
  media: [],
  availability: "open",
  availabilityLabel: "Open",
  services: [
    {
      id: "phone",
      label: "Phone charging",
      iconName: "phone",
      iconUrl: "https://example.test/phone.png",
    },
  ],
  actions: ["navigate"],
};

function renderPanel() {
  return render(
    <POIDetailPanel
      poi={poi}
      actionLabels={labels}
      onAction={vi.fn()}
      details={{
        summary: [
          {
            id: "rating",
            kind: "rating",
            label: "Rating",
            value: "4.5",
            iconUrl: "javascript:alert(1)",
          },
        ],
        groups: [
          {
            id: "amenities",
            heading: "Amenities",
            items: [
              {
                id: "wifi",
                label: "Wireless network",
                iconName: "wifi",
                iconUrl: "https://example.test/wifi.png",
              },
            ],
          },
        ],
        tags: [
          {
            id: "lift",
            label: "Lift to every floor",
            iconName: "elevator-up",
            iconUrl: "http://example.test/lift.png",
          },
        ],
      }}
    />,
  );
}

const rowOf = (label: string) => screen.getByText(label).parentElement!;

describe("POIDetailPanel icon fallback (GAP-178)", () => {
  it("draws the iconName's icon where the iconUrl is unsafe", () => {
    renderPanel();
    const tag = rowOf("Lift to every floor");
    expect(tag.querySelector("img")).toBeNull();
    const icon = tag.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("width", "16");
  });

  it("draws the iconName's icon once a safe iconUrl fails to load", () => {
    const { container } = renderPanel();
    for (const label of ["Phone charging", "Wireless network"]) {
      const row = rowOf(label);
      const image = row.querySelector("img");
      expect(image, `${label} loads its asset first`).not.toBeNull();
      expect(
        row.querySelector("svg"),
        `${label} draws no glyph while it loads`,
      ).toBeNull();
      fireEvent.error(image!);
      expect(
        rowOf(label).querySelector("img"),
        `${label} keeps a failed image`,
      ).toBeNull();
      const icon = rowOf(label).querySelector("svg");
      expect(icon, `${label} falls back to its iconName`).not.toBeNull();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    expect(
      container.querySelectorAll(".kozmos-poi-property-icon"),
    ).toHaveLength(0);
  });

  it("draws a summary fact's kind glyph where its iconUrl is unsafe", () => {
    renderPanel();
    const fact = screen.getByText("4.5").closest(".kozmos-poi-summary-item")!;
    expect(fact.querySelector("img")).toBeNull();
    expect(fact.querySelector("svg")).toHaveAttribute("width", "20");
  });
});
