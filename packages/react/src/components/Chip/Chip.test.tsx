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
      <Chip onRemove={() => undefined} removeLabel="Remove open now">
        Open now
      </Chip>,
    );
    const remove = screen.getByRole("button", { name: /remove open now/i });
    expect(remove).toHaveClass("kozmos-chip-remove");
    expect(remove).toHaveClass("h-6", "w-6");
    expect(remove).not.toHaveClass("h-5");
  });

  it("shrinks to its room and truncates its label, still named by the whole label", () => {
    // A chip's automatic minimum was its words, which never wrap, so a long
    // label ran past its room — in MultiSelect under the field's clear
    // (#537's audit). It now shrinks, its label ends in an ellipsis, and
    // every word stays for the remove's name and the chip's text.
    const { container } = render(
      <Chip onRemove={() => undefined}>Step-free access from the street</Chip>,
    );
    const chip = container.querySelector('[data-slot="chip"]');
    const label = container.querySelector('[data-slot="chip-label"]');
    expect(chip).toHaveClass("min-w-0", "max-w-full");
    expect(label).toHaveClass("min-w-0", "truncate");
    expect(label?.parentElement).toHaveClass("min-w-0");
    expect(label).toHaveTextContent("Step-free access from the street");
    const remove = screen.getByRole("button", {
      name: "Remove Step-free access from the street",
    });
    expect(remove).toHaveClass("shrink-0", "h-6", "w-6");
  });

  it("truncates a pressable chip's label and keeps its whole name", () => {
    render(
      <Chip onClick={() => undefined}>Step-free access from the street</Chip>,
    );
    const button = screen.getByRole("button", {
      name: "Step-free access from the street",
    });
    expect(button).toHaveClass("min-w-0");
    expect(button.querySelector('[data-slot="chip-label"]')).toHaveClass(
      "truncate",
    );
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
      expect(terminal.closest('[data-slot="chip"]')).toHaveClass(
        "bg-theme-fill",
      );

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

// GAP-170, decision 200: Tag's six emotions on Chip.
describe("Chip emotion", () => {
  const EMOTIONS = [
    "themed",
    "neutral",
    "success",
    "danger",
    "informative",
    "alert",
  ] as const;
  const chipOf = (label: string) =>
    screen.getByText(label).closest('[data-slot="chip"]') as HTMLElement;

  it.each(EMOTIONS)(
    "%s at rest: the emotion's surface and ink, edged in its text colour, its tint deeper under the pointer",
    (emotion) => {
      render(
        <Chip emotion={emotion} onClick={() => undefined}>
          New
        </Chip>,
      );
      const chip = chipOf("New");
      expect(chip).toHaveAttribute("data-emotion", emotion);
      expect(chip.style.getPropertyValue("--kz-emotion-surface")).toBe(
        `var(--semantics-emotion-${emotion}-surface)`,
      );
      expect(chip).toHaveClass(
        "border-[var(--kz-emotion-text)]",
        "bg-[var(--kz-emotion-surface)]",
        "text-[var(--kz-emotion-on-surface)]",
        "hover:bg-[color-mix(in_srgb,var(--kz-emotion-text)_10%,var(--kz-emotion-surface))]",
      );
      expect(chip).not.toHaveClass(
        "bg-background",
        "border-input",
        "hover:bg-hover-fill",
      );
    },
  );

  it.each(EMOTIONS)(
    "%s selected: filled with the emotion's text colour, the page's colour as ink",
    (emotion) => {
      render(
        <Chip emotion={emotion} selected onClick={() => undefined}>
          New
        </Chip>,
      );
      const chip = chipOf("New");
      expect(chip).toHaveClass(
        "border-[var(--kz-emotion-text)]",
        "bg-[var(--kz-emotion-text)]",
        "text-background",
      );
      expect(chip).not.toHaveClass("bg-theme-fill", "bg-destructive");
      expect(screen.getByRole("button", { name: "New" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    },
  );

  it("decides the colour whatever the variant", () => {
    render(
      <>
        <Chip variant="destructive" emotion="success">
          Ready
        </Chip>
        <Chip variant="brand" emotion="alert" selected>
          Pending
        </Chip>
      </>,
    );
    expect(chipOf("Ready")).toHaveClass("bg-[var(--kz-emotion-surface)]");
    expect(chipOf("Ready")).not.toHaveClass("bg-destructive/10");
    expect(chipOf("Pending")).toHaveClass("bg-[var(--kz-emotion-text)]");
  });

  it("with no emotion, each variant draws as it did", () => {
    render(
      <>
        <Chip>Plain</Chip>
        <Chip variant="brand">Brand</Chip>
        <Chip variant="destructive" selected>
          Gone
        </Chip>
      </>,
    );
    expect(chipOf("Plain")).not.toHaveAttribute("data-emotion");
    expect(chipOf("Plain")).not.toHaveAttribute("style");
    expect(chipOf("Plain")).toHaveClass(
      "border-input",
      "bg-background",
      "hover:bg-hover-fill",
    );
    expect(chipOf("Brand")).toHaveClass("bg-primary/10", "text-primary");
    expect(chipOf("Gone")).toHaveClass("bg-destructive");
  });
});

// GAP-251: the remove button's hover shows on a hovered chip. It takes the
// hover fill (decision 173), and the chip goes back to its fill at rest while
// its remove is hovered, so the two are not the same fill.
describe("Chip remove hover", () => {
  const removeOf = (name: string) => screen.getByRole("button", { name });
  const chipOf = (button: HTMLElement) =>
    button.closest('[data-slot="chip"]') as HTMLElement;

  it("takes the hover fill, not ink at a tenth", () => {
    render(<Chip onRemove={() => undefined}>Retail</Chip>);
    const remove = removeOf("Remove Retail");
    expect(remove).toHaveClass("hover:bg-hover-fill");
    expect(remove).not.toHaveClass("hover:bg-foreground/10");
  });

  it.each([
    [undefined, false, "has-[.kozmos-chip-remove:hover]:bg-background"],
    ["brand", false, "has-[.kozmos-chip-remove:hover]:bg-primary/10"],
    ["destructive", false, "has-[.kozmos-chip-remove:hover]:bg-destructive/10"],
    [undefined, true, "has-[.kozmos-chip-remove:hover]:bg-theme-fill"],
    ["destructive", true, "has-[.kozmos-chip-remove:hover]:bg-destructive"],
  ] as const)(
    "a %s chip (selected: %s) goes back to its fill at rest while its remove is hovered",
    (variant, selected, rest) => {
      render(
        <Chip variant={variant} selected={selected} onRemove={() => undefined}>
          Retail
        </Chip>,
      );
      expect(chipOf(removeOf("Remove Retail"))).toHaveClass(rest);
    },
  );

  it("an emotion chip goes back to its surface, or selected to its text fill, under which the remove turns to the page's colour", () => {
    render(
      <>
        <Chip emotion="danger" onRemove={() => undefined}>
          Marked for Deletion
        </Chip>
        <Chip emotion="informative" selected onRemove={() => undefined}>
          New
        </Chip>
      </>,
    );
    const rest = removeOf("Remove Marked for Deletion");
    expect(chipOf(rest)).toHaveClass(
      "has-[.kozmos-chip-remove:hover]:bg-[var(--kz-emotion-surface)]",
    );
    expect(rest).toHaveClass(
      "hover:bg-[color-mix(in_srgb,var(--kz-emotion-text)_10%,var(--kz-emotion-surface))]",
    );
    const selected = removeOf("Remove New");
    expect(chipOf(selected)).toHaveClass(
      "has-[.kozmos-chip-remove:hover]:bg-[var(--kz-emotion-text)]",
    );
    expect(selected).toHaveClass(
      "hover:bg-background",
      "hover:text-[var(--kz-emotion-text)]",
    );
  });
});
