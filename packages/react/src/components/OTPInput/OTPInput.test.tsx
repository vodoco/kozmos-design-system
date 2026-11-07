import { render, fireEvent, screen } from "@testing-library/react";
import React, { useRef } from "react";
import { renderToString } from "react-dom/server";
import { OTPInput, type OTPInputProps } from "./OTPInput";
import { AnalyticsProvider, type AnalyticsEvent } from "../../utils/analytics";
import { afterEach, describe, expect, it, vi } from "vitest";

// The package's server-safe alias, which lint asks for. jsdom has a window,
// so here it is useLayoutEffect: it runs inside the commit, before any
// passive effect.
const useCommitEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const cellsIn = (root: ParentNode) =>
  Array.from(root.querySelectorAll("input"), (input) => input.value);

/**
 * Reads the cells inside every commit of its own, before any passive effect
 * runs, so a frame that draws stale cells is seen.
 */
function CommitProbe({
  onCommit,
  ...props
}: OTPInputProps & { onCommit: (cells: string[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useCommitEffect(() => {
    onCommit(cellsIn(ref.current!));
  });
  return <OTPInput ref={ref} {...props} />;
}

describe("OTPInput", () => {
  it("renders correct number of inputs", () => {
    render(<OTPInput length={4} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("normalizes invalid lengths to one input", () => {
    render(<OTPInput length={0} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("focuses next input on change", () => {
    render(<OTPInput length={4} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("renders error messages and aria attributes correctly", () => {
    render(<OTPInput length={4} error="OTP is invalid" />);
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");
      const errorId = input.getAttribute("aria-describedby");
      expect(document.getElementById(errorId!)).toBeInTheDocument();
    });
    expect(screen.getByText("OTP is invalid")).toBeInTheDocument();
  });

  it("associates the label and helper text with the first digit", () => {
    render(
      <OTPInput
        helperText="Enter the code we sent."
        id="verification-code"
        label="Verification code"
        length={4}
      />,
    );

    expect(screen.getByLabelText("Verification code")).toHaveAttribute(
      "id",
      "verification-code",
    );
    expect(screen.getByText("Enter the code we sent.")).toBeInTheDocument();
  });

  it("does not change values while read only", () => {
    const handleChange = vi.fn();
    render(
      <OTPInput length={4} onChange={handleChange} readOnly value="1234" />,
    );

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "9" } });

    expect(handleChange).not.toHaveBeenCalled();
    expect(inputs[0]).toHaveValue("1");
  });

  it("sanitizes controlled values to digits", () => {
    render(<OTPInput length={4} value="1a 2-3" />);

    const inputs = screen.getAllByRole("textbox");
    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      "1",
      "2",
      "3",
      "",
    ]);
  });

  it("sanitizes pasted codes", () => {
    const handleChange = vi.fn();
    render(<OTPInput length={4} onChange={handleChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "12-34",
      },
    });

    expect(handleChange).toHaveBeenCalledWith("1234");
    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("draws a controlled value's digits on the server", () => {
    const page = new DOMParser().parseFromString(
      renderToString(<OTPInput length={4} value="12" />),
      "text/html",
    );

    expect(
      Array.from(page.querySelectorAll("input"), (input) =>
        input.getAttribute("value"),
      ),
    ).toEqual(["1", "2", "", ""]);
  });

  it("shows a controlled value in its first commit", () => {
    const commits: string[][] = [];
    render(
      <CommitProbe
        length={4}
        onCommit={(cells) => commits.push(cells)}
        value="12"
      />,
    );

    expect(commits).toEqual([["1", "2", "", ""]]);
  });

  it("keeps a controlled value's digits when a digit arrives before effects run", () => {
    // A "3" typed into the third cell inside the first commit: a keystroke
    // that lands before passive effects run, as a busy page lets it.
    const handleChange = vi.fn();
    function TypesInItsFirstCommit() {
      const ref = useRef<HTMLDivElement>(null);
      useCommitEffect(() => {
        const third = ref.current!.querySelectorAll("input")[2];
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )!.set!.call(third, "3");
        third.dispatchEvent(new Event("input", { bubbles: true }));
      }, []);
      return (
        <OTPInput ref={ref} length={4} onChange={handleChange} value="12" />
      );
    }
    render(<TypesInItsFirstCommit />);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("123");
  });

  it("shows each new controlled value in the commit it arrives in", () => {
    const commits: string[][] = [];
    const onCommit = (cells: string[]) => commits.push(cells);
    const { rerender } = render(
      <CommitProbe length={4} onCommit={onCommit} value="12" />,
    );

    rerender(<CommitProbe length={4} onCommit={onCommit} value="345" />);
    expect(commits.at(-1)).toEqual(["3", "4", "5", ""]);

    rerender(<CommitProbe length={4} onCommit={onCommit} value="" />);
    expect(commits.at(-1)).toEqual(["", "", "", ""]);
  });

  it("keeps its own digits while uncontrolled", () => {
    const handleChange = vi.fn();
    render(<OTPInput length={4} onChange={handleChange} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    expect(handleChange.mock.calls).toEqual([["1"], ["12"]]);
    expect(cellsIn(document)).toEqual(["1", "2", "", ""]);
    expect(document.activeElement).toBe(inputs[2]);
  });

  it("redraws a controlled value for a new length in the commit it arrives in", () => {
    const commits: string[][] = [];
    const onCommit = (cells: string[]) => commits.push(cells);
    const { rerender } = render(
      <CommitProbe length={4} onCommit={onCommit} value="1234" />,
    );

    rerender(<CommitProbe length={6} onCommit={onCommit} value="1234" />);
    expect(commits.at(-1)).toEqual(["1", "2", "3", "4", "", ""]);

    rerender(<CommitProbe length={3} onCommit={onCommit} value="1234" />);
    expect(commits.at(-1)).toEqual(["1", "2", "3"]);
  });

  it("keeps typed digits for a new length in the commit it arrives in", () => {
    const commits: string[][] = [];
    const onCommit = (cells: string[]) => commits.push(cells);
    const { rerender } = render(<CommitProbe length={4} onCommit={onCommit} />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    rerender(<CommitProbe length={6} onCommit={onCommit} />);
    expect(commits.at(-1)).toEqual(["1", "2", "", "", "", ""]);

    rerender(<CommitProbe length={1} onCommit={onCommit} />);
    expect(commits.at(-1)).toEqual(["1"]);
  });

  describe("completion analytics", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const COMPLETED = {
      component: "OTPInput",
      eventName: "otp_code_completed",
      properties: { length: 4 },
    };

    /**
     * Renders inside an AnalyticsProvider. `completions()` flushes its batch
     * and returns every `otp_code_completed` dispatched so far.
     */
    function renderTracked(ui: React.ReactElement) {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const dispatch = vi.fn((events: AnalyticsEvent[]) => events);
      const view = render(ui, {
        wrapper: ({ children }) => (
          <AnalyticsProvider onDispatch={dispatch}>
            {children}
          </AnalyticsProvider>
        ),
      });
      const completions = () => {
        vi.runOnlyPendingTimers();
        return dispatch.mock.calls
          .flatMap(([batch]) => batch)
          .filter(({ eventName }) => eventName === "otp_code_completed");
      };
      return { ...view, completions, inputs: screen.getAllByRole("textbox") };
    }

    const type = (input: HTMLElement, digit: string) =>
      fireEvent.change(input, { target: { value: digit } });
    const paste = (input: HTMLElement, code: string) =>
      fireEvent.paste(input, { clipboardData: { getData: () => code } });

    it("tracks a code once when typing fills its last cell", () => {
      const { completions, inputs } = renderTracked(<OTPInput length={4} />);

      ["1", "2", "3"].forEach((digit, index) => type(inputs[index], digit));
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
    });

    it("tracks a pasted full code once", () => {
      const { completions, inputs } = renderTracked(<OTPInput length={4} />);

      paste(inputs[0], "12-34");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
    });

    it("tracks nothing for a partial code, typed or pasted, until it is full", () => {
      const { completions, inputs } = renderTracked(<OTPInput length={4} />);

      paste(inputs[0], "12");
      type(inputs[2], "3");
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toHaveLength(1);
    });

    it("tracks a full code once while it is edited, and again once it is cleared and completed", () => {
      const { completions, inputs } = renderTracked(<OTPInput length={4} />);

      paste(inputs[0], "1234");
      type(inputs[1], "9");
      paste(inputs[0], "5678");
      expect(completions()).toHaveLength(1);

      type(inputs[2], "");
      expect(completions()).toHaveLength(1);

      type(inputs[2], "7");
      expect(completions()).toEqual([
        expect.objectContaining(COMPLETED),
        expect.objectContaining(COMPLETED),
      ]);
    });

    it("tracks no controlled value, only the user's own completion", () => {
      const { completions, inputs, rerender } = renderTracked(
        <OTPInput length={4} value="1234" />,
      );
      rerender(<OTPInput length={4} value="" />);
      rerender(<OTPInput length={4} value="5678" />);
      rerender(<OTPInput length={4} value="123" />);
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toHaveLength(1);
    });

    it("tracks a completion once when the parent echoes the code back as value", () => {
      function EchoesTheCode() {
        const [code, setCode] = React.useState("");
        return <OTPInput length={4} onChange={setCode} value={code} />;
      }
      const { completions, inputs } = renderTracked(<EchoesTheCode />);

      ["1", "2", "3"].forEach((digit, index) => type(inputs[index], digit));
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
    });

    it("tracks each completion once under StrictMode", () => {
      const { completions, inputs } = renderTracked(
        <React.StrictMode>
          <OTPInput length={4} />
        </React.StrictMode>,
      );

      ["1", "2", "3"].forEach((digit, index) => type(inputs[index], digit));
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toHaveLength(1);

      type(inputs[2], "");
      paste(inputs[0], "5678");
      expect(completions()).toEqual([
        expect.objectContaining(COMPLETED),
        expect.objectContaining(COMPLETED),
      ]);
    });
  });
});
