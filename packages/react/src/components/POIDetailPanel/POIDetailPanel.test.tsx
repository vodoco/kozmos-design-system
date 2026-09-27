import { fireEvent, render, screen } from "@testing-library/react";
import type { POIAction, POIPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIDetailPanel } from "./POIDetailPanel";
import { POIDetailAssetIcon } from "./POIDetailContent";
import {
  restaurantDetails,
  restaurantPOI,
  entranceDetails,
  entrancePOI,
} from "./POIDetailPanel.fixtures";

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
  buildingLabel: "Building A",
  media: [],
  availability: "open",
  availabilityLabel: "Open",
  description: "Flame-grilled burgers, fries and shakes.",
  services: [{ id: "dine-in", label: "Dine-in" }],
  actions: ["navigate", "share", "order"],
};

describe("POIDetailPanel", () => {
  it("reveals focused buttons by scrolling only their action strip", () => {
    render(
      <POIDetailPanel poi={poi} actionLabels={labels} onAction={vi.fn()} />,
    );
    const strip = screen.getByRole("group", { name: "Place actions" });
    const share = screen.getByRole("button", { name: "Share" });
    const scrollBy = vi.fn();
    strip.scrollBy = scrollBy;
    vi.spyOn(strip, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 100,
    } as DOMRect);
    vi.spyOn(share, "getBoundingClientRect").mockReturnValue({
      left: 80,
      right: 140,
    } as DOMRect);
    fireEvent.focus(share);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 44, behavior: "auto" });
    vi.mocked(share.getBoundingClientRect).mockReturnValue({
      left: -20,
      right: 40,
    } as DOMRect);
    fireEvent.focus(share);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -24, behavior: "auto" });
  });
  it("names the scrollable action group and handles viewport keys without stealing button keys", () => {
    render(
      <POIDetailPanel
        poi={poi}
        actionLabels={labels}
        actionsLabel="Venue actions"
        onAction={vi.fn()}
      />,
    );
    const strip = screen.getByRole("group", { name: "Venue actions" });
    expect(strip).toHaveAttribute("tabindex", "0");
    Object.defineProperties(strip, {
      scrollWidth: { value: 600 },
      clientWidth: { value: 300 },
    });
    const scrollTo = vi.fn();
    strip.scrollTo = scrollTo;
    fireEvent.keyDown(strip, { key: "End" });
    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "auto" });
    scrollTo.mockClear();
    fireEvent.keyDown(screen.getByRole("button", { name: "Go" }), {
      key: "End",
    });
    expect(scrollTo).not.toHaveBeenCalled();
  });
  it("resets action scrolling on a different POI but preserves it on refresh", () => {
    const props = { actionLabels: labels, onAction: vi.fn() };
    const { rerender } = render(<POIDetailPanel {...props} poi={poi} />);
    const strip = screen.getByRole("group", { name: "Place actions" });
    strip.scrollLeft = 90;
    rerender(<POIDetailPanel {...props} poi={{ ...poi, name: "Updated" }} />);
    expect(screen.getByRole("group", { name: "Place actions" })).toBe(strip);
    expect(strip.scrollLeft).toBe(90);
    rerender(<POIDetailPanel {...props} poi={{ ...poi, id: "different" }} />);
    expect(screen.getByRole("group", { name: "Place actions" })).not.toBe(
      strip,
    );
    expect(
      screen.getByRole("group", { name: "Place actions" }).scrollLeft,
    ).toBe(0);
  });
  it.each([0, 1, 2, 3, 4])(
    "renders at most three metadata items from %i supplied",
    (count) => {
      const { container } = render(
        <POIDetailPanel
          poi={poi}
          actionLabels={labels}
          onAction={vi.fn()}
          details={{
            summary: Array.from({ length: count }, (_, i) => ({
              id: String(i),
              kind: "property",
              label: `Label ${i}`,
              value: `Value ${i}`,
            })),
          }}
        />,
      );
      expect(
        container.querySelectorAll("[data-slot=meta-strip-item]"),
      ).toHaveLength(Math.min(count, 3));
      expect(
        container
          .querySelector(".kozmos-poi-summary")
          ?.getAttribute("tabindex"),
      ).toBeFalsy();
      expect(screen.queryByText("Value 3")).not.toBeInTheDocument();
    },
  );
  it("keeps external icons decorative, rejects unsafe URLs and retries changed assets", () => {
    const { container, rerender } = render(
      <POIDetailAssetIcon src="https://example.test/icon.png" />,
    );
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden", "true");
    fireEvent.error(image);
    expect(container.querySelector("img")).toBeNull();
    rerender(<POIDetailAssetIcon src="/new-icon.png" />);
    expect(container.querySelector("img")).not.toBeNull();
    for (const src of [
      "javascript:alert(1)",
      "data:image/svg+xml,hi",
      "//evil.test/icon",
      "/\\evil.test/icon",
    ]) {
      rerender(<POIDetailAssetIcon src={src} />);
      expect(container.querySelector("img")).toBeNull();
    }
  });
  it("preserves tag text when the decorative asset fails", () => {
    const { container } = render(
      <POIDetailPanel
        poi={poi}
        actionLabels={labels}
        onAction={vi.fn()}
        details={{
          tags: [
            {
              id: "pay",
              label: "Apple Pay",
              iconUrl: "https://example.test/apple.png",
            },
          ],
        }}
      />,
    );
    fireEvent.error(container.querySelector(".kozmos-poi-property-icon")!);
    expect(screen.getByText("Apple Pay")).toBeVisible();
    expect(container.querySelector(".kozmos-poi-property-icon")).toBeNull();
  });
  it("masks only explicitly monochrome assets and removes a failed mask", () => {
    const { container, rerender } = render(
      <POIDetailAssetIcon src="https://example.test/icon.png" monochrome />,
    );
    expect(container.querySelector(".kozmos-poi-property-mask")).not.toBeNull();
    expect(container.querySelector("img")).toHaveAttribute(
      "crossorigin",
      "anonymous",
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector(".kozmos-poi-property-mask")).toBeNull();
    rerender(<POIDetailAssetIcon src="https://example.test/color.png" />);
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector(".kozmos-poi-property-mask")).toBeNull();
  });
  it("renders optional decorative attribute icons and preserves unknown-icon text", () => {
    render(
      <POIDetailPanel
        poi={poi}
        actionLabels={labels}
        onAction={vi.fn()}
        details={{
          groups: [
            {
              id: "amenities",
              heading: "Amenities",
              items: [
                { id: "wifi", label: "Wireless network", iconName: "wifi" },
                {
                  id: "future",
                  label: "Future amenity",
                  iconName: "not-a-registered-icon",
                },
                {
                  id: "inherited",
                  label: "Inherited property",
                  iconName: "constructor",
                },
              ],
            },
          ],
        }}
      />,
    );
    const wifi = screen.getByText("Wireless network").closest("li");
    expect(wifi?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(wifi?.querySelector("svg")).toHaveAttribute("width", "16");
    expect(
      screen.getByText("Future amenity").closest("li")?.querySelector("svg"),
    ).toBeNull();
    expect(
      screen
        .getByText("Inherited property")
        .closest("li")
        ?.querySelector("svg"),
    ).toBeNull();
  });
  it("keeps inactive save controls outlined", () => {
    render(
      <POIDetailPanel
        poi={restaurantPOI}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Favourite" })).toHaveClass(
      "kozmos-button-outline",
    );
  });
  it("retains shared metadata semantics without a redundant scroll tab stop", () => {
    const { container } = render(
      <POIDetailPanel
        poi={poi}
        actionLabels={labels}
        onAction={vi.fn()}
        details={{
          summary: [
            { id: "rating", kind: "rating", label: "Rating", value: "4.7 / 5" },
          ],
        }}
      />,
    );
    expect(container.querySelector(".kozmos-poi-summary")).toHaveAttribute(
      "data-slot",
      "meta-strip",
    );
    expect(container.querySelector(".kozmos-poi-summary")).not.toHaveAttribute(
      "tabindex",
    );
    expect(screen.getByText("Rating").tagName).toBe("DT");
  });
  it("resets scroll only when selecting a different place and forwards its ref", () => {
    let node: HTMLElement | null = null;
    const props = {
      actionLabels: labels,
      onAction: vi.fn(),
      ref: (element: HTMLElement | null) => {
        node = element;
      },
    };
    const { rerender } = render(<POIDetailPanel {...props} poi={poi} />);
    const article = screen.getByRole("article");
    expect(node).toBe(article);
    article.scrollTop = 300;
    rerender(
      <POIDetailPanel {...props} poi={{ ...poi, name: "Updated name" }} />,
    );
    expect(article.scrollTop).toBe(300);
    rerender(<POIDetailPanel {...props} poi={{ ...poi, id: "another" }} />);
    expect(article.scrollTop).toBe(0);
  });

  it("omits a broken logo and retries when its source changes", () => {
    const props = { actionLabels: labels, onAction: vi.fn() };
    const { rerender } = render(
      <POIDetailPanel
        {...props}
        poi={{ ...poi, logo: { src: "/bad-logo.png", alt: "Venue logo" } }}
      />,
    );
    fireEvent.error(screen.getByAltText("Venue logo"));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: poi.name })).toBeVisible();
    rerender(
      <POIDetailPanel
        {...props}
        poi={{ ...poi, logo: { src: "/replacement.png", alt: "Venue logo" } }}
      />,
    );
    expect(screen.getByAltText("Venue logo")).toHaveAttribute(
      "src",
      "/replacement.png",
    );
  });
  it("renders the restaurant's optional anatomy as semantic information", () => {
    render(
      <POIDetailPanel
        poi={restaurantPOI}
        details={restaurantDetails}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText("4.7 / 5")).toBeVisible();
    expect(screen.getByText("32 reviews")).toBeVisible();
    expect(screen.getByRole("region", { name: "Cuisines" })).toHaveTextContent(
      "Mediterranean",
    );
    expect(
      screen.queryByRole("button", { name: "Vegetarian" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Go 2 min/ })).toBeVisible();
    // No handler means no capability; never pretend that booking succeeded.
    expect(screen.getByRole("button", { name: "Book" })).toBeDisabled();
  });

  it("emits supplementary capabilities independently of legacy actions", () => {
    const onSupplementaryAction = vi.fn();
    render(
      <POIDetailPanel
        poi={restaurantPOI}
        details={restaurantDetails}
        actionLabels={labels}
        onAction={vi.fn()}
        onSupplementaryAction={onSupplementaryAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Book" }));
    expect(onSupplementaryAction).toHaveBeenCalledWith("book", "il-forno");
  });

  it("keeps favourite state controlled and labelled", () => {
    const onAction = vi.fn();
    render(
      <POIDetailPanel
        poi={restaurantPOI}
        actionLabels={labels}
        onAction={onAction}
        actionStates={{ favourite: { pressed: true } }}
      />,
    );
    const favourite = screen.getByRole("button", { name: "Favourite" });
    expect(favourite).toHaveAttribute("aria-pressed", "true");
    expect(favourite).toHaveClass(
      "kozmos-button-default",
      "kozmos-button-emotion-filled",
    );
    expect(favourite.querySelector("svg")).toHaveAttribute("fill", "none");
    fireEvent.click(favourite);
    expect(onAction).toHaveBeenCalledWith("favourite", "il-forno");
    expect(favourite).toHaveAttribute("aria-pressed", "true");
  });

  it("expands plain-text description and resets expansion on POI selection", () => {
    const props = {
      actionLabels: labels,
      onAction: vi.fn(),
      details: restaurantDetails,
    };
    const { rerender } = render(
      <POIDetailPanel {...props} poi={restaurantPOI} />,
    );
    const expand = screen.getByRole("button", { name: "Read more" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expand);
    expect(screen.getByRole("button", { name: "Read less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByText(restaurantDetails.description!.full!),
    ).toBeVisible();
    rerender(
      <POIDetailPanel {...props} poi={{ ...restaurantPOI, id: "other" }} />,
    );
    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("omits unavailable media, logos, ratings and irrelevant sections for an entrance", () => {
    render(
      <POIDetailPanel
        poi={entrancePOI}
        details={entranceDetails}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("Rating")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Cuisines" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Read more" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Access Programs" }),
    ).toHaveTextContent("TSA PreCheck");
  });

  it("does not infer availability or render empty groups or a false hours disclosure", () => {
    const { container } = render(
      <POIDetailPanel
        poi={{
          ...entrancePOI,
          availability: "unknown",
          availabilityLabel: "Hours unavailable",
        }}
        details={{
          groups: [{ id: "empty", heading: "Amenities", items: [] }],
          openingHours: {
            label: "Opening hours",
            summary: "Ask at reception",
            rows: [],
          },
        }}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(screen.queryByText("Open")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Amenities" }),
    ).not.toBeInTheDocument();
    expect(container.querySelector("summary")).toBeNull();
    expect(screen.getByText("Ask at reception")).toBeVisible();
  });

  it("renders a native labelled hours disclosure and respects heading level", () => {
    const { container } = render(
      <POIDetailPanel
        poi={restaurantPOI}
        details={restaurantDetails}
        titleLevel={3}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Il Forno", level: 3 }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Cuisines", level: 4 }),
    ).toBeVisible();
    expect(container.querySelector("details > summary")).toHaveTextContent(
      "Closes 12:30 pm",
    );
  });

  it("announces supplementary failures and disables in-progress actions", () => {
    render(
      <POIDetailPanel
        poi={restaurantPOI}
        details={restaurantDetails}
        actionLabels={labels}
        onAction={vi.fn()}
        onSupplementaryAction={vi.fn()}
        supplementaryActionStates={{
          book: {
            loading: true,
            message: "Could not book.",
            messageTone: "error",
          },
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Book" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Could not book.");
  });
  it("renders optional regions and emits typed actions", () => {
    const onAction = vi.fn();
    const onClose = vi.fn();
    render(
      <POIDetailPanel
        actionLabels={labels}
        onAction={onAction}
        onClose={onClose}
        poi={poi}
      />,
    );

    expect(screen.getByRole("heading", { name: "Burger King" })).toBeVisible();
    expect(screen.getByText("Open")).toBeVisible();
    expect(screen.getByText("Dine-in")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Order" }));
    expect(onAction).toHaveBeenCalledWith("order", poi.id);
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exposes loading, pressed, and action error states", () => {
    render(
      <POIDetailPanel
        actionLabels={labels}
        actionStates={{
          share: { loading: true },
          order: { message: "Ordering is unavailable.", messageTone: "error" },
        }}
        onAction={() => undefined}
        poi={poi}
      />,
    );

    expect(screen.getByRole("button", { name: "Share" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ordering is unavailable.",
    );
  });
});
