import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { scrollHorizontalWithKeyboard } from "./keyboard-scroll";

describe("horizontal viewport keys", () => {
  it("scrolls a focused viewport, but not descendant controls or modified keys", () => {
    render(
      <div role="region" onKeyDown={scrollHorizontalWithKeyboard}>
        <button>Child</button>
      </div>,
    );
    const viewport = screen.getByRole("region");
    Object.defineProperties(viewport, {
      clientWidth: { value: 200 },
      scrollWidth: { value: 600 },
      scrollBy: { value: vi.fn() },
      scrollTo: { value: vi.fn() },
    });
    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    expect(viewport.scrollBy).toHaveBeenCalledWith({
      left: 40,
      behavior: "auto",
    });
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    fireEvent.keyDown(viewport, { key: "ArrowRight", metaKey: true });
    expect(viewport.scrollBy).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(viewport, { key: "End" });
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: 400,
      behavior: "auto",
    });
    viewport.style.direction = "rtl";
    fireEvent.keyDown(viewport, { key: "End" });
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: -400,
      behavior: "auto",
    });
  });
});
