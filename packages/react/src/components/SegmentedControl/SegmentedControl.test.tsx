import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const items = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three", label: "Three" },
];

describe("SegmentedControl", () => {
  it("reveals the focused segment and keeps disabled overflowing content keyboard reachable", () => {
    const { rerender } = render(<SegmentedControl items={items} />);
    const last = screen.getByRole("radio", { name: "Three" });
    const scroll = vi.fn();
    last.scrollIntoView = scroll;
    fireEvent.focus(last);
    expect(scroll).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
    rerender(<SegmentedControl items={items} disabled />);
    expect(screen.getByRole("group")).toHaveAttribute("tabindex", "0");
  });
  it("renders items as a single-choice segmented group", () => {
    render(<SegmentedControl defaultValue="one" items={items} />);

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Segmented control",
    );
    expect(screen.getByRole("radio", { name: "One" })).toHaveAttribute(
      "data-state",
      "on",
    );
    expect(screen.getByRole("radio", { name: "Two" })).toBeInTheDocument();
  });

  it("calls onValueChange when a segment is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <SegmentedControl
        defaultValue="one"
        items={items}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Two" }));

    expect(onValueChange).toHaveBeenCalledWith("two");
  });

  it("uses the visible label as the group name", () => {
    render(<SegmentedControl items={items} label="View mode" />);

    expect(
      screen.getByRole("group", { name: "View mode" }),
    ).toBeInTheDocument();
  });

  it("marks the group invalid when an error is present", () => {
    render(<SegmentedControl error="Choose one" items={items} />);

    expect(screen.getByRole("group")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Choose one")).toBeInTheDocument();
  });

  it("reports a deselect as undefined, not as an empty string", async () => {
    // Pressing the segment that already holds the pill takes the choice back.
    // Radix calls that "", which is a value no `items` entry can have — so a
    // consumer typing its handler against its own union had to remember to
    // guard, and one of them cast instead and laundered "" past TypeScript.
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        defaultValue="one"
        items={items}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "One" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(undefined);
    expect(onValueChange).not.toHaveBeenCalledWith("");
  });

  it("still reports a normal selection as its value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        defaultValue="one"
        items={items}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Two" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
  });

  describe("held by the product, with nothing chosen (R1)", () => {
    // `onValueChange` hands over `undefined` when the choice is taken back,
    // and a product holding the choice passes that back as `value`. Radix
    // reads an undefined value as "uncontrolled", so the control showed the
    // last choice it had seen itself, not the product's: taken back, the
    // segment stayed pressed.
    let warnings: ReturnType<typeof vi.spyOn>[] = [];
    beforeEach(() => {
      warnings = [
        vi.spyOn(console, "warn").mockImplementation(() => {}),
        vi.spyOn(console, "error").mockImplementation(() => {}),
      ];
    });
    afterEach(() => warnings.forEach((spy) => spy.mockRestore()));
    /** No "changing from uncontrolled to controlled", or the reverse. */
    const expectNoWarnings = () =>
      expect(
        warnings.flatMap((spy) =>
          spy.mock.calls.map((call) => String(call[0])),
        ),
      ).toEqual([]);

    /** The product's state, and a way to clear it from outside the control. */
    function Held({ initial }: { initial?: string }) {
      const [value, setValue] = React.useState<string | undefined>(initial);
      return (
        <>
          <SegmentedControl
            items={items}
            label="View"
            onValueChange={setValue}
            value={value}
          />
          <output>{value ?? "nothing"}</output>
          <button onClick={() => setValue(undefined)} type="button">
            Clear
          </button>
        </>
      );
    }

    const pressed = () =>
      screen
        .getAllByRole("radio")
        .filter((radio) => radio.getAttribute("aria-checked") === "true")
        .map((radio) => radio.textContent);

    it("starts empty, takes a choice, and gives it back", async () => {
      const user = userEvent.setup();
      render(<Held />);
      expect(pressed()).toEqual([]);

      await user.click(screen.getByRole("radio", { name: "One" }));
      expect(screen.getByRole("status")).toHaveTextContent("one");
      expect(pressed()).toEqual(["One"]);

      await user.click(screen.getByRole("radio", { name: "One" }));
      expect(screen.getByRole("status")).toHaveTextContent("nothing");
      expect(pressed()).toEqual([]);
      expect(screen.getByRole("radio", { name: "One" })).toHaveAttribute(
        "data-state",
        "off",
      );
      expectNoWarnings();
    });

    it("chooses again after the choice is taken back", async () => {
      const user = userEvent.setup();
      render(<Held />);
      await user.click(screen.getByRole("radio", { name: "Two" }));
      await user.click(screen.getByRole("radio", { name: "Two" }));
      expect(pressed()).toEqual([]);

      await user.click(screen.getByRole("radio", { name: "Three" }));
      expect(screen.getByRole("status")).toHaveTextContent("three");
      expect(pressed()).toEqual(["Three"]);
      await user.click(screen.getByRole("radio", { name: "Three" }));
      expect(pressed()).toEqual([]);
      expectNoWarnings();
    });

    it("empties when the product clears it, and chooses again after", async () => {
      const user = userEvent.setup();
      render(<Held initial="two" />);
      expect(pressed()).toEqual(["Two"]);

      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(pressed()).toEqual([]);

      await user.click(screen.getByRole("radio", { name: "One" }));
      expect(pressed()).toEqual(["One"]);
      await user.click(screen.getByRole("radio", { name: "One" }));
      expect(screen.getByRole("status")).toHaveTextContent("nothing");
      expect(pressed()).toEqual([]);
      expectNoWarnings();
    });

    it("takes back a choice it started with", async () => {
      const user = userEvent.setup();
      render(<Held initial="one" />);
      await user.click(screen.getByRole("radio", { name: "One" }));
      expect(screen.getByRole("status")).toHaveTextContent("nothing");
      expect(pressed()).toEqual([]);
      await user.click(screen.getByRole("radio", { name: "Two" }));
      await user.click(screen.getByRole("radio", { name: "Two" }));
      expect(pressed()).toEqual([]);
      expectNoWarnings();
    });

    it("keeps its own choice when the product leaves value out, or passes it undefined beside a defaultValue", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { unmount } = render(
        <SegmentedControl
          defaultValue="one"
          items={items}
          onValueChange={onValueChange}
        />,
      );
      expect(pressed()).toEqual(["One"]);
      await user.click(screen.getByRole("radio", { name: "Two" }));
      expect(pressed()).toEqual(["Two"]);
      await user.click(screen.getByRole("radio", { name: "Two" }));
      expect(pressed()).toEqual([]);
      expect(onValueChange.mock.calls).toEqual([["two"], [undefined]]);
      unmount();

      // A wrapper that passes every prop on, value among them, still leaves
      // the choice to the control when it gives a defaultValue.
      render(
        <SegmentedControl defaultValue="one" items={items} value={undefined} />,
      );
      expect(pressed()).toEqual(["One"]);
      await user.click(screen.getByRole("radio", { name: "Three" }));
      expect(pressed()).toEqual(["Three"]);
      expectNoWarnings();
    });
  });
});
