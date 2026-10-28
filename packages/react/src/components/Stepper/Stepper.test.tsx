import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Stepper } from "./Stepper";
import { describe, it, expect, vi } from "vitest";
import { axe } from "vitest-axe";

describe("Stepper", () => {
  it("renders correctly", () => {
    render(<Stepper steps={["One", "Two"]} currentStep={0} />);
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  // A screen reader is told which step is current, as the web says it:
  // `aria-current="step"` on that step, and on no other. The stepper set
  // none, so its order was heard and its progress was not.
  it('marks the current step, and only it, aria-current="step"', () => {
    const { container } = render(
      <Stepper steps={["Search", "Route", "Go"]} currentStep={1} />,
    );
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("aria-current", "step");
    expect(current[0]).toHaveTextContent("Route");
  });

  it("marks no step current once every step is done", () => {
    const { container } = render(
      <Stepper steps={["Search", "Route", "Go"]} currentStep={3} />,
    );
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
  });
});

// GAP-191: a tour shows its progress as dots (MAP-64).
describe('Stepper variant="dots"', () => {
  const steps = ["Search", "Route", "Floors", "Share", "Go"];

  it("draws one dot per step, each named by its step", () => {
    render(<Stepper variant="dots" steps={steps} currentStep={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items.map((item) => item.textContent)).toEqual(steps);
  });

  it('marks the current dot, and only it, aria-current="step"', () => {
    const { container } = render(
      <Stepper variant="dots" steps={steps} currentStep={1} />,
    );
    const current = container.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("aria-current", "step");
    expect(current[0]).toHaveTextContent("Route");
  });

  it("says the position, Step 2 of 5, as the group's name", () => {
    render(<Stepper variant="dots" steps={steps} currentStep={1} />);
    expect(
      screen.getByRole("group", { name: "Step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("takes the position's words from positionLabel, a function or a template", () => {
    const { rerender } = render(
      <Stepper
        variant="dots"
        steps={steps}
        currentStep={2}
        positionLabel={(step, count) => `Paso ${step} de ${count}`}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Paso 3 de 5" }),
    ).toBeInTheDocument();
    rerender(
      <Stepper
        variant="dots"
        steps={steps}
        currentStep={4}
        positionLabel="Étape {step} sur {count}"
      />,
    );
    expect(
      screen.getByRole("group", { name: "Étape 5 sur 5" }),
    ).toBeInTheDocument();
  });

  it("gives each dot its state: done before the current one, pending after", () => {
    const { container } = render(
      <Stepper variant="dots" steps={steps} currentStep={2} />,
    );
    expect(
      Array.from(container.querySelectorAll("li")).map((dot) =>
        dot.getAttribute("data-state"),
      ),
    ).toEqual(["done", "done", "current", "pending", "pending"]);
  });

  it("marks no dot current once every step is done, and says the last", () => {
    const { container } = render(
      <Stepper variant="dots" steps={steps} currentStep={5} />,
    );
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
    expect(
      screen.getByRole("group", { name: "Step 5 of 5" }),
    ).toBeInTheDocument();
  });

  // As the numbered stepper reads them: no steps draws the root alone, and a
  // step before the first, or one that is not a number, has nothing done and
  // nothing current.
  it("draws the root alone for no steps, with no group, list or position", () => {
    const { container } = render(
      <Stepper variant="dots" steps={[]} currentStep={0} data-testid="dots" />,
    );
    const root = screen.getByTestId("dots");
    expect(root).toBeEmptyDOMElement();
    expect(root).not.toHaveAttribute("role");
    expect(root).not.toHaveAttribute("aria-label");
    expect(container.querySelector("ol")).toBeNull();
    const numbered = render(<Stepper steps={[]} currentStep={0} />);
    expect(numbered.container.firstElementChild).toBeEmptyDOMElement();
  });

  it("before the first step, marks nothing done or current and names the first", () => {
    const { container } = render(
      <Stepper variant="dots" steps={["A", "B", "C"]} currentStep={-1} />,
    );
    expect(
      screen.getByRole("group", { name: "Step 1 of 3" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
    expect(
      Array.from(container.querySelectorAll("li")).map((dot) =>
        dot.getAttribute("data-state"),
      ),
    ).toEqual(["pending", "pending", "pending"]);
  });

  it("reads a step that is not a number as before the first, never Step NaN", () => {
    for (const currentStep of [NaN, Infinity * 0, Number("x")]) {
      const { container, unmount } = render(
        <Stepper
          variant="dots"
          steps={["A", "B", "C"]}
          currentStep={currentStep}
        />,
      );
      expect(
        screen.getByRole("group", { name: "Step 1 of 3" }),
      ).toBeInTheDocument();
      expect(container.querySelectorAll("[aria-current]")).toHaveLength(0);
      expect(container.textContent).not.toContain("NaN");
      unmount();
    }
  });

  it("draws the numbered stepper by default, as before", () => {
    const { container } = render(<Stepper steps={steps} currentStep={1} />);
    expect(container.querySelector("ol")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.getByText("Route")).toBeVisible();
  });
});

// GAP-173 (decision 119): steps as objects, an orientation and step
// selection, for Pointr Cloud's building wizard: five vertical steps, a status
// each, and steps the visitor may go back to.
// What a screen reader is given for a step: its label and status words. The
// indicator, whose number or glyph is drawn for the eye, is aria-hidden.
const said = (element: Element) =>
  element.querySelector(".kozmos-stepper-label")?.textContent;

describe("Stepper steps as objects, orientation and selection (GAP-173)", () => {
  const wizard = [
    "Building details",
    "Levels",
    "Alignment",
    "Fine-tune",
    "Preview",
  ];

  it("takes a step as an object, and draws its label as a string's", () => {
    const strings = render(<Stepper steps={wizard} currentStep={1} />);
    const objects = render(
      <Stepper steps={wizard.map((label) => ({ label }))} currentStep={1} />,
    );
    expect(objects.container.innerHTML).toBe(strings.container.innerHTML);
    expect(screen.getAllByText("Levels")).toHaveLength(2);
  });

  it("is a list of its steps, named by the position, Step 2 of 5", () => {
    render(<Stepper steps={wizard} currentStep={1} />);
    const list = screen.getByRole("list", { name: "Step 2 of 5" });
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(list).toContainElement(screen.getAllByRole("listitem")[0]);
  });

  it("names the list in the product's words from positionLabel", () => {
    render(
      <Stepper
        steps={wizard}
        currentStep={1}
        positionLabel="Step {step}/{count}"
      />,
    );
    expect(screen.getByRole("list", { name: "Step 2/5" })).toBeInTheDocument();
  });

  it("says each step's status in words: done, current, not started", () => {
    render(<Stepper steps={wizard} currentStep={1} />);
    expect(screen.getAllByRole("listitem").map(said)).toEqual([
      "Building details, Done",
      // The current step's word is aria-current's, so none is added.
      "Levels",
      "Alignment, Not started",
      "Fine-tune, Not started",
      "Preview, Not started",
    ]);
  });

  it("draws and says a step's own status: error and loading", () => {
    const { container } = render(
      <Stepper
        steps={[
          { label: "Building details", status: "error" },
          { label: "Levels", status: "loading" },
          "Alignment",
          { label: "Fine-tune", status: "done" },
          "Preview",
        ]}
        currentStep={1}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.getAttribute("data-status"))).toEqual([
      "error",
      "loading",
      "pending",
      "done",
      "pending",
    ]);
    expect(items.map(said)).toEqual([
      "Building details, Error",
      "Levels, In progress",
      "Alignment, Not started",
      "Fine-tune, Done",
      "Preview, Not started",
    ]);
    // The current step stays aria-current whatever its status.
    expect(container.querySelectorAll("[aria-current]")).toHaveLength(1);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    // A spinner while the step works, a cross on an error, and the
    // indicator is drawn for the eye only: the words above say it.
    expect(items[1].querySelector(".kozmos-spinner-arc")).not.toBeNull();
    expect(items[0].querySelector(".kozmos-stepper-error")).not.toBeNull();
    for (const item of items)
      expect(item.querySelector(".kozmos-stepper-indicator")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
  });

  it("takes the status words from statusLabels, one or all", () => {
    render(
      <Stepper
        steps={[
          { label: "Datos", status: "error" },
          { label: "Plantas", status: "loading" },
          "Alineación",
        ]}
        currentStep={1}
        statusLabels={{
          error: "Con errores",
          loading: "En curso",
          pending: "Sin empezar",
        }}
      />,
    );
    expect(screen.getAllByRole("listitem").map(said)).toEqual([
      "Datos, Con errores",
      "Plantas, En curso",
      "Alineación, Sin empezar",
    ]);
  });

  it("with onStepSelect, the steps before the current one, and it, are buttons", () => {
    const onStepSelect = vi.fn();
    render(
      <Stepper steps={wizard} currentStep={2} onStepSelect={onStepSelect} />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toEqual([
      screen.getByRole("button", { name: "Building details, Done" }),
      screen.getByRole("button", { name: "Levels, Done" }),
      screen.getByRole("button", { name: "Alignment" }),
    ]);
    // Tab stops, in order, as Pagination's and Breadcrumb's links are.
    for (const button of buttons) {
      expect(button).toHaveAttribute("type", "button");
      expect(button).not.toHaveAttribute("tabindex");
    }
    fireEvent.click(screen.getByRole("button", { name: "Levels, Done" }));
    expect(onStepSelect).toHaveBeenCalledTimes(1);
    expect(onStepSelect).toHaveBeenCalledWith(1);
  });

  it("never makes a disabled step a button; disabled: false opens a step ahead", () => {
    render(
      <Stepper
        steps={[
          { label: "Building details", disabled: true },
          "Levels",
          "Alignment",
          { label: "Fine-tune", disabled: false },
          "Preview",
        ]}
        currentStep={2}
        onStepSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("button")).toEqual([
      screen.getByRole("button", { name: "Levels, Done" }),
      screen.getByRole("button", { name: "Alignment" }),
      screen.getByRole("button", { name: "Fine-tune, Not started" }),
    ]);
  });

  it("never makes a current step that says it is disabled a button", () => {
    render(
      <Stepper
        steps={["Building details", { label: "Levels", disabled: true }]}
        currentStep={1}
        onStepSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("button")).toEqual([
      screen.getByRole("button", { name: "Building details, Done" }),
    ]);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute(
      "aria-current",
      "step",
    );
    // Where the visitor is, never drawn disabled.
    expect(screen.getAllByRole("listitem")[1]).not.toHaveAttribute(
      "data-disabled",
    );
  });

  // A step that is not a number is before the first: no step is before it,
  // so none is open unless it says so.
  it("opens only a step that says so when the current step is not a number", () => {
    render(
      <Stepper
        steps={[
          "Building details",
          { label: "Levels", disabled: false },
          "Alignment",
        ]}
        currentStep={NaN}
        onStepSelect={() => {}}
      />,
    );
    expect(screen.getAllByRole("button")).toEqual([
      screen.getByRole("button", { name: "Levels, Not started" }),
    ]);
  });

  // A product moves `currentStep` to the step the visitor selects. The
  // selected button stays the same element as it becomes current, so the
  // keyboard's focus stays on it: it was swapped for spans, and the focus
  // fell to the page's body.
  it("keeps the focus on a selected step as it becomes the current one", () => {
    function Wizard() {
      const [current, setCurrent] = React.useState(2);
      return (
        <Stepper
          steps={[
            "Building details",
            "Levels",
            "Alignment",
            { label: "Fine-tune", disabled: false },
            "Preview",
          ]}
          currentStep={current}
          onStepSelect={setCurrent}
        />
      );
    }
    render(<Wizard />);
    for (const name of ["Levels, Done", "Fine-tune, Not started"]) {
      const step = screen.getByRole("button", { name });
      step.focus();
      fireEvent.click(step);
      expect(step).toBeInTheDocument();
      expect(document.activeElement).toBe(step);
      expect(step).toHaveAttribute("aria-current", "step");
      expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
    }
  });

  it("says the current step on its button, which selects nothing", () => {
    const onStepSelect = vi.fn();
    render(
      <Stepper steps={wizard} currentStep={2} onStepSelect={onStepSelect} />,
    );
    const current = screen.getByRole("button", { name: "Alignment" });
    expect(current).toHaveAttribute("aria-current", "step");
    expect(screen.getAllByRole("listitem")[2]).not.toHaveAttribute(
      "aria-current",
    );
    fireEvent.click(current);
    expect(onStepSelect).not.toHaveBeenCalled();
  });

  // A step the visitor may not go to looked like one they may at rest: only
  // a hover's underline told them apart. It is drawn disabled, as a disabled
  // control is, where the others are buttons.
  it("draws a step the visitor may not go to disabled, only where steps are buttons", () => {
    const steps = [
      { label: "Building details", disabled: true },
      "Levels",
      "Alignment",
      { label: "Fine-tune", disabled: false },
      "Preview",
    ];
    const { rerender } = render(
      <Stepper steps={steps} currentStep={2} onStepSelect={() => {}} />,
    );
    expect(
      screen
        .getAllByRole("listitem")
        .map((item) => item.hasAttribute("data-disabled")),
    ).toEqual([true, false, false, false, true]);
    rerender(<Stepper steps={steps} currentStep={2} />);
    expect(document.querySelectorAll("[data-disabled]")).toHaveLength(0);
  });

  // The line after a step is drawn as progress once that step is done, so a
  // step's error before the current one breaks it.
  it("draws the line after a step as progress only once the step is done", () => {
    const { container } = render(
      <Stepper
        steps={[
          "Building details",
          { label: "Levels", status: "error" },
          "Alignment",
        ]}
        currentStep={2}
      />,
    );
    const lines = container.querySelectorAll(".kozmos-stepper-connector");
    expect(lines[0]).toHaveClass("bg-primary");
    expect(lines[1]).toHaveClass("bg-border");
    expect(lines[1]).not.toHaveClass("bg-primary");
  });

  // The words between a step's label and its status are the product's too.
  it("takes what stands between a label and its status from statusSeparator", () => {
    render(
      <Stepper
        steps={["建物", { label: "階", status: "error" }]}
        currentStep={1}
        statusLabels={{ done: "完了", error: "エラー" }}
        statusSeparator="、"
      />,
    );
    expect(screen.getAllByRole("listitem").map(said)).toEqual([
      "建物、完了",
      "階、エラー",
    ]);
  });

  it("draws no button without onStepSelect", () => {
    render(<Stepper steps={wizard} currentStep={4} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("is horizontal by default and vertical when asked", () => {
    const { rerender } = render(
      <Stepper steps={wizard} currentStep={1} data-testid="stepper" />,
    );
    expect(screen.getByTestId("stepper")).not.toHaveAttribute(
      "data-orientation",
    );
    rerender(
      <Stepper
        steps={wizard}
        currentStep={1}
        orientation="vertical"
        data-testid="stepper"
      />,
    );
    expect(screen.getByTestId("stepper")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
    expect(screen.getByTestId("stepper")).toHaveClass(
      "kozmos-stepper-vertical",
    );
  });

  it("has no axe violations, vertical, with statuses and buttons", async () => {
    const { container } = render(
      <Stepper
        orientation="vertical"
        steps={[
          { label: "Building details", status: "done" },
          { label: "Levels", status: "error" },
          { label: "Alignment", status: "loading" },
          "Fine-tune",
          { label: "Preview", disabled: true },
        ]}
        currentStep={2}
        onStepSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("draws the root alone for no steps, with no list or name", () => {
    render(<Stepper steps={[]} currentStep={0} data-testid="stepper" />);
    expect(screen.getByTestId("stepper")).not.toHaveAttribute("role");
    expect(screen.getByTestId("stepper")).not.toHaveAttribute("aria-label");
  });

  // The dots name each dot by its step's label; they draw the position only.
  it("dots take objects, named by their labels", () => {
    render(
      <Stepper
        variant="dots"
        steps={[{ label: "Search" }, "Route", { label: "Go", status: "error" }]}
        currentStep={1}
      />,
    );
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Search", "Route", "Go"]);
  });

  // TourStep (#422) passes strings, positionLabel and aria-hidden: unchanged.
  it("keeps the dots TourStep draws as they were", () => {
    const { container } = render(
      <Stepper
        variant="dots"
        steps={["1", "2", "3", "4", "5"]}
        currentStep={1}
        positionLabel="Step {step} of {count}"
        aria-hidden="true"
        className="kozmos-tour-step-dots"
      />,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("role", "group");
    expect(root).toHaveAttribute("aria-label", "Step 2 of 5");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("kozmos-stepper-dots", "kozmos-tour-step-dots");
    expect(root.querySelectorAll("button")).toHaveLength(0);
    expect(
      Array.from(root.querySelectorAll("li")).map((dot) =>
        dot.getAttribute("data-state"),
      ),
    ).toEqual(["done", "current", "pending", "pending", "pending"]);
  });
});
