import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";

const options = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
  { value: "activity", label: "Activity" },
];

// The host's layout effect reads the DOM of each commit it makes, after React
// has written it and before any effect of the field's own can correct it.
const useCommitEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;
const strictModes = [
  ["outside StrictMode", undefined],
  ["under StrictMode", React.StrictMode],
] as const;

describe("Combobox: a prop change shows in the commit it arrives in", () => {
  describe.each(strictModes)("%s", (_, wrapper) => {
    it("shows the chosen option's label in the commit that chooses or renames it", () => {
      const commits: { value: string; label?: string; shown?: string }[] = [];
      function Host({
        list = options,
        value,
      }: {
        list?: typeof options;
        value: string;
      }) {
        const input = React.useRef<HTMLInputElement>(null);
        useCommitEffect(() => {
          commits.push({
            value,
            label: list.find((option) => option.value === value)?.label ?? "",
            shown: input.current?.value,
          });
        });
        return <Combobox ref={input} options={list} value={value} />;
      }
      const { rerender } = render(<Host value="overview" />, { wrapper });
      rerender(<Host value="details" />);
      rerender(
        <Host
          list={options.map((option) =>
            option.value === "details"
              ? { ...option, label: "Details (renamed)" }
              : option,
          )}
          value="details"
        />,
      );
      rerender(<Host value="" />);

      expect(commits.map(({ value }) => value)).toEqual(
        expect.arrayContaining(["overview", "details", ""]),
      );
      expect(commits.map(({ label }) => label)).toContain("Details (renamed)");
      for (const commit of commits)
        expect(commit.shown, `the commit for "${commit.value}"`).toBe(
          commit.label,
        );
    });

    it("writes no label into its own text while the product holds inputValue, nor when it lets go", () => {
      // A choice made while the product holds the text is not copied into
      // the field's own text: letting go after `value` has moved shows the
      // field's own text, not the new choice's label.
      const { rerender } = render(
        <Combobox options={options} value="overview" inputValue="Overview" />,
        { wrapper },
      );
      const input = screen.getByRole("combobox");
      rerender(
        <Combobox options={options} value="details" inputValue="Overview" />,
      );
      expect(input).toHaveValue("Overview");
      rerender(<Combobox options={options} value="details" />);
      expect(input).toHaveValue("Overview");
    });

    it.each(["disabled", "readOnly"] as const)(
      "draws no popup in the commit that makes it %s",
      async (lock) => {
        const user = userEvent.setup();
        const commits: { popup: boolean; expanded: string | null }[] = [];
        function Host({ locked }: { locked: boolean }) {
          const input = React.useRef<HTMLInputElement>(null);
          useCommitEffect(() => {
            commits.push({
              popup: document.querySelector("[data-combobox-popup]") !== null,
              expanded: input.current?.getAttribute("aria-expanded") ?? null,
            });
          });
          return (
            <Combobox
              ref={input}
              label="View"
              options={options}
              {...{ [lock]: locked }}
            />
          );
        }
        const { rerender } = render(<Host locked={false} />, { wrapper });
        await user.click(screen.getByRole("combobox", { name: "View" }));
        expect(screen.getByRole("listbox")).toBeVisible();

        commits.length = 0;
        rerender(<Host locked />);
        expect(commits.length).toBeGreaterThan(0);
        for (const commit of commits)
          expect(commit).toEqual({ popup: false, expanded: "false" });
        expect(screen.queryByRole("listbox")).toBeNull();
      },
    );

    it.each(["disabled", "readOnly"] as const)(
      "stays closed when it is no longer %s, until the visitor opens it",
      async (lock) => {
        const user = userEvent.setup();
        const Host = ({ locked }: { locked: boolean }) => (
          <Combobox label="View" options={options} {...{ [lock]: locked }} />
        );
        const { rerender } = render(<Host locked={false} />, { wrapper });
        const input = screen.getByRole("combobox", { name: "View" });
        await user.click(input);
        expect(screen.getByRole("listbox")).toBeVisible();

        rerender(<Host locked />);
        rerender(<Host locked={false} />);
        expect(input).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("listbox")).toBeNull();

        await user.click(screen.getByRole("button", { name: "Open options" }));
        expect(screen.getByRole("listbox")).toBeVisible();
      },
    );
  });
});

describe("Combobox: the visitor's typed text is kept (GAP-232)", () => {
  // Replaces the field's whole text, as a visitor who selects it and types.
  const replacing = (input: HTMLInputElement) => ({
    initialSelectionStart: 0,
    initialSelectionEnd: input.value.length,
  });

  describe.each(strictModes)("%s", (_, wrapper) => {
    it("keeps every character typed while an async search drops the chosen option", async () => {
      const user = userEvent.setup();
      // A server search: each query brings only the options that match it,
      // so the chosen "Overview" leaves `options` as "Act" is typed.
      function AsyncSearch() {
        const [list, setList] = React.useState(options);
        return (
          <Combobox
            label="View"
            options={list}
            defaultValue="overview"
            filterOption={() => true}
            onInputValueChange={(query) =>
              setList(
                options.filter((option) =>
                  option.label.toLowerCase().includes(query.toLowerCase()),
                ),
              )
            }
          />
        );
      }
      render(<AsyncSearch />, { wrapper });
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      expect(input).toHaveValue("Overview");

      await user.type(input, "Act", replacing(input));
      expect(input).toHaveValue("Act");
      expect(
        screen.getAllByRole("option").map((option) => option.textContent),
      ).toEqual(["Activity"]);
    });

    it("keeps every character typed when the product clears value in onInputValueChange", async () => {
      const user = userEvent.setup();
      const changes: string[] = [];
      // "Typing clears the choice": the text no longer names the option.
      function ClearsOnType() {
        const [value, setValue] = React.useState("overview");
        return (
          <Combobox
            label="View"
            options={options}
            value={value}
            onValueChange={setValue}
            onInputValueChange={(text) => {
              changes.push(text);
              setValue("");
            }}
          />
        );
      }
      render(<ClearsOnType />, { wrapper });
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      expect(input).toHaveValue("Overview");

      await user.type(input, "Det", replacing(input));
      expect(input).toHaveValue("Det");
      expect(changes).toEqual(["D", "De", "Det"]);

      // A choice made after typing still shows its label.
      await user.click(screen.getByRole("option", { name: "Details" }));
      expect(input).toHaveValue("Details");
    });

    it("shows a new value's label when the host sets it, even over typed text", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Combobox label="View" options={options} value="overview" />,
        { wrapper },
      );
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      await user.type(input, "Ac", replacing(input));
      expect(input).toHaveValue("Ac");

      rerender(<Combobox label="View" options={options} value="details" />);
      expect(input).toHaveValue("Details");
    });

    it("keeps typed text when the chosen option is renamed, and follows a rename while it shows the label", async () => {
      const user = userEvent.setup();
      const renamed = (label: string) =>
        options.map((option) =>
          option.value === "overview" ? { ...option, label } : option,
        );
      const { rerender } = render(
        <Combobox label="View" options={options} defaultValue="overview" />,
        { wrapper },
      );
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      rerender(
        <Combobox
          label="View"
          options={renamed("Summary")}
          defaultValue="overview"
        />,
      );
      expect(input).toHaveValue("Summary");

      await user.type(input, "Su", replacing(input));
      rerender(
        <Combobox
          label="View"
          options={renamed("Synopsis")}
          defaultValue="overview"
        />,
      );
      expect(input).toHaveValue("Su");
    });

    it("keeps nothing typed when an async search brings the chosen option back after the visitor erased their text", async () => {
      const user = userEvent.setup();
      function AsyncSearch() {
        const [list, setList] = React.useState(options);
        return (
          <Combobox
            label="View"
            options={list}
            defaultValue="overview"
            filterOption={() => true}
            onInputValueChange={(query) =>
              setList(
                options.filter((option) =>
                  option.label.toLowerCase().includes(query.toLowerCase()),
                ),
              )
            }
          />
        );
      }
      render(<AsyncSearch />, { wrapper });
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      await user.type(input, "x", replacing(input));
      expect(input).toHaveValue("x");
      // Erased, the query is empty and the search brings "Overview" back.
      await user.type(input, "{Backspace}");
      expect(screen.getByRole("option", { name: "Overview" })).toBeVisible();
      expect(input).toHaveValue("");
    });

    it("empties the label it kept when the host clears the choice later", () => {
      const { rerender } = render(
        <Combobox label="View" options={options} value="overview" />,
        { wrapper },
      );
      const input = screen.getByRole("combobox", { name: "View" });
      rerender(
        <Combobox label="View" options={options.slice(1)} value="overview" />,
      );
      expect(input).toHaveValue("Overview");
      // A later render, as a dependent field reset by the product.
      rerender(<Combobox label="View" options={options.slice(1)} value="" />);
      expect(input).toHaveValue("");
    });

    it.each([
      ["value", { value: "details" }],
      ["defaultValue", { defaultValue: "details" }],
    ] as const)(
      "shows the label when options arrive after %s",
      (_name, choice) => {
        const { rerender } = render(
          <Combobox label="View" options={[]} {...choice} />,
          { wrapper },
        );
        const input = screen.getByRole("combobox", { name: "View" });
        expect(input).toHaveValue("");
        rerender(<Combobox label="View" options={options} {...choice} />);
        expect(input).toHaveValue("Details");
      },
    );

    it("follows a rename again once the visitor chooses the same option they typed over", async () => {
      const user = userEvent.setup();
      const renamed = options.map((option) =>
        option.value === "overview" ? { ...option, label: "Summary" } : option,
      );
      const { rerender } = render(
        <Combobox label="View" options={options} defaultValue="overview" />,
        { wrapper },
      );
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      await user.type(input, "Ov", replacing(input));
      await user.click(screen.getByRole("option", { name: "Overview" }));
      expect(input).toHaveValue("Overview");
      rerender(
        <Combobox label="View" options={renamed} defaultValue="overview" />,
      );
      expect(input).toHaveValue("Summary");
    });

    it("keeps a defaultInputValue draft when options arrive after the first render", () => {
      const { rerender } = render(
        <Combobox
          label="View"
          options={[]}
          defaultValue="overview"
          defaultInputValue="Ov"
        />,
        { wrapper },
      );
      const input = screen.getByRole("combobox", { name: "View" });
      rerender(
        <Combobox
          label="View"
          options={options}
          defaultValue="overview"
          defaultInputValue="Ov"
        />,
      );
      expect(input).toHaveValue("Ov");
    });

    it('shows a late label when defaultInputValue is "", which is no draft', () => {
      const { rerender } = render(
        <Combobox
          label="View"
          options={[]}
          value="overview"
          defaultInputValue=""
        />,
        { wrapper },
      );
      const input = screen.getByRole("combobox", { name: "View" });
      expect(input).toHaveValue("");
      rerender(
        <Combobox
          label="View"
          options={options}
          value="overview"
          defaultInputValue=""
        />,
      );
      expect(input).toHaveValue("Overview");
    });

    it("follows a rename after the product lets go of inputValue it held while the visitor typed", async () => {
      const user = userEvent.setup();
      function Host({ held, list }: { held: boolean; list: typeof options }) {
        const [text, setText] = React.useState("Overview");
        return (
          <Combobox
            label="View"
            options={list}
            value="overview"
            inputValue={held ? text : undefined}
            onInputValueChange={setText}
          />
        );
      }
      const { rerender } = render(<Host held list={options} />, { wrapper });
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      await user.type(input, "Ov", replacing(input));
      expect(input).toHaveValue("Ov");
      rerender(<Host held={false} list={options} />);
      expect(input).toHaveValue("Overview");
      rerender(
        <Host
          held={false}
          list={options.map((option) =>
            option.value === "overview"
              ? { ...option, label: "Summary" }
              : option,
          )}
        />,
      );
      expect(input).toHaveValue("Summary");
    });

    it("shows a late label for a value the host sets after the visitor typed and pressed Clear", async () => {
      const user = userEvent.setup();
      const later = [...options, { value: "later", label: "Later" }];
      const { rerender } = render(
        <Combobox label="View" options={options} value="overview" />,
        { wrapper },
      );
      const input = screen.getByRole<HTMLInputElement>("combobox", {
        name: "View",
      });
      await user.type(input, "Ov", replacing(input));
      await user.click(screen.getByRole("button", { name: "Clear selection" }));
      expect(input).toHaveValue("");
      rerender(<Combobox label="View" options={options} value="" />);
      // The host chooses before its options hold the choice.
      rerender(<Combobox label="View" options={options} value="later" />);
      rerender(<Combobox label="View" options={later} value="later" />);
      expect(input).toHaveValue("Later");
    });

    it("keeps the chosen label shown when its option leaves options, the choice unchanged", () => {
      const { rerender } = render(
        <Combobox label="View" options={options} value="overview" />,
        { wrapper },
      );
      const input = screen.getByRole("combobox", { name: "View" });
      rerender(
        <Combobox label="View" options={options.slice(1)} value="overview" />,
      );
      expect(input).toHaveValue("Overview");
    });
  });
});

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
      // With nothing in it the popup is not drawn at all (no empty box, and
      // no layer to swallow a parent's Escape).
      else expect(container.querySelector("[data-combobox-popup]")).toBeNull();
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
    // The popup draws the superseded helper's words, and the field's status
    // says them (field-popup-status.test.tsx).
    // In the theme's portal, outside the render's container.
    const popup = document.querySelector<HTMLElement>("[data-combobox-popup]");
    expect(within(popup!).getByText("Help")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Help");
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
