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
const key = () =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
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
});
