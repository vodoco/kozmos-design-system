import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, kbdKeyName } from "./Kbd";

// GAP-156: the selection bar's hint draws Esc as a key, and a screen reader
// reads "Escape".
describe("Kbd (GAP-156)", () => {
  it("draws a key as a <kbd>, read by the key's name", () => {
    render(
      <p data-testid="hint">
        Press <Kbd>Esc</Kbd> to clear
      </p>,
    );
    const hint = screen.getByTestId("hint");
    const key = hint.querySelector("kbd")!;
    expect(key).not.toBeNull();
    // Drawn as written, hidden from a screen reader...
    expect(key.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      /^Esc$/,
    );
    // ...which reads the name instead.
    expect(key.querySelector(".sr-only")).toHaveTextContent(/^Escape$/);
    expect(hint).toHaveTextContent("Press EscEscape to clear");
  });

  it("reads a key whose name is how it is drawn once", () => {
    const { container } = render(<Kbd>K</Kbd>);
    const key = container.querySelector("kbd")!;
    expect(key).toHaveTextContent(/^K$/);
    expect(key.querySelector("[aria-hidden]")).toBeNull();
    expect(key.querySelector(".sr-only")).toBeNull();
  });

  it.each([
    ["Esc", "Escape"],
    ["ESC", "Escape"],
    ["Ctrl", "Control"],
    ["⌘", "Command"],
    ["Cmd", "Command"],
    ["⌥", "Option"],
    ["⇧", "Shift"],
    ["⌃", "Control"],
    ["↵", "Enter"],
    ["⌫", "Backspace"],
    ["Del", "Delete"],
    ["⇥", "Tab"],
    ["↑", "Up arrow"],
    ["→", "Right arrow"],
    ["PgUp", "Page up"],
    ["PgDn", "Page down"],
    ["␣", "Space"],
    ["Enter", "Enter"],
    ["F2", "F2"],
  ])("reads %j as %j", (key, name) => {
    expect(kbdKeyName(key)).toBe(name);
  });

  it("draws a combination as a <kbd> of <kbd>s joined by +, read by each key's name", () => {
    const { container } = render(<Kbd keys={["Ctrl", "Shift", "P"]} />);
    const outer = container.firstElementChild!;
    expect(outer.tagName).toBe("KBD");
    const caps = outer.querySelectorAll(":scope > kbd");
    expect([...caps].map((cap) => cap.textContent)).toEqual([
      "CtrlControl",
      "Shift",
      "P",
    ]);
    // What a screen reader reads: the names, joined by the visible "+".
    const read = (node: Node): string =>
      node.nodeType === Node.TEXT_NODE
        ? node.textContent!
        : (node as Element).getAttribute("aria-hidden") === "true"
          ? ""
          : [...node.childNodes].map(read).join("");
    expect(read(outer)).toBe("Control+Shift+P");
  });

  it("draws one key given as keys as one key", () => {
    const { container } = render(<Kbd keys={["Esc"]} />);
    const key = container.firstElementChild!;
    expect(key.tagName).toBe("KBD");
    expect(key.querySelector("kbd")).toBeNull();
    expect(key.querySelector(".sr-only")).toHaveTextContent(/^Escape$/);
  });

  it("reads the product's own words instead of the names", () => {
    const { container, rerender } = render(<Kbd label="Echap">Esc</Kbd>);
    expect(container.querySelector(".sr-only")).toHaveTextContent(/^Echap$/);
    rerender(<Kbd keys={["Strg", "C"]} label="Steuerung plus C" />);
    const outer = container.firstElementChild!;
    expect(outer.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      "Strg+C",
    );
    expect(outer.querySelectorAll(".sr-only")).toHaveLength(1);
    expect(outer.querySelector(".sr-only")).toHaveTextContent(
      /^Steuerung plus C$/,
    );
  });

  it("is a key cap drawn with Kozmos's tokens, and passes the caller's props on", () => {
    const ref = { current: null as HTMLElement | null };
    render(
      <Kbd ref={ref} className="extra" data-testid="key" title="Escape key">
        Esc
      </Kbd>,
    );
    const key = screen.getByTestId("key");
    expect(ref.current).toBe(key);
    expect(key).toHaveAttribute("title", "Escape key");
    for (const name of [
      "h-5",
      "min-w-5",
      "rounded-marker",
      "border-border",
      "bg-muted",
      "text-xs",
      "text-foreground",
      "extra",
    ])
      expect(key).toHaveClass(name);
  });
});
