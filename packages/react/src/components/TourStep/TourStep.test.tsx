import * as React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";
import { Dialog, DialogContent, DialogTitle } from "../Dialog/Dialog";
import { TourStep, type TourStepProps } from "./TourStep";

// GAP-188: one step of a product tour. jsdom lays nothing out, so where the
// card sits is measured in scripts/check-tour-step.mjs; here, what it says,
// what it draws and what it does.

/** The text an aria-describedby list reads, in its order. */
function description(element: Element) {
  return (element.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" | ");
}

/** A target with a box of its own: jsdom gives every element a 0 by 0 one. */
function boxed(element: HTMLElement | null, x = 100, y = 120) {
  if (element)
    element.getBoundingClientRect = () =>
      DOMRect.fromRect({ x, y, width: 80, height: 40 });
}

const frames = () =>
  act(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

function Step(props: Partial<TourStepProps>) {
  return (
    <TourStep
      tourLabel="How Pointr Cloud is organised"
      step={2}
      stepCount={5}
      title="Open a site"
      hint="Sites are listed by client."
      instruction="Go ahead and open a site to proceed to the next step."
      onBack={() => {}}
      onNext={() => {}}
      onClose={() => {}}
      {...props}
    >
      Each site holds its buildings.
    </TourStep>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TourStep (GAP-188)", () => {
  it("is exported from the package", async () => {
    const pkg = await import("../../index");
    expect(pkg.TourStep).toBe(TourStep);
  });

  it("is a non-modal dialog named by its title and described by its tour, position, body, hint and status", async () => {
    render(<Step />);
    const dialog = await screen.findByRole("dialog", { name: "Open a site" });
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(description(dialog)).toBe(
      [
        "How Pointr Cloud is organised",
        "Step 2 of 5",
        "Each site holds its buildings.",
        "Sites are listed by client.",
        "Go ahead and open a site to proceed to the next step.",
      ].join(" | "),
    );
    // The title is the step's heading; the position is on the page too.
    expect(
      screen.getByRole("heading", { level: 2, name: "Open a site" }),
    ).toBeInTheDocument();
    expect(dialog.querySelector(".kozmos-tour-step-eyebrow")).toHaveTextContent(
      "How Pointr Cloud is organised · Step 2 of 5",
    );
  });

  it("reads its position from positionLabel: a template, a function, or a closing word", async () => {
    const { rerender } = render(
      <Step positionLabel="Schritt {step} von {count}" />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(description(dialog)).toContain("Schritt 2 von 5");
    rerender(<Step positionLabel={(step, count) => `${step}/${count}`} />);
    expect(description(await screen.findByRole("dialog"))).toContain("2/5");
    rerender(<Step step={6} positionLabel="Done" />);
    expect(description(await screen.findByRole("dialog"))).toContain("Done");
  });

  it("takes focus on Next when it opens, so the step is announced as a dialog opening", async () => {
    render(<Step />);
    const next = await screen.findByRole("button", { name: "Next" });
    await waitFor(() => expect(next).toHaveFocus());
  });

  it("takes focus on itself when it has no Next", async () => {
    render(<Step onNext={undefined} />);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveFocus());
  });

  it("closes on Escape and by Close, named Close by default (decision 100)", async () => {
    const onClose = vi.fn();
    render(<Step onClose={onClose} />);
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("stays open on a press outside it, on the dim or on the lit target, and says so through onInteractOutside", async () => {
    const onClose = vi.fn();
    const onInteractOutside = vi.fn();
    function Page() {
      const target = React.useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={target} type="button">
            Sites
          </button>
          <Step
            target={target}
            onClose={onClose}
            onInteractOutside={onInteractOutside}
          />
        </>
      );
    }
    render(<Page />);
    await screen.findByRole("dialog");
    // Radix listens for outside presses after the frame it opens in.
    await frames();
    const target = screen.getByRole("button", { name: "Sites" });
    fireEvent.pointerDown(target);
    fireEvent.pointerDown(
      document.querySelector(".kozmos-tour-step-backdrop")!,
    );
    fireEvent.pointerDown(document.body);
    // Focus moving to the target is outside too.
    act(() => target.focus());
    expect(onInteractOutside.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on a press outside when the product asks, from onInteractOutside", async () => {
    const onClose = vi.fn();
    render(<Step onClose={onClose} onInteractOutside={() => onClose()} />);
    await screen.findByRole("dialog");
    await frames();
    fireEvent.pointerDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("draws Back and Next only when given them, in English by default and in the product's words", async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const { rerender } = render(<Step onBack={onBack} onNext={onNext} />);
    fireEvent.click(await screen.findByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    rerender(
      <Step
        step={5}
        onBack={undefined}
        nextLabel="Finish"
        closeLabel="Close tour"
      />,
    );
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close tour" }),
    ).toBeInTheDocument();
  });

  it("draws the progress as Stepper's dots, for the eye only: the position is in words", async () => {
    render(<Step />);
    const dialog = await screen.findByRole("dialog");
    const dots = dialog.querySelector(".kozmos-stepper-dots");
    expect(dots).toHaveAttribute("aria-hidden", "true");
    const states = Array.from(
      dots!.querySelectorAll(".kozmos-stepper-dot"),
    ).map((dot) => dot.getAttribute("data-state"));
    expect(states).toEqual([
      "done",
      "current",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("past its last step, every dot is done", async () => {
    render(<Step step={6} positionLabel="Done" />);
    const dialog = await screen.findByRole("dialog");
    const states = Array.from(
      dialog.querySelectorAll(".kozmos-stepper-dot"),
    ).map((dot) => dot.getAttribute("data-state"));
    expect(states).toEqual(["done", "done", "done", "done", "done"]);
  });

  it("with no stepCount, no Back and no Next, is a coachmark: no position, no dots, no footer (GAP-157)", async () => {
    const onClose = vi.fn();
    render(
      <TourStep title="Draw a room" closeLabel="Dismiss" onClose={onClose}>
        Pick the room tool, then click the corners.
      </TourStep>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Draw a room" });
    expect(description(dialog)).toBe(
      "Pick the room tool, then click the corners.",
    );
    expect(dialog.querySelector(".kozmos-tour-step-eyebrow")).toBeNull();
    expect(dialog.querySelector(".kozmos-stepper-dots")).toBeNull();
    expect(dialog.querySelector(".kozmos-tour-step-footer")).toBeNull();
    await waitFor(() => expect(dialog).toHaveFocus());
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("holds its instruction in a polite live region, mounted even while empty", async () => {
    const { rerender } = render(<Step instruction={undefined} />);
    const dialog = await screen.findByRole("dialog");
    const status = screen.getByRole("status");
    expect(dialog).toContainElement(status);
    expect(status).toBeEmptyDOMElement();
    rerender(<Step instruction="Done: select Next." />);
    // The same region, so a reader hears what arrived in it.
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Done: select Next.");
    // The marker is drawn for the eye.
    expect(status.querySelector(".kozmos-tour-step-marker")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is drawn anew for each step, focus on the new step's Next", async () => {
    function Tour() {
      const [step, setStep] = React.useState(1);
      return (
        <Step
          step={step}
          title={step === 1 ? "Open a site" : "Open a building"}
          onNext={() => setStep(2)}
        />
      );
    }
    render(<Tour />);
    const first = await screen.findByRole("dialog", { name: "Open a site" });
    const next = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(next).toHaveFocus());
    fireEvent.click(next);
    const second = await screen.findByRole("dialog", {
      name: "Open a building",
    });
    expect(second).not.toBe(first);
    expect(first.isConnected).toBe(false);
    const secondNext = screen.getByRole("button", { name: "Next" });
    await waitFor(() => expect(secondNext).toHaveFocus());
    // Radix hands focus back from the first step on a timer: it stays.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(secondNext).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Open a building" })).toBe(
      second,
    );
  });

  // PopoverContent's focus model (GAP-190, #410): closing with focus lost
  // gives it back to what had it as the step opened, else to the target.
  it("gives focus back to what opened it on Escape, else to its target", async () => {
    function Page() {
      const target = React.useRef<HTMLButtonElement>(null);
      const [open, setOpen] = React.useState(false);
      const [step, setStep] = React.useState(1);
      // A target with a box, so it is the anchor focus can go back to.
      React.useEffect(() => boxed(target.current));
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Start tour
          </button>
          <button ref={target} type="button">
            Sites
          </button>
          <Step
            open={open}
            step={step}
            target={target}
            onNext={() => setStep(2)}
            onClose={() => setOpen(false)}
          />
        </>
      );
    }
    render(<Page />);
    const start = screen.getByRole("button", { name: "Start tour" });
    act(() => start.focus());
    fireEvent.click(start);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(start).toHaveFocus());

    // Opened again and moved on: the second step opened with focus on the
    // first's Next, which left with it, so focus goes to the target.
    fireEvent.click(start);
    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    await screen.findByRole("dialog");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sites" })).toHaveFocus(),
    );
  });

  it("sits beside an element target, and places itself in the window with none", async () => {
    function Page({ point }: { point: boolean }) {
      const target = React.useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={target} type="button">
            Sites
          </button>
          <Step target={point ? target : undefined} />
        </>
      );
    }
    const { rerender } = render(<Page point={false} />);
    const placed = await screen.findByRole("dialog");
    expect(placed).toHaveAttribute("data-placement", "centre");
    boxed(screen.getByRole("button", { name: "Sites" }));
    rerender(<Page point />);
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-placement",
        "target",
      ),
    );
  });

  it("places itself while its target has no box, and moves beside it once it has one", async () => {
    function Page() {
      const target = React.useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={target} type="button">
            Sites
          </button>
          <Step target={target} />
        </>
      );
    }
    render(<Page />);
    const dialog = await screen.findByRole("dialog");
    // jsdom's 0 by 0 box is no box, as Backdrop reads it.
    expect(dialog).toHaveAttribute("data-placement", "centre");
    boxed(screen.getByRole("button", { name: "Sites" }));
    // No render: the frame loop finds it.
    await frames();
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-placement",
        "target",
      ),
    );
  });

  it("gives focus back to the control a display: contents wrapper draws, as a Vue component's is", async () => {
    function Page() {
      const wrapper = React.useRef<HTMLSpanElement>(null);
      const [open, setOpen] = React.useState(true);
      React.useEffect(() =>
        boxed(wrapper.current!.firstElementChild as HTMLElement),
      );
      return (
        <>
          <span ref={wrapper} style={{ display: "contents" }}>
            <button type="button">Sites</button>
          </span>
          <Step target={wrapper} onClose={() => setOpen(false)} open={open} />
        </>
      );
    }
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(),
    );
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveAttribute(
        "data-placement",
        "target",
      ),
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sites" })).toHaveFocus(),
    );
  });

  it("sits beside a virtual element or a rect", async () => {
    const point = {
      getBoundingClientRect: () =>
        DOMRect.fromRect({ x: 300, y: 200, width: 0, height: 0 }),
    };
    const { rerender } = render(<Step target={point} />);
    expect(await screen.findByRole("dialog")).toHaveAttribute(
      "data-placement",
      "target",
    );
    rerender(<Step target={{ top: 40, left: 60, width: 120, height: 30 }} />);
    await frames();
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "data-placement",
      "target",
    );
  });

  it("lights its target with Backdrop's cut-out, in the theme's portal", async () => {
    function Page() {
      const target = React.useRef<HTMLButtonElement>(null);
      React.useEffect(() => boxed(target.current));
      return (
        <ThemeProvider theme="light">
          <button ref={target} type="button">
            Sites
          </button>
          <Step target={target} />
        </ThemeProvider>
      );
    }
    render(<Page />);
    const dialog = await screen.findByRole("dialog");
    const backdrop = document.querySelector(".kozmos-tour-step-backdrop");
    expect(backdrop).toHaveClass("kozmos-backdrop");
    // The dim and the card share the provider's portal, never the page's
    // own boxes, which may clip or transform them.
    expect(backdrop!.parentElement).toBe(
      dialog.closest("[data-radix-popper-content-wrapper]")!.parentElement,
    );
    await frames();
    expect(backdrop).toHaveAttribute("data-lit");
  });

  it("dims the whole page with no target", async () => {
    render(<Step />);
    await screen.findByRole("dialog");
    const backdrop = document.querySelector(".kozmos-tour-step-backdrop");
    expect(backdrop).toBeInTheDocument();
    await frames();
    expect(backdrop).not.toHaveAttribute("data-lit");
  });

  it("renders nothing while open is false", () => {
    render(<Step open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".kozmos-tour-step-backdrop")).toBeNull();
  });

  it("passes its own attributes and a ref to the card", async () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <TourStep
        ref={ref}
        id="step"
        className="mine"
        data-step="two"
        title="Open a site"
        onClose={() => {}}
      />,
    );
    const dialog = await screen.findByRole("dialog");
    expect(ref.current).toBe(dialog);
    expect(dialog).toHaveAttribute("id", "step");
    expect(dialog).toHaveClass("kozmos-tour-step", "mine");
    expect(dialog).toHaveAttribute("data-step", "two");
  });

  it("opened with a modal Dialog it sits in, takes focus from the dialog's trap and is not hidden", async () => {
    render(
      <ThemeProvider>
        <Dialog open>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Settings</DialogTitle>
            <button type="button">First in the dialog</button>
            <Step />
          </DialogContent>
        </Dialog>
      </ThemeProvider>,
    );
    const step = await screen.findByRole("dialog", { name: "Open a site" });
    expect(step.closest('[aria-hidden="true"]')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Next" })).toHaveFocus(),
    );
    // Its dim is drawn in the dialog's content, where the modal leaves it live.
    const backdrop = document.querySelector(".kozmos-tour-step-backdrop");
    expect(
      backdrop?.closest('[role="dialog"][data-state="open"]'),
    ).not.toBeNull();
  });

  it("has no axe violations open", async () => {
    render(
      <ThemeProvider theme="light">
        <main>
          <Step />
        </main>
      </ThemeProvider>,
    );
    await screen.findByRole("dialog");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
