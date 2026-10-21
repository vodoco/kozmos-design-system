import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useInputModality } from "./input-modality";

function Probe() {
  return <output>{useInputModality()}</output>;
}
const move = (type: string, x: number, y: number) =>
  act(() => {
    document.dispatchEvent(
      new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }),
    );
  });
const key = (init: KeyboardEventInit = { key: "ArrowDown" }) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { ...init, bubbles: true }),
    );
  });

describe("useInputModality", () => {
  it("says which hand moved last: a key, then a pointer that moved", () => {
    render(<Probe />);
    move("pointermove", 10, 10);
    expect(screen.getByRole("status")).toHaveTextContent("pointer");
    key();
    expect(screen.getByRole("status")).toHaveTextContent("keyboard");
    // A list that scrolls under a still pointer can be sent a move where the
    // pointer already was: that is not the pointer moving.
    move("pointermove", 10, 10);
    expect(screen.getByRole("status")).toHaveTextContent("keyboard");
    move("pointermove", 12, 10);
    expect(screen.getByRole("status")).toHaveTextContent("pointer");
    key();
    move("pointerdown", 12, 10);
    expect(screen.getByRole("status")).toHaveTextContent("pointer");
  });

  it("does not count a lone modifier as the keyboard, but counts a key with one", () => {
    render(<Probe />);
    move("pointermove", 20, 20);
    expect(screen.getByRole("status")).toHaveTextContent("pointer");
    // Shift- or Cmd-click over a row, and Cmd-Tab away and back: the
    // modifier alone is not the keyboard moving the row.
    for (const [lone, flag] of [
      ["Shift", "shiftKey"],
      ["Control", "ctrlKey"],
      ["Alt", "altKey"],
      ["Meta", "metaKey"],
      ["AltGraph", "altKey"],
      ["CapsLock", ""],
      ["Fn", ""],
      ["OS", ""],
    ] as const) {
      key({ key: lone, ...(flag ? { [flag]: true } : {}) });
      expect(screen.getByRole("status"), lone).toHaveTextContent("pointer");
    }
    // A modifier with another key is the keyboard: Alt+ArrowDown opens Select
    // and Combobox, Shift+ArrowDown extends a selection.
    key({ key: "ArrowDown", altKey: true });
    expect(screen.getByRole("status")).toHaveTextContent("keyboard");
    move("pointermove", 22, 20);
    key({ key: "ArrowDown", shiftKey: true });
    expect(screen.getByRole("status")).toHaveTextContent("keyboard");
  });
});
