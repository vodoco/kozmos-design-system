import { fireEvent, render, screen } from "@testing-library/react";
import type { RouteOptionPresentation } from "@kozmos-ds/product-contracts";
import { describe, expect, it, vi } from "vitest";
import { RoutePreviewPanel } from "./RoutePreviewPanel";

const options: RouteOptionPresentation[] = [
  {
    id: "quickest",
    label: "Quickest",
    durationSeconds: 240,
    durationLabel: "4 min",
    distanceMetres: 150,
    distanceLabel: "150 m",
    preference: "quickest",
    selected: true,
    available: true,
  },
  {
    id: "step-free",
    label: "Step-free",
    durationSeconds: 360,
    durationLabel: "6 min",
    distanceMetres: 173,
    distanceLabel: "173 m",
    preference: "step-free",
    selected: false,
    available: true,
  },
];

describe("RoutePreviewPanel", () => {
  it("selects alternatives and continues with the selected stable ID", () => {
    const onSelect = vi.fn();
    const onContinue = vi.fn();
    render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={onContinue}
        onOptionSelect={onSelect}
        options={options}
        optionsCountLabel="2 route options"
        selectedRouteAnnouncement="Quickest route selected, 4 minutes."
        status="ready"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Step-free/ }));
    expect(onSelect).toHaveBeenCalledWith("step-free");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledWith("quickest");
    expect(screen.getByText("Quickest route selected, 4 minutes.")).toHaveClass(
      "sr-only",
    );
  });

  it("disables continuation while calculating", () => {
    render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={[]}
        status="calculating"
        statusContent="Calculating routes…"
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Calculating routes…");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
