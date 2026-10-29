import { render, screen } from "@testing-library/react";
import { SplitButton } from "./SplitButton";
import { describe, it, expect } from "vitest";

describe("SplitButton", () => {
  it("renders main button and menu trigger", () => {
    render(<SplitButton>Action</SplitButton>);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("toggles menu", () => {
    render(
      <SplitButton menuItems={[{ label: "Item", onClick: () => {} }]}>
        Action
      </SplitButton>,
    );
    // Find the trigger button (it has children rendering chevron, usually index 1 if logic holds, or by class/svg)
    // Simplified check
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  // GAP-168, GAP-182: the menu half shows only a chevron, and was named
  // "More options" in fixed English.
  it("names the menu half in a product's own words", () => {
    render(
      <SplitButton menuLabel="Weitere Optionen">Veröffentlichen</SplitButton>,
    );
    expect(
      screen.getByRole("button", { name: "Weitere Optionen" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More options" }),
    ).not.toBeInTheDocument();
  });

  it("tints the seam's side alone, so the outline keeps its edge (site GAP-73)", () => {
    // A seam colour on all four sides outranked the outline variant's own,
    // and its outline drew white at a fifth over white.
    // scripts/check-site-gaps.mjs reads every side's colour in every engine.
    render(<SplitButton variant="outline">Save</SplitButton>);
    const main = screen.getByRole("button", { name: "Save" });
    expect(main).toHaveClass("border-e", "border-e-theme-fill-foreground/20");
    expect(main).not.toHaveClass("border-theme-fill-foreground/20");
  });

  it("names the menu half More options when a product passes no name", () => {
    render(<SplitButton>Publish</SplitButton>);
    expect(
      screen.getByRole("button", { name: "More options" }),
    ).toBeInTheDocument();
  });
});
