import { render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";
import { describe, it, expect } from "vitest";

describe("Navbar", () => {
  it("names the navigation landmark and keeps stateful slots mounted once", () => {
    render(
      <Navbar
        navigationLabel="Workspace navigation"
        navigation={<a href="/settings">Settings</a>}
        primaryAction={<button>Publish</button>}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Workspace navigation" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Publish" })).toHaveLength(1);
  });
  it("renders logo and content", () => {
    render(
      <Navbar logo={<span>Logo</span>}>
        <a href="#">Link</a>
      </Navbar>,
    );
    expect(screen.getByText("Logo")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
  });

  it("renders slotted navigation regions", () => {
    render(
      <Navbar
        account={<button type="button">Account</button>}
        context={<button type="button">Workspace</button>}
        logo={<span>Logo</span>}
        navigation={<a href="#">Explore</a>}
        primaryAction={<button type="button">Publish</button>}
        utilities={<button type="button">Notifications</button>}
      />,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(
      screen.getByText("Workspace").closest('[data-slot="navbar-context"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Publish")
        .closest('[data-slot="navbar-primary-action"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Explore").closest('[data-slot="navbar-navigation"]'),
    ).toBeInTheDocument();
  });

  it("keeps the legacy site slot as a context alias", () => {
    render(<Navbar site={<button type="button">Legacy Site</button>} />);

    expect(screen.getByText("Legacy Site")).toBeInTheDocument();
  });

  it("sets its navigation at the start, the centre or the end (GAP-196)", () => {
    const { rerender } = render(<Navbar navigation={<a href="#">Maps</a>} />);
    const nav = () => screen.getByRole("navigation");
    // The default keeps the bar as it was drawn: centred.
    expect(nav()).toHaveAttribute("data-align", "center");
    for (const align of ["start", "end", "center"] as const) {
      rerender(
        <Navbar navigation={<a href="#">Maps</a>} navigationAlign={align} />,
      );
      expect(nav()).toHaveAttribute("data-align", align);
      expect(nav()).toHaveClass("kozmos-navbar-navigation");
    }
  });
});
