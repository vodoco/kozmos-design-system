import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteLocationField } from "./RouteLocationField";
import { AnalyticsProvider } from "../../utils/analytics";

const lobby = {
  value: "lobby-id",
  label: "Lobby",
  description: "North Terminal · Ground floor",
};
const props = {
  label: "From",
  location: null,
  query: "",
  options: [lobby],
  onQueryChange: vi.fn(),
  onSelect: vi.fn(),
  onClear: vi.fn(),
};

describe("RouteLocationField", () => {
  it("preserves host-ranked synonym results only in explicit host filter mode", () => {
    const host = { filterMode: "host" as const };
    const elevator = {
      value: "e1",
      label: "Elevator",
      description: "Ground floor",
    };
    const { rerender } = render(
      <RouteLocationField {...props} query="lift" options={[elevator]} />,
    );
    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    rerender(
      <RouteLocationField
        {...props}
        {...host}
        query="lift"
        options={[elevator]}
      />,
    );
    expect(
      screen.getByRole("option", { name: /Elevator/ }),
    ).toBeInTheDocument();
    rerender(
      <RouteLocationField
        {...props}
        {...host}
        query="lift"
        options={[elevator]}
        status="loading"
      />,
    );
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
  it("does not include a place identity in automatic selection analytics", () => {
    const onDispatch = vi.fn();
    const { unmount } = render(
      <AnalyticsProvider onDispatch={onDispatch}>
        <RouteLocationField {...props} />
      </AnalyticsProvider>,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: /Lobby/ }));
    unmount();
    expect(onDispatch).toHaveBeenCalled();
    expect(JSON.stringify(onDispatch.mock.calls)).not.toContain(lobby.value);
  });
  it("keeps a resolved place separate from its query and supports explicit clearing", () => {
    const onClear = vi.fn();
    render(
      <RouteLocationField
        {...props}
        location={lobby}
        query="unrelated draft"
        onClear={onClear}
        clearLabel="Clear origin"
      />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(lobby.description)).toBeInTheDocument();
    expect(screen.queryByText("unrelated draft")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear origin" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("never treats typed text as a resolved location", () => {
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <RouteLocationField
        {...props}
        onQueryChange={onQueryChange}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "From" }), {
      target: { value: "Lobby" },
    });
    expect(onQueryChange).toHaveBeenCalledWith("Lobby");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("discards stale selectable results while loading but allows a new query or map selection", () => {
    const onChooseMap = vi.fn();
    render(
      <RouteLocationField
        {...props}
        status="loading"
        statusText="Searching places"
        onChooseMap={onChooseMap}
        mapLabel="Choose on map"
      />,
    );
    const field = screen.getByRole("combobox");
    expect(field).not.toBeDisabled();
    fireEvent.focus(field);
    fireEvent.keyDown(field, { key: "ArrowDown" });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    const map = screen.getByRole("button", { name: "Choose on map" });
    expect(map.closest('[role="listbox"]')).toBeNull();
    fireEvent.click(map);
    expect(onChooseMap).toHaveBeenCalledTimes(1);
  });

  it("selects the exact suggestion with its secondary location context", () => {
    const onSelect = vi.fn();
    render(<RouteLocationField {...props} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: /Lobby/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(lobby);
  });

  it("omits ambiguous identities instead of selecting an arbitrary result", () => {
    render(
      <RouteLocationField
        {...props}
        options={[lobby, { ...lobby, label: "Other lobby" }]}
      />,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
