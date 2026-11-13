import * as React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsRow } from "./SettingsRow";
import { List } from "../List";
import { Switch } from "../Switch";
import { Input } from "../Input";

afterEach(cleanup);

// GAP-040, decision 135: one SettingsRow, on ListItem's slots, with
// inherited, overridden and reset states.

function Setting({ onReset }: { onReset?: () => void }) {
  const [value, setValue] = React.useState(true);
  const [state, setState] = React.useState<"inherited" | "overridden">(
    "overridden",
  );
  return (
    <List>
      <SettingsRow
        label="Show the floor selector"
        description="Lets visitors change levels."
        state={state}
        onReset={() => {
          setValue(false);
          setState("inherited");
          onReset?.();
        }}
        control={
          <Switch
            checked={value}
            onCheckedChange={(next) => {
              setValue(next);
              setState("overridden");
            }}
          />
        }
      />
    </List>
  );
}

describe("SettingsRow", () => {
  it("is a list row whose name and description name and describe its control", () => {
    render(
      <List>
        <SettingsRow
          label="Session timeout"
          description="Minutes before a visitor is signed out."
          control={<Input type="number" defaultValue={30} />}
        />
      </List>,
    );
    const row = screen.getByRole("listitem");
    expect(row).toHaveClass("kozmos-settings-row", "kozmos-list-item-slotted");
    const field = within(row).getByRole("spinbutton", {
      name: "Session timeout",
    });
    expect(field).toHaveAccessibleDescription(
      "Minutes before a visitor is signed out.",
    );
    // No state: no tag.
    expect(row.querySelector(".kozmos-settings-row-state")).toBeNull();
  });

  it("draws the inherited state as a tag read with the control, and offers no reset", () => {
    render(
      <List>
        <SettingsRow
          label="Analytics"
          state="inherited"
          onReset={() => {}}
          control={<Switch checked />}
        />
      </List>,
    );
    const toggle = screen.getByRole("switch", { name: "Analytics" });
    expect(toggle).toHaveAccessibleDescription("Inherited");
    expect(screen.getByRole("listitem")).toHaveAttribute(
      "data-state",
      "inherited",
    );
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).toBeNull();
  });

  it("offers Reset to default while overridden; pressed, focus goes to the control and the row is inherited", async () => {
    const onReset = vi.fn();
    render(<Setting onReset={onReset} />);
    const toggle = screen.getByRole("switch", {
      name: "Show the floor selector",
    });
    expect(toggle).toHaveAccessibleDescription(
      "Lets visitors change levels. Overridden",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reset to default" }),
    );
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveFocus();
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription(
      "Lets visitors change levels. Inherited",
    );
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).toBeNull();
    // Changed again, it is overridden again, and the reset comes back.
    await userEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: "Reset to default" }),
    ).toBeInTheDocument();
  });

  it("disables its control and reads the reason with it; a disabled row offers no reset", () => {
    render(
      <List>
        <SettingsRow
          label="Geofencing"
          state="overridden"
          onReset={() => {}}
          disabled
          disabledReason="Turn on Positioning first."
          control={<Switch checked />}
        />
      </List>,
    );
    const toggle = screen.getByRole("switch", { name: "Geofencing" });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAccessibleDescription(
      "Overridden Turn on Positioning first.",
    );
    expect(screen.getByRole("listitem")).toHaveAttribute("data-disabled");
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).toBeNull();
  });

  it("keeps a control's own name and description, and takes the product's words", () => {
    render(
      <List>
        <SettingsRow
          label="Banner"
          description="Shown above the map."
          state="overridden"
          overriddenLabel="Geändert"
          resetLabel="Zurücksetzen"
          onReset={() => {}}
          control={
            <Switch aria-label="Show the banner" aria-describedby="extra" />
          }
        />
      </List>,
    );
    const toggle = screen.getByRole("switch", { name: "Show the banner" });
    expect(toggle.getAttribute("aria-describedby")?.split(" ")[0]).toBe(
      "extra",
    );
    expect(screen.getByText("Geändert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zurücksetzen" }),
    ).toBeInTheDocument();
  });

  it("names and disables a control it cannot hand props to, where it is drawn", () => {
    const { rerender } = render(
      <List>
        <SettingsRow
          label="Banner text"
          description="Shown above the map."
          disabled
          disabledReason="Publish first."
          control={
            <>
              <input type="text" />
            </>
          }
        />
      </List>,
    );
    const field = screen.getByRole("textbox", { name: "Banner text" });
    expect(field).toHaveAccessibleDescription(
      "Shown above the map. Publish first.",
    );
    expect(field).toBeDisabled();
    rerender(
      <List>
        <SettingsRow
          label="Banner text"
          description="Shown above the map."
          control={
            <>
              <input type="text" />
            </>
          }
        />
      </List>,
    );
    expect(screen.getByRole("textbox", { name: "Banner text" })).toBeEnabled();
  });
});
