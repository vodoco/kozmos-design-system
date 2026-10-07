import {
  cleanup,
  isInaccessible,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

// The natives clamp the value; Radix does not. A value past either end made
// it log an error, mark the bar indeterminate, draw it empty and drop
// aria-valuenow and aria-valuetext.
describe("EmptyState progress out of range", () => {
  it.each([
    [120, 100, "complete"],
    [100.0000001, 100, "complete"],
    [-1, 0, "loading"],
    [Number.NaN, 0, "loading"],
  ])("draws %s as %s", (value, expected, state) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <EmptyState
          title="Downloading"
          progress={{ value, label: "Downloading the assistant" }}
        />,
      );
      const bar = screen.getByRole("progressbar", {
        name: "Downloading the assistant",
      });
      expect(bar).toHaveAttribute("aria-valuenow", String(expected));
      expect(bar).toHaveAttribute("aria-valuetext", `${expected}%`);
      expect(bar).toHaveAttribute("data-state", state);
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("EmptyState progress layout", () => {
  const block = () =>
    document.querySelector("[data-empty-state-progress]") as HTMLElement;

  // The natives leave their stack's gap above the bar, 16 or 8 compact, from
  // the description or, without one, from the title. The title's own bottom
  // margin is 4 (2 compact), so the bar tops it up.
  it.each([
    ["default", true, []],
    ["default", false, ["mt-3"]],
    ["compact", true, ["mt-2"]],
    ["compact", false, ["mt-1.5"]],
  ] as const)(
    "leaves the natives' gap above the bar (%s, description: %s)",
    (size, withDescription, classes) => {
      render(
        <EmptyState
          title="The assistant isn't downloaded yet"
          description={
            withDescription
              ? "It works offline once it's on this device."
              : undefined
          }
          size={size}
          progress={{ value: 40, label: "Downloading the assistant" }}
        />,
      );
      const margins = [...block().classList].filter((name) =>
        name.startsWith("mt-"),
      );
      expect(margins).toEqual(classes);
    },
  );

  // The natives align the label to the leading edge; the empty state centres
  // its text, and a label that wraps sat centred under the title.
  it("aligns the label to the leading edge", () => {
    render(
      <EmptyState
        title="Downloading"
        progress={{ value: 40, label: "Downloading the assistant" }}
      />,
    );
    expect(block()).toHaveClass("text-start");
  });

  // The natives expose one element. The label is the bar's name, so in
  // browse mode a screen reader read it twice: as text, then as the bar.
  it("reads the label once, as the bar's name", () => {
    render(
      <EmptyState
        title="Downloading"
        progress={{
          value: 40,
          label: "Downloading the assistant",
          valueText: "12 of 30 MB",
        }}
      />,
    );
    const bar = screen.getByRole("progressbar", {
      name: "Downloading the assistant",
    });
    expect(bar).toHaveAccessibleName("Downloading the assistant");
    const label = screen.getByText("Downloading the assistant");
    expect(label).toBeVisible();
    expect(isInaccessible(label)).toBe(true);
    expect(isInaccessible(screen.getByText("12 of 30 MB"))).toBe(true);
    expect(isInaccessible(bar)).toBe(false);
  });
});
