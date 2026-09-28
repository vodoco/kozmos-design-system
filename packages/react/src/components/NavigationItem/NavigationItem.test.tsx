import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavigationItem, navigationItemVariants } from "./NavigationItem";

/**
 * Decision 36 (row 25 / GAP-013): every rail tile's label is 11px on a 14px
 * line, up to two lines, in both densities — "one smaller size for every tile,
 * not some small some large" (decision 17). The tiles stay 72px wide (64
 * compact). The browser check measures the lines and the heights; these pin
 * the classes that draw them.
 */
describe("NavigationItem rail tile", () => {
  it("sets the label at 11px in both densities", () => {
    for (const density of ["default", "compact"] as const) {
      const classes = navigationItemVariants({
        placement: "rail",
        density,
      }).split(/\s+/);
      expect(classes, density).toContain("text-[11px]");
      expect(classes, density).not.toContain("text-xs");
    }
  });

  it("draws an 11px tile, whichever density it is given", () => {
    const { rerender } = render(
      <NavigationItem icon={<svg />} placement="rail">
        Settings
      </NavigationItem>,
    );
    const tile = screen.getByRole("button", { name: "Settings" });
    expect(tile).toHaveClass("text-[11px]", "w-[72px]", "min-h-[72px]");
    expect(tile).not.toHaveClass("text-xs");

    rerender(
      <NavigationItem density="compact" icon={<svg />} placement="rail">
        Settings
      </NavigationItem>,
    );
    expect(tile).toHaveClass("text-[11px]", "w-16", "min-h-16");
    expect(tile).not.toHaveClass("text-xs");
  });

  it("gives the label two balanced lines of 14px", () => {
    render(
      <NavigationItem icon={<svg />} placement="rail">
        SDK Configuration
      </NavigationItem>,
    );
    const label = screen.getByText("SDK Configuration");
    // 14px keeps a two-line tile 72px tall: 8 + 24 + 4 + 2 × 14 + 8. The
    // 16px line it had made it 76.
    expect(label).toHaveClass("line-clamp-2", "text-balance", "leading-[14px]");
    expect(label).not.toHaveClass("leading-4");
  });

  it("takes a dashboard rail's 96px from className, as the docs say", () => {
    // Holds before the change and after it: w-24 replaces the tile's own
    // width rather than losing to it, which is what makes the documented
    // `className="w-24"` work.
    render(
      <NavigationItem className="w-24" icon={<svg />} placement="rail">
        UI Translation Manager
      </NavigationItem>,
    );
    const tile = screen.getByRole("button", {
      name: "UI Translation Manager",
    });
    expect(tile).toHaveClass("w-24");
    expect(tile).not.toHaveClass("w-[72px]");
  });
});

describe("NavigationItem", () => {
  it("renders a selected navigation link", () => {
    render(
      <NavigationItem href="/explore" selected>
        Explore
      </NavigationItem>,
    );

    const item = screen.getByRole("link", { name: "Explore" });
    expect(item).toHaveAttribute("aria-current", "page");
    expect(item).toHaveAttribute("data-selected", "true");
  });

  it("renders a button when no href is provided", () => {
    render(<NavigationItem>Overview</NavigationItem>);

    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("prevents disabled anchor activation", () => {
    const onClick = vi.fn();
    render(
      <NavigationItem disabled href="/settings" onClick={onClick}>
        Settings
      </NavigationItem>,
    );

    const item = screen.getByRole("link", { name: "Settings" });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("href", "/settings");
    expect(item).toHaveAttribute("tabindex", "-1");
  });

  it("applies focus-visible styling when requested", () => {
    render(<NavigationItem focusVisible>Overview</NavigationItem>);

    expect(screen.getByRole("button", { name: "Overview" })).toHaveClass(
      "ring-2",
    );
  });

  it("supports rail icon-only items", () => {
    render(
      <NavigationItem
        aria-label="Search"
        content="icon-only"
        icon={<span data-testid="icon" />}
        placement="rail"
      />,
    );

    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "data-placement",
      "rail",
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("infers icon-label content when an icon is supplied", () => {
    render(
      <NavigationItem icon={<span data-testid="icon" />}>
        Overview
      </NavigationItem>,
    );

    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "data-content",
      "icon-label",
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("uses explicit content to decide which optional slots render", () => {
    render(
      <NavigationItem
        badge={<span data-testid="badge">3</span>}
        content="label"
        icon={<span data-testid="icon" />}
        trailing={<span data-testid="trailing" />}
      >
        Overview
      </NavigationItem>,
    );

    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "data-content",
      "label",
    );
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trailing")).not.toBeInTheDocument();
  });

  it("renders only the matching extra slot for badge and trailing content", () => {
    const { rerender } = render(
      <NavigationItem
        badge={<span data-testid="badge">3</span>}
        content="badge"
        icon={<span data-testid="icon" />}
        trailing={<span data-testid="trailing" />}
      >
        Notifications
      </NavigationItem>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.queryByTestId("trailing")).not.toBeInTheDocument();

    rerender(
      <NavigationItem
        badge={<span data-testid="badge">3</span>}
        content="trailing"
        icon={<span data-testid="icon" />}
        trailing={<span data-testid="trailing" />}
      >
        Settings
      </NavigationItem>,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });
});
