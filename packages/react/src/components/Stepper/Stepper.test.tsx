import { render, screen } from "@testing-library/react";
import { Stepper } from "./Stepper";
import { describe, it, expect } from "vitest";

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

  it("draws the numbered stepper by default, as before", () => {
    const { container } = render(<Stepper steps={steps} currentStep={1} />);
    expect(container.querySelector("ol")).toBeNull();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.getByText("Route")).toBeVisible();
  });
});
