import type { Meta, StoryObj } from "@storybook/react";
import {
  Circle,
  Code02,
  Divider,
  FlipBackward,
  FlipForward,
  MarkerPin01,
  Pencil01,
  Pentagon,
  RefreshCcw01,
  Ruler,
  ScissorsCut01,
  Transform,
  XSquare,
} from "@kozmos-ds/icons";
import {
  MapEditToolbar,
  type MapEditToolbarAction,
  type MapEditToolbarItem,
  type MapEditToolbarTool,
} from "./MapEditToolbar";
import { Input } from "../../components/Input/Input";

// A Dashboard module (decision 183): its stories are filed under Dashboard/,
// and draw only with Kozmos parts. src/dashboard is not scanned for
// style.css's utilities, so a story here writes no utility classes either.
//
// Each story is one of Pointr Cloud's toolbars (CLOUD-UI-005, as Cloud 10.16
// draws them): the part is the same, the items the product's. The icons are
// named exports of @kozmos-ds/icons (decision 121): Transform, ScissorsCut01,
// Divider and Ruler for Adjust, Cut-out, Split and Straighten, as MAP-64's
// toolbar draws them. MAP-619's Merge, after Split, waits for its glyph
// (GAP-223), which @kozmos-ds/icons does not have yet.

const undo: MapEditToolbarAction = {
  type: "action",
  id: "undo",
  label: "Undo",
  icon: FlipBackward,
};
const redo: MapEditToolbarAction = {
  type: "action",
  id: "redo",
  label: "Redo",
  icon: FlipForward,
};
const clear: MapEditToolbarAction = {
  type: "action",
  id: "clear",
  label: "Clear",
  icon: XSquare,
};
const reset: MapEditToolbarAction = {
  type: "action",
  id: "reset",
  label: "Reset",
  icon: RefreshCcw01,
};
const draw: MapEditToolbarTool = {
  type: "tool",
  id: "draw",
  label: "Draw",
  icon: Pencil01,
};
const adjust: MapEditToolbarTool = {
  type: "tool",
  id: "adjust",
  label: "Adjust",
  icon: Transform,
};
const cutOut: MapEditToolbarTool = {
  type: "tool",
  id: "cut-out",
  label: "Cut-out",
  icon: ScissorsCut01,
};
const split: MapEditToolbarTool = {
  type: "tool",
  id: "split",
  label: "Split",
  icon: Divider,
};
const straighten: MapEditToolbarAction = {
  type: "action",
  id: "straighten",
  label: "Straighten",
  icon: Ruler,
};
const divider: MapEditToolbarItem = { type: "divider" };
const off = <T extends MapEditToolbarTool | MapEditToolbarAction>(
  item: T,
): T => ({
  ...item,
  disabled: true,
});

/**
 * Create, no geometry yet, written out: the card's example. The other
 * modes below are built from the items above.
 */
const CREATE_ITEMS: MapEditToolbarItem[] = [
  { type: "tool", id: "polygon", label: "Polygon", icon: Pentagon },
  { type: "tool", id: "point", label: "Point", icon: MarkerPin01 },
  { type: "tool", id: "circle", label: "Circle", icon: Circle },
  { type: "divider" },
  { type: "tool", id: "json", label: "JSON", icon: Code02 },
  { type: "divider" },
  {
    type: "action",
    id: "undo",
    label: "Undo",
    icon: FlipBackward,
    disabled: true,
  },
  {
    type: "action",
    id: "redo",
    label: "Redo",
    icon: FlipForward,
    disabled: true,
  },
  { type: "action", id: "clear", label: "Clear", icon: XSquare },
];

/** Cloud's other toolbars, by mode. */
const MAP_EDIT_MODES = {
  drawPolygon: [
    { ...draw, tooltip: "Double click to finish drawing" },
    off(split),
    off(straighten),
    divider,
    off(undo),
    off(redo),
    clear,
  ],
  drawCircle: [
    draw,
    off(split),
    off(straighten),
    divider,
    off(undo),
    off(redo),
    clear,
  ],
  drawPoint: [draw, divider, off(undo), off(redo), clear],
  geometrySet: [
    adjust,
    divider,
    cutOut,
    split,
    straighten,
    divider,
    undo,
    off(redo),
    clear,
  ],
  json: [undo, off(redo), clear, reset],
  editExisting: [
    adjust,
    divider,
    cutOut,
    split,
    straighten,
    divider,
    undo,
    redo,
    clear,
    reset,
  ],
} satisfies Record<string, MapEditToolbarItem[]>;

const meta: Meta<typeof MapEditToolbar> = {
  id: "dashboard-mapedittoolbar",
  title: "Dashboard/MapEditToolbar",
  component: MapEditToolbar,
  args: {
    label: "Geometry tools",
    items: CREATE_ITEMS,
  },
  argTypes: {
    items: { control: false },
    field: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof MapEditToolbar>;

/**
 * Create, no geometry yet: the three shapes and JSON are tools, then the
 * history and Clear. Undo and Redo wait for something to undo.
 */
export const Create: Story = {};

/** Drawing a polygon: Draw is the tool, Split and Straighten wait for a shape. */
export const DrawPolygon: Story = {
  args: { items: MAP_EDIT_MODES.drawPolygon, defaultValue: "draw" },
};

/** Drawing a circle: as a polygon, with Cloud's hint left to the guidance strip. */
export const DrawCircle: Story = {
  args: { items: MAP_EDIT_MODES.drawCircle, defaultValue: "draw" },
};

/** Placing a point: Draw alone, then the history and Clear. */
export const DrawPoint: Story = {
  args: { items: MAP_EDIT_MODES.drawPoint, defaultValue: "draw" },
};

/**
 * A geometry is set: Adjust is the tool; Cut-out and Split are tools too,
 * and Straighten an action, done once.
 */
export const GeometrySet: Story = {
  args: { items: MAP_EDIT_MODES.geometrySet, defaultValue: "adjust" },
};

/**
 * JSON: a labelled GeoJSON field takes the tools' place, a Kozmos Input in
 * the card, outside the items' arrow-key order.
 */
export const Json: Story = {
  args: {
    items: MAP_EDIT_MODES.json,
    field: <Input aria-label="GeoJSON" placeholder="Paste GeoJSON" />,
  },
};

/** Editing a saved geometry: the geometry-set toolbar, and Reset. */
export const EditExisting: Story = {
  args: { items: MAP_EDIT_MODES.editExisting, defaultValue: "adjust" },
};

/**
 * On a narrow map the items that do not fit go, from the end, into a More
 * menu, never off the screen: Cloud's toolbar ran off a 1280 window.
 */
export const NarrowMap: Story = {
  args: { items: MAP_EDIT_MODES.editExisting, defaultValue: "adjust" },
  render: (args) => (
    <div style={{ inlineSize: 320 }}>
      <MapEditToolbar {...args} />
    </div>
  ),
};

/** Right to left, the first item is on the right, and the arrows follow. */
export const RightToLeft: Story = {
  args: { items: MAP_EDIT_MODES.geometrySet, defaultValue: "adjust" },
  render: (args) => (
    <div dir="rtl">
      <MapEditToolbar {...args} />
    </div>
  ),
};
