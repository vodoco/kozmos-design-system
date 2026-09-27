import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./Alert";
import { Card, CardContent, CardHeader, CardTitle } from "../Card";
import { EmptyState } from "../EmptyState";
import { POIResultList } from "../POIResultList/POIResultList";

describe("a notice that does not interrupt", () => {
  it("is not a live region unless it is asked to be", () => {
    // role="alert" was hard-coded with no way out, so a static page notice —
    // "View only. Only Dashboard admins can change these settings." — was read
    // out over whatever the visitor was doing, every time the page opened.
    const { container } = render(<Alert>Notice</Alert>);
    expect(container.firstElementChild).not.toHaveAttribute("role");

    render(<Alert live="polite">Saved</Alert>);
    expect(screen.getByRole("status")).toBeVisible();

    render(<Alert live="assertive">Failed</Alert>);
    expect(screen.getByRole("alert")).toBeVisible();
  });

  it("lets a caller set the role outright", () => {
    render(<Alert role="note">Notice</Alert>);
    expect(screen.getByRole("note")).toBeVisible();
  });

  it("gives the title a size of its own, and no heading by default", () => {
    // The reset makes every heading font-size: inherit and the title carried
    // no size class, so it came out the size of the description below it.
    // Neither SwiftUI nor Compose makes this a heading; the web's h5 landed
    // straight after a page's h2 sections.
    const { container } = render(
      <Alert>
        <AlertTitle>View only</AlertTitle>
        <AlertDescription>Only admins can change these.</AlertDescription>
      </Alert>,
    );
    const title = screen.getByText("View only");
    expect(title.tagName).toBe("P");
    expect(title.className).toMatch(/text-base/);
    expect(screen.getByText("Only admins can change these.").className).toMatch(
      /text-sm/,
    );
    expect(container.querySelector("h5")).toBeNull();
  });

  it("takes a heading level when the alert really is a section", () => {
    render(<AlertTitle level={3}>Kill switch</AlertTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toBeVisible();
  });
});

describe("density", () => {
  it("gives a card a smaller padding when asked", () => {
    // Card had three hard-coded p-6 and no option, so the only way to 16 was a
    // caller passing className="p-4" — which restyles the component from
    // outside and exists only on the web (GAP-034).
    const { container: normal } = render(
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>How visitors search.</CardContent>
      </Card>,
    );
    expect(normal.querySelector(".flex-col")?.className).toMatch(/\bp-6\b/);
    expect(screen.getByText("How visitors search.").className).toMatch(
      /\bpx-6\b/,
    );

    const { container: compact } = render(
      <Card padding="compact">
        <CardHeader>
          <CardTitle>Search compact</CardTitle>
        </CardHeader>
        <CardContent>Compact content.</CardContent>
      </Card>,
    );
    // The whole card, not just the header: a card padded 16 at the top and 24
    // at the bottom is the bug, not the fix.
    expect(compact.querySelector(".flex-col")?.className).toMatch(/\bp-4\b/);
    expect(screen.getByText("Compact content.").className).toMatch(/\bpx-4\b/);
  });

  it("lets a slot tell an empty state not to pad itself twice", () => {
    // Measured on the MAP-474 boards: 258px inside the result list, of which
    // 48 was the slot's padding and 64 this component's. The product placing
    // it there has no reason to know that, so the slot says so.
    const { container } = render(
      <POIResultList
        emptyState={<EmptyState title="No results" />}
        items={[]}
        onSelect={vi.fn()}
        resultCountLabel="No results"
      />,
    );
    const box = container.querySelector("[data-size]")!;
    expect(box).toHaveAttribute("data-size", "compact");
    // The attribute is only the plumbing. What matters is that it pads less:
    // 32 of its own inside a slot that already drew a box is the 258px.
    expect(box.className).toMatch(/\bp-4\b/);
    expect(box.className).not.toMatch(/\bp-8\b/);
    expect(box.className).not.toMatch(/\bh-full\b/);
  });

  it("keeps the full size when it is the screen, and when asked outright", () => {
    const { container: alone } = render(<EmptyState title="Nothing here" />);
    expect(alone.firstElementChild).toHaveAttribute("data-size", "default");
    expect(alone.firstElementChild?.className).toMatch(/\bp-8\b/);

    // An explicit size beats the slot's.
    const { container: forced } = render(
      <POIResultList
        emptyState={<EmptyState size="default" title="No results" />}
        items={[]}
        onSelect={vi.fn()}
        resultCountLabel="No results"
      />,
    );
    const forcedBox = forced.querySelector("[data-size]")!;
    expect(forcedBox).toHaveAttribute("data-size", "default");
    expect(forcedBox.className).toMatch(/\bp-8\b/);
  });
});
