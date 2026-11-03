import { fireEvent, render, screen, within } from "@testing-library/react";
import type {
  POIAction,
  POIDetailsPresentation,
  POIPresentation,
} from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { POIDetailPanel } from "./POIDetailPanel";

// GAP-130: the product hands the visitor to its own app from the card's own
// action row, with its own words and icon, rather than from an outline Button
// drawn under the card.
const labels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};

const poi: POIPresentation = {
  id: "gate-b12",
  name: "Gate B12",
  media: [],
  actions: ["navigate", "share"],
};

const details: POIDetailsPresentation = {
  supplementaryActions: [{ action: "call", label: "Call" }],
  hostActions: [
    {
      id: "open-in-app",
      label: "Get live directions in Pointr Express",
      iconName: "phone",
    },
    { id: "feedback", label: "Report a problem" },
  ],
};

describe("POIDetailPanel's host actions (GAP-130)", () => {
  it("draws them after the supplementary actions, in the order given, in the same strip", () => {
    render(
      <POIDetailPanel
        poi={poi}
        details={details}
        actionLabels={labels}
        onAction={vi.fn()}
        onSupplementaryAction={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    const strip = screen.getByRole("group", { name: "Place actions" });
    expect(
      within(strip)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual([
      "Go",
      "Share",
      "Call",
      "Get live directions in Pointr Express",
      "Report a problem",
    ]);
    const handOff = within(strip).getByRole("button", {
      name: "Get live directions in Pointr Express",
    });
    expect(handOff).toHaveClass("kozmos-poi-action");
    expect(handOff).not.toHaveClass("kozmos-poi-action-primary");
    // Its icon leads, and is not read: the label is the action.
    const icon = handOff.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(handOff.firstElementChild).toBe(icon);
    expect(
      within(strip)
        .getByRole("button", { name: "Report a problem" })
        .querySelector("svg"),
    ).toBeNull();
  });

  it("reports the pressed action's id and the POI's, apart from the panel's own handlers", () => {
    const onAction = vi.fn();
    const onSupplementaryAction = vi.fn();
    const onHostAction = vi.fn();
    render(
      <POIDetailPanel
        poi={poi}
        details={details}
        actionLabels={labels}
        onAction={onAction}
        onSupplementaryAction={onSupplementaryAction}
        onHostAction={onHostAction}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Get live directions in Pointr Express",
      }),
    );
    expect(onHostAction).toHaveBeenCalledTimes(1);
    expect(onHostAction).toHaveBeenCalledWith("open-in-app", "gate-b12");
    expect(onAction).not.toHaveBeenCalled();
    expect(onSupplementaryAction).not.toHaveBeenCalled();
  });

  it("draws the strip for host actions alone", () => {
    render(
      <POIDetailPanel
        poi={{ ...poi, actions: [] }}
        details={{ hostActions: details.hostActions }}
        actionLabels={labels}
        onAction={vi.fn()}
        onHostAction={vi.fn()}
      />,
    );
    expect(
      within(screen.getByRole("group", { name: "Place actions" })).getAllByRole(
        "button",
      ),
    ).toHaveLength(2);
  });

  it("draws them disabled without a handler, and honours disabled and loading", () => {
    const { rerender } = render(
      <POIDetailPanel
        poi={poi}
        details={details}
        actionLabels={labels}
        onAction={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Get live directions in Pointr Express",
      }),
    ).toBeDisabled();

    const onHostAction = vi.fn();
    rerender(
      <POIDetailPanel
        poi={poi}
        details={{
          hostActions: [
            { id: "open-in-app", label: "Open in app", disabled: true },
            { id: "feedback", label: "Report a problem" },
          ],
        }}
        actionLabels={labels}
        onAction={vi.fn()}
        onHostAction={onHostAction}
        hostActionStates={{ feedback: { loading: true } }}
      />,
    );
    for (const name of ["Open in app", "Report a problem"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(onHostAction).not.toHaveBeenCalled();
  });

  it("says a host action's message after the panel's own, politely or as an alert", () => {
    render(
      <POIDetailPanel
        poi={poi}
        details={details}
        actionLabels={labels}
        onAction={vi.fn()}
        onHostAction={vi.fn()}
        actionStates={{ share: { message: "Link copied." } }}
        hostActionStates={{
          "open-in-app": {
            message: "Pointr Express is not installed.",
            messageTone: "error",
          },
          feedback: { message: "Thanks for telling us." },
        }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Pointr Express is not installed.",
    );
    expect(
      screen.getAllByRole("status").map((node) => node.textContent),
    ).toEqual(["Link copied.", "Thanks for telling us."]);
  });
});
