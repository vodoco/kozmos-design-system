import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type ComboboxOption } from "../Combobox";
import { Listbox } from "./Listbox";

const options = [
  { value: "alpha", label: "Alpha" },
  { value: "beta", label: "Beta" },
  { value: "gamma", label: "Gamma" },
];

// What `aria-activedescendant` names in a commit, read by a Profiler as React
// commits it: every commit, the list's own included, not just the last.
function activeOptionNow() {
  const id = document
    .querySelector('[role="listbox"]')
    ?.getAttribute("aria-activedescendant");
  if (!id) return null;
  const option = document.getElementById(id);
  if (!option) return `undrawn ${id}`;
  const disabled = option.getAttribute("aria-disabled") === "true";
  return `${option.textContent?.trim()}${disabled ? " (disabled)" : ""}`;
}

describe("Listbox: the active option moves in the commit that changes it (GAP-231)", () => {
  describe.each([
    ["outside StrictMode", undefined],
    ["under StrictMode", React.StrictMode],
  ] as const)("%s", (_, wrapper) => {
    it("names the first enabled option in every commit after its options change", async () => {
      const user = userEvent.setup();
      const commits: (string | null)[] = [];
      const Host = ({ list }: { list: ComboboxOption[] }) => (
        <React.Profiler
          id="list"
          onRender={() => commits.push(activeOptionNow())}
        >
          <Listbox aria-label="Routes" options={list} />
        </React.Profiler>
      );
      const { rerender } = render(<Host list={options} />, { wrapper });
      await user.tab();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(activeOptionNow()).toBe("Gamma");

      // The third row of the new options cannot be used.
      commits.length = 0;
      rerender(
        <Host
          list={[
            { value: "delta", label: "Delta" },
            { value: "epsilon", label: "Epsilon" },
            { value: "zeta", label: "Zeta", disabled: true },
          ]}
        />,
      );
      expect(commits.length).toBeGreaterThan(0);
      for (const commit of commits) expect(commit).toBe("Delta");
    });
  });
});

describe("Listbox: a choice leaves the active option where it is", () => {
  it("keeps it when the product holds the choice and passes its options anew", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Held() {
      const [value, setValue] = React.useState<string[]>(["alpha"]);
      return (
        <Listbox
          aria-label="Routes"
          multiple
          options={options.map((option) => ({ ...option }))}
          value={value}
          onValueChange={(next) => {
            setValue(next as string[]);
            onValueChange(next);
          }}
        />
      );
    }
    render(<Held />);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(activeOptionNow()).toBe("Gamma");
    await user.keyboard("{Enter}");
    expect(onValueChange.mock.calls.map(([values]) => values)).toEqual([
      ["alpha", "gamma"],
      ["alpha"],
    ]);
  });
});

describe("Listbox", () => {
  it("selects a single option", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(<Listbox options={options} onValueChange={handleValueChange} />);

    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(handleValueChange).toHaveBeenCalledWith("beta", options[1]);
  });

  it("supports multiple selected values", async () => {
    render(<Listbox multiple options={options} value={["alpha", "gamma"]} />);

    expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Gamma" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("exposes the active option through aria-activedescendant", async () => {
    const user = userEvent.setup();

    render(<Listbox id="route-listbox" options={options} />);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      "route-listbox-option-0",
    );

    listbox.focus();
    await user.keyboard("{ArrowDown}");
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      "route-listbox-option-1",
    );
  });

  it("starts on the chosen option, as the WAI-ARIA listbox does", () => {
    // TimePicker's list opens on the field's time; with nothing chosen, on
    // the first option.
    render(<Listbox id="times" options={options} value="gamma" />);
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-activedescendant",
      "times-option-2",
    );
  });
});
