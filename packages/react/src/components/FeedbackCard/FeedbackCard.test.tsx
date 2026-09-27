import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedbackCard } from "./FeedbackCard";

describe("FeedbackCard", () => {
  it("submits the rating and the comment", () => {
    const onSubmitFeedback = vi.fn();
    render(<FeedbackCard onSubmitFeedback={onSubmitFeedback} />);
    fireEvent.click(screen.getAllByRole("radio")[3]);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Clear signage." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    expect(onSubmitFeedback).toHaveBeenCalledWith(4, "Clear signage.");
  });

  it("cannot be submitted before it is answered", () => {
    render(<FeedbackCard />);
    expect(
      screen.getByRole("button", { name: "Submit Feedback" }),
    ).toBeDisabled();
  });

  it("asks with two thumbs when that is the question", () => {
    // "Are you enjoying Express Maps?" is a yes or a no, not a mark out of
    // five. Thumbs-up submits as 2, the top of the same scale.
    const onSubmitFeedback = vi.fn();
    render(
      <FeedbackCard onSubmitFeedback={onSubmitFeedback} variant="thumbs" />,
    );
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(2);
    fireEvent.click(screen.getByRole("radio", { name: "Good" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    expect(onSubmitFeedback).toHaveBeenCalledWith(2, "");
  });

  it("counts the comment when the product sets a limit", () => {
    render(<FeedbackCard count={{ limit: 512, minimum: 50 }} />);
    expect(screen.getByText("0/512")).toBeVisible();
    fireEvent.input(screen.getByRole("textbox"), {
      target: { value: "I got lost while navigating." },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("28/512");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter at least 50 characters.",
    );
  });

  it("takes every word from the caller", () => {
    // "Submit Feedback", "Submitting..." and the comment placeholder were
    // fixed English inside the component.
    render(
      <FeedbackCard
        commentPlaceholder="Cuéntanos más"
        submitLabel="Enviar"
        title="Valora tu experiencia"
      />,
    );
    expect(screen.getByRole("button", { name: "Enviar" })).toBeVisible();
    expect(screen.getByPlaceholderText("Cuéntanos más")).toBeVisible();
  });

  it("thanks with a token colour and a real mark, not an emoji", () => {
    // It was bg-green-100, which compiles to a fixed rgb(220 252 231): a
    // re-themed product got Tailwind green here and nowhere else. The mark
    // was 🎉, which a screen reader reads out as "party popper".
    const { container } = render(<FeedbackCard />);
    fireEvent.click(screen.getAllByRole("radio")[4]);
    fireEvent.click(screen.getByRole("button", { name: "Submit Feedback" }));
    expect(screen.getByText("Thank you for the feedback!")).toBeVisible();
    expect(container.innerHTML).not.toContain("🎉");
    expect(container.innerHTML).not.toMatch(/bg-green-\d/);
    expect(container.querySelector(".bg-success\\/10")).not.toBeNull();
  });

  it("takes the heading level of wherever it sits", () => {
    render(<FeedbackCard titleLevel={2} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
  });
});
