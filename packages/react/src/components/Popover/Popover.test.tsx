import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";
import { describe, it, expect } from "vitest";

describe("Popover", () => {
  it("shows content on click", () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders an arrow only when one is asked for", () => {
    const { container, rerender } = render(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );
    // The arrow is opt-in, unlike Tooltip's, because plenty of popovers are
    // panels that read better without a pointer.
    expect(document.querySelectorAll("svg")).toHaveLength(0);

    rerender(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          Content
          <PopoverArrow />
        </PopoverContent>
      </Popover>,
    );
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
    void container;
  });
});

// GAP-190: a popover the product opens, beside a control it does not own.
function TourStep({
  onOpenChange,
  returnFocus = true,
}: {
  onOpenChange?: (open: boolean) => void;
  returnFocus?: boolean;
}) {
  const target = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
    >
      <PopoverAnchor asChild>
        <button ref={target} type="button">
          Add desk
        </button>
      </PopoverAnchor>
      <button type="button" onClick={() => setOpen(true)}>
        Start tour
      </button>
      <PopoverContent
        aria-label="Step 1 of 3"
        onCloseAutoFocus={
          returnFocus
            ? (event) => {
                event.preventDefault();
                target.current?.focus();
              }
            : undefined
        }
      >
        <button type="button">Next</button>
      </PopoverContent>
    </Popover>
  );
}

describe("PopoverAnchor (GAP-190)", () => {
  it("is exported from the package", async () => {
    const pkg = await import("../../index");
    expect(pkg.PopoverAnchor).toBeDefined();
    expect(pkg.PopoverAnchor).toBe(PopoverAnchor);
  });

  it("leaves its target a plain button, which opens nothing", () => {
    render(<TourStep />);
    const target = screen.getByRole("button", { name: "Add desk" });
    for (const attribute of [
      "aria-haspopup",
      "aria-expanded",
      "aria-controls",
      "data-state",
    ])
      expect(target).not.toHaveAttribute(attribute);
    fireEvent.click(target);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens and closes from the product's state, with no trigger", async () => {
    const changes: boolean[] = [];
    render(<TourStep onOpenChange={(open) => changes.push(open)} />);
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    expect(step).toBeInTheDocument();
    // The target is still plain while its popover is open.
    const target = screen.getByRole("button", { name: "Add desk" });
    expect(target).not.toHaveAttribute("aria-expanded");
    expect(target).not.toHaveAttribute("aria-controls");
    fireEvent.keyDown(step, { key: "Escape" });
    expect(changes).toEqual([false]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gives focus back to the target through onCloseAutoFocus", async () => {
    render(<TourStep />);
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    fireEvent.keyDown(step, { key: "Escape" });
    // Radix hands focus over after the content unmounts, on a timer.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add desk" })).toHaveFocus(),
    );
  });

  it("has nothing to give focus back to without onCloseAutoFocus", async () => {
    // Why the docs ask for the handler: there is no trigger to return to.
    render(<TourStep returnFocus={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    fireEvent.keyDown(step, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole("button", { name: "Add desk" })).not.toHaveFocus();
  });

  it("anchors to a rect through virtualRef, drawing no element", async () => {
    const rect = {
      getBoundingClientRect: () =>
        DOMRect.fromRect({ x: 100, y: 200, width: 40, height: 20 }),
    };
    const { container } = render(
      <Popover open>
        <PopoverAnchor virtualRef={{ current: rect }} />
        <PopoverContent side="bottom" sideOffset={8} aria-label="Feature">
          Feature
        </PopoverContent>
      </Popover>,
    );
    // The anchor draws nothing in the tree that holds it; the content opens
    // by it (scripts/check-popover-anchor.mjs measures where, in a browser).
    expect(container).toBeEmptyDOMElement();
    expect(
      await screen.findByRole("dialog", { name: "Feature" }),
    ).toBeInTheDocument();
  });
});
