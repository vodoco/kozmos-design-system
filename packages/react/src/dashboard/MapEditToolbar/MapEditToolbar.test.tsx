import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  Circle,
  Code02,
  Divider,
  FlipBackward,
  FlipForward,
  Hexagon01,
  MarkerPin01,
  ScissorsCut01,
  Transform,
  XSquare,
} from "@kozmos-ds/icons";
import { MapEditToolbar, type MapEditToolbarItem } from "./MapEditToolbar";
import { fitMapEditToolbarItems } from "./fit";
import * as dashboard from "../index";

// Cloud's create mode: [Polygon, Point, Circle] | [JSON] | [Undo, Redo, Clear].
const CREATE: MapEditToolbarItem[] = [
  { type: "tool", id: "polygon", label: "Polygon", icon: Hexagon01 },
  { type: "tool", id: "point", label: "Point", icon: MarkerPin01 },
  { type: "tool", id: "circle", label: "Circle", icon: Circle },
  { type: "divider" },
  { type: "tool", id: "json", label: "JSON", icon: Code02 },
  { type: "divider" },
  { type: "action", id: "undo", label: "Undo", icon: FlipBackward },
  {
    type: "action",
    id: "redo",
    label: "Redo",
    icon: FlipForward,
    disabled: true,
  },
  { type: "action", id: "clear", label: "Clear", icon: XSquare },
];

// Cloud's geometry-set mode, with Adjust chosen.
const GEOMETRY: MapEditToolbarItem[] = [
  { type: "tool", id: "adjust", label: "Adjust", icon: Transform },
  { type: "divider" },
  { type: "tool", id: "cut-out", label: "Cut-out", icon: ScissorsCut01 },
  { type: "tool", id: "split", label: "Split", icon: Divider },
  { type: "divider" },
  { type: "action", id: "undo", label: "Undo", icon: FlipBackward },
  { type: "action", id: "clear", label: "Clear", icon: XSquare },
];

const toolbar = () => screen.getByRole("toolbar");
const item = (name: string) => within(toolbar()).getByRole("button", { name });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MapEditToolbar (CLOUD-UI-005)", () => {
  it("is exported from the dashboard entry", () => {
    expect(dashboard.MapEditToolbar).toBe(MapEditToolbar);
  });

  it("is a labelled, horizontal toolbar on a card", () => {
    render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
    expect(toolbar()).toHaveAccessibleName("Geometry tools");
    expect(toolbar()).toHaveAttribute("aria-orientation", "horizontal");
    expect(toolbar()).toHaveClass(
      "kozmos-map-edit-toolbar",
      "kozmos-surface-solid",
    );
    expect(toolbar().parentElement).toHaveClass(
      "kozmos-map-edit-toolbar-frame",
    );
  });

  it("names every item by its label, and draws its icon hidden", () => {
    render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
    const buttons = within(toolbar()).getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Polygon",
      "Point",
      "Circle",
      "JSON",
      "Undo",
      "Redo",
      "Clear",
    ]);
    for (const button of buttons) {
      expect(button).toHaveAccessibleName(button.textContent!);
      const icon = button.querySelector("svg")!;
      expect(icon).toHaveAttribute("aria-hidden", "true");
      expect(icon).toHaveClass("kozmos-map-edit-toolbar-icon");
    }
  });

  it("draws tools as ToggleButtons with aria-pressed, and actions as plain buttons", () => {
    render(
      <MapEditToolbar
        label="Geometry tools"
        items={CREATE}
        defaultValue="point"
      />,
    );
    expect(item("Polygon")).toHaveAttribute("aria-pressed", "false");
    expect(item("Point")).toHaveAttribute("aria-pressed", "true");
    expect(item("Point")).toHaveAttribute("data-state", "on");
    expect(item("Undo")).not.toHaveAttribute("aria-pressed");
    expect(item("Undo")).toHaveClass("kozmos-button-ghost");
  });

  it("draws dividers between the groups, hidden from assistive technology", () => {
    render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
    const dividers = toolbar().querySelectorAll(
      ".kozmos-map-edit-toolbar-divider",
    );
    expect(dividers).toHaveLength(2);
    for (const divider of dividers) {
      expect(divider).toHaveAttribute("data-orientation", "vertical");
      expect(divider).toHaveAttribute("role", "none");
    }
  });

  describe("one active tool", () => {
    it("chooses the tool pressed, and only that one", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={CREATE}
          onValueChange={onValueChange}
        />,
      );
      await user.click(item("Polygon"));
      expect(onValueChange).toHaveBeenLastCalledWith("polygon");
      expect(item("Polygon")).toHaveAttribute("aria-pressed", "true");
      await user.click(item("Circle"));
      expect(onValueChange).toHaveBeenLastCalledWith("circle");
      expect(
        within(toolbar())
          .getAllByRole("button")
          .filter((button) => button.getAttribute("aria-pressed") === "true"),
      ).toEqual([item("Circle")]);
    });

    it("lets the chosen tool go when it is pressed again", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={CREATE}
          defaultValue="json"
          onValueChange={onValueChange}
        />,
      );
      await user.click(item("JSON"));
      expect(onValueChange).toHaveBeenLastCalledWith(null);
      expect(item("JSON")).toHaveAttribute("aria-pressed", "false");
    });

    it("follows a controlled value, whatever is pressed", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { rerender } = render(
        <MapEditToolbar
          label="Geometry tools"
          items={GEOMETRY}
          value="adjust"
          onValueChange={onValueChange}
        />,
      );
      await user.click(item("Split"));
      expect(onValueChange).toHaveBeenLastCalledWith("split");
      expect(item("Adjust")).toHaveAttribute("aria-pressed", "true");
      expect(item("Split")).toHaveAttribute("aria-pressed", "false");
      rerender(
        <MapEditToolbar
          label="Geometry tools"
          items={GEOMETRY}
          value="split"
        />,
      );
      expect(item("Split")).toHaveAttribute("aria-pressed", "true");
      expect(item("Adjust")).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("reports an action by its id, and never a disabled one", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onValueChange = vi.fn();
    render(
      <MapEditToolbar
        label="Geometry tools"
        items={CREATE}
        onAction={onAction}
        onValueChange={onValueChange}
      />,
    );
    await user.click(item("Undo"));
    expect(onAction).toHaveBeenCalledWith("undo");
    expect(item("Redo")).toBeDisabled();
    await user.click(item("Redo"));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe("roving focus", () => {
    const tabStops = () =>
      within(toolbar())
        .getAllByRole("button")
        .filter((button) => button.tabIndex === 0);

    it("is one tab stop: the chosen tool, else the first item", () => {
      const { rerender } = render(
        <MapEditToolbar label="Geometry tools" items={CREATE} />,
      );
      expect(tabStops()).toEqual([item("Polygon")]);
      rerender(
        <MapEditToolbar label="Geometry tools" items={CREATE} value="json" />,
      );
      expect(tabStops()).toEqual([item("JSON")]);
    });

    it("moves with the arrows, wraps, skips disabled items, and goes to the ends with Home and End", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <MapEditToolbar label="Geometry tools" items={CREATE} />
          <button type="button">After</button>
        </>,
      );
      await user.click(screen.getByRole("button", { name: "Before" }));
      await user.tab();
      expect(item("Polygon")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(item("Point")).toHaveFocus();
      await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      expect(item("Undo")).toHaveFocus();
      // Redo is disabled: skipped.
      await user.keyboard("{ArrowRight}");
      expect(item("Clear")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(item("Polygon")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(item("Clear")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(item("Polygon")).toHaveFocus();
      await user.keyboard("{End}");
      expect(item("Clear")).toHaveFocus();
      expect(tabStops()).toEqual([item("Clear")]);
      // One tab stop: Tab leaves the toolbar, Shift+Tab comes back to Clear.
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
      await user.tab({ shift: true });
      expect(item("Clear")).toHaveFocus();
    });

    it("moves in the writing direction: ArrowLeft goes forward right to left", () => {
      render(
        <div dir="rtl" style={{ direction: "rtl" }}>
          <MapEditToolbar label="Geometry tools" items={GEOMETRY} />
        </div>,
      );
      act(() => item("Adjust").focus());
      fireEvent.keyDown(item("Adjust"), { key: "ArrowLeft" });
      expect(item("Cut-out")).toHaveFocus();
      fireEvent.keyDown(item("Cut-out"), { key: "ArrowRight" });
      expect(item("Adjust")).toHaveFocus();
    });

    it("leaves a field in the card out of the arrows' order", () => {
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={GEOMETRY.slice(5)}
          field={<input aria-label="GeoJSON" />}
        />,
      );
      const field = screen.getByRole("textbox", { name: "GeoJSON" });
      expect(field.closest(".kozmos-map-edit-toolbar-field")).not.toBeNull();
      act(() => field.focus());
      fireEvent.keyDown(field, { key: "ArrowRight" });
      expect(field).toHaveFocus();
    });
  });

  describe("tooltips", () => {
    it("describes an item by its tooltip, and keeps a pressed tool's look", async () => {
      const user = userEvent.setup();
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={[
            {
              type: "tool",
              id: "polygon",
              label: "Polygon",
              icon: Hexagon01,
              tooltip: "Double click to finish drawing",
            },
            {
              type: "action",
              id: "undo",
              label: "Undo",
              icon: FlipBackward,
              tooltip: "Ctrl+Z",
            },
          ]}
          value="polygon"
        />,
      );
      expect(item("Polygon")).toHaveAccessibleDescription(
        "Double click to finish drawing",
      );
      expect(item("Undo")).toHaveAccessibleDescription("Ctrl+Z");
      // A trigger drawn on the button would write its own data-state over
      // the ToggleButton's "on".
      expect(item("Polygon")).toHaveAttribute("data-state", "on");
      await user.hover(item("Undo"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Ctrl+Z");
    });

    it("gives a disabled item none", () => {
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={[
            {
              type: "action",
              id: "redo",
              label: "Redo",
              icon: FlipForward,
              disabled: true,
              tooltip: "Ctrl+Shift+Z",
            },
          ]}
        />,
      );
      expect(item("Redo")).not.toHaveAccessibleDescription();
      expect(
        toolbar().querySelector(".kozmos-map-edit-toolbar-tip"),
      ).toBeNull();
    });
  });

  describe("overflow on a narrow map", () => {
    // jsdom lays nothing out: every item is 56 wide, a divider 1, and the
    // frame as wide as the map gives it.
    function emulateMap(width: { current: number }) {
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect",
      ).mockImplementation(function (this: HTMLElement) {
        const w = this.classList.contains("kozmos-map-edit-toolbar-divider")
          ? 1
          : 56;
        return new DOMRect(0, 0, w, 48);
      });
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
        function (this: HTMLElement) {
          return this.classList.contains("kozmos-map-edit-toolbar-frame")
            ? width.current
            : 0;
        },
      );
      const observers: Array<() => void> = [];
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            observers.push(callback);
          }
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      );
      return {
        resize(next: number) {
          width.current = next;
          act(() => observers.forEach((callback) => callback()));
        },
      };
    }

    it("shows every item when they fit, and no More", () => {
      emulateMap({ current: 1000 });
      render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
      expect(within(toolbar()).getAllByRole("button")).toHaveLength(7);
      expect(
        within(toolbar()).queryByRole("button", { name: "More" }),
      ).toBeNull();
    });

    it("puts what does not fit, from the end, behind More", async () => {
      // Polygon, Point, Circle, a divider and More: 56 × 4 + 1 = 225.
      emulateMap({ current: 230 });
      const user = userEvent.setup();
      const onAction = vi.fn();
      const onValueChange = vi.fn();
      render(
        <MapEditToolbar
          label="Geometry tools"
          items={CREATE}
          onAction={onAction}
          onValueChange={onValueChange}
        />,
      );
      const names = within(toolbar())
        .getAllByRole("button")
        .map((button) => button.textContent);
      expect(names).toEqual(["Polygon", "Point", "Circle", "More"]);
      // No divider is left at the end, before More.
      expect(
        toolbar().querySelectorAll(".kozmos-map-edit-toolbar-divider"),
      ).toHaveLength(0);
      const more = item("More");
      expect(more).toHaveAttribute("aria-haspopup", "menu");
      await user.click(more);
      const menu = await screen.findByRole("menu");
      expect(
        within(menu).getByRole("menuitemcheckbox", { name: "JSON" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        within(menu)
          .getAllByRole("menuitem")
          .map((m) => m.textContent),
      ).toEqual(["Undo", "Redo", "Clear"]);
      expect(
        within(menu).getByRole("menuitem", { name: "Redo" }),
      ).toHaveAttribute("aria-disabled", "true");
      // One separator, between the groups: none leads the menu.
      expect(within(menu).getAllByRole("separator")).toHaveLength(1);
      await user.click(within(menu).getByRole("menuitem", { name: "Clear" }));
      expect(onAction).toHaveBeenCalledWith("clear");
      await user.click(item("More"));
      await user.click(
        within(await screen.findByRole("menu")).getByRole("menuitemcheckbox", {
          name: "JSON",
        }),
      );
      expect(onValueChange).toHaveBeenLastCalledWith("json");
    });

    it("keeps More in the arrows' order", () => {
      emulateMap({ current: 230 });
      render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
      act(() => item("Circle").focus());
      fireEvent.keyDown(item("Circle"), { key: "ArrowRight" });
      expect(item("More")).toHaveFocus();
      fireEvent.keyDown(item("More"), { key: "End" });
      expect(item("More")).toHaveFocus();
    });

    it("refits as the map is resized", () => {
      const map = emulateMap({ current: 1000 });
      render(<MapEditToolbar label="Geometry tools" items={CREATE} />);
      expect(within(toolbar()).getAllByRole("button")).toHaveLength(7);
      map.resize(230);
      expect(within(toolbar()).getAllByRole("button")).toHaveLength(4);
      map.resize(1000);
      expect(within(toolbar()).getAllByRole("button")).toHaveLength(7);
    });
  });

  describe("fitMapEditToolbarItems", () => {
    it("fits everything that fits", () => {
      expect(fitMapEditToolbarItems([56, 56, 1, 56], 169, 56, 0)).toBe(4);
    });
    it("leaves room for More after the items it keeps", () => {
      expect(fitMapEditToolbarItems([56, 56, 1, 56], 168, 56, 0)).toBe(2);
      expect(fitMapEditToolbarItems([56, 56, 1, 56], 120, 56, 4)).toBe(1);
    });
    it("counts the gaps", () => {
      expect(fitMapEditToolbarItems([56, 56], 112, 56, 4)).toBe(0);
      expect(fitMapEditToolbarItems([56, 56], 116, 56, 4)).toBe(2);
    });
  });
});
