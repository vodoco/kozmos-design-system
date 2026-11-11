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

  describe("CardHeader tone (CLOUD-UI-001, decisions 135 and 139)", () => {
    it("draws the subtle strip: its class, the strip's block padding, the card's sides", () => {
      render(
        <Card padding="compact">
          <CardHeader tone="subtle">
            <CardTitle>Add beacon</CardTitle>
            <CardDescription>Terminal A / Level 2</CardDescription>
          </CardHeader>
        </Card>,
      );
      const header = screen.getByRole("heading", {
        name: "Add beacon",
      }).parentElement!;
      expect(header).toHaveAttribute("data-tone", "subtle");
      expect(header).toHaveClass(
        "kozmos-card-header-subtle",
        "p-4",
        "py-3",
        // The card's padding below the tint, as a header's own bottom pays.
        "mb-4",
      );
    });

    it("draws the subtle strip with actions, the actions at its end", () => {
      render(
        <Card>
          <CardHeader
            tone="subtle"
            actions={<button type="button">Close</button>}
          >
            <CardTitle>Add beacon</CardTitle>
          </CardHeader>
        </Card>,
      );
      const actions = screen.getByRole("button", {
        name: "Close",
      }).parentElement!;
      const header = actions.parentElement!;
      expect(header).toHaveClass(
        "kozmos-card-header",
        "kozmos-card-header-subtle",
        "p-6",
        "py-3",
        "mb-6",
      );
      expect(header.lastElementChild).toBe(actions);
    });

    it("gives its title the strip's 14 unless the title says otherwise", () => {
      render(
        <Card>
          <CardHeader tone="subtle">
            <CardTitle>Strip</CardTitle>
            <CardTitle size="md">Chosen</CardTitle>
          </CardHeader>
        </Card>,
      );
      const strip = screen.getByRole("heading", { name: "Strip" });
      expect(strip).toHaveAttribute("data-size", "sm");
      expect(strip).toHaveClass("text-sm");
      expect(strip).not.toHaveClass("text-2xl");
      const chosen = screen.getByRole("heading", { name: "Chosen" });
      expect(chosen).toHaveAttribute("data-size", "md");
      expect(chosen).toHaveClass("text-lg");
    });

    it("is the default tone unset, with no tint and the 24 title", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Plain</CardTitle>
          </CardHeader>
        </Card>,
      );
      const title = screen.getByRole("heading", { name: "Plain" });
      expect(title).not.toHaveAttribute("data-size");
      expect(title).toHaveClass("text-2xl");
      expect(title.parentElement).not.toHaveAttribute("data-tone");
      expect(title.parentElement).not.toHaveClass("kozmos-card-header-subtle");
    });
  });
});
