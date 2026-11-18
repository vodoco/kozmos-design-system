import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CodeBlock } from "./CodeBlock";

afterEach(cleanup);

const JSON_VALUE = `{
  "mergedUnit": {
    "fid": "f-1209",
    "levels": [1, 2]
  }
}`;

// GAP-216, decision 225: a read-only, monospaced block of code, such as
// MAP-619's merged unit's JSON. No syntax colouring.
describe("CodeBlock (GAP-216)", () => {
  it("is a code region named by its label, the code shown as written", () => {
    render(<CodeBlock label="mergedUnit JSON" code={JSON_VALUE} />);
    const region = screen.getByRole("region", { name: "mergedUnit JSON" });
    expect(region).toHaveClass("kozmos-code-block");
    const pre = region.querySelector("pre")!;
    const code = pre.querySelector("code")!;
    expect(pre).toHaveClass("kozmos-code-block-pre");
    // Every space and line kept, and no markup inside: no colouring.
    expect(code.textContent).toBe(JSON_VALUE);
    expect(code.children).toHaveLength(0);
  });

  it("wraps by default, and scrolls sideways, keyboard reachable, when wrap is off", () => {
    const { rerender } = render(
      <CodeBlock label="mergedUnit JSON" code={JSON_VALUE} />,
    );
    const region = screen.getByRole("region", { name: "mergedUnit JSON" });
    const pre = () => region.querySelector("pre")!;
    expect(region).toHaveAttribute("data-wrap", "true");
    // Wrapped, it never scrolls sideways: nothing to reach.
    expect(pre()).not.toHaveAttribute("tabindex");

    rerender(
      <CodeBlock label="mergedUnit JSON" code={JSON_VALUE} wrap={false} />,
    );
    expect(region).toHaveAttribute("data-wrap", "false");
    // A box that scrolls is reachable from the keyboard, so its overflow can
    // be read with the arrow keys.
    expect(pre()).toHaveAttribute("tabindex", "0");
  });

  it("draws no copy button unless asked", () => {
    render(<CodeBlock label="mergedUnit JSON" code={JSON_VALUE} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("copies the code and says so, in the product's words", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onCopy = vi.fn();
    render(
      <CodeBlock
        label="mergedUnit JSON"
        code={JSON_VALUE}
        copyable
        copyLabel="Copy JSON"
        copiedLabel="JSON copied"
        onCopy={onCopy}
      />,
    );
    const copy = screen.getByRole("button", { name: "Copy JSON" });
    expect(copy).toHaveAttribute("type", "button");
    const status = screen.getByRole("status");
    // In the page, silent, before anything is copied.
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("");
    const rest = copy.innerHTML;

    await act(async () => {
      fireEvent.click(copy);
    });
    expect(writeText).toHaveBeenCalledWith(JSON_VALUE);
    expect(onCopy).toHaveBeenCalledWith(JSON_VALUE);
    expect(status.textContent).toBe("JSON copied");
    // A check stands in for the copy icon.
    expect(copy.innerHTML).not.toBe(rest);

    // Copied again, it says so again.
    await act(async () => {
      fireEvent.click(copy);
    });
    expect(status.textContent).toBe("JSON copied\u00a0");
  });

  it("names its copy Copy and says Copied by default, and says nothing when the copy fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(<CodeBlock label="mergedUnit JSON" code={JSON_VALUE} copyable />);
    const copy = screen.getByRole("button", { name: "Copy" });
    const icon = copy.innerHTML;
    await act(async () => {
      fireEvent.click(copy);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(copy.innerHTML).toBe(icon);
  });

  it("has no axe violations, wrapped or scrolling, with a copy", async () => {
    const { container } = render(
      <>
        <CodeBlock label="Wrapped" code={JSON_VALUE} copyable />
        <CodeBlock label="Scrolling" code={JSON_VALUE} wrap={false} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
