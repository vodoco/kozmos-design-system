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

  describe("decimal digits from any script", () => {
    // The code 0 9 1 2 in each script a phone's keyboard may type it in:
    // zero is where a digit's walk back to the start of its run stops at
    // once, and nine is where it walks furthest.
    const SCRIPTS = [
      ["Arabic-Indic", "٠٩١٢"],
      ["Extended Arabic-Indic", "۰۹۱۲"],
      ["Devanagari", "०९१२"],
      ["full-width", "０９１２"],
    ] as const;

    const paste = (input: HTMLElement, code: string) =>
      fireEvent.paste(input, { clipboardData: { getData: () => code } });

    it.each(SCRIPTS)("takes %s digits typed one by one as ASCII", (_, code) => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);

      const inputs = screen.getAllByRole("textbox");
      Array.from(code).forEach((digit, index) =>
        fireEvent.change(inputs[index], { target: { value: digit } }),
      );

      expect(handleChange.mock.calls).toEqual([
        ["0"],
        ["09"],
        ["091"],
        ["0912"],
      ]);
      expect(cellsIn(document)).toEqual(["0", "9", "1", "2"]);
      expect(document.activeElement).toBe(inputs[3]);
    });

    it.each(SCRIPTS)("takes a pasted %s code as ASCII", (_, code) => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);

      paste(screen.getAllByRole("textbox")[0], code);

      expect(handleChange.mock.calls).toEqual([["0912"]]);
      expect(cellsIn(document)).toEqual(["0", "9", "1", "2"]);
    });

    it("keeps a mixed paste's digits in order, as ASCII", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);

      paste(screen.getAllByRole("textbox")[0], "١2३-4");

      expect(handleChange.mock.calls).toEqual([["1234"]]);
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);
    });

    it("drops what is not a decimal digit: letters, ², ½ and other numbers", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");

      // Superscript two, one half, a circled one and the Roman numeral twelve
      // are numbers, but none is a decimal digit (general category Nd).
      fireEvent.change(inputs[0], { target: { value: "²" } });
      fireEvent.change(inputs[0], { target: { value: "½" } });
      expect(handleChange).not.toHaveBeenCalled();
      expect(cellsIn(document)).toEqual(["", "", "", ""]);

      paste(inputs[0], "a²٣½b①Ⅻ4");
      expect(handleChange.mock.calls).toEqual([["34"]]);
      expect(cellsIn(document)).toEqual(["3", "4", "", ""]);
    });

    it("draws a controlled value's digits from any script as ASCII", () => {
      const commits: string[][] = [];
      const onCommit = (cells: string[]) => commits.push(cells);
      const { rerender } = render(
        <CommitProbe length={4} onCommit={onCommit} value="١٢٣" />,
      );
      expect(commits).toEqual([["1", "2", "3", ""]]);

      rerender(<CommitProbe length={4} onCommit={onCommit} value="۴५６7" />);
      expect(commits.at(-1)).toEqual(["4", "5", "6", "7"]);
    });

    it("trims to length by digits, two UTF-16 units or one", () => {
      // The double-struck digits are each two UTF-16 units, and are the third
      // of five sets of mathematical digits that run back to back.
      const handleChange = vi.fn();
      const { rerender } = render(
        <OTPInput length={4} onChange={handleChange} />,
      );

      paste(screen.getAllByRole("textbox")[0], "𝟙𝟚𝟛𝟜𝟝");
      expect(handleChange.mock.calls).toEqual([["1234"]]);
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);

      rerender(<OTPInput length={4} onChange={handleChange} value="٥٦٧٨٩" />);
      expect(cellsIn(document)).toEqual(["5", "6", "7", "8"]);
    });
  });

  describe("IME composition", () => {
    // An IME's events go to the cell that has the focus at each step, as
    // Chromium's do: a commit lands wherever the focus went.
    const focused = () => document.activeElement as HTMLInputElement;
    const composing = (text: string) =>
      fireEvent.input(focused(), {
        target: { value: text },
        isComposing: true,
        inputType: "insertCompositionText",
        data: text,
      });
    /**
     * Composes `text` and commits it, in the order Chromium's IME sends:
     * compositionstart, the text as it composes, the text committed, then
     * compositionend.
     */
    const compose = (text: string) => {
      fireEvent.compositionStart(focused(), { data: "" });
      composing(text);
      composing(text);
      fireEvent.compositionEnd(focused(), { data: text });
    };

    it.each([
      ["a full-width digit", "１"],
      ["an ASCII digit", "1"],
    ])("enters %s composed by an IME once, then moves on", (_, digit) => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      compose(digit);

      expect(handleChange.mock.calls).toEqual([["1"]]);
      expect(cellsIn(document)).toEqual(["1", "", "", ""]);
      expect(document.activeElement).toBe(inputs[1]);
    });

    it("draws the IME's text, and keeps the focus and onChange, until the composition ends", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      fireEvent.compositionStart(inputs[0], { data: "" });
      composing("あ");
      expect(cellsIn(document)).toEqual(["あ", "", "", ""]);
      composing("１");
      expect(cellsIn(document)).toEqual(["１", "", "", ""]);
      expect(handleChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(inputs[0]);

      fireEvent.compositionEnd(inputs[0], { data: "１" });
      expect(handleChange.mock.calls).toEqual([["1"]]);
      expect(cellsIn(document)).toEqual(["1", "", "", ""]);
      expect(document.activeElement).toBe(inputs[1]);
    });

    it("enters nothing for a composition that is cancelled or ends in no digit", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      fireEvent.compositionStart(inputs[0], { data: "" });
      composing("１");
      composing("");
      fireEvent.compositionEnd(inputs[0], { data: "" });

      compose("一");

      expect(handleChange).not.toHaveBeenCalled();
      expect(cellsIn(document)).toEqual(["", "", "", ""]);
      expect(document.activeElement).toBe(inputs[0]);
    });

    it("enters a composition once when its text arrives again after compositionend (Input Events Level 2)", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      fireEvent.compositionStart(inputs[0], { data: "" });
      composing("１");
      fireEvent.compositionEnd(inputs[0], { data: "１" });
      fireEvent.input(focused(), {
        target: { value: "１" },
        isComposing: false,
        inputType: "insertFromComposition",
        data: "１",
      });

      expect(handleChange.mock.calls).toEqual([["1"]]);
      expect(cellsIn(document)).toEqual(["1", "", "", ""]);
    });

    it("holds a non-composing input that arrives mid-composition, and moves on only at compositionend", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      fireEvent.compositionStart(inputs[0], { data: "" });
      composing("１");
      fireEvent.input(inputs[0], {
        target: { value: "２" },
        isComposing: false,
        inputType: "insertFromComposition",
        data: "２",
      });
      expect(handleChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(inputs[0]);

      fireEvent.compositionEnd(inputs[0], { data: "２" });
      expect(handleChange.mock.calls).toEqual([["2"]]);
      expect(document.activeElement).toBe(inputs[1]);
    });

    it("enters nothing when a read-only cell's composition ends", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} readOnly />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();

      fireEvent.compositionStart(inputs[0], { data: "" });
      (inputs[0] as HTMLInputElement).value = "１";
      fireEvent.compositionEnd(inputs[0], { data: "１" });

      expect(handleChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(inputs[0]);
    });

    // React never hears these compositions end. The cell must not stay
    // composing, or what is typed into it later is drawn and never entered.
    it.each([
      ["disabled", { disabled: true }],
      ["made read-only", { readOnly: true }],
    ])(
      "enters typing again after a composing cell is %s and then restored",
      (_, props) => {
        const handleChange = vi.fn();
        const { rerender } = render(
          <OTPInput length={4} onChange={handleChange} />,
        );
        const inputs = screen.getAllByRole("textbox");
        inputs[0].focus();
        fireEvent.compositionStart(inputs[0], { data: "" });
        composing("１");

        rerender(<OTPInput length={4} onChange={handleChange} {...props} />);
        rerender(<OTPInput length={4} onChange={handleChange} />);
        fireEvent.change(inputs[0], { target: { value: "2" } });

        expect(handleChange.mock.calls).toEqual([["2"]]);
        expect(cellsIn(document)).toEqual(["2", "", "", ""]);
      },
    );

    it("enters typing again in a cell that was composing when a shorter length removed it", () => {
      const handleChange = vi.fn();
      const { rerender } = render(
        <OTPInput length={4} onChange={handleChange} />,
      );
      screen.getAllByRole("textbox")[3].focus();
      fireEvent.compositionStart(focused(), { data: "" });
      composing("１");

      rerender(<OTPInput length={3} onChange={handleChange} />);
      rerender(<OTPInput length={4} onChange={handleChange} />);
      fireEvent.change(screen.getAllByRole("textbox")[3], {
        target: { value: "4" },
      });

      expect(handleChange.mock.calls).toEqual([["4"]]);
      expect(cellsIn(document)).toEqual(["", "", "", "4"]);
    });

    it("enters typing again after the focus leaves a composing cell", () => {
      const handleChange = vi.fn();
      render(<OTPInput length={4} onChange={handleChange} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[0].focus();
      fireEvent.compositionStart(inputs[0], { data: "" });
      composing("１");

      fireEvent.blur(inputs[0]);
      fireEvent.change(inputs[0], { target: { value: "2" } });

      expect(handleChange.mock.calls).toEqual([["2"]]);
      expect(cellsIn(document)).toEqual(["2", "", "", ""]);
    });

    it("keeps the focus on Backspace inside a composition", () => {
      render(<OTPInput length={4} />);
      const inputs = screen.getAllByRole("textbox");
      inputs[1].focus();

      fireEvent.compositionStart(inputs[1], { data: "" });
      fireEvent.keyDown(inputs[1], { key: "Backspace", isComposing: true });
      expect(document.activeElement).toBe(inputs[1]);

      // Safari's keydown that ends a composition: keyCode 229, no isComposing.
      fireEvent.keyDown(inputs[1], { key: "Backspace", keyCode: 229 });
      expect(document.activeElement).toBe(inputs[1]);
    });
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

  describe("defaultValue", () => {
    it("starts an uncontrolled field with its code, and a controlled value wins over it", () => {
      const handleChange = vi.fn();
      const { unmount } = render(
        <OTPInput defaultValue="1234" length={4} onChange={handleChange} />,
      );
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);
      expect(handleChange).not.toHaveBeenCalled();
      unmount();

      render(<OTPInput defaultValue="9876" length={4} value="12" />);
      expect(cellsIn(document)).toEqual(["1", "2", "", ""]);
    });

    it("keeps a defaultValue's decimal digits from any script as ASCII, cut to length", () => {
      render(<OTPInput defaultValue="١2a-٣ ४５6" length={4} />);
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);
    });

    it("draws a defaultValue in its first commit and on the server", () => {
      const commits: string[][] = [];
      render(
        <CommitProbe
          defaultValue="12"
          length={4}
          onCommit={(cells) => commits.push(cells)}
        />,
      );
      expect(commits).toEqual([["1", "2", "", ""]]);

      const page = new DOMParser().parseFromString(
        renderToString(<OTPInput defaultValue="12" length={4} />),
        "text/html",
      );
      expect(
        Array.from(page.querySelectorAll("input"), (input) =>
          input.getAttribute("value"),
        ),
      ).toEqual(["1", "2", "", ""]);
    });

    it("reads defaultValue on mount only", () => {
      const { rerender } = render(<OTPInput defaultValue="12" length={4} />);
      expect(cellsIn(document)).toEqual(["1", "2", "", ""]);

      rerender(<OTPInput defaultValue="5678" length={4} />);
      expect(cellsIn(document)).toEqual(["1", "2", "", ""]);

      fireEvent.change(screen.getAllByRole("textbox")[2], {
        target: { value: "3" },
      });
      rerender(<OTPInput defaultValue="" length={4} />);
      expect(cellsIn(document)).toEqual(["1", "2", "3", ""]);
    });

    it("edits a full defaultValue as a full code", () => {
      const handleChange = vi.fn();
      render(
        <OTPInput defaultValue="1234" length={4} onChange={handleChange} />,
      );
      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[1], { target: { value: "9" } });
      expect(handleChange.mock.calls).toEqual([["1934"]]);
      expect(cellsIn(document)).toEqual(["1", "9", "3", "4"]);
      expect(document.activeElement).toBe(inputs[2]);
    });

    it("is cleared by the user, and a remount starts with it again", () => {
      const handleChange = vi.fn();
      const field = (key: string) => (
        <OTPInput
          defaultValue="12"
          key={key}
          length={4}
          onChange={handleChange}
        />
      );
      const { rerender } = render(field("first"));
      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[1], { target: { value: "" } });
      fireEvent.change(inputs[0], { target: { value: "" } });
      expect(handleChange.mock.calls).toEqual([["1"], [""]]);
      expect(cellsIn(document)).toEqual(["", "", "", ""]);

      rerender(field("second"));
      expect(cellsIn(document)).toEqual(["1", "2", "", ""]);
    });
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

    it("tracks no defaultValue, and edits a full one as a full code", () => {
      const { completions, inputs } = renderTracked(
        <OTPInput defaultValue="1234" length={4} />,
      );
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);
      expect(completions()).toEqual([]);

      type(inputs[1], "9");
      paste(inputs[0], "5678");
      expect(completions()).toEqual([]);

      type(inputs[2], "");
      type(inputs[2], "7");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
    });

    it("tracks a partial defaultValue once the user completes it", () => {
      const { completions, inputs } = renderTracked(
        <OTPInput defaultValue="123" length={4} />,
      );
      expect(completions()).toEqual([]);

      type(inputs[3], "4");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
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

    it("tracks a code typed in another script once", () => {
      const { completions, inputs } = renderTracked(<OTPInput length={4} />);

      ["١", "٢", "٣"].forEach((digit, index) => type(inputs[index], digit));
      expect(completions()).toEqual([]);

      type(inputs[3], "٤");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
    });

    it("tracks a code pasted in another script once, and its host holds it in ASCII", () => {
      const handleChange = vi.fn();
      function EchoesTheCode() {
        const [code, setCode] = React.useState("");
        return (
          <OTPInput
            length={4}
            onChange={(next) => {
              handleChange(next);
              setCode(next);
            }}
            value={code}
          />
        );
      }
      const { completions, inputs } = renderTracked(<EchoesTheCode />);

      paste(inputs[0], "१२३४");
      expect(completions()).toEqual([expect.objectContaining(COMPLETED)]);
      expect(handleChange.mock.calls).toEqual([["1234"]]);
      expect(cellsIn(document)).toEqual(["1", "2", "3", "4"]);
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
