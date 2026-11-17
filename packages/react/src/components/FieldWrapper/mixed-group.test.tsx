import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RadioGroup, RadioGroupItem } from "../Radio/Radio";
import { SegmentedControl } from "../SegmentedControl/SegmentedControl";

afterEach(cleanup);

// Decisions 188 and 191: a RadioGroup or SegmentedControl of a
// multi-selection whose features chose different options.

const items = [
  { value: "hours", label: "Hours" },
  { value: "closed", label: "Closed" },
  { value: "open", label: "Always open" },
];

type Kind = "RadioGroup" | "SegmentedControl";

/** The group's options, which Radix draws as radios in both parts. */
const options = () => screen.getAllByRole("radio");
const chosen = () =>
  options().filter((option) => option.getAttribute("aria-checked") === "true");
/** The chosen options' names (a RadioGroupItem's label is beside it). */
const chosenNames = () =>
  chosen().map(
    (option) =>
      items.find(
        (item) => screen.queryByRole("radio", { name: item.label }) === option,
      )?.label,
  );
const groupOf = (kind: Kind) =>
  kind === "RadioGroup"
    ? screen.getByRole("radiogroup")
    : screen.getByRole("group");

function Part({
  kind,
  ...props
}: {
  kind: Kind;
  mixed?: boolean;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  onValueChange?: (value: string | undefined) => void;
  onResetMixed?: () => void;
}) {
  return kind === "RadioGroup" ? (
    <RadioGroup label="Opening" {...props}>
      {items.map((item) => (
        <RadioGroupItem
          key={item.value}
          value={item.value}
          label={item.label}
        />
      ))}
    </RadioGroup>
  ) : (
    <SegmentedControl label="Opening" items={items} {...props} />
  );
}

/**
 * A property editor's group across a multi-selection, as Pointr Cloud holds
 * it: mixed until the visitor chooses, the reset offered after.
 */
function Edited({
  kind,
  onReset,
  onChange,
}: {
  kind: Kind;
  onReset?: () => void;
  onChange?: (value: string | undefined) => void;
}) {
  const [edit, setEdit] = React.useState<string | undefined>(undefined);
  return (
    <Part
      kind={kind}
      mixed={edit === undefined}
      value={edit ?? "hours"}
      onValueChange={(next) => {
        onChange?.(next);
        setEdit(next);
      }}
      onResetMixed={() => {
        setEdit(undefined);
        onReset?.();
      }}
    />
  );
}

describe.each<Kind>(["RadioGroup", "SegmentedControl"])(
  "a mixed %s (decisions 188 and 191)",
  (kind) => {
    it("chooses nothing, and draws Multiple values under the options, said as the group's description", () => {
      render(<Part kind={kind} mixed value="closed" />);
      expect(chosen()).toHaveLength(0);
      const line = screen.getByText("Multiple values");
      // Seen, not hidden: the group has no placeholder to say it in.
      expect(line).toBeVisible();
      expect(line).not.toHaveAttribute("hidden");
      expect(
        groupOf(kind).getAttribute("aria-describedby")?.split(" "),
      ).toContain(line.id);
      expect(groupOf(kind)).toHaveAttribute("data-mixed", "");
      // Under the options, in the document's order, as a field's reset is.
      expect(
        groupOf(kind).compareDocumentPosition(line) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      // While mixed there is nothing to reset to.
      expect(
        screen.queryByRole("button", { name: "Reset to multiple values" }),
      ).toBeNull();
    });

    it("keeps an error's description beside the mixed one", () => {
      render(<Part kind={kind} mixed error="Choose one" />);
      const ids = groupOf(kind).getAttribute("aria-describedby")?.split(" ");
      expect(ids).toContain(screen.getByText("Multiple values").id);
      expect(ids).toContain(screen.getByText("Choose one").id);
    });

    it("ends with a choice, which is reported; the reset brings the several values back, and focus to an option", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onReset = vi.fn();
      render(<Edited kind={kind} onChange={onChange} onReset={onReset} />);
      expect(chosen()).toHaveLength(0);

      await user.click(screen.getByRole("radio", { name: "Closed" }));
      expect(onChange).toHaveBeenCalledWith("closed");
      expect(chosenNames()).toEqual(["Closed"]);
      expect(screen.queryByText("Multiple values")).toBeNull();
      expect(groupOf(kind)).not.toHaveAttribute("data-mixed");
      expect(groupOf(kind).getAttribute("aria-describedby") ?? "").toBe("");

      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(chosen()).toHaveLength(0);
      expect(screen.getByText("Multiple values")).toBeVisible();
      // Focus went to the group's option, never lost to the page as the
      // button went, and focusing it chose nothing.
      expect(document.activeElement?.getAttribute("role")).toBe("radio");
      expect(groupOf(kind)).toContainElement(
        document.activeElement as HTMLElement,
      );
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("uncontrolled: drops its default while mixed, and shows the visitor's choice once it is not", async () => {
      const user = userEvent.setup();
      function Uncontrolled() {
        const [mixed, setMixed] = React.useState(true);
        return (
          <Part
            kind={kind}
            mixed={mixed}
            defaultValue="hours"
            onValueChange={() => setMixed(false)}
            onResetMixed={() => setMixed(true)}
          />
        );
      }
      render(<Uncontrolled />);
      expect(chosen()).toHaveLength(0);
      await user.click(screen.getByRole("radio", { name: "Always open" }));
      expect(chosenNames()).toEqual(["Always open"]);
      await user.click(
        screen.getByRole("button", { name: "Reset to multiple values" }),
      );
      // The choice held before it turned mixed again is dropped.
      expect(chosen()).toHaveLength(0);
    });

    it("offers no reset while disabled", () => {
      render(
        <Part
          kind={kind}
          mixed={false}
          value="hours"
          disabled
          onResetMixed={() => {}}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "Reset to multiple values" }),
      ).toBeNull();
    });

    it("takes the product's words", () => {
      const { rerender } = render(
        kind === "RadioGroup" ? (
          <RadioGroup mixed mixedLabel="Mehrere Werte">
            <RadioGroupItem value="a" label="A" />
          </RadioGroup>
        ) : (
          <SegmentedControl items={items} mixed mixedLabel="Mehrere Werte" />
        ),
      );
      expect(screen.getByText("Mehrere Werte")).toBeVisible();
      rerender(
        kind === "RadioGroup" ? (
          <RadioGroup
            mixed={false}
            onResetMixed={() => {}}
            resetMixedLabel="Auf mehrere Werte zurücksetzen"
          >
            <RadioGroupItem value="a" label="A" />
          </RadioGroup>
        ) : (
          <SegmentedControl
            items={items}
            mixed={false}
            onResetMixed={() => {}}
            resetMixedLabel="Auf mehrere Werte zurücksetzen"
          />
        ),
      );
      expect(
        screen.getByRole("button", { name: "Auf mehrere Werte zurücksetzen" }),
      ).toBeVisible();
    });

    it("without mixed, is the part it was: its default chosen, no line and no reset", () => {
      render(
        <Part kind={kind} defaultValue="closed" onResetMixed={() => {}} />,
      );
      expect(chosenNames()).toEqual(["Closed"]);
      expect(screen.queryByText("Multiple values")).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
      expect(groupOf(kind)).not.toHaveAttribute("aria-describedby");
    });
  },
);
