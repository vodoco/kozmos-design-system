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
