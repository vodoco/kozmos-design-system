import { render, screen } from "@testing-library/react";
import { Skeleton } from "./Skeleton";
import { describe, it, expect } from "vitest";

describe("Skeleton", () => {
  it("renders correctly", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("holds a shape and a size, so a loading row needs no inline style of its own", () => {
    // GAP-057: Skeleton took only className, so every loading state wrote its
    // own `style={{ height: 16, width: "60%" }}` — and each one guessed.
    const { container, rerender } = render(<Skeleton />);
    const line = container.firstElementChild as HTMLElement;
    // A line stands in for text, so it is text-high and fills its row.
    expect(line).toHaveClass("h-4", "w-full", "rounded-control");
    expect(line).toHaveAttribute("data-shape", "line");

    rerender(<Skeleton height={12} shape="line" width="60%" />);
    const sized = container.firstElementChild as HTMLElement;
    expect(sized.style.width).toBe("60%");
    expect(sized.style.height).toBe("12px");
    // Told a height, it stops assuming one.
    expect(sized).not.toHaveClass("h-4");

    rerender(<Skeleton shape="circle" />);
    const circle = container.firstElementChild as HTMLElement;
    expect(circle).toHaveClass("rounded-pill", "shrink-0");
    expect(circle).not.toHaveClass("w-full");
    expect(circle.style.width).toBe("2.5rem");
    expect(circle.style.height).toBe("2.5rem");

    // One number is a diameter; a circle should not need telling twice.
    rerender(<Skeleton shape="circle" width={64} />);
    const bigger = container.firstElementChild as HTMLElement;
    expect(bigger.style.width).toBe("64px");
    expect(bigger.style.height).toBe("64px");

    // The pulse the reduced-motion rules switch off survives all of it.
    rerender(<Skeleton shape="block" />);
    expect(container.firstElementChild).toHaveClass("kozmos-skeleton");
  });
});
