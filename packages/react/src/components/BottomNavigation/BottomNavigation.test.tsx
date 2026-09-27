import { render, screen } from "@testing-library/react";
import { BottomNavigation } from "./BottomNavigation";
import { Home01 as Home } from "@kozmos-ds/icons";
import { describe, it, expect } from "vitest";
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

  it("composes shared rail navigation items", () => {
    render(
      <BottomNavigation
        items={[
          { icon: <Home data-testid="icon" />, label: "Home", active: true },
        ]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Bottom navigation" }),
    ).toHaveAttribute("data-slot", "bottom-navigation");
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "data-placement",
      "rail",
    );
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
