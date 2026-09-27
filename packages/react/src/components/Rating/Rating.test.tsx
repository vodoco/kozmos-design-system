import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Rating } from "./Rating";

describe("Rating", () => {
  // The two this file had before the scale became a variant, kept: the second
  // is the plain case — a click that SETS a value — which the rest of this
  // file only ever exercises by clearing one.
  it("renders one option per step of the scale", () => {
    render(<Rating max={5} value={3} />);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("reports the value that was clicked", () => {
    const onChange = vi.fn();
    render(<Rating max={5} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("radio")[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("announces what is chosen, not what the pointer is over", () => {
    // aria-checked read from the hover value, so a pointer passing over the
    // fifth star made a screen reader announce five when the answer was three.
    render(<Rating onChange={vi.fn()} value={3} />);
    const stars = screen.getAllByRole("radio");
    fireEvent.mouseEnter(stars[4]);
    expect(stars[2]).toHaveAttribute("aria-checked", "true");
    expect(stars[4]).toHaveAttribute("aria-checked", "false");
  });

  it("is one tab stop, and the arrows move within it", () => {
    // Five stars meant five tab stops: a keyboard visitor tabbed through the
    // whole scale to get past a rating.
    const onChange = vi.fn();
    render(<Rating onChange={onChange} value={3} />);
    const stars = screen.getAllByRole("radio");
    expect(stars.map((s) => s.tabIndex)).toEqual([-1, -1, 0, -1, -1]);

    fireEvent.keyDown(stars[2], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(stars[2], { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(stars[2], { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(stars[2], { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("does not run off either end", () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} value={5} />);
    fireEvent.keyDown(screen.getAllByRole("radio")[4], { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears when the chosen one is chosen again", () => {
    const onChange = vi.fn();
    render(<Rating onChange={onChange} value={3} />);
    fireEvent.click(screen.getAllByRole("radio")[2]);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("stays readable when it is read-only", () => {
    // It was a radiogroup of DISABLED radios, which leaves the tab order
    // entirely: a rating meant only to be read could not be reached at all.
    const { container } = render(<Rating readOnly value={4} />);
    expect(
      screen.getByRole("img", { name: "Rated 4 out of 5 stars" }),
    ).toBeVisible();
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("takes its words from the caller", () => {
    // "Rating" and "Rate 3 out of 5 stars" were fixed English, and the second
    // says "stars" whatever the scale is.
    render(
      <Rating
        itemLabel={(v) => `Nota ${v}`}
        label="Valoración"
        onChange={vi.fn()}
        value={0}
      />,
    );
    expect(
      screen.getByRole("radiogroup", { name: "Valoración" }),
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "Nota 1" })).toBeVisible();
  });

  describe("thumbs", () => {
    it("is a choice of two, and only the chosen one fills", () => {
      // Stars mean "at least this many", so four fill. A thumbs-up is not
      // "two thumbs": exactly the one chosen fills.
      const { container } = render(
        <Rating onChange={vi.fn()} value={2} variant="thumbs" />,
      );
      const options = screen.getAllByRole("radio");
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAttribute("aria-checked", "false");
      expect(options[1]).toHaveAttribute("aria-checked", "true");
      expect(container.querySelectorAll(".border-ring")).toHaveLength(1);
    });

    it("ignores max, and names the two without saying stars", () => {
      render(<Rating max={5} onChange={vi.fn()} variant="thumbs" />);
      expect(screen.getAllByRole("radio")).toHaveLength(2);
      expect(screen.getByRole("radio", { name: "Poor" })).toBeVisible();
      expect(screen.getByRole("radio", { name: "Good" })).toBeVisible();
    });

    it("starts unanswered so a dialog can keep Submit disabled", () => {
      const { container } = render(
        <Rating onChange={vi.fn()} variant="thumbs" />,
      );
      expect(
        screen
          .getAllByRole("radio")
          .every((o) => o.getAttribute("aria-checked") === "false"),
      ).toBe(true);
      expect(container.querySelectorAll(".border-ring")).toHaveLength(0);
    });

    it("does not preview on hover, because there is no scale to preview", () => {
      const { container } = render(
        <Rating onChange={vi.fn()} value={0} variant="thumbs" />,
      );
      fireEvent.mouseEnter(screen.getAllByRole("radio")[1]);
      expect(container.querySelectorAll(".border-ring")).toHaveLength(0);
    });

    it("reads as a rating, not a scale, when read-only", () => {
      render(<Rating readOnly value={1} variant="thumbs" />);
      expect(screen.getByRole("img", { name: "Rated poor" })).toBeVisible();
    });
  });
});
