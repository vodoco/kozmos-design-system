import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Search } from "./Search";
import { describe, it, expect, vi } from "vitest";
import { AnalyticsProvider } from "../../utils/analytics";

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

  describe("clearable (GAP-161)", () => {
    it("draws no clear unless asked, and none while the field is empty", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Search label="Find a place" defaultValue="gate" />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      rerender(<Search label="Find a place" defaultValue="gate" clearable />);
      expect(
        screen.getByRole("button", { name: "Clear search" }),
      ).toBeInTheDocument();
      await user.clear(screen.getByRole("searchbox"));
      expect(screen.queryByRole("button")).toBeNull();
      await user.type(screen.getByRole("searchbox"), "g");
      expect(screen.getByRole("button", { name: "Clear search" })).toHaveClass(
        "kozmos-field-action",
        "kozmos-input-action",
      );
    });

    it("draws no clear on a disabled or read-only field", () => {
      const { rerender } = render(
        <Search
          label="Find a place"
          value="gate"
          clearable
          disabled
          readOnly
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      rerender(<Search label="Find a place" value="gate" clearable readOnly />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("is named in the page's language", () => {
      render(
        <Search
          label="Bir yer bul"
          defaultValue="kapı"
          clearable
          clearLabel="Aramayı temizle"
        />,
      );
      expect(
        screen.getByRole("button", { name: "Aramayı temizle" }),
      ).toBeInTheDocument();
    });

    it("empties a controlled field through its onChange, calls onClear, reports it and returns the focus", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const dispatched = vi.fn();
      const seen: string[] = [];
      function Host() {
        const [query, setQuery] = React.useState("gate");
        return (
          <AnalyticsProvider batchDelayMs={0} onDispatch={dispatched}>
            <Search
              label="Find a place"
              clearable
              value={query}
              onChange={(event) => {
                seen.push(event.target.value);
                setQuery(event.target.value);
              }}
              onClear={onClear}
            />
          </AnalyticsProvider>
        );
      }
      render(<Host />);
      await user.click(screen.getByRole("button", { name: "Clear search" }));
      expect(seen).toEqual([""]);
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(screen.getByRole("searchbox")).toHaveFocus();
      expect(screen.queryByRole("button")).toBeNull();
      await waitFor(() =>
        expect(dispatched.mock.calls.flat(2)).toContainEqual(
          expect.objectContaining({
            component: "Search",
            eventName: "search_cleared",
          }),
        ),
      );
      // The query is never sent.
      const cleared = dispatched.mock.calls
        .flat(2)
        .find((event) => event.eventName === "search_cleared");
      expect(cleared.properties).toBeUndefined();
    });

    it("empties an uncontrolled field and takes its clear away", async () => {
      const user = userEvent.setup();
      render(<Search label="Find a place" defaultValue="gate" clearable />);
      await user.click(screen.getByRole("button", { name: "Clear search" }));
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(screen.getByRole("searchbox")).toHaveFocus();
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("clears on Escape while it holds text, and leaves Escape alone once empty", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const outer = vi.fn();
      render(
        <div
          onKeyDown={(event) => {
            if (event.key === "Escape") outer(event.defaultPrevented);
          }}
        >
          <Search
            label="Find a place"
            defaultValue="gate"
            clearable
            onClear={onClear}
          />
        </div>,
      );
      await user.click(screen.getByRole("searchbox"));
      await user.keyboard("{Escape}");
      expect(screen.getByRole("searchbox")).toHaveValue("");
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenLastCalledWith(true);
      await user.keyboard("{Escape}");
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(outer).toHaveBeenLastCalledWith(false);
    });

    it("leaves Escape alone when it is not clearable", async () => {
      const user = userEvent.setup();
      const outer = vi.fn();
      render(
        <div
          onKeyDown={(event) => {
            if (event.key === "Escape") outer(event.defaultPrevented);
          }}
        >
          <Search label="Find a place" defaultValue="gate" />
        </div>,
      );
      await user.click(screen.getByRole("searchbox"));
      await user.keyboard("{Escape}");
      expect(outer).toHaveBeenLastCalledWith(false);
    });

    it("keeps the caller's onKeyDown, onInput and ref", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      const onInput = vi.fn();
      const ref = React.createRef<HTMLInputElement>();
      render(
        <Search
          ref={ref}
          label="Find a place"
          clearable
          onKeyDown={onKeyDown}
          onInput={onInput}
        />,
      );
      await user.type(screen.getByRole("searchbox"), "a");
      expect(onKeyDown).toHaveBeenCalled();
      expect(onInput).toHaveBeenCalled();
      expect(ref.current).toBe(screen.getByRole("searchbox"));
    });
  });
});
