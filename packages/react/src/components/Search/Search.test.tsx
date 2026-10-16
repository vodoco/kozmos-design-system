import { render, screen } from "@testing-library/react";
import { Search } from "./Search";
import { describe, it, expect } from "vitest";

describe("Search", () => {
  it("renders correctly", () => {
    render(<Search placeholder="test search" />);
    expect(screen.getByPlaceholderText("test search")).toBeInTheDocument();
  });

  it("hides the browser's own clear, which empties the field behind the product's back", () => {
    // A `type="search"` input draws a second, unlabelled x in Chrome, Edge and
    // Safari, and it wipes the field through the browser rather than through
    // onClear — so the DOM empties, the product's state does not, and the next
    // render puts the text back. The rule that hides it is owned CSS, because
    // no utility can reach `::-webkit-search-cancel-button`; the class is what
    // this asserts.
    const { container } = render(<Search label="Find a place" />);
    const input = container.querySelector("input[type='search']");
    expect(input).not.toBeNull();
    expect(input).toHaveClass("kozmos-search-input");
  });

  it("joins a caller's aria-describedby with its own error", () => {
    render(
      <>
        <p id="search-hint">Try a gate or a shop</p>
        <Search
          label="Find a place"
          aria-describedby="search-hint"
          error="Nothing matches"
        />
      </>,
    );
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "aria-describedby",
      `search-hint ${screen.getByText("Nothing matches").id}`,
    );
  });

  it("does not let a caller conceal its error", () => {
    render(
      <Search
        label="Find a place"
        error="Nothing matches"
        aria-invalid={false}
      />,
    );
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("keeps its id hooks stable when a caller's id comes and goes", () => {
    const { rerender } = render(<Search label="Find a place" />);
    rerender(<Search label="Find a place" id="place" />);
    rerender(<Search label="Find a place" />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});
