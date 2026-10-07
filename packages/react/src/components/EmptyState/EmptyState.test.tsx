import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { EmptyState } from "./EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the title and optional description", () => {
    render(
      <EmptyState
        title="No results found"
        description="Try adjusting your filters or search terms."
      />,
    );

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your filters or search terms."),
    ).toBeInTheDocument();
  });

  it("renders optional icon and action content", () => {
    render(
      <EmptyState
        title="No results found"
        icon={<span aria-label="Search icon" />}
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByLabelText("Search icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear filters" }),
    ).toBeInTheDocument();
  });

  it("keeps the expected centered empty-state layout classes", () => {
    render(<EmptyState title="Nothing here" data-testid="empty-state" />);

    expect(screen.getByTestId("empty-state")).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "p-8",
      "text-center",
    );
  });
});

// GAP-115: the assistant before its model is downloaded says how far the
// download has got where it says why. The bar is the empty state's own,
// between the description and the action, named by its label.
describe("EmptyState progress", () => {
  it("draws a named bar with its value, between the description and the action", () => {
    render(
      <EmptyState
        title="The assistant isn't downloaded yet"
        description="It works offline once it's on this device."
        progress={{
          value: 40,
          label: "Downloading the assistant",
          valueText: "12 of 30 MB",
        }}
        action={<button type="button">Back to search</button>}
      />,
    );
    const bar = screen.getByRole("progressbar", {
      name: "Downloading the assistant",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuetext", "12 of 30 MB");
    expect(screen.getByText("12 of 30 MB")).toBeVisible();
    const description = screen.getByText(
      "It works offline once it's on this device.",
    );
    const action = screen.getByRole("button", { name: "Back to search" });
    expect(
      description.compareDocumentPosition(bar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      bar.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("draws no bar without progress", () => {
    render(<EmptyState title="No results" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
