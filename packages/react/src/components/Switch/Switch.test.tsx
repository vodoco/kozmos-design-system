import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Switch } from "./Switch";
import "@testing-library/jest-dom/vitest";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toHaveClass("h-6", "w-11");
  });

  it("renders label with correct htmlFor association", () => {
    render(<Switch label="Enable notifications" />);
    const switchEl = screen.getByRole("switch");
    const label = screen.getByText("Enable notifications");
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute("for", switchEl.id);
  });

  it("renders error message with aria-describedby linkage", () => {
    render(<Switch error="Required field" />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-invalid", "true");
    expect(switchEl).toHaveAttribute("aria-describedby");

    const errorMessage = screen.getByText("Required field");
    expect(errorMessage).toBeInTheDocument();
    expect(switchEl.getAttribute("aria-describedby")).toBe(errorMessage.id);
  });

  it("renders boolean error without error text", () => {
    render(<Switch error={true} />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-invalid", "true");
    expect(switchEl).not.toHaveAttribute("aria-describedby");
  });

  it("renders error label styling", () => {
    render(<Switch label="Enable notifications" error />);
    expect(screen.getByRole("switch")).toHaveClass("border-destructive");
    expect(screen.getByText("Enable notifications")).toHaveClass(
      "text-destructive-text",
    );
  });

  it("keeps a caller's aria-describedby", () => {
    render(
      <>
        <p id="switch-hint">Sends a push when your gate changes</p>
        <Switch label="Gate alerts" aria-describedby="switch-hint" />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAttribute(
      "aria-describedby",
      "switch-hint",
    );
  });

  it("joins a caller's aria-describedby with its own error", () => {
    render(
      <>
        <p id="switch-hint">Sends a push when your gate changes</p>
        <Switch
          label="Gate alerts"
          aria-describedby="switch-hint"
          error="Turn this on to continue"
        />
      </>,
    );
    const ids = screen
      .getByRole("switch")
      .getAttribute("aria-describedby")
      ?.split(" ");
    const errorId = screen.getByText("Turn this on to continue").id;
    expect(ids).toEqual(["switch-hint", errorId]);
  });

  it("keeps a caller's aria-invalid when it sets no error", () => {
    render(<Switch label="Gate alerts" aria-invalid />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Switch description and state label (GAP-162)", () => {
  it("reads the description as the switch's description, not its name", () => {
    render(
      <Switch
        label="Gate alerts"
        description="Sends a push when your gate changes"
      />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAccessibleName("Gate alerts");
    expect(switchEl).toHaveAccessibleDescription(
      "Sends a push when your gate changes",
    );
  });

  it("joins the caller's description, its own and the error, in that order", () => {
    render(
      <>
        <p id="switch-hint">Alerts use data</p>
        <Switch
          label="Gate alerts"
          description="Sends a push"
          aria-describedby="switch-hint"
          error="Turn this on to continue"
        />
      </>,
    );
    expect(screen.getByRole("switch")).toHaveAccessibleDescription(
      "Alerts use data Sends a push Turn this on to continue",
    );
  });

  it("says its state in words that follow it and are not read", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch label="Gate alerts" showStateLabel />);
    const words = container.querySelector('[data-slot="state-label"]');
    expect(words).toHaveTextContent("Off");
    expect(words).toHaveAttribute("aria-hidden", "true");
    await user.click(screen.getByRole("switch"));
    expect(words).toHaveTextContent("On");
    // The switch is named by its label alone; its role says on or off.
    expect(screen.getByRole("switch")).toHaveAccessibleName("Gate alerts");
  });

  it("takes the words, and a controlled state", () => {
    const { container, rerender } = render(
      <Switch
        label="Alertes"
        showStateLabel
        onLabel="Activé"
        offLabel="Désactivé"
        checked
      />,
    );
    const words = () => container.querySelector('[data-slot="state-label"]');
    expect(words()).toHaveTextContent("Activé");
    rerender(
      <Switch
        label="Alertes"
        showStateLabel
        onLabel="Activé"
        offLabel="Désactivé"
        checked={false}
      />,
    );
    expect(words()).toHaveTextContent("Désactivé");
  });

  it("starts its words from defaultChecked", () => {
    const { container } = render(
      <Switch label="Gate alerts" showStateLabel defaultChecked />,
    );
    expect(
      container.querySelector('[data-slot="state-label"]'),
    ).toHaveTextContent("On");
  });
});

// Decisions 188 and 189 (17 Nov 2026): a switch standing for several
// features whose settings differ. The track is the theme fill with no thumb
// and a dash; role="switch" has no mixed state, so it is off to a screen
// reader with "Multiple values" as its description; a click turns it on.
describe("Switch mixed (decisions 188, 189)", () => {
  it("draws the theme fill and a dash, no thumb, and says Multiple values as its description", () => {
    const { container } = render(
      <Switch label="Step-free" mixed checked showStateLabel />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-checked", "false");
    expect(switchEl).toHaveAttribute("data-mixed", "");
    expect(switchEl).toHaveAccessibleName("Step-free");
    expect(switchEl).toHaveAccessibleDescription("Multiple values");
    expect(switchEl).toHaveClass("bg-theme-fill", "border-theme-fill");
    expect(switchEl).not.toHaveClass("bg-muted-foreground");
    const dash = switchEl.querySelector('[data-slot="mixed-dash"]');
    expect(dash).toHaveAttribute("aria-hidden", "true");
    expect(dash).toHaveClass("text-theme-fill-foreground", "h-4", "w-4");
    expect(switchEl.querySelector("span")).toBeNull();
    expect(
      container.querySelector('[data-slot="state-label"]'),
    ).toHaveTextContent("Multiple values");
  });

  it("is the destructive fill in error, the dash the thumb's surface, and joins its descriptions in order", () => {
    render(
      <Switch
        label="Step-free"
        description="Routes avoid stairs"
        error="Pick one"
        mixed
        mixedLabel="Valeurs multiples"
      />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveClass("bg-destructive", "border-destructive");
    expect(switchEl).not.toHaveClass("bg-theme-fill");
    expect(switchEl.querySelector('[data-slot="mixed-dash"]')).toHaveClass(
      "text-background",
    );
    expect(switchEl).toHaveAccessibleDescription(
      "Routes avoid stairs Valeurs multiples Pick one",
    );
  });

  it("turns on at a click, controlled, and reports on", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    function Product() {
      const [edit, setEdit] = React.useState<boolean | undefined>();
      return (
        <Switch
          label="Step-free"
          mixed={edit === undefined}
          // Some of the features are on: a click still turns it on.
          checked={edit ?? true}
          onCheckedChange={(checked) => {
            changes.push(checked);
            setEdit(checked);
          }}
          onResetMixed={() => setEdit(undefined)}
        />
      );
    }
    render(<Product />);
    await user.click(screen.getByRole("switch"));
    expect(changes).toEqual([true]);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("aria-checked", "true");
    expect(switchEl).not.toHaveAttribute("data-mixed");
    expect(switchEl.querySelector('[data-slot="mixed-dash"]')).toBeNull();
    expect(switchEl.querySelector("span")).toHaveAttribute(
      "data-state",
      "checked",
    );
    expect(switchEl).not.toHaveAccessibleDescription("Multiple values");
  });

  it("turns on at a click, uncontrolled, whatever it started from", async () => {
    const user = userEvent.setup();
    function Product() {
      const [mixed, setMixed] = React.useState(true);
      return (
        <Switch
          label="Step-free"
          mixed={mixed}
          defaultChecked
          onCheckedChange={() => setMixed(false)}
        />
      );
    }
    render(<Product />);
    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("offers the reset once edited; pressed, focus goes to the switch and it is mixed again", async () => {
    const user = userEvent.setup();
    function Product() {
      const [edit, setEdit] = React.useState<boolean | undefined>();
      return (
        <Switch
          label="Step-free"
          mixed={edit === undefined}
          checked={edit ?? false}
          onCheckedChange={setEdit}
          onResetMixed={() => setEdit(undefined)}
        />
      );
    }
    render(<Product />);
    expect(
      screen.queryByRole("button", { name: "Reset to multiple values" }),
    ).toBeNull();
    await user.click(screen.getByRole("switch"));
    await user.click(
      screen.getByRole("button", { name: "Reset to multiple values" }),
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveFocus();
    expect(switchEl).toHaveAttribute("data-mixed", "");
    expect(switchEl).toHaveAttribute("aria-checked", "false");
    expect(
      screen.queryByRole("button", { name: "Reset to multiple values" }),
    ).toBeNull();
  });

  it("never offers the reset while disabled, and takes the reset's words", () => {
    const { rerender } = render(
      <Switch label="Step-free" disabled onResetMixed={() => {}} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <Switch
        label="Step-free"
        onResetMixed={() => {}}
        resetMixedLabel="Revenir aux valeurs multiples"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Revenir aux valeurs multiples" }),
    ).toHaveAttribute("data-slot", "reset-mixed");
  });
});
