import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../ThemeProvider";
import { Chip, ChipGroup } from "./Chip";

describe("Chip", () => {
  it("renders a non-interactive chip by default", () => {
    render(<Chip>Retail</Chip>);

    expect(screen.getByText("Retail")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retail/i }),
    ).not.toBeInTheDocument();
  });

  it("supports selected interactive chips", () => {
    const onClick = vi.fn();

    render(
      <Chip selected onClick={onClick}>
        Food
      </Chip>,
    );

    const chip = screen.getByRole("button", { name: /food/i });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the legacy active prop as a selected alias", () => {
    render(
      <Chip active onClick={() => undefined}>
        Coffee
      </Chip>,
    );

    expect(screen.getByRole("button", { name: /coffee/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Chip onClick={onClick}>Open now</Chip>);

    screen.getByRole("button", { name: /open now/i }).focus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps removable chips as sibling actions", () => {
    const onClick = vi.fn();
    const onRemove = vi.fn();

    render(
      <Chip onClick={onClick} onRemove={onRemove}>
        Open now
      </Chip>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /remove open now/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("gives remove a mark that meets 2.5.8 and a target that clears it", () => {
    // 20px drawn (h-5 w-5) at every chip size, under WCAG 2.5.8's 24px
    // minimum. The mark is now 24; the target the owned rule adds is taller
    // still, and deliberately no wider — see the rule for why.
    render(
      <Chip
        label="Open now"
        onRemove={() => undefined}
        removeLabel="Remove open now"
      />,
    );
    const remove = screen.getByRole("button", { name: /remove open now/i });
    expect(remove).toHaveClass("kozmos-chip-remove");
    expect(remove).toHaveClass("h-6", "w-6");
    expect(remove).not.toHaveClass("h-5");
  });

  describe("a one-of-several choice (row 37)", () => {
    // 'Whole airport / Terminal 2' is one choice. As two toggles it was
    // announced as two unrelated buttons, each "not pressed" or "pressed".
    function Scope(props: React.ComponentProps<typeof ChipGroup>) {
      return (
        <ChipGroup aria-label="Search in" selectionMode="single" {...props}>
          <Chip value="airport">Whole airport</Chip>
          <Chip value="t2">Terminal 2</Chip>
          <Chip disabled value="t3">
            Terminal 3
          </Chip>
        </ChipGroup>
      );
    }

    it("is one radio group, not a run of toggles", () => {
      render(<Scope value="airport" />);

      const group = screen.getByRole("radiogroup", { name: "Search in" });
      expect(group).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: "Whole airport" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "Terminal 2" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
      expect(group.querySelector("[aria-pressed]")).toBeNull();
    });

    it("keeps one stop for the Tab key, on the chosen chip", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <Scope value="t2" />
          <button type="button">After</button>
        </>,
      );

      await user.tab();
      await user.tab();
      expect(screen.getByRole("radio", { name: "Terminal 2" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("moves the choice with the arrow keys, past a chip that cannot be chosen", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Scope defaultValue="airport" onValueChange={onValueChange} />);

      await user.click(screen.getByRole("radio", { name: "Whole airport" }));
      // Held, as a finger on a key is: the choice follows the focus while an
      // arrow key is down, and focus moves a tick after the keydown.
      await user.keyboard("{ArrowRight>}");
      const terminal = screen.getByRole("radio", { name: "Terminal 2" });
      await waitFor(() => expect(terminal).toHaveFocus());
      await user.keyboard("{/ArrowRight}");
      expect(terminal).toHaveAttribute("aria-checked", "true");
      expect(onValueChange).toHaveBeenLastCalledWith("t2");

      // Terminal 3 is disabled: the next stop wraps to the first chip.
      await user.keyboard("{ArrowRight>}");
      const airport = screen.getByRole("radio", { name: "Whole airport" });
      await waitFor(() => expect(airport).toHaveFocus());
      await user.keyboard("{/ArrowRight}");
      expect(onValueChange).toHaveBeenLastCalledWith("airport");
    });

    it("moves the choice the way the text reads, right to left in Arabic", async () => {
      // In a right-to-left layout the next chip is to the left, so the left
      // arrow must reach it. Radix reads the direction the ThemeProvider sets.
      // Three chips, from the middle one: with two, wrapping would land on the
      // same chip whichever way the arrow went, and prove nothing.
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ThemeProvider dir="rtl">
          <ChipGroup
            aria-label="Terminal"
            defaultValue="t2"
            selectionMode="single"
            onValueChange={onValueChange}
          >
            <Chip value="t1">Terminal 1</Chip>
            <Chip value="t2">Terminal 2</Chip>
            <Chip value="t3">Terminal 3</Chip>
          </ChipGroup>
        </ThemeProvider>,
      );

      await user.click(screen.getByRole("radio", { name: "Terminal 2" }));
      await user.keyboard("{ArrowLeft>}");
      const next = screen.getByRole("radio", { name: "Terminal 3" });
      await waitFor(() => expect(next).toHaveFocus());
      await user.keyboard("{/ArrowLeft}");
      expect(onValueChange).toHaveBeenLastCalledWith("t3");
    });

    it("draws the chosen chip selected, and cannot be emptied by a second tap", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Scope defaultValue="airport" onValueChange={onValueChange} />);

      const terminal = screen.getByRole("radio", { name: "Terminal 2" });
      await user.click(terminal);
      expect(onValueChange).toHaveBeenCalledWith("t2");
      expect(terminal.closest('[data-slot="chip"]')).toHaveClass("bg-primary");

      onValueChange.mockClear();
      await user.click(terminal);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(terminal).toHaveAttribute("aria-checked", "true");
    });

    it("leaves a group of toggles as it was", () => {
      render(
        <ChipGroup aria-label="Dietary">
          <Chip selected onClick={() => undefined}>
            Vegan
          </Chip>
          <Chip onClick={() => undefined}>Halal</Chip>
        </ChipGroup>,
      );

      expect(screen.queryByRole("radiogroup")).toBeNull();
      expect(screen.getByRole("button", { name: "Vegan" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });
});
