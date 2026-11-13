import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom/vitest";
import {
  RatingEditor,
  ratingStars,
  validateRating,
  type RatingEditorValue,
} from "./RatingEditor";
import * as dashboard from "../index";

const field = (name: string) =>
  screen.getByLabelText(name, { selector: "input" }) as HTMLInputElement;
const describedBy = (input: HTMLElement) =>
  (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent)
    .join(" ");
const value = (
  rating: number | null,
  max: number | null,
  count: number | null,
) => ({ rating, max, count }) satisfies RatingEditorValue;

describe("RatingEditor", () => {
  it("is exported from the ./dashboard entry", () => {
    expect(dashboard.RatingEditor).toBe(RatingEditor);
    expect(dashboard.validateRating).toBe(validateRating);
  });

  it("edits the rating, its max and its count in three number fields", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RatingEditor onValueChange={onValueChange} />);
    expect(field("Max rating").value).toBe("5");
    await user.click(field("Rating"));
    await user.keyboard("4.3");
    expect(onValueChange).toHaveBeenLastCalledWith(value(4.3, 5, null));
    await user.click(field("Number of ratings"));
    await user.keyboard("120");
    expect(onValueChange).toHaveBeenLastCalledWith(value(4.3, 5, 120));
  });

  it("previews five stars to the nearest half, with the real numbers in words", () => {
    const { rerender } = render(<RatingEditor value={value(4.3, 5, 120)} />);
    expect(screen.getByText("4.3 of 5 · 120 ratings")).toBeVisible();
    // The stars are the words' picture, hidden from a screen reader.
    const stars = screen.getByText(
      "4.3 of 5 · 120 ratings",
    ).previousElementSibling!;
    expect(stars).toHaveAttribute("aria-hidden", "true");
    expect(stars.querySelectorAll("svg")).toHaveLength(5);
    rerender(<RatingEditor value={value(86, 100, 1)} />);
    expect(screen.getByText("86 of 100 · 1 rating")).toBeVisible();
    rerender(<RatingEditor value={value(3, 5, null)} />);
    expect(screen.getByText("3 of 5")).toBeVisible();
  });

  it("rounds the preview's share to the nearest half star (decision 181)", () => {
    expect(ratingStars(4.3, 5)).toBe(4.5);
    expect(ratingStars(86, 100)).toBe(4.5);
    expect(ratingStars(3.2, 5)).toBe(3);
    expect(ratingStars(4.76, 5)).toBe(5);
    expect(ratingStars(7, 10)).toBe(3.5);
  });

  it("marks a rating above its max on both fields, each described by its message", () => {
    render(<RatingEditor value={value(7, 5, 10)} />);
    expect(field("Rating")).toHaveAttribute("aria-invalid", "true");
    expect(field("Max rating")).toHaveAttribute("aria-invalid", "true");
    expect(describedBy(field("Rating"))).toContain(
      "Rating can't be more than the max rating, 5.",
    );
    expect(describedBy(field("Max rating"))).toContain(
      "Max rating can't be less than the rating, 7.",
    );
    expect(field("Number of ratings")).not.toHaveAttribute("aria-invalid");
    // No preview of a rating that cannot be.
    expect(screen.queryByText(/ of 5/)).toBeNull();
  });

  it("takes a count only as a whole number of 0 or more (Cloud took −3)", () => {
    const { rerender } = render(<RatingEditor value={value(4, 5, -3)} />);
    const message = "Number of ratings must be a whole number, 0 or more.";
    expect(field("Number of ratings")).toHaveAttribute("aria-invalid", "true");
    expect(describedBy(field("Number of ratings"))).toContain(message);
    rerender(<RatingEditor value={value(4, 5, 2.5)} />);
    expect(describedBy(field("Number of ratings"))).toContain(message);
    rerender(<RatingEditor value={value(4, 5, 0)} />);
    expect(field("Number of ratings")).not.toHaveAttribute("aria-invalid");
  });

  it("takes a rating with one decimal at most, and a max of 1 or more", () => {
    expect(validateRating(value(4.35, 5, 0))).toEqual({
      rating: "Rating must be 0 or more, with one decimal at most.",
    });
    expect(validateRating(value(-1, 5, 0)).rating).toBeDefined();
    expect(validateRating(value(0.3, 5, 0))).toEqual({});
    expect(validateRating(value(1, 0, 0))).toEqual({
      max: "Max rating must be 1 or more.",
    });
    expect(validateRating(value(100, 100, 0))).toEqual({});
    expect(validateRating(value(null, null, null))).toEqual({});
  });

  it("says its errors in the product's words", () => {
    render(
      <RatingEditor
        value={value(7, 5, 0)}
        messages={{ ratingAboveMax: (max) => `Höchstens ${max}.` }}
      />,
    );
    expect(describedBy(field("Rating"))).toContain("Höchstens 5.");
  });

  it("shows a mixed field's label and no number, and waits to preview", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const { rerender } = render(
      <RatingEditor value={value(null, 5, 10)} mixed={{ rating: true }} />,
    );
    expect(field("Rating")).toHaveAttribute("placeholder", "Multiple values");
    expect(field("Rating").value).toBe("");
    expect(screen.queryByText(/ of 5/)).toBeNull();
    rerender(
      <RatingEditor value={value(4, 5, 10)} onResetMixed={{ rating: reset }} />,
    );
    await user.click(
      screen.getByRole("button", { name: "Reset to multiple values" }),
    );
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("has no axe violations, valid or not", async () => {
    const { container, rerender } = render(
      <RatingEditor value={value(4.3, 5, 120)} />,
    );
    expect(await axe(container)).toHaveNoViolations();
    rerender(<RatingEditor value={value(7, 5, -3)} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
