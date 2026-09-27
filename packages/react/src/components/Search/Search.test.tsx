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
});
