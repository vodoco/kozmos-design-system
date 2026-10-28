import { fireEvent, render, screen, within } from "@testing-library/react";
import type {
  POIHostActionPresentation,
  POIPresentation,
  POIResultPresentation,
} from "@kozmos-ds/product-contracts";
import { Calendar } from "@kozmos-ds/icons";
import { describe, expect, it, vi } from "vitest";
import { POIResultCard } from "./POIResultCard";
import { POIResultList } from "../POIResultList";
import { AnalyticsProvider } from "../../utils/analytics";

// GAP-028: a product offers its own actions on a result, each with its own
// words and icon, beside the ones Kozmos names.
const poi: POIPresentation = {
  id: "trattoria/1",
  name: "Trattoria Uno",
  categoryLabel: "Restaurant",
  floorLabel: "Level 2",
  media: [],
  actions: ["navigate"],
};

const reserve: POIHostActionPresentation = {
  id: "reserve",
  label: "Reserve a table",
  iconName: "calendar",
};

const result: POIResultPresentation = {
  poiId: poi.id,
  resultIndex: 1,
  selected: true,
  featured: false,
  actions: [
    { action: "navigate", label: "Go", primary: true },
    { action: "details", label: "Details" },
  ],
  hostActions: [reserve, { id: "menu", label: "See the menu" }],
};

describe("POIResultCard's host actions (GAP-028)", () => {
  it("draws them after the card's own actions, in the order given, in the same row", () => {
    render(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={vi.fn()}
        onAction={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const row = screen.getByRole("group", { name: "Actions for this result" });
    expect(
      within(row)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Go", "Details", "Reserve a table", "See the menu"]);
    // A host action is outlined, never the filled primary.
    const reserveButton = within(row).getByRole("button", {
      name: "Reserve a table",
    });
    expect(reserveButton).toHaveAttribute("type", "button");
    expect(reserveButton.className).not.toContain("bg-primary");
  });

  it("draws the icon the product gave for its name before the label, hidden from screen readers, and none for a name it did not give", () => {
    render(
      <POIResultCard
        poi={poi}
        result={{
          ...result,
          hostActions: [
            reserve,
            { id: "x", label: "Odd", iconName: "nope" },
            // A registry name the product gave no icon for draws none on the web.
            { id: "share", label: "Share it", iconName: "share-01" },
            // An inherited name is never a component.
            { id: "proto", label: "Proto", iconName: "constructor" },
          ],
        }}
        hostActionIcons={{ calendar: Calendar }}
        onSelect={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const reserveButton = screen.getByRole("button", {
      name: "Reserve a table",
    });
    const icon = reserveButton.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("h-5", "w-5");
    expect(reserveButton.firstElementChild).toBe(icon);
    for (const name of ["Odd", "Share it", "Proto"])
      expect(
        screen.getByRole("button", { name }).querySelector("svg"),
      ).toBeNull();
  });

  it("draws no icon without hostActionIcons, only the words", () => {
    render(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const reserveButton = screen.getByRole("button", {
      name: "Reserve a table",
    });
    expect(reserveButton.querySelector("svg")).toBeNull();
    expect(reserveButton).toHaveTextContent("Reserve a table");
  });

  it("reports the pressed action's id and the POI's, never selecting, with one analytics event", () => {
    const onDispatch = vi.fn();
    const onSelect = vi.fn();
    const onAction = vi.fn();
    const onHostAction = vi.fn();
    const { unmount } = render(
      <AnalyticsProvider onDispatch={onDispatch}>
        <POIResultCard
          poi={poi}
          result={result}
          onSelect={onSelect}
          onAction={onAction}
          onHostAction={onHostAction}
        />
      </AnalyticsProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reserve a table" }));
    expect(onHostAction).toHaveBeenCalledTimes(1);
    expect(onHostAction).toHaveBeenCalledWith("reserve", poi.id);
    expect(onAction).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    unmount();
    const events = onDispatch.mock.calls.flatMap(([batch]) => batch);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      component: "POIResultCard",
      eventName: "poi_result_action",
      properties: {
        poiId: poi.id,
        resultIndex: 1,
        action: "host",
        hostActionId: "reserve",
      },
    });
  });

  it("draws them disabled without a handler, and keeps one marked disabled disabled", () => {
    const onDispatch = vi.fn();
    const onHostAction = vi.fn();
    const props = {
      poi,
      onSelect: vi.fn(),
      result: {
        ...result,
        hostActions: [reserve, { id: "menu", label: "Menu", disabled: true }],
      },
    };
    const { rerender, unmount } = render(
      <AnalyticsProvider onDispatch={onDispatch}>
        <POIResultCard {...props} />
      </AnalyticsProvider>,
    );
    const reserveButton = screen.getByRole("button", {
      name: "Reserve a table",
    });
    expect(reserveButton).toBeDisabled();
    fireEvent.click(reserveButton);
    rerender(
      <AnalyticsProvider onDispatch={onDispatch}>
        <POIResultCard {...props} onHostAction={onHostAction} />
      </AnalyticsProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Reserve a table" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(onHostAction).not.toHaveBeenCalled();
    unmount();
    expect(onDispatch).not.toHaveBeenCalled();
  });

  it("reveals them only on the selected, available result, and says the select row controls them", () => {
    const onlyHost = { ...result, actions: undefined };
    const { rerender } = render(
      <POIResultCard
        poi={poi}
        result={{ ...onlyHost, selected: false }}
        onSelect={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Reserve a table" }),
    ).not.toBeInTheDocument();
    // A result whose only actions are the product's still says they are there.
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    rerender(
      <POIResultCard
        poi={poi}
        result={onlyHost}
        onSelect={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const select = screen.getAllByRole("button")[0];
    expect(select).toHaveAttribute("aria-expanded", "true");
    const row = screen.getByRole("group", { name: "Actions for this result" });
    expect(select).toHaveAttribute("aria-controls", row.id);

    rerender(
      <POIResultCard
        poi={poi}
        result={{ ...onlyHost, available: false }}
        onSelect={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Reserve a table" }),
    ).not.toBeInTheDocument();
  });

  it("is reached by the keyboard, after the card's own actions", () => {
    render(
      <POIResultCard
        poi={poi}
        result={result}
        onSelect={vi.fn()}
        onAction={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>("button:not([disabled])"),
    ).filter((node) => node.tabIndex >= 0);
    expect(focusable.map((node) => node.textContent?.trim())).toEqual([
      expect.stringContaining("Trattoria Uno"),
      "Go",
      "Details",
      "Reserve a table",
      "See the menu",
    ]);
  });

  it("is handed on by POIResultList to its cards and its groups, with its icons", () => {
    const onHostAction = vi.fn();
    const member = (id: string) => ({
      poi: { ...poi, id, name: `Branch ${id}` },
      result: {
        ...result,
        poiId: id,
        hostActions: [
          { id: "reserve", label: `Reserve at ${id}`, iconName: "calendar" },
        ],
      },
    });
    render(
      <POIResultList
        resultCountLabel="2 results"
        onSelect={vi.fn()}
        onHostAction={onHostAction}
        hostActionIcons={{ calendar: Calendar }}
        items={[
          member("a"),
          {
            id: "group",
            label: "Two branches",
            items: [member("b")],
          },
        ]}
      />,
    );
    for (const name of ["Reserve at a", "Reserve at b"])
      expect(
        screen.getByRole("button", { name }).querySelector("svg"),
      ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reserve at a" }));
    fireEvent.click(screen.getByRole("button", { name: "Reserve at b" }));
    expect(onHostAction.mock.calls).toEqual([
      ["reserve", "a"],
      ["reserve", "b"],
    ]);
  });
});
