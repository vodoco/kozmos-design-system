import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { describe, it, expect } from "vitest";

describe("Sidebar", () => {
  it("renders correctly", () => {
    render(<Sidebar>Content</Sidebar>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders slotted sidebar regions", () => {
    render(
      <Sidebar
        footer={<span>Account</span>}
        header={<span>Workspace</span>}
        navigation={<a href="#">Explore</a>}
        tools={<button type="button">Settings</button>}
      />,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(
      screen.getByText("Workspace").closest('[data-slot="sidebar-header"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Explore").closest('[data-slot="sidebar-navigation"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Settings").closest('[data-slot="sidebar-tools"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Account").closest('[data-slot="sidebar-footer"]'),
    ).toBeInTheDocument();
  });

  it("supports rail variant state", () => {
    render(<Sidebar variant="rail">Rail content</Sidebar>);

    expect(screen.getByText("Rail content").closest("aside")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("is a 96px rail on the surface, its edge at the inline end", () => {
    // Decision 42: rail items fill their rail, so the rail's navigation
    // spans all of its 96px; the header and footer stay centred.
    render(<Sidebar variant="rail" navigation={<span>Explore</span>} />);

    const aside = screen.getByText("Explore").closest("aside");
    expect(aside).toHaveClass("w-24", "bg-surface-0", "border-e");
    expect(aside).not.toHaveClass("w-20", "px-2", "border-r");
    expect(
      screen.getByText("Explore").closest('[data-slot="sidebar-navigation"]'),
    ).toHaveClass("self-stretch");
  });

  it("draws the expanded sidebar's edge at the inline end too", () => {
    render(<Sidebar navigation={<span>Explore</span>} />);

    const aside = screen.getByText("Explore").closest("aside");
    expect(aside).toHaveClass("w-64", "px-4", "border-e");
    expect(aside).not.toHaveClass("border-r");
  });
});
