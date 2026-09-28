import { fireEvent, render, screen } from "@testing-library/react";
import { BottomNavigation } from "./BottomNavigation";
import { Home01 as Home } from "@kozmos-ds/icons";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

describe("BottomNavigation", () => {
  it("renders items correctly", () => {
    render(
      <BottomNavigation
        items={[{ icon: <Home data-testid="icon" />, label: "Home" }]}
      />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("marks the current item as the page", () => {
    // Holds before the change and after it.
    render(
      <BottomNavigation
        items={[
          { icon: <Home data-testid="icon" />, label: "Home", active: true },
          { icon: <Home />, label: "Search" },
        ]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Bottom navigation" }),
    ).toHaveAttribute("data-slot", "bottom-navigation");
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps its own items, not the rail's", () => {
    // Decision 42: the rail took the dashboard side menu's design, and the
    // bar keeps its own. Its items share the bar, 6px in from their edges,
    // a selected one the muted fill with no bar, as before.
    render(
      <BottomNavigation
        items={[
          { icon: <Home />, label: "Home", active: true },
          { icon: <Home />, label: "Settings" },
        ]}
      />,
    );

    for (const name of ["Home", "Settings"]) {
      const item = screen.getByRole("button", { name });
      expect(item, name).not.toHaveAttribute("data-placement");
      expect(item, name).toHaveClass(
        "h-full",
        "w-auto",
        "flex-1",
        "min-h-16",
        "px-1.5",
        "py-1.5",
        "gap-1",
        "rounded-control",
      );
      expect(item, name).not.toHaveClass("w-full", "px-2", "py-4");
      expect(
        item.querySelector('[data-slot="navigation-item-indicator"]'),
        name,
      ).toBeNull();
    }
    expect(screen.getByRole("button", { name: "Home" })).toHaveClass(
      "bg-muted",
      "text-primary",
    );
    expect(screen.getByRole("button", { name: "Settings" })).toHaveClass(
      "text-foreground",
    );
  });

  it("keeps its 11px labels on 14px lines", () => {
    render(
      <BottomNavigation items={[{ icon: <Home />, label: "Settings" }]} />,
    );

    const item = screen.getByRole("button", { name: "Settings" });
    expect(item).toHaveClass("text-[11px]", "font-medium");
    expect(item).not.toHaveClass("text-xs");
    expect(screen.getByText("Settings")).toHaveClass(
      "line-clamp-2",
      "leading-[14px]",
    );
  });

  it("links, disables and counts as a navigation item does", () => {
    // Holds before the change and after it: the bar keeps what it had from
    // NavigationItem when it stops using it.
    const onClick = vi.fn();
    render(
      <BottomNavigation
        items={[
          { icon: <Home />, label: "Saved", href: "/saved" },
          { icon: <Home />, label: "Alerts", badge: "3" },
          { icon: <Home />, label: "Settings", disabled: true, onClick },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Saved" })).toHaveAttribute(
      "href",
      "/saved",
    );
    expect(screen.getByRole("button", { name: /Alerts/ })).toHaveTextContent(
      "Alerts3",
    );
    const disabled = screen.getByRole("button", { name: "Settings" });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    expect(disabled).toHaveAttribute("tabindex", "-1");
    fireEvent.click(disabled);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps its density's padding", () => {
    // Holds before the change and after it.
    render(
      <BottomNavigation
        density="default"
        items={[{ icon: <Home />, label: "Home" }]}
      />,
    );

    expect(screen.getByRole("button", { name: "Home" })).toHaveClass(
      "min-h-[72px]",
      "px-2",
      "py-2",
    );
  });
});
