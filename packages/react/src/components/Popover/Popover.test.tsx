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
  onCloseAutoFocus,
  showStart = true,
}: {
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
  showStart?: boolean;
}) {
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
        <button type="button">Add desk</button>
      </PopoverAnchor>
      {showStart && (
        <button type="button" onClick={() => setOpen(true)}>
          Start tour
        </button>
      )}
      <PopoverContent
        aria-label="Step 1 of 3"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <button type="button">Next</button>
      </PopoverContent>
    </Popover>
  );
}

// Two steps, one Popover each, as a tour composes them: step 1's Next closes
// it and opens step 2 in the same update.
function TwoStepTour({
  onOpenChange,
}: {
  onOpenChange: (step: number, open: boolean) => void;
}) {
  const [step, setStep] = React.useState(0);
  const steps = [
    { target: "Add desk", label: "Step 1 of 2", action: "Next" },
    { target: "Choose a floor", label: "Step 2 of 2", action: "Done" },
  ];
  return (
    <>
      <button type="button" onClick={() => setStep(1)}>
        Start tour
      </button>
      {steps.map(({ target, label, action }, index) => (
        <Popover
          key={label}
          open={step === index + 1}
          onOpenChange={(open) => {
            onOpenChange(index + 1, open);
            if (!open) setStep(0);
          }}
        >
          <PopoverAnchor asChild>
            <button type="button">{target}</button>
          </PopoverAnchor>
          <PopoverContent aria-label={label}>
            <button
              type="button"
              onClick={() => setStep(index + 2 > steps.length ? 0 : index + 2)}
            >
              {action}
            </button>
          </PopoverContent>
        </Popover>
      ))}
    </>
  );
}

/** Radix hands focus over after the content unmounts, on a timer. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("PopoverAnchor (GAP-190)", () => {
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

  it("gives focus back to what had it when it opened, with no handler", async () => {
    render(<TourStep />);
    const start = screen.getByRole("button", { name: "Start tour" });
    start.focus();
    fireEvent.click(start);
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(),
    );
    fireEvent.keyDown(step, { key: "Escape" });
    await waitFor(() => expect(start).toHaveFocus());
  });

  it("gives focus to its anchor when nothing had it as it opened", async () => {
    render(<TourStep />);
    // Opened by the product, not from a focused control.
    expect(document.body).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    fireEvent.keyDown(step, { key: "Escape" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add desk" })).toHaveFocus(),
    );
  });

  it("gives focus to its anchor when what opened it is gone", async () => {
    const { rerender } = render(<TourStep />);
    const start = screen.getByRole("button", { name: "Start tour" });
    start.focus();
    fireEvent.click(start);
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    rerender(<TourStep showStart={false} />);
    fireEvent.keyDown(step, { key: "Escape" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add desk" })).toHaveFocus(),
    );
  });

  it("leaves focus alone when onCloseAutoFocus prevents the default", async () => {
    render(<TourStep onCloseAutoFocus={(event) => event.preventDefault()} />);
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    const step = await screen.findByRole("dialog", { name: "Step 1 of 3" });
    fireEvent.keyDown(step, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await settle();
    expect(document.body).toHaveFocus();
  });

  it("keeps a two-step tour's next step open, with focus on it", async () => {
    const changes: string[] = [];
    render(
      <TwoStepTour
        onOpenChange={(step, open) => changes.push(`${step} ${open}`)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start tour" }));
    await screen.findByRole("dialog", { name: "Step 1 of 2" });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const second = await screen.findByRole("dialog", { name: "Step 2 of 2" });
    await settle();
    // Step 1's closing gave focus back to nothing: step 2 had taken it.
    expect(second).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Step 1 of 2" })).toBeNull();
    expect(screen.getByRole("button", { name: "Done" })).toHaveFocus();
    expect(changes).toEqual([]);
    // The tour's end gives focus to the last step's control.
    fireEvent.keyDown(second, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Choose a floor" }),
      ).toHaveFocus(),
    );
    expect(changes).toEqual(["2 false"]);
  });

  it("keeps PopoverTrigger's own return of focus", async () => {
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Panel">
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    trigger.focus();
    fireEvent.click(trigger);
    const panel = await screen.findByRole("dialog", { name: "Panel" });
    fireEvent.keyDown(panel, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
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

  it("has nothing to give focus to beside a rect, so leaves it", async () => {
    const rect = { getBoundingClientRect: () => DOMRect.fromRect({}) };
    function MapHint() {
      const [open, setOpen] = React.useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor virtualRef={{ current: rect }} />
          <PopoverContent aria-label="Reception desk">
            <button type="button">Directions</button>
          </PopoverContent>
        </Popover>
      );
    }
    render(<MapHint />);
    const hint = await screen.findByRole("dialog", { name: "Reception desk" });
    fireEvent.keyDown(hint, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await settle();
    expect(document.body).toHaveFocus();
  });

  it("gives focus to an element given as its virtualRef", async () => {
    // What the Vue harness passes: an element outside React's tree.
    const outside = document.createElement("button");
    outside.textContent = "Map pin";
    document.body.append(outside);
    function Hint() {
      const [open, setOpen] = React.useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor virtualRef={{ current: outside }} />
          <PopoverContent aria-label="Pin">
            <button type="button">Close</button>
          </PopoverContent>
        </Popover>
      );
    }
    render(<Hint />);
    const hint = await screen.findByRole("dialog", { name: "Pin" });
    fireEvent.keyDown(hint, { key: "Escape" });
    await waitFor(() => expect(outside).toHaveFocus());
    outside.remove();
  });
});
