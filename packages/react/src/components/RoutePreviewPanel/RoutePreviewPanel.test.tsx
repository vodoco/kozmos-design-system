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

  it("tops up only its first row to what a map shell's panel leaves above it", () => {
    // Decision 14: hosted at the top of AdaptiveMapShell's panel, the
    // destination row tops its 16 up to what the panel leaves (owned CSS,
    // measured in scripts/check-adaptive-edge-cases.mjs). The options under
    // it sit under that row and keep their 16. A `p-4` or `pt-4` on the row
    // would outrank the owned rule.
    const { container } = render(
      <RoutePreviewPanel
        backLabel="Back"
        continueLabel="Continue"
        destinationName="Burger King"
        onBack={() => undefined}
        onContinue={() => undefined}
        onOptionSelect={() => undefined}
        options={options}
        status="ready"
      />,
    );
    const [row, body] = Array.from(
      container.querySelector("section")!.children,
    );
    expect(row.tagName).toBe("HEADER");
    expect(row.classList.contains("kozmos-route-preview-first-row")).toBe(true);
    expect(row.className).not.toMatch(/\b(p|pt|py)-/);
    expect(body.classList.contains("kozmos-route-preview-first-row")).toBe(
      false,
    );
    expect(body.className).toMatch(/\bp-4\b/);
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
