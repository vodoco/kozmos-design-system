import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleButton } from "./ToggleButton";
import { describe, it, expect } from "vitest";

describe("ToggleButton", () => {
  it("toggles state", () => {
    render(<ToggleButton>Toggle</ToggleButton>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-state", "on");
    fireEvent.click(button);
    expect(button).toHaveAttribute("data-state", "off");
  });
});

// Decisions 188 and 190 (17 Nov 2026): a toggle standing for several
// features that differ is announced as mixed, aria-pressed="mixed", drawn
// with a dash before its label (its dashed theme edge is owned CSS, read in
// e2e/MixedToggles.spec.tsx), and a press turns it pressed.
describe("ToggleButton mixed (decisions 188, 190)", () => {
  it('is aria-pressed="mixed" with a dash before its label', () => {
    render(
      <ToggleButton mixed pressed>
        Bold
      </ToggleButton>,
    );
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveAttribute("aria-pressed", "mixed");
    expect(button).toHaveAttribute("data-state", "off");
    const dash = button.firstElementChild;
    expect(dash).toHaveAttribute("data-slot", "mixed-dash");
    expect(dash).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveTextContent("Bold");
  });

  it("turns pressed at a press, controlled, and reports pressed", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    function Product() {
      const [edit, setEdit] = React.useState<boolean | undefined>();
      return (
        <ToggleButton
          mixed={edit === undefined}
          pressed={edit ?? true}
          onPressedChange={(pressed) => {
            changes.push(pressed);
            setEdit(pressed);
          }}
        >
          Bold
        </ToggleButton>
      );
    }
    render(<Product />);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(changes).toEqual([true]);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.querySelector('[data-slot="mixed-dash"]')).toBeNull();
  });

  it("turns pressed at a press, uncontrolled, whatever it started from", async () => {
    const user = userEvent.setup();
    function Product() {
      const [mixed, setMixed] = React.useState(true);
      return (
        <ToggleButton
          mixed={mixed}
          defaultPressed
          onPressedChange={() => setMixed(false)}
        >
          Bold
        </ToggleButton>
      );
    }
    render(<Product />);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers the reset once edited; pressed, focus goes to the toggle and it is mixed again", async () => {
    const user = userEvent.setup();
    function Product() {
      const [edit, setEdit] = React.useState<boolean | undefined>();
      return (
        <div>
          <ToggleButton
            mixed={edit === undefined}
            pressed={edit ?? false}
            onPressedChange={setEdit}
            onResetMixed={() => setEdit(undefined)}
          >
            Bold
          </ToggleButton>
        </div>
      );
    }
    render(<Product />);
    expect(
      screen.queryByRole("button", { name: "Reset to multiple values" }),
    ).toBeNull();
    await user.click(screen.getByRole("button", { name: "Bold" }));
    const reset = screen.getByRole("button", {
      name: "Reset to multiple values",
    });
    expect(reset).toHaveAttribute("data-slot", "reset-mixed");
    await user.click(reset);
    const button = screen.getByRole("button", { name: "Bold" });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute("aria-pressed", "mixed");
    expect(
      screen.queryByRole("button", { name: "Reset to multiple values" }),
    ).toBeNull();
  });

  it("never offers the reset while disabled, and takes the reset's words", () => {
    const { rerender } = render(
      <ToggleButton disabled onResetMixed={() => {}}>
        Bold
      </ToggleButton>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    rerender(
      <ToggleButton
        onResetMixed={() => {}}
        resetMixedLabel="Revenir aux valeurs multiples"
      >
        Bold
      </ToggleButton>,
    );
    expect(
      screen.getByRole("button", { name: "Revenir aux valeurs multiples" }),
    ).toBeInTheDocument();
  });
});
