import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea";
import { Input } from "../Input";

const count = { limit: 512, minimum: 50 };

describe("a counted field", () => {
  it("counts from zero and says nothing yet", () => {
    const { container } = render(
      <Textarea count={count} label="Your feedback" />,
    );
    expect(screen.getByText("0/512")).toBeVisible();
    // Empty is unanswered, not wrong: telling someone their answer is too
    // short before they have started is noise.
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(screen.getByLabelText("Your feedback")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
  });

  it("follows an uncontrolled field without taking the caret", () => {
    render(<Textarea count={count} label="Your feedback" />);
    const field = screen.getByLabelText("Your feedback");
    fireEvent.input(field, { target: { value: "x".repeat(52) } });
    expect(screen.getByText("52/512")).toBeVisible();
    expect(field).toHaveAttribute("aria-invalid", "false");
  });

  it("says how much more is needed, once something is typed", () => {
    render(<Textarea count={count} label="Your feedback" />);
    const field = screen.getByLabelText("Your feedback");
    fireEvent.input(field, {
      target: { value: "I got lost while navigating." },
    });
    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("28/512");
    expect(message).toHaveTextContent("Please enter at least 50 characters.");
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("lets a visitor go over the limit, and tells them", () => {
    // maxLength would have made this state impossible: the browser refuses
    // the keystroke, so someone pasting a long answer silently loses the end.
    render(<Textarea count={{ limit: 512 }} label="Your feedback" />);
    const field = screen.getByLabelText("Your feedback");
    expect(field).not.toHaveAttribute("maxlength");
    fireEvent.input(field, { target: { value: "x".repeat(513) } });
    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("513/512");
    expect(message).toHaveTextContent("Maximum character limit exceeded");
  });

  it("keeps the count out of the assertive region while typing", () => {
    // The count changes on every keystroke. In the role="alert" element a
    // screen reader would read the number back after each letter.
    const { container } = render(<Textarea count={count} label="Feedback" />);
    fireEvent.input(screen.getByLabelText("Feedback"), {
      target: { value: "x".repeat(60) },
    });
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(screen.getByText("60/512")).toBeVisible();
    // and the field points at it, so it is read on focus rather than on change
    const described = screen
      .getByLabelText("Feedback")
      .getAttribute("aria-describedby");
    expect(
      container.querySelector(`#${CSS.escape(described!)}`),
    ).toHaveTextContent("60/512");
  });

  it("counts what a person sees, not UTF-16 units", () => {
    render(<Textarea count={{ limit: 10 }} label="Feedback" />);
    fireEvent.input(screen.getByLabelText("Feedback"), {
      target: { value: "👍👍" },
    });
    expect(screen.getByText("2/10")).toBeVisible();
  });

  it("counts a value that is not a string", () => {
    // A field's value is string | number | readonly string[]. Counting only
    // strings made a numeric input read 0/30 whatever was in it — a silently
    // wrong number, which is worse than no number at all.
    render(
      <Input
        count={{ limit: 30 }}
        label="Capacity"
        onChange={vi.fn()}
        value={12345}
      />,
    );
    expect(screen.getByText("5/30")).toBeVisible();
  });

  it("lets the caller's own error win", () => {
    render(
      <Textarea
        count={count}
        error="That word is not allowed."
        label="Feedback"
      />,
    );
    fireEvent.input(screen.getByLabelText("Feedback"), {
      target: { value: "no" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That word is not allowed.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("at least 50");
  });

  it("takes its words from the caller", () => {
    render(
      <Textarea
        count={{
          limit: 512,
          minimum: 50,
          label: (n, max) => `${n} de ${max}`,
          underMinimum: (n) => `Escribe al menos ${n} caracteres.`,
        }}
        label="Feedback"
      />,
    );
    fireEvent.input(screen.getByLabelText("Feedback"), {
      target: { value: "hola" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("4 de 512");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Escribe al menos 50 caracteres.",
    );
  });

  it("works the same on a single-line field", () => {
    render(<Input count={{ limit: 30 }} label="Venue name" />);
    fireEvent.input(screen.getByLabelText("Venue name"), {
      target: { value: "Harbour International Airport" },
    });
    expect(screen.getByText("29/30")).toBeVisible();
  });

  it("still calls the caller's onInput", () => {
    const onInput = vi.fn();
    render(<Textarea count={count} label="Feedback" onInput={onInput} />);
    fireEvent.input(screen.getByLabelText("Feedback"), {
      target: { value: "a" },
    });
    expect(onInput).toHaveBeenCalled();
    expect(screen.getByText("1/512")).toBeVisible();
  });

  it("follows a controlled value without mirroring it", () => {
    const { rerender } = render(
      <Textarea
        count={count}
        label="Feedback"
        onChange={vi.fn()}
        value="abc"
      />,
    );
    expect(screen.getByText("3/512")).toBeVisible();
    rerender(
      <Textarea
        count={count}
        label="Feedback"
        onChange={vi.fn()}
        value="abcdef"
      />,
    );
    expect(screen.getByText("6/512")).toBeVisible();
  });
});
