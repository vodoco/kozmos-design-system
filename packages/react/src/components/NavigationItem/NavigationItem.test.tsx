import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NavigationItem, navigationItemVariants } from "./NavigationItem";

/**
 * Decision 42: the rail is the dashboard side menu's. An item fills its rail
 * (96px), padded 16px by 8px, its 24px icon 6px above an 11px regular label
 * on 14px lines that wraps to two and grows the item. At rest it is the muted
 * foreground; selected, primary on theme/0's tint with a 2px primary bar on
 * its inline end. The browser check measures all of it in three engines;
 * these pin the classes and the bar that draw it.
 */
describe("NavigationItem rail item", () => {
  const rail = (density: "default" | "compact") =>
    navigationItemVariants({ placement: "rail", density }).split(/\s+/);

  it("fills its rail, with no width or height of its own, in either density", () => {
    // The fixed 72px and 64px tiles are retired. `compact` stays a valid
    // density, because top and side items use it, and a rail item draws the
    // same with it as without it.
    for (const density of ["default", "compact"] as const) {
      expect(rail(density), density).toContain("w-full");
      for (const fixed of ["w-[72px]", "w-16", "min-h-[72px]", "min-h-16"])
        expect(rail(density), density).not.toContain(fixed);
    }
    expect(rail("compact")).toEqual(rail("default"));
  });

  it("is padded 16px by 8px, its icon 6px above its label", () => {
    render(
      <NavigationItem icon={<svg />} placement="rail">
        Settings
      </NavigationItem>,
    );
    const item = screen.getByRole("button", { name: "Settings" });
    expect(item).toHaveClass("py-4", "px-2", "gap-1.5");
    expect(item).not.toHaveClass("py-2", "py-1.5", "gap-1");
    expect(item.querySelector("[aria-hidden]")).toHaveClass("h-6", "w-6");
  });

  it("sets its label 11px on 14px lines at regular weight, up to two lines", () => {
    render(
      <NavigationItem icon={<svg />} placement="rail">
        SDK Configuration
      </NavigationItem>,
    );
    const item = screen.getByRole("button", { name: "SDK Configuration" });
    expect(item).toHaveClass("text-[11px]", "font-normal");
    expect(item).not.toHaveClass("font-medium");
    expect(screen.getByText("SDK Configuration")).toHaveClass(
      "line-clamp-2",
      "text-balance",
      "leading-[14px]",
    );
  });

  it("is the muted foreground at rest, with no fill and no bar", () => {
    render(
      <NavigationItem icon={<svg />} placement="rail">
        Home
      </NavigationItem>,
    );
    const item = screen.getByRole("button", { name: "Home" });
    expect(item).toHaveClass("text-muted-foreground");
    expect(item).not.toHaveClass("text-foreground", "bg-muted");
    expect(
      item.querySelector('[data-slot="navigation-item-indicator"]'),
    ).toBeNull();
  });

  it("selected, is primary on the theme/0 tint with a 2px bar at its inline end", () => {
    for (const props of [{ selected: true }, { state: "selected" as const }]) {
      const { unmount } = render(
        <NavigationItem icon={<svg />} placement="rail" {...props}>
          Search
        </NavigationItem>,
      );
      const item = screen.getByRole("button", { name: "Search" });
      expect(item).toHaveClass(
        "bg-[var(--primitives-colors-theme-0)]",
        "text-primary",
      );
      expect(item).not.toHaveClass("bg-muted");
      const bar = item.querySelector('[data-slot="navigation-item-indicator"]');
      // `end-0` is the inline end: the right in LTR, the left in RTL.
      expect(bar).toHaveClass(
        "absolute",
        "inset-y-0",
        "end-0",
        "w-0.5",
        "bg-primary",
      );
      expect(bar).toHaveAttribute("aria-hidden", "true");
      unmount();
    }
  });

  it("is square, and rings its focus inside itself", () => {
    // Full width in a rail that scrolls, an outside ring would be clipped.
    render(
      <NavigationItem focusVisible icon={<svg />} placement="rail">
        Settings
      </NavigationItem>,
    );
    const item = screen.getByRole("button", { name: "Settings" });
    expect(item).toHaveClass(
      "rounded-none",
      "ring-inset",
      "ring-offset-0",
      "focus-visible:ring-inset",
      "focus-visible:ring-offset-0",
    );
    expect(item).not.toHaveClass("rounded-control", "ring-offset-2");
  });

  it("leaves top and side items as they were", () => {
    // Holds before the change and after it.
    render(
      <>
        <NavigationItem placement="side" selected>
          Overview
        </NavigationItem>
        <NavigationItem placement="top">Explore</NavigationItem>
      </>,
    );
    const side = screen.getByRole("button", { name: "Overview" });
    expect(side).toHaveClass(
      "rounded-control",
      "font-medium",
      "bg-muted",
      "text-primary",
      "px-3",
      "py-2",
      "text-sm",
    );
    expect(
      side.querySelector('[data-slot="navigation-item-indicator"]'),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Explore" })).toHaveClass(
      "rounded-control",
      "text-foreground",
      "px-3",
      "py-2",
    );
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

describe("NavigationItem asChild", () => {
  it("draws the item on its one child, a router's link, with the icon, label and badge inside it", () => {
    render(
      <NavigationItem
        asChild
        content="badge"
        icon={<svg data-testid="icon" />}
        badge={3}
        selected
      >
        <a href="/home">Home</a>
      </NavigationItem>,
    );
    const link = screen.getByRole("link", { name: /Home/ });
    expect(link.getAttribute("href")).toBe("/home");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-selected")).toBe("true");
    expect(link.className).toContain("rounded");
    expect(link.contains(screen.getByTestId("icon"))).toBe(true);
    expect(link.textContent).toBe("Home3");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the child's own handler and runs the item's", () => {
    const onChild = vi.fn();
    const onItem = vi.fn();
    render(
      <NavigationItem asChild onClick={onItem}>
        <a href="#settings" onClick={onChild}>
          Settings
        </a>
      </NavigationItem>,
    );
    screen.getByRole("link", { name: "Settings" }).click();
    expect(onChild).toHaveBeenCalledTimes(1);
    expect(onItem).toHaveBeenCalledTimes(1);
  });
});
