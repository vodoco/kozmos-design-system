import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom/vitest";
import { Input } from "../../components/Input/Input";
import { PropertyField } from "./PropertyField";
import * as dashboard from "../index";

describe("PropertyField", () => {
  it("is exported from the ./dashboard entry", () => {
    expect(dashboard.PropertyField).toBe(PropertyField);
  });

  it("is a group named by the property's caption", () => {
    render(
      <PropertyField name="Capacity">
        <Input aria-label="Capacity value" />
      </PropertyField>,
    );
    const group = screen.getByRole("group", { name: "Capacity" });
    expect(group).toContainElement(screen.getByLabelText("Capacity value"));
    expect(screen.getByText("Capacity")).toBeVisible();
  });

  it("removes the property from a red trash button named for it, by keyboard", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <PropertyField name="Capacity" onRemove={onRemove}>
        <Input aria-label="Capacity value" />
      </PropertyField>,
    );
    const remove = screen.getByRole("button", { name: "Remove Capacity" });
    // Kozmos's destructive tone (decision 61).
    expect(remove).toHaveClass("kozmos-button-ghost");
    expect(remove.getAttribute("style") ?? "").toMatch(/danger/);
    await user.tab();
    await user.tab();
    expect(remove).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("draws no remove or info button unless asked", () => {
    render(<PropertyField name="Capacity" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens what the property is from a named info button", async () => {
    const user = userEvent.setup();
    render(
      <PropertyField name="Capacity" info="How many people the space holds.">
        <Input aria-label="Capacity value" />
      </PropertyField>,
    );
    const info = screen.getByRole("button", { name: "About Capacity" });
    expect(screen.queryByText("How many people the space holds.")).toBeNull();
    info.focus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findByText("How many people the space holds."),
    ).toBeInTheDocument();
  });

  it("takes the buttons' names in the product's words", () => {
    render(
      <PropertyField
        name="Kapazität"
        info="…"
        infoLabel="Über Kapazität"
        onRemove={() => {}}
        removeLabel="Kapazität entfernen"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Über Kapazität" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kapazität entfernen" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PropertyField name="Capacity" info="People" onRemove={() => {}}>
        <Input aria-label="Capacity value" />
      </PropertyField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
