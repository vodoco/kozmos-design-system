import { render, screen } from "@testing-library/react";
import { Progress } from "./Progress";
import { describe, it, expect } from "vitest";

describe("Progress", () => {
  it("exposes the same normalized value visually and to assistive technology", () => {
    const { rerender } = render(
      <Progress value={25} max={50} aria-label="Download" />,
    );
    const progress = screen.getByRole("progressbar", { name: "Download" });
    expect(progress).toHaveAttribute("aria-valuenow", "25");
    expect(progress).toHaveAttribute("aria-valuemax", "50");
    // A width from the inline start, not a translation that always runs
    // from the left: right to left the bar fills from the right.
    expect(progress.firstElementChild).toHaveStyle({ width: "50%" });
    expect(progress.firstElementChild).not.toHaveStyle({
      transform: "translateX(-50%)",
    });
    rerender(<Progress value={null} aria-label="Download" />);
    expect(progress).not.toHaveAttribute("aria-valuenow");
    expect(progress).toHaveAttribute("data-state", "indeterminate");
  });
  it("renders correctly", () => {
    render(<Progress value={50} aria-label="progress" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
