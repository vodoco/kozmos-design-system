import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "../Combobox";
import {
  FIELD_ACTION,
  FIELD_ACTIONS_ROW,
  fieldActionsRoom,
} from "../Combobox/field-actions";
import { MultiSelect } from "./MultiSelect";

const options = [
  { value: "filters", label: "Filters" },
  { value: "layers", label: "Layers" },
  { value: "routes", label: "Routes" },
];

// The host's layout effect reads the DOM of each commit it makes, after React
// has written it and before any effect of the field's own can correct it.
const useCommitEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

describe("MultiSelect: a prop change shows in the commit it arrives in", () => {
  describe.each([
    ["outside StrictMode", undefined],
    ["under StrictMode", React.StrictMode],
  ] as const)("%s", (_, wrapper) => {
    it.each(["disabled", "readOnly"] as const)(
      "draws no list in the commit that makes it %s",
      async (lock) => {
        const user = userEvent.setup();
        const commits: { list: boolean; expanded: string | null }[] = [];
        function Host({ locked }: { locked: boolean }) {
          useCommitEffect(() => {
            commits.push({
              list: document.querySelector('[role="listbox"]') !== null,
              expanded:
                document
                  .querySelector('[role="combobox"]')
                  ?.getAttribute("aria-expanded") ?? null,
            });
          });
          return (
            <MultiSelect
              label="Tools"
              options={options}
              {...{ [lock]: locked }}
            />
          );
        }
        const { rerender } = render(<Host locked={false} />, { wrapper });
        await user.click(screen.getByRole("combobox", { name: "Tools" }));
        expect(screen.getByRole("listbox")).toBeVisible();

        commits.length = 0;
        rerender(<Host locked />);
        expect(commits.length).toBeGreaterThan(0);
        for (const commit of commits)
          expect(commit).toEqual({ list: false, expanded: "false" });
        expect(screen.queryByRole("listbox")).toBeNull();
      },
    );

    it.each(["disabled", "readOnly"] as const)(
      "stays closed when it is no longer %s, until the visitor opens it",
      async (lock) => {
        const user = userEvent.setup();
        const Host = ({ locked }: { locked: boolean }) => (
          <MultiSelect
            label="Tools"
            options={options}
            {...{ [lock]: locked }}
          />
        );
        const { rerender } = render(<Host locked={false} />, { wrapper });
        const input = screen.getByRole("combobox", { name: "Tools" });
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

// What `aria-activedescendant` names in a commit, read by a Profiler as React
// commits it: every commit, the field's own included, not just the last.
function activeOptionNow() {
  const id = document
    .querySelector('[role="combobox"]')
    ?.getAttribute("aria-activedescendant");
  if (!id) return null;
  const option = document.getElementById(id);
  if (!option) return `undrawn ${id}`;
  const disabled = option.getAttribute("aria-disabled") === "true";
  return `${option.textContent?.trim()}${disabled ? " (disabled)" : ""}`;
}

describe("MultiSelect: the active option moves in the commit that changes it (GAP-231)", () => {
  describe.each([
    ["outside StrictMode", undefined],
    ["under StrictMode", React.StrictMode],
  ] as const)("%s", (_, wrapper) => {
    it("names the first enabled option in every commit after typing", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      render(
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect label="Tools" options={options} />
        </React.Profiler>,
        { wrapper },
      );
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(activeOptionNow()).toBe("Routes");

      // "e" keeps every option drawn; new text starts at the first.
      commits.length = 0;
      await user.keyboard("e");
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Filters");
    });

    it("names the first option in every commit after typing narrows the list", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      render(
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect label="Tools" options={options} />
        </React.Profiler>,
        { wrapper },
      );
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(activeOptionNow()).toBe("Routes");

      // "l" draws Filters and Layers: the third row is gone.
      commits.length = 0;
      await user.keyboard("l");
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Filters");
    });
  });
});

describe("MultiSelect: opening names no option until it is drawn (GAP-231)", () => {
  describe.each([
    ["outside StrictMode", undefined],
    ["under StrictMode", React.StrictMode],
  ] as const)("%s", (_, wrapper) => {
    it.each(["the pointer", "ArrowDown"] as const)(
      "names a drawn option, or none, in every commit of opening with %s",
      async (how) => {
        const user = userEvent.setup();
        const commits: (string | null)[] = [];
        render(
          <React.Profiler
            id="field"
            onRender={() => commits.push(activeOptionNow())}
          >
            <MultiSelect label="Tools" options={options} />
          </React.Profiler>,
          { wrapper },
        );
        const input = screen.getByRole("combobox", { name: "Tools" });
        if (how === "ArrowDown") {
          input.focus();
          await user.keyboard("{Escape}");
        }
        commits.length = 0;
        if (how === "ArrowDown") await user.keyboard("{ArrowDown}");
        else await user.click(input);
        expect(screen.getByRole("listbox")).toBeVisible();
        expect(commits.length).toBeGreaterThan(0);
        // Drawn and enabled, or none: never an option still to be drawn.
        for (const commit of commits)
          expect(commit ?? "none").not.toMatch(/undrawn|\(disabled\)/);
        expect(commits.at(-1)).not.toBeNull();
      },
    );
  });
});

describe("MultiSelect: a choice leaves the active option where it is", () => {
  describe.each([
    ["outside StrictMode", undefined],
    ["under StrictMode", React.StrictMode],
  ] as const)("%s", (_, wrapper) => {
    // A host that holds the choice, and passes its options anew each render,
    // as a product mapping its data does.
    function Held({
      initial = [],
      maxSelected,
      onValueChange,
      onCommit,
    }: {
      initial?: string[];
      maxSelected?: number;
      onValueChange?: (values: string[]) => void;
      onCommit?: () => void;
    }) {
      const [value, setValue] = React.useState(initial);
      return (
        <React.Profiler id="field" onRender={() => onCommit?.()}>
          <MultiSelect
            label="Tools"
            maxSelected={maxSelected}
            options={options.map((option) => ({ ...option }))}
            value={value}
            onValueChange={(next) => {
              setValue(next);
              onValueChange?.(next);
            }}
          />
        </React.Profiler>
      );
    }

    it.each([
      ["chosen by the field", "uncontrolled"],
      ["held by the product, options passed anew", "controlled"],
    ] as const)(
      "chooses two options with ArrowDown, Enter, ArrowDown, Enter (%s)",
      async (_, mode) => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const commits: (string | null)[] = [];
        render(
          mode === "uncontrolled" ? (
            <React.Profiler
              id="field"
              onRender={() => commits.push(activeOptionNow())}
            >
              <MultiSelect
                label="Tools"
                options={options}
                onValueChange={onValueChange}
              />
            </React.Profiler>
          ) : (
            <Held
              onValueChange={onValueChange}
              onCommit={() => commits.push(activeOptionNow())}
            />
          ),
          { wrapper },
        );
        await user.click(screen.getByRole("combobox", { name: "Tools" }));
        await user.keyboard("{ArrowDown}");
        expect(activeOptionNow()).toBe("Layers");

        commits.length = 0;
        await user.keyboard("{Enter}");
        const choiceCommits = [...commits];
        await user.keyboard("{ArrowDown}{Enter}");
        expect(onValueChange.mock.calls.map(([values]) => values)).toEqual([
          ["layers"],
          ["layers", "routes"],
        ]);
        expect(activeOptionNow()).toBe("Routes");
        // Every commit of the first choice kept Layers, the option chosen.
        expect(choiceCommits.length).toBeGreaterThan(0);
        for (const commit of choiceCommits) expect(commit).toBe("Layers");
      },
    );

    it("keeps the option chosen with the pointer active", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      render(
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect label="Tools" options={options} />
        </React.Profiler>,
        { wrapper },
      );
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.hover(screen.getByRole("option", { name: "Routes" }));
      expect(activeOptionNow()).toBe("Routes");

      commits.length = 0;
      await user.click(screen.getByRole("option", { name: "Routes" }));
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Routes");
    });

    it("keeps the option chosen while text is typed active when the text clears", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      render(
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect label="Tools" options={options} />
        </React.Profiler>,
        { wrapper },
      );
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      // "ers" draws Filters and Layers.
      await user.keyboard("ers{ArrowDown}");
      expect(activeOptionNow()).toBe("Layers");

      commits.length = 0;
      await user.keyboard("{Enter}");
      expect(screen.getByRole("combobox", { name: "Tools" })).toHaveValue("");
      expect(screen.getAllByRole("option")).toHaveLength(3);
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Layers");
    });

    it("moves on from the option chosen under typed text when the product disables it", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      // The product disables an option once it is chosen.
      function Host() {
        const [value, setValue] = React.useState<string[]>([]);
        return (
          <React.Profiler
            id="field"
            onRender={() => commits.push(activeOptionNow())}
          >
            <MultiSelect
              label="Tools"
              options={options.map((option) => ({
                ...option,
                disabled: value.includes(option.value),
              }))}
              value={value}
              onValueChange={setValue}
            />
          </React.Profiler>
        );
      }
      render(<Host />, { wrapper });
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      // "ers" draws Filters and Layers.
      await user.keyboard("ers{ArrowDown}");
      expect(activeOptionNow()).toBe("Layers");

      commits.length = 0;
      await user.keyboard("{Enter}");
      expect(screen.getAllByRole("option")).toHaveLength(3);
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Routes");
    });

    it("starts again at the first option when new options of the same count arrive", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      const Host = ({ list }: { list: typeof options }) => (
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect label="Tools" options={list} />
        </React.Profiler>
      );
      const { rerender } = render(<Host list={options} />, { wrapper });
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(activeOptionNow()).toBe("Routes");

      commits.length = 0;
      rerender(
        <Host
          list={[
            { value: "floors", label: "Floors" },
            { value: "zones", label: "Zones" },
            { value: "pins", label: "Pins" },
          ]}
        />,
      );
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Floors");
    });

    it("names no option while every option is disabled, and the first when they are enabled again", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      const Host = ({ off }: { off: boolean }) => (
        <React.Profiler
          id="field"
          onRender={() => commits.push(activeOptionNow())}
        >
          <MultiSelect
            label="Tools"
            options={options.map((option) => ({ ...option, disabled: off }))}
          />
        </React.Profiler>
      );
      const { rerender } = render(<Host off={false} />, { wrapper });
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.keyboard("{ArrowDown}");
      expect(activeOptionNow()).toBe("Layers");

      commits.length = 0;
      rerender(<Host off />);
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBeNull();

      commits.length = 0;
      rerender(<Host off={false} />);
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Filters");
    });

    it("moves on from an option that maxSelected disables, to the next it can choose", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      function Host({ value }: { value: string[] }) {
        return (
          <React.Profiler
            id="field"
            onRender={() => commits.push(activeOptionNow())}
          >
            <MultiSelect
              label="Tools"
              maxSelected={2}
              options={options}
              value={value}
            />
          </React.Profiler>
        );
      }
      const { rerender } = render(<Host value={["filters"]} />, { wrapper });
      await user.click(screen.getByRole("combobox", { name: "Tools" }));
      await user.keyboard("{ArrowDown}");
      expect(activeOptionNow()).toBe("Layers");

      // The product's second choice reaches the limit: Layers can no longer
      // be chosen, and the next option on from it, Routes, is active.
      commits.length = 0;
      rerender(<Host value={["filters", "routes"]} />);
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Routes");
    });
  });
});

describe("MultiSelect", () => {
  it("selects and removes multiple options", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <MultiSelect
        label="Tools"
        options={options}
        onValueChange={handleValueChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Tools" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Filters" }));
    await user.click(screen.getByRole("option", { name: "Layers" }));

    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Layers").length).toBeGreaterThan(0);
    expect(handleValueChange).toHaveBeenLastCalledWith(
      ["filters", "layers"],
      [options[0], options[1]],
    );

    await user.click(screen.getByRole("button", { name: "Remove Filters" }));
    expect(handleValueChange).toHaveBeenLastCalledWith(
      ["layers"],
      [options[1]],
    );
  });

  it("marks selected listbox options", async () => {
    const user = userEvent.setup();

    render(<MultiSelect options={options} defaultValue={["routes"]} />);

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Routes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("uses stable active option ids independent of option values", async () => {
    const user = userEvent.setup();

    render(
      <MultiSelect
        id="tool-select"
        options={[{ value: "route planning", label: "Route planning" }]}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      "tool-select-option-0",
    );
    expect(screen.getByRole("option")).toHaveAttribute(
      "id",
      "tool-select-option-0",
    );
  });

  describe("clearing every choice (R3)", () => {
    // The clear button goes with the choices it clears, and focus went down
    // with it, to the page: a keyboard had to find its way back to the field.
    // The field takes focus now, with its list closed — the visitor cleared
    // the choice, and did not ask for options — until they type or press an
    // arrow key.
    const field = () => screen.getByRole("combobox", { name: "Tools" });
    const clear = () =>
      screen.getByRole("button", { name: "Clear selected options" });

    it("hands focus to the field, with its list closed", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <MultiSelect
          defaultValue={["filters", "layers"]}
          label="Tools"
          onValueChange={onValueChange}
          options={options}
        />,
      );
      clear().focus();
      await user.keyboard("{Enter}");

      expect(onValueChange).toHaveBeenLastCalledWith([], []);
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("lets the visitor type straight away, or open the list with an arrow key", async () => {
      const user = userEvent.setup();
      render(
        <MultiSelect
          defaultValue={["filters"]}
          label="Tools"
          options={options}
        />,
      );
      clear().focus();
      await user.keyboard(" ");
      expect(field()).toHaveFocus();
      expect(screen.queryByRole("listbox")).toBeNull();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("listbox")).toBeVisible();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();

      await user.keyboard("lay");
      expect(field()).toHaveValue("lay");
      expect(screen.getByRole("listbox")).toBeVisible();
      expect(screen.getByRole("option", { name: "Layers" })).toBeVisible();

      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("button", { name: "Remove Layers" }),
      ).toBeInTheDocument();
    });

    it("hands focus to the field when the product holds the choices", async () => {
      const user = userEvent.setup();
      function Held({ refuse = false }: { refuse?: boolean }) {
        const [value, setValue] = React.useState(["routes"]);
        return (
          <MultiSelect
            label="Tools"
            onValueChange={(next) => {
              if (!refuse) setValue(next);
            }}
            options={options}
            value={value}
          />
        );
      }
      const { unmount } = render(<Held />);
      clear().focus();
      await user.keyboard("{Enter}");
      expect(
        screen.queryByRole("button", { name: "Remove Routes" }),
      ).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveAttribute("aria-expanded", "false");
      unmount();

      // A product that keeps its choices: the button stays, and focus still
      // goes to the field, which is where the keyboard goes on from.
      render(<Held refuse />);
      clear().focus();
      await user.keyboard("{Enter}");
      expect(
        screen.getByRole("button", { name: "Remove Routes" }),
      ).toBeInTheDocument();
      expect(field()).toHaveFocus();
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("offers nothing to clear while disabled or read-only", async () => {
      const onValueChange = vi.fn();
      const { rerender } = render(
        <MultiSelect
          defaultValue={["filters"]}
          disabled
          label="Tools"
          onValueChange={onValueChange}
          options={options}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      rerender(
        <MultiSelect
          defaultValue={["filters"]}
          label="Tools"
          onValueChange={onValueChange}
          options={options}
          readOnly
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Clear selected options" }),
      ).toBeNull();
      const user = userEvent.setup();
      await user.click(field());
      await user.keyboard("{Backspace}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    it("still hands focus to the field when one choice is removed", async () => {
      const user = userEvent.setup();
      render(
        <MultiSelect
          defaultValue={["filters", "layers"]}
          label="Tools"
          options={options}
        />,
      );
      screen.getByRole("button", { name: "Remove Filters" }).focus();
      await user.keyboard("{Enter}");
      expect(field()).toHaveFocus();
      expect(
        screen.getByRole("button", { name: "Remove Layers" }),
      ).toBeInTheDocument();
    });
  });

  // The owner's decision of 24 Oct: MultiSelect's clear and open are
  // Combobox's (Combobox/field-actions.ts), each as tall as the field.
  // scripts/check-density.mjs measures them, and check-field-actions.mjs
  // hovers and focuses them, in a browser; these hold what they do.
  describe("its clear and open buttons", () => {
    const renderTools = (chosen: string[] = ["filters"]) => {
      const field = React.createRef<HTMLDivElement>();
      render(
        <MultiSelect
          ref={field}
          defaultValue={chosen}
          label="Tools"
          options={options}
        />,
      );
      return field;
    };

    it("sit inside the field the caller's ref reaches", () => {
      const field = renderTools();
      expect(field.current).toContainElement(
        screen.getByRole("button", { name: "Clear selected options" }),
      );
      expect(field.current).toContainElement(
        screen.getByRole("button", { name: "Open options" }),
      );
    });

    it("name what they do, the open button as the list changes", async () => {
      const user = userEvent.setup();
      renderTools();
      await user.click(screen.getByRole("button", { name: "Open options" }));
      expect(screen.getByRole("combobox", { name: "Tools" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await user.click(screen.getByRole("button", { name: "Close options" }));
      expect(screen.getByRole("combobox", { name: "Tools" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(
        screen.getByRole("button", { name: "Open options" }),
      ).toBeInTheDocument();
    });

    it("follow the input in Tab order: the clear, then the open", async () => {
      const user = userEvent.setup();
      renderTools();
      screen.getByRole("combobox", { name: "Tools" }).focus();
      await user.tab();
      expect(
        screen.getByRole("button", { name: "Clear selected options" }),
      ).toHaveFocus();
      await user.tab();
      expect(
        screen.getByRole("button", { name: /^(Open|Close) options$/ }),
      ).toHaveFocus();
      await user.tab({ shift: true });
      await user.tab({ shift: true });
      expect(screen.getByRole("combobox", { name: "Tools" })).toHaveFocus();
    });

    it("are Combobox's, from the one module both draw from", () => {
      const field = renderTools();
      const open = screen.getByRole("button", { name: "Open options" });
      expect(open.className).toBe(FIELD_ACTION);
      expect(
        screen.getByRole("button", { name: "Clear selected options" })
          .className,
      ).toBe(FIELD_ACTION);
      expect(open.parentElement?.className).toBe(FIELD_ACTIONS_ROW);
      expect(field.current).toHaveClass(fieldActionsRoom(true));
      cleanup();
      render(
        <Combobox
          clearable
          defaultValue="filters"
          label="View"
          options={options}
        />,
      );
      const comboboxOpen = screen.getByRole("button", { name: "Open options" });
      expect(comboboxOpen.className).toBe(FIELD_ACTION);
      expect(comboboxOpen.parentElement?.className).toBe(FIELD_ACTIONS_ROW);
      expect(screen.getByRole("combobox")).toHaveClass(fieldActionsRoom(true));
    });
  });
});

/**
 * GAP-225: reaching `maxSelected` disables the remaining options, and a
 * screen reader is told so, once, in the product's words. The limit has a
 * region of its own, in the field from its first render and empty, beside the
 * empty text's; only its words change.
 */
describe("MultiSelect's limit is said when the selection reaches it", () => {
  // The empty text's status comes first, the limit's after it.
  function limitStatus() {
    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(2);
    return statuses[1]!;
  }

  // Every change a screen reader could read in the region: one record per
  // change of its words.
  function watch(node: HTMLElement) {
    const said: string[] = [];
    const observer = new MutationObserver(() => {
      said.push(node.textContent ?? "");
    });
    observer.observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return {
      said: async () => {
        await Promise.resolve();
        return said.filter(Boolean);
      },
      stop: () => observer.disconnect(),
    };
  }

  it("says the limit once on reaching it, and not on unrelated re-renders", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MultiSelect label="Tools" options={options} maxSelected={2} />,
    );
    const status = limitStatus();
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();
    const region = watch(status);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "Filters" }));
    expect(status).toBeEmptyDOMElement();
    await user.click(screen.getByRole("option", { name: "Layers" }));
    // The same node, now with the words.
    expect(limitStatus()).toBe(status);
    expect(status).toHaveTextContent("Limit of 2 reached");
    expect(screen.getByRole("option", { name: "Routes" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // Typing, an empty list and its own status, closing, opening and a host
    // re-render change nothing in the limit's region.
    await user.type(input, "zz");
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "No results found",
    );
    await user.clear(input);
    await user.keyboard("{Escape}");
    await user.click(input);
    rerender(
      <MultiSelect
        label="Tools"
        options={options}
        maxSelected={2}
        helperText="Choose two"
      />,
    );
    expect(status).toHaveTextContent("Limit of 2 reached");
    expect(await region.said()).toEqual(["Limit of 2 reached"]);
    region.stop();
  });

  it("says it again only after the selection drops below and reaches it again", async () => {
    const user = userEvent.setup();
    render(<MultiSelect label="Tools" options={options} maxSelected={2} />);
    const status = limitStatus();
    const region = watch(status);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Filters" }));
    await user.click(screen.getByRole("option", { name: "Layers" }));
    expect(status).toHaveTextContent("Limit of 2 reached");

    // Below the limit: the words go.
    await user.click(screen.getByRole("button", { name: "Remove Layers" }));
    expect(status).toBeEmptyDOMElement();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Routes" }));
    expect(limitStatus()).toBe(status);
    expect(status).toHaveTextContent("Limit of 2 reached");
    expect(await region.said()).toEqual([
      "Limit of 2 reached",
      "Limit of 2 reached",
    ]);
    region.stop();
  });

  it("says the product's own words", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        label="Araçlar"
        options={options}
        maxSelected={1}
        maxSelectedLabel={(max) => `En fazla ${max} seçenek seçilebilir`}
      />,
    );
    const status = limitStatus();
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Routes" }));
    expect(status).toHaveTextContent("En fazla 1 seçenek seçilebilir");
    expect(screen.queryByText("Limit of 1 reached")).toBeNull();
  });

  it("says the limit reached with the keyboard", async () => {
    const user = userEvent.setup();
    render(<MultiSelect label="Tools" options={options} maxSelected={2} />);
    const status = limitStatus();
    await user.click(screen.getByRole("combobox"));
    // Filters, then the arrow on to Layers.
    await user.keyboard("{Enter}");
    expect(status).toBeEmptyDOMElement();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Layers" }).id,
    );
    await user.keyboard("{Enter}");
    expect(
      screen
        .getAllByRole("button", { name: /^Remove / })
        .map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Remove Filters", "Remove Layers"]);
    expect(status).toHaveTextContent("Limit of 2 reached");
  });

  it("says a limit that a value the host sets reaches", () => {
    const { rerender } = render(
      <MultiSelect
        label="Tools"
        options={options}
        maxSelected={2}
        value={["filters"]}
      />,
    );
    const status = limitStatus();
    rerender(
      <MultiSelect
        label="Tools"
        options={options}
        maxSelected={2}
        value={["filters", "layers"]}
      />,
    );
    expect(limitStatus()).toBe(status);
    expect(status).toHaveTextContent("Limit of 2 reached");
  });

  it("says a value over the limit, once, and not again as it comes down to it", async () => {
    const user = userEvent.setup();
    const props = { label: "Tools", options, maxSelected: 2 };
    const { rerender } = render(<MultiSelect {...props} value={[]} />);
    const status = limitStatus();
    const region = watch(status);
    // Below to over in one step: the others are disabled, so it is said.
    rerender(
      <MultiSelect {...props} value={["filters", "layers", "routes"]} />,
    );
    expect(status).toHaveTextContent("Limit of 2 reached");
    // Over to at: still at the limit, nothing new to say.
    rerender(<MultiSelect {...props} value={["filters", "layers"]} />);
    expect(status).toHaveTextContent("Limit of 2 reached");
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Routes" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(await region.said()).toEqual(["Limit of 2 reached"]);
    region.stop();
  });

  it("says new words at the limit when the limit or its label changes", () => {
    const value = ["filters", "layers"];
    const { rerender } = render(
      <MultiSelect
        label="Tools"
        options={options}
        value={[]}
        maxSelected={2}
      />,
    );
    const status = limitStatus();
    rerender(
      <MultiSelect
        label="Tools"
        options={options}
        value={value}
        maxSelected={2}
      />,
    );
    expect(status).toHaveTextContent("Limit of 2 reached");
    // Another language, at the same limit: its words replace the old ones.
    rerender(
      <MultiSelect
        label="Araçlar"
        options={options}
        value={value}
        maxSelected={2}
        maxSelectedLabel={(max) => `En fazla ${max} seçenek`}
      />,
    );
    expect(limitStatus()).toBe(status);
    expect(status).toHaveTextContent("En fazla 2 seçenek");
  });

  it("says nothing for a limit given in the render that mounts its region", () => {
    const value = ["filters", "layers"];
    const { rerender } = render(
      <MultiSelect label="Tools" options={options} value={value} />,
    );
    // No limit, no region of its own.
    expect(screen.getAllByRole("status")).toHaveLength(1);
    rerender(
      <MultiSelect
        label="Tools"
        options={options}
        value={value}
        maxSelected={2}
      />,
    );
    expect(limitStatus()).toBeEmptyDOMElement();
  });

  it("takes its region away with the limit, and says nothing when the limit comes back already met", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MultiSelect label="Tools" options={options} maxSelected={2} />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Filters" }));
    await user.click(screen.getByRole("option", { name: "Layers" }));
    expect(limitStatus()).toHaveTextContent("Limit of 2 reached");

    rerender(<MultiSelect label="Tools" options={options} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryByText("Limit of 2 reached")).toBeNull();
    expect(screen.getByRole("option", { name: "Routes" })).not.toHaveAttribute(
      "aria-disabled",
    );

    rerender(<MultiSelect label="Tools" options={options} maxSelected={2} />);
    expect(limitStatus()).toBeEmptyDOMElement();
  });

  it("says nothing for a selection that was already at the limit when it mounted", () => {
    render(
      <MultiSelect
        label="Tools"
        options={options}
        maxSelected={2}
        defaultValue={["filters", "layers"]}
      />,
    );
    expect(limitStatus()).toBeEmptyDOMElement();
  });
});
