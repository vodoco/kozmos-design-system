import { render, cleanup, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { Input } from "./Input";
import "@testing-library/jest-dom/vitest";

afterEach(cleanup);

describe("Input", () => {
  it("does not let an empty error string hide linked helper text", () => {
    const { getByRole, getByText } = render(
      <Input error="" helperText="Guidance" />,
    );
    expect(getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      getByText("Guidance").id,
    );
  });
  it("retains caller descriptions alongside its error message", () => {
    const { getByRole } = render(
      <Input error="Required" aria-describedby=" caller-help  caller-help " />,
    );
    expect(
      getByRole("textbox").getAttribute("aria-describedby")?.split(/\s+/),
    ).toEqual(["caller-help", getByRole("alert").id]);
  });

  it("retains caller descriptions alongside helper text", () => {
    const { getByRole, getByText } = render(
      <Input helperText="Guidance" aria-describedby="caller-help" />,
    );
    expect(
      getByRole("textbox").getAttribute("aria-describedby")?.split(/\s+/),
    ).toEqual(["caller-help", getByText("Guidance").id]);
  });

  it("does not let aria-invalid=false conceal an error status", () => {
    const { getByRole } = render(<Input status="error" aria-invalid={false} />);
    expect(getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("preserves caller invalid semantics when no component error is set", () => {
    const { getByRole } = render(<Input aria-invalid="spelling" />);
    expect(getByRole("textbox")).toHaveAttribute("aria-invalid", "spelling");
  });
  it("renders correctly", () => {
    const { getByRole } = render(<Input />);
    expect(getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label and placeholder text", () => {
    const { getByLabelText } = render(
      <Input label="Email" placeholder="Email address" />,
    );
    const input = getByLabelText("Email");
    expect(input).toHaveAttribute("placeholder", "Email address");
  });

  it("uses the owned input recipe (geometry is checked in built browsers)", () => {
    const { getByRole } = render(<Input />);
    expect(getByRole("textbox")).toHaveClass("kozmos-reset", "kozmos-input");
  });

  it("renders error messages and aria attributes correctly", () => {
    const { getByRole, getByText } = render(
      <Input error="This is an error message" />,
    );
    const input = getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby");

    const errorMessage = getByText("This is an error message");
    expect(errorMessage).toBeInTheDocument();

    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBe(errorMessage.id);
  });

  it("supports boolean error state without an error description", () => {
    const { getByRole, queryByText } = render(<Input error />);
    const input = getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(queryByText("true")).not.toBeInTheDocument();
  });

  it("renders helper text with aria-describedby linkage", () => {
    const { getByRole, getByText } = render(
      <Input helperText="Use your work email." />,
    );
    const input = getByRole("textbox");
    const helperText = getByText("Use your work email.");
    expect(input).toHaveAttribute("aria-describedby", helperText.id);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("supports warning and success validation tones", () => {
    const { getByRole, rerender } = render(
      <Input status="warning" helperText="Check this value." />,
    );
    expect(getByRole("textbox")).toHaveClass("kozmos-input-warning");
    expect(getByRole("textbox")).not.toHaveAttribute("aria-invalid");

    rerender(<Input status="success" helperText="Looks good." />);
    expect(getByRole("textbox")).toHaveClass("kozmos-input-success");
  });

  it("treats status error as invalid for assistive tech", () => {
    const { getByRole } = render(
      <Input status="error" helperText="Invalid value." />,
    );
    expect(getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("passes disabled through to the native input", () => {
    const { getByRole } = render(<Input disabled />);
    expect(getByRole("textbox")).toBeDisabled();
  });

  it("passes readOnly through to the native input", () => {
    const { getByRole } = render(<Input readOnly />);
    expect(getByRole("textbox")).toHaveAttribute("readonly");
  });

  it("copies its value from a button inside its end, and says so (GAP-154)", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onCopy = vi.fn();
    const { getByRole } = render(
      <Input
        label="FID"
        readOnly
        defaultValue="fid-0042"
        action={{ kind: "copy", label: "Copy FID", onCopy }}
      />,
    );
    const field = getByRole("textbox", { name: "FID" });
    const copy = getByRole("button", { name: "Copy FID" });
    const status = getByRole("status");
    // Inside the field's wrapper, after the input, and the room kept for it.
    expect(field.nextElementSibling).toBe(copy);
    expect(field).toHaveClass("kozmos-input-with-action");
    expect(copy).toHaveClass("kozmos-field-action", "kozmos-input-action");
    expect(copy).toHaveAttribute("type", "button");
    // The region is in the page, silent, before anything is copied.
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("");

    await act(async () => {
      fireEvent.click(copy);
    });
    expect(writeText).toHaveBeenCalledWith("fid-0042");
    expect(onCopy).toHaveBeenCalledWith("fid-0042");
    expect(status.textContent).toBe("Copied");

    // A second copy changes the words, so it is read again.
    await act(async () => {
      fireEvent.click(copy);
    });
    expect(status.textContent).toBe("Copied\u00a0");
  });

  it("says nothing when the copy fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { getByRole } = render(
      <Input
        label="FID"
        readOnly
        defaultValue="fid-0042"
        action={{ kind: "copy", copiedLabel: "Copiado" }}
      />,
    );
    await act(async () => {
      fireEvent.click(getByRole("button", { name: "Copy" }));
    });
    expect(getByRole("status")).toHaveTextContent("");
  });

  it("draws a toggle action as a pressed button with its own name", () => {
    const onPressedChange = vi.fn();
    const { getByRole, rerender } = render(
      <Input
        label="Name"
        action={{
          kind: "toggle",
          label: "Featured",
          icon: <svg aria-hidden="true" />,
          pressed: false,
          onPressedChange,
        }}
      />,
    );
    const toggle = getByRole("button", { name: "Featured" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledWith(true);

    rerender(
      <Input
        label="Name"
        disabled
        action={{
          kind: "toggle",
          label: "Featured",
          icon: <svg aria-hidden="true" />,
          pressed: true,
          onPressedChange,
        }}
      />,
    );
    expect(getByRole("button", { name: "Featured" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Disabled with its field.
    expect(getByRole("button", { name: "Featured" })).toBeDisabled();
  });

  it("draws no wrapper or room without an action", () => {
    const { getByRole, queryByRole } = render(<Input label="Name" />);
    expect(getByRole("textbox")).not.toHaveClass("kozmos-input-with-action");
    expect(queryByRole("button")).toBeNull();
    expect(queryByRole("status")).toBeNull();
  });
});
