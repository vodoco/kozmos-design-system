import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";
import { AnalyticsProvider, type AnalyticsEvent } from "../../utils/analytics";

afterEach(cleanup);

describe("SearchBar", () => {
  it("returns focus to the controlled input when clearing removes the action", async () => {
    const user = userEvent.setup();
    const inputRef = React.createRef<HTMLInputElement>();
    function ControlledSearch() {
      const [value, setValue] = React.useState("Museum");
      return <SearchBar ref={inputRef} value={value} onChange={setValue} />;
    }
    const { unmount } = render(<ControlledSearch />);
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("searchbox")).toHaveFocus();
    expect(inputRef.current).toBe(screen.getByRole("searchbox"));
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    await user.type(screen.getByRole("searchbox"), "Gallery");
    expect(screen.getByRole("searchbox")).toHaveValue("Gallery");
    unmount();
    expect(inputRef.current).toBeNull();
  });

  it("lets the host move focus after clearing and preserves callback refs", async () => {
    const user = userEvent.setup();
    const ref = vi.fn();
    const onClear = vi.fn(() =>
      screen.getByRole("button", { name: "Map" }).focus(),
    );
    const { unmount } = render(
      <>
        <SearchBar ref={ref} value="Museum" onClear={onClear} />
        <button>Map</button>
      </>,
    );
    expect(ref).toHaveBeenLastCalledWith(screen.getByRole("searchbox"));
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Map" })).toHaveFocus();
    unmount();
    expect(ref.mock.lastCall?.[0]).toBeNull();
  });

  it("keeps the caller's ref on the live input when the trailing slot comes or goes", () => {
    // The input is remounted when `trailing` appears or disappears; an
    // imperative handle made once left the caller holding the detached one.
    const ref = React.createRef<HTMLInputElement>();
    const { rerender } = render(<SearchBar ref={ref} value="" />);
    expect(ref.current).toBe(screen.getByRole("searchbox"));
    rerender(
      <SearchBar ref={ref} value="" trailing={<button>Filters</button>} />,
    );
    expect(ref.current).toBe(screen.getByRole("searchbox"));
    expect(ref.current?.isConnected).toBe(true);
    rerender(<SearchBar ref={ref} value="" />);
    expect(ref.current).toBe(screen.getByRole("searchbox"));
  });

  it("composes the host keyboard handler with search initiation", () => {
    const dispatch = vi.fn((events: AnalyticsEvent[]) => events);
    const onKeyDown = vi.fn();
    const { unmount } = render(
      <AnalyticsProvider onDispatch={dispatch}>
        <SearchBar value="Museum" onKeyDown={onKeyDown} />
      </AnalyticsProvider>,
    );
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
    expect(onKeyDown).toHaveBeenCalledOnce();
    unmount();
    expect(
      dispatch.mock.calls
        .flatMap(([batch]) => batch)
        .filter(({ eventName }) => eventName === "search_initiated"),
    ).toHaveLength(1);
  });

  it.each(["composing", "prevented"])(
    "does not initiate a %s Enter",
    (mode) => {
      const dispatch = vi.fn((events: AnalyticsEvent[]) => events);
      const { unmount } = render(
        <AnalyticsProvider onDispatch={dispatch}>
          <SearchBar
            value="Museum"
            {...(mode === "prevented"
              ? {
                  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) =>
                    event.preventDefault(),
                }
              : {})}
          />
        </AnalyticsProvider>,
      );
      fireEvent.keyDown(screen.getByRole("searchbox"), {
        key: "Enter",
        isComposing: mode === "composing",
      });
      unmount();
      expect(
        dispatch.mock.calls
          .flatMap(([batch]) => batch)
          .filter(({ eventName }) => eventName === "search_initiated"),
      ).toHaveLength(0);
    },
  );

  it("composes Core clear without submitting its containing form", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const submit = vi.fn();
    const dispatch = vi.fn((events: AnalyticsEvent[]) => events);
    const { unmount } = render(
      <AnalyticsProvider onDispatch={dispatch}>
        <form onSubmit={submit}>
          <SearchBar
            value="Museum"
            onChange={onChange}
            onClear={onClear}
            clearLabel="Clear places"
          />
        </form>
      </AnalyticsProvider>,
    );
    const clear = screen.getByRole("button", { name: "Clear places" });
    expect(clear).toHaveClass("kozmos-button");
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(submit).not.toHaveBeenCalled();
    unmount();
    const events = dispatch.mock.calls.flatMap(([batch]) => batch);
    expect(
      events.map(({ component, eventName }) => [component, eventName]),
    ).toEqual([
      ["Button", "button_clicked"],
      ["SearchBar", "search_cleared"],
    ]);
    expect(JSON.stringify(events)).not.toContain("Museum");
  });

  it.each(["disabled", "readOnly"] as const)(
    "does not clear a %s field",
    (state) => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      render(
        <SearchBar
          value="Museum"
          onChange={onChange}
          onClear={onClear}
          {...{ [state]: true }}
        />,
      );
      const clear = screen.getByRole("button", { name: "Clear search" });
      expect(clear).toBeDisabled();
      fireEvent.click(clear);
      expect(onChange).not.toHaveBeenCalled();
      expect(onClear).not.toHaveBeenCalled();
    },
  );

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
