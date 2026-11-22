import figma from "@figma/code-connect";
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
import { Input } from "../../components/Input/Input";
import { MapEditToolbar } from "./MapEditToolbar";

/**
 * Figma Code Connect: MapEditToolbar, a Dashboard module (decision 183),
 * one connection per Mode, each with Cloud's items for that toolbar
 * (CLOUD-UI-005). Overflow has no prop: in code the toolbar overflows into
 * its More menu when the map is narrower than its items.
 * The set is not in the live file yet: its node id is a placeholder.
 * An item's icon is a component passed as a value, which Code Connect
 * collects no import for: each connection lists its imports.
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12604
 */
const URL =
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2480-12604";

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Create" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Pentagon, MarkerPin01, Circle, Code02, FlipBackward, FlipForward, XSquare } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
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
      ]}
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Draw Polygon" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Pencil01, Divider, Ruler, FlipBackward, FlipForward, XSquare } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
        { type: "tool", id: "draw", label: "Draw", icon: Pencil01 },
        {
          type: "tool",
          id: "split",
          label: "Split",
          icon: Divider,
          disabled: true,
        },
        {
          type: "action",
          id: "straighten",
          label: "Straighten",
          icon: Ruler,
          disabled: true,
        },
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
      ]}
      defaultValue="draw"
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Draw Circle" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Pencil01, Divider, Ruler, FlipBackward, FlipForward, XSquare } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
        { type: "tool", id: "draw", label: "Draw", icon: Pencil01 },
        {
          type: "tool",
          id: "split",
          label: "Split",
          icon: Divider,
          disabled: true,
        },
        {
          type: "action",
          id: "straighten",
          label: "Straighten",
          icon: Ruler,
          disabled: true,
        },
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
      ]}
      defaultValue="draw"
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Draw Point" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Pencil01, FlipBackward, FlipForward, XSquare } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
        { type: "tool", id: "draw", label: "Draw", icon: Pencil01 },
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
      ]}
      defaultValue="draw"
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Geometry Set" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Transform, ScissorsCut01, Divider, Ruler, FlipBackward, FlipForward, XSquare } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
        { type: "tool", id: "adjust", label: "Adjust", icon: Transform },
        { type: "divider" },
        { type: "tool", id: "cut-out", label: "Cut-out", icon: ScissorsCut01 },
        { type: "tool", id: "split", label: "Split", icon: Divider },
        { type: "action", id: "straighten", label: "Straighten", icon: Ruler },
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
      ]}
      defaultValue="adjust"
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "JSON" },
  imports: [
    "import { Input } from '@kozmos-ds/react';",
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { FlipBackward, FlipForward, XSquare, RefreshCcw01 } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      field={<Input aria-label="GeoJSON" placeholder="Paste GeoJSON" />}
      items={[
        { type: "action", id: "undo", label: "Undo", icon: FlipBackward },
        {
          type: "action",
          id: "redo",
          label: "Redo",
          icon: FlipForward,
          disabled: true,
        },
        { type: "action", id: "clear", label: "Clear", icon: XSquare },
        { type: "action", id: "reset", label: "Reset", icon: RefreshCcw01 },
      ]}
    />
  ),
});

figma.connect(MapEditToolbar, URL, {
  variant: { Mode: "Edit Existing" },
  imports: [
    "import { MapEditToolbar } from '@kozmos-ds/react/dashboard';",
    "import { Transform, ScissorsCut01, Divider, Ruler, FlipBackward, FlipForward, XSquare, RefreshCcw01 } from '@kozmos-ds/icons';",
  ],
  example: () => (
    <MapEditToolbar
      label="Geometry tools"
      items={[
        { type: "tool", id: "adjust", label: "Adjust", icon: Transform },
        { type: "divider" },
        { type: "tool", id: "cut-out", label: "Cut-out", icon: ScissorsCut01 },
        { type: "tool", id: "split", label: "Split", icon: Divider },
        { type: "action", id: "straighten", label: "Straighten", icon: Ruler },
        { type: "divider" },
        { type: "action", id: "undo", label: "Undo", icon: FlipBackward },
        { type: "action", id: "redo", label: "Redo", icon: FlipForward },
        { type: "action", id: "clear", label: "Clear", icon: XSquare },
        { type: "action", id: "reset", label: "Reset", icon: RefreshCcw01 },
      ]}
      defaultValue="adjust"
    />
  ),
});
