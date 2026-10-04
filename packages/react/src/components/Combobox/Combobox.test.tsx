import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";

const options = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];

describe("Combobox", () => {
  it("omits every ambiguous or blank command without confusing a same-ID value", async () => {
    const user = userEvent.setup();
    const invalid = vi.fn(),
      valid = vi.fn(),
      select = vi.fn();
    render(
      <Combobox
        options={[{ value: "map", label: "Map room" }]}
        onValueChange={select}
        popupActions={[
          { id: " ", label: "Blank", onAction: invalid },
          { id: "map", label: "First map", onAction: invalid },
          { id: "map", label: "Second map", onAction: invalid },
          { id: "position", label: "Current position", onAction: valid },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(
      screen.getAllByRole("option").map((node) => node.textContent),
    ).toEqual(["Map room", "Current position"]);
    await user.keyboard("{End}{Enter}");
    expect(valid).toHaveBeenCalledOnce();
    expect(invalid).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "renders matching status once with commands=%s and keeps its description",
    async (commands) => {
      const user = userEvent.setup();
      const { container } = render(
        <Combobox
          label="Origin"
          options={[]}
          helperText="Locations unavailable"
          status="error"
          emptyText="Locations unavailable"
          popupActions={
            commands ? [{ id: "map", label: "Map", onAction: vi.fn() }] : []
          }
        />,
      );
      const input = screen.getByRole("combobox");
      await user.click(input);
      expect(screen.getAllByText("Locations unavailable")).toHaveLength(1);
      expect(input).toHaveAccessibleDescription("Locations unavailable");
      if (commands)
        expect(screen.getByRole("option", { name: "Map" })).toBeVisible();
      else
        expect(
          container.querySelector("[data-combobox-popup]"),
        ).not.toHaveClass("shadow-overlay");
      await user.keyboard("{Escape}");
      expect(input).toHaveAttribute("aria-expanded", "false");
    },
  );

  it("deduplicates the rendered error, not a superseded helper", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Combobox
        options={[]}
        error="Error"
        helperText="Help"
        emptyText="Error"
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.getAllByText("Error")).toHaveLength(1);
    rerender(
      <Combobox
        options={[]}
        error="Error"
        helperText="Help"
        emptyText="Help"
      />,
    );
    expect(screen.getByText("Error")).toBeVisible();
    expect(screen.getByText("Help")).toBeVisible();
  });

  it("retains the keyboard choice across host rerenders and uses the latest action", async () => {
    const user = userEvent.setup();
    const oldAction = vi.fn(),
      nextAction = vi.fn();
    const { rerender } = render(
      <Combobox
        options={options}
        popupActions={[
          { id: "map", label: "Select from map", onAction: oldAction },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{End}");
    rerender(
      <Combobox
        options={options.map((option) => ({ ...option }))}
        popupActions={[
          { id: "map", label: "Select from map", onAction: nextAction },
        ]}
      />,
    );
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Select from map" }).id,
    );
    await user.keyboard("{Enter}");
    expect(nextAction).toHaveBeenCalledOnce();
    expect(oldAction).not.toHaveBeenCalled();
  });

  it("never runs a command for Enter on text that matches nothing", async () => {
    // Commands are picked, never chosen for the visitor: Enter after typing
    // a place that matches nothing ran the first command ("Current
    // position", "Select from map") in its place.
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onValueChange = vi.fn();
    render(
      <Combobox
        options={options}
        onValueChange={onValueChange}
        popupActions={[{ id: "map", label: "Select from map", onAction }]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Gate 99");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    await user.keyboard("{Enter}");
    expect(onAction).not.toHaveBeenCalled();
    expect(onValueChange).not.toHaveBeenCalled();
    // A command is still reached by moving to it.
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("makes the first matching option active as the query changes, not a command", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        options={options}
        popupActions={[
          { id: "map", label: "Select from map", onAction: vi.fn() },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Det");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Details" }).id,
    );
  });

  it("does not choose on the Enter that commits an IME composition in Safari", async () => {
    // Safari reports that Enter with isComposing false but keyCode 229.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={options} onValueChange={onValueChange} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Det");
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it("keeps an active value by identity on reorder and falls back when disabled or filtered", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Combobox options={options} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    rerender(<Combobox options={[options[1], options[0], options[2]]} />);
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Details" }).id,
    );
    rerender(
      <Combobox
        options={[{ ...options[1], disabled: true }, options[0], options[2]]}
      />,
    );
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Overview" }).id,
    );
    await user.type(input, "act");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Activity" }).id,
    );
  });

  it("does not let the wrapper dismiss an IME or caller-handled Escape", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Combobox options={options} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    fireEvent.keyDown(input, { key: "Escape", isComposing: true });
    expect(input).toHaveAttribute("aria-expanded", "true");
    rerender(
      <Combobox
        options={options}
        onKeyDown={(event) => event.preventDefault()}
      />,
    );
    await user.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });
  it("keeps action IDs separate from values and skips unavailable actions", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const unavailable = vi.fn();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Combobox
        label="Place"
        options={[{ value: "map", label: "Map room" }]}
        onValueChange={onValueChange}
        popupActions={[
          { id: "map", label: "Select from map", onAction },
          {
            id: "disabled",
            label: "Unavailable",
            disabled: true,
            onAction: unavailable,
          },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{End}{Enter}");
    expect(onAction).toHaveBeenCalledOnce();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(unavailable).not.toHaveBeenCalled();
    rerender(<Combobox label="Place" options={[]} popupActions={[]} />);
    await user.click(screen.getByRole("button", { name: "Open options" }));
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-activedescendant");
  });
  it("keeps popup commands separate from values and keyboard accessible without search matches", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    render(
      <Combobox
        label="Place"
        options={[]}
        inputValue="no match"
        clearable={false}
        onValueChange={onValueChange}
        onInputValueChange={onInputValueChange}
        popupActions={[{ id: "map", label: "Select from the map", onAction }]}
      />,
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    const action = screen.getByRole("option", { name: "Select from the map" });
    expect(action.closest('[role="listbox"]')).not.toBeNull();
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", action.id);
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledOnce();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onInputValueChange).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole("option", { name: "Select from the map" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open options" }));
    await user.keyboard("{Escape}");
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });
  it("keeps an initial search query until the selected identity changes", () => {
    const { rerender } = render(
      <Combobox options={options} value="" defaultInputValue="draft" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("draft");
    rerender(
      <Combobox options={options} value="overview" defaultInputValue="draft" />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("Overview");
    rerender(<Combobox options={options} value="" defaultInputValue="draft" />);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
  it("localizes disclosure and clearing controls", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        options={options}
        inputValue="Overview"
        clearLabel="Effacer"
        openLabel="Ouvrir"
        closeLabel="Fermer"
      />,
    );
    expect(screen.getByRole("button", { name: "Effacer" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ouvrir" }));
    expect(screen.getByRole("button", { name: "Fermer" })).toBeInTheDocument();
  });
  it("selects an option with keyboard navigation", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Combobox
        label="View"
        options={options}
        onValueChange={handleValueChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "View" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(input).toHaveValue("Details");
    expect(handleValueChange).toHaveBeenCalledWith("details", options[1]);
  });

  it("filters options from typed input", async () => {
    const user = userEvent.setup();

    render(<Combobox options={options} />);

    const input = screen.getByRole("combobox");
    await user.type(input, "act");

    expect(
      screen.getByRole("option", { name: "Activity" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Details" }),
    ).not.toBeInTheDocument();
  });

  it("links error text through aria-describedby", () => {
    render(<Combobox options={options} error="Choose a view" />);

    const input = screen.getByRole("combobox");
    const error = screen.getByText("Choose a view");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
  });

  it("uses stable active option ids independent of option values", async () => {
    const user = userEvent.setup();

    render(
      <Combobox
        id="view-combobox"
        options={[{ value: "activity stream", label: "Activity stream" }]}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "view-combobox-option-0",
    );
    expect(screen.getByRole("option")).toHaveAttribute(
      "id",
      "view-combobox-option-0",
    );
  });
});
