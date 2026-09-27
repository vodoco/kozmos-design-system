import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SearchBar } from "./SearchBar";

afterEach(cleanup);

describe("SearchBar", () => {
  it("renders the search input with placeholder and value", () => {
    render(
      <SearchBar
        placeholder="Search places"
        value="Station"
        onChange={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText("Search places");
    expect(input).toHaveValue("Station");
  });

  it("emits value changes", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Library" },
    });

    expect(onChange).toHaveBeenCalledWith("Library");
  });

  it("clears the value and calls onClear", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchBar value="Museum" onChange={onChange} onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not render a clear button for an empty value", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("passes disabled and readOnly through to the input", () => {
    const { rerender } = render(
      <SearchBar value="" onChange={() => {}} disabled />,
    );
    expect(screen.getByRole("searchbox")).toBeDisabled();

    rerender(<SearchBar value="" onChange={() => {}} readOnly />);
    expect(screen.getByRole("searchbox")).toHaveAttribute("readonly");
  });

  it("is 44 tall at radius Control, the clear control a 24 circle in a 44 hit area", () => {
    render(<SearchBar value="Station" onChange={() => {}} />);
    expect(screen.getByRole("search")).toHaveClass("h-11", "rounded-control");
    const clear = screen.getByRole("button", { name: "Clear search" });
    expect(clear).toHaveClass("h-11", "w-11");
    expect(clear.firstElementChild).toHaveClass("h-6", "w-6", "rounded-pill");
  });

  it("hides the browser's own clear, which empties the field behind the product's back", () => {
    // A `type="search"` input draws a second, unlabelled x in Chrome, Edge and
    // Safari, and it wipes the field through the browser rather than through
    // onClear — so the DOM empties, the product's state does not, and the next
    // render puts the text back. The rule that hides it is owned CSS, because
    // no utility can reach `::-webkit-search-cancel-button`; the class is what
    // this asserts.
    const { container } = render(
      <SearchBar onChange={() => undefined} value="coffee" />,
    );
    const input = container.querySelector("input[type='search']");
    expect(input).not.toBeNull();
    expect(input).toHaveClass("kozmos-search-input");
  });
});
