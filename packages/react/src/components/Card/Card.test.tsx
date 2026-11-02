import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardDescription, CardHeader, CardTitle } from "./Card";

describe("Card", () => {
  it("renders correctly", () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("puts actions at the header's end, after the title and description (GAP-169)", () => {
    render(
      <Card>
        <CardHeader actions={<button type="button">Edit site</button>}>
          <CardTitle>Boston Logan Airport</CardTitle>
          <CardDescription>3 buildings</CardDescription>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByRole("heading", { name: "Boston Logan Airport" });
    const header = title.parentElement!.parentElement!;
    const actions = screen.getByRole("button", {
      name: "Edit site",
    }).parentElement!;
    expect(header).toHaveClass("kozmos-card-header", "p-6");
    expect(title.parentElement).toHaveClass("kozmos-card-header-text");
    expect(actions).toHaveAttribute("data-slot", "card-header-actions");
    expect(actions).toHaveClass("kozmos-card-header-actions");
    // In reading order after the text, so a keyboard reaches them after it.
    expect(header.lastElementChild).toBe(actions);
    expect(
      title.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("draws a header with no actions as it was", () => {
    render(
      <Card padding="compact">
        <CardHeader>
          <CardTitle>Site</CardTitle>
        </CardHeader>
      </Card>,
    );
    const header = screen.getByRole("heading", { name: "Site" }).parentElement!;
    expect(header).toHaveClass("flex", "flex-col", "space-y-1.5", "p-4");
    expect(header).not.toHaveClass("kozmos-card-header");
    expect(
      header.querySelector('[data-slot="card-header-actions"]'),
    ).toBeNull();
  });
});
