import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("gives a non-interactive icon badge nameable image semantics", () => {
    render(<Badge size="icon" icon={<span>✓</span>} aria-label="Verified" />);
    expect(screen.getByRole("img", { name: "Verified" })).toBeInTheDocument();
  });
  it("renders correctly", () => {
    render(<Badge>Test Content</Badge>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("hides the counter by default", () => {
    render(<Badge counter={2}>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("renders an opt-in counter", () => {
    render(
      <Badge counter={2} showCounter>
        New
      </Badge>,
    );

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("2")).toHaveAttribute("data-slot", "badge-counter");
  });

  // On the default Badge, itself the theme fill, the counter inverts: the
  // theme foreground with the fill's number (Olcay, 2026-10-07). `inverse`
  // was the surface, black in the dark. The destructive Badge keeps it.
  it("inverts the default badge's counter onto the theme foreground", () => {
    render(
      <Badge counter={2} showCounter>
        New
      </Badge>,
    );
    const counter = screen.getByText("2");
    expect(counter).toHaveClass("bg-theme-fill-foreground", "text-theme-fill");
    expect(counter).not.toHaveClass("bg-background");
    expect(counter).not.toHaveClass("text-foreground");
  });

  it("keeps the destructive badge's counter on the surface", () => {
    render(
      <Badge counter={2} showCounter variant="destructive">
        Closed
      </Badge>,
    );
    const counter = screen.getByText("2");
    expect(counter).toHaveClass("bg-background", "text-foreground");
    expect(counter).not.toHaveClass("bg-theme-fill-foreground");
  });

  it("normalizes legacy parenthesized counters", () => {
    render(
      <Badge counter="(2)" showCounter>
        New
      </Badge>,
    );

    expect(screen.getByText("2")).toHaveAttribute("data-slot", "badge-counter");
    expect(screen.queryByText("(2)")).not.toBeInTheDocument();
  });

  it("renders icon-sized badges from the icon slot", () => {
    render(
      <Badge icon={<span data-testid="badge-icon">ok</span>} size="icon">
        Text
      </Badge>,
    );

    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
    expect(screen.queryByText("Text")).not.toBeInTheDocument();
  });
});
