/**
 * A headless stand-in for the Figma Plugin API, so a painter in
 * `figma/foundations-importer/code.js` can be run from the terminal and its
 * output measured — the same way the web suites measure the DOM and the
 * Paparazzi goldens are measured with PIL.
 *
 * It models what the painters touch: frames, components, instances, text,
 * vectors, the auto-layout properties, fills and strokes, variable-bound
 * paints, shared plugin data, component properties and instance swaps. It
 * does not lay anything out: a text node's width is the sum of a fixed
 * advance per character, an auto-layout frame keeps the size it was given.
 * That is enough to assert the numbers a painter writes — a 64 square, a
 * counter placed 4 beyond its edge, a paint bound to a named variable — and
 * not enough to assert how Figma renders them. It is a unit test of the
 * painter, not a picture of the file.
 *
 * `loadPlugin` evaluates the plugin source in a fresh context whose `figma`
 * global is this mock and returns the context, so every top-level function
 * of the plugin (the painters, the helpers) is reachable by name.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

let nextId = 1;

const CHAR_ADVANCE = 0.55;

/**
 * A bound paint's opacity is what the file draws, and a token's own alpha
 * rides on it: rendered over REST on 2026-09-21, Backdrop's fill bound to
 * Overlay/Scrim held 0.502 and drew at 128/255, and IconButton's Glass fill
 * held 0.102. What the file did not keep is a strength laid on top of an
 * opaque token: CategoryTile's 5 % selection wash and 20 % ring and
 * DirectionStep's 10 % disc read back at 1, while CategoryField's 12 % wash,
 * painted by the same helper, kept its 0.12. So the mock keeps an opacity
 * equal to the bound token's own alpha, in both modes, and drops any other,
 * recording each drop: a check fails on a painter that lays a strength on a
 * bound paint instead of on the layer.
 */
export const boundPaintOpacityDrops = [];

let tokenAlphaByName = null;

// The alpha each variable's token carries, from the payload the importer
// writes: the same value in Light and Dark, or null when the modes differ
// or the token is not in the payload.
function tokenAlpha(name) {
  if (!tokenAlphaByName) {
    tokenAlphaByName = new Map();
    const payload = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "docs/figma-foundations-payload.json"),
        "utf8",
      ),
    );
    const byCanonical = new Map(
      payload.variables.map((variable) => [variable.canonicalName, variable]),
    );
    const alphaOf = (record, mode, depth = 0) => {
      if (!record || depth > 8) return null;
      if (record.kind === "alias") {
        const target = byCanonical.get(record.path);
        return target ? alphaOf(target.values[mode], mode, depth + 1) : null;
      }
      const raw = String(record.value).trim().toLowerCase();
      const hex = raw.match(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
      if (hex) return hex[1] ? Number.parseInt(hex[1], 16) / 255 : 1;
      const rgba = raw.match(/^rgba?\(([^)]+)\)$/);
      if (rgba) {
        const parts = rgba[1].split(",");
        return parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
      }
      return null;
    };
    for (const variable of payload.variables) {
      const light = alphaOf(variable.values.light, "light");
      const dark = alphaOf(variable.values.dark, "dark");
      tokenAlphaByName.set(
        variable.figmaName,
        light !== null && dark !== null && Math.abs(light - dark) < 0.002
          ? light
          : null,
      );
    }
  }
  return tokenAlphaByName.has(name) ? tokenAlphaByName.get(name) : null;
}

function storePaints(node, paints) {
  if (!Array.isArray(paints)) return paints;
  return paints.map((paint) => {
    if (
      paint &&
      paint.boundVariables &&
      paint.boundVariables.color &&
      typeof paint.opacity === "number" &&
      paint.opacity < 1
    ) {
      const token = String(paint.boundVariables.color.id).replace(
        /^VariableID:/,
        "",
      );
      const alpha = tokenAlpha(token);
      if (alpha !== null && Math.abs(paint.opacity - alpha) < 0.002) {
        return paint;
      }
      boundPaintOpacityDrops.push({
        node: node.name,
        opacity: paint.opacity,
        token,
        tokenAlpha: alpha,
      });
      const kept = { ...paint };
      delete kept.opacity;
      return kept;
    }
    return paint;
  });
}

// Every node a findOne or findAll visits, and the pages searches start on, so
// a check can hold a painter to the pages it should read: a lookup that walks
// the Components page costs 27k nodes in the live file.
export const searchStats = { visits: 0, pageSearches: {} };

export function resetSearchStats() {
  searchStats.visits = 0;
  searchStats.pageSearches = {};
}

function countPageSearch(name) {
  searchStats.pageSearches[name] = (searchStats.pageSearches[name] || 0) + 1;
}

// Figma couples a text's sizing, its truncation and its line limit, and no
// document says how. The file does, read over REST on 2026-09-22:
// - CategoryTile's label was set to auto height, then to truncate, then to two
//   lines, and read TRUNCATE (a fixed box that truncates), 14 high, with no line
//   limit: every long category name cut at one line. So truncation on a text
//   that sizes itself, with no line limit yet, fixes the box; and a fixed box
//   takes no line limit.
// - The Tree and navigation labels were set to TRUNCATE, then to HUG
//   vertically, and read auto height, truncation and a limit of 1. So HUG gives
//   a truncating box auto height and keeps the one line it showed.
// The state lives in one plain object, so clone() copies it whole rather than
// replaying it through these setters in some other order.
const TEXT_SIZING_FIELDS = {
  textAutoResize: "autoResize",
  textTruncation: "truncation",
  maxLines: "maxLines",
};
const TEXT_SIZING_SETTERS = {
  textAutoResize(value) {
    const sizing = this._textSizing;
    sizing.autoResize = value;
    if (value === "TRUNCATE") {
      sizing.truncation = "ENDING";
      sizing.maxLines = null;
    }
  },
  textTruncation(value) {
    const sizing = this._textSizing;
    sizing.truncation = value;
    if (
      value === "ENDING" &&
      sizing.maxLines === null &&
      (sizing.autoResize === "HEIGHT" ||
        sizing.autoResize === "WIDTH_AND_HEIGHT")
    ) {
      sizing.autoResize = "TRUNCATE";
    }
  },
  maxLines(value) {
    const sizing = this._textSizing;
    if (value !== null && value !== undefined) {
      if (sizing.truncation !== "ENDING") {
        throw new Error(
          "in set_maxLines: maxLines applies only when textTruncation is ENDING",
        );
      }
      if (
        sizing.autoResize !== "HEIGHT" &&
        sizing.autoResize !== "WIDTH_AND_HEIGHT"
      ) {
        throw new Error(
          "in set_maxLines: a fixed text box takes no line limit",
        );
      }
      if (!(value >= 1)) {
        throw new Error("in set_maxLines: the value must be >= 1");
      }
    }
    sizing.maxLines = value === undefined ? null : value;
  },
};
function defineTextSizing(node) {
  node._textSizing = {
    autoResize: "WIDTH_AND_HEIGHT",
    truncation: "DISABLED",
    maxLines: null,
  };
  for (const [key, field] of Object.entries(TEXT_SIZING_FIELDS)) {
    Object.defineProperty(node, key, {
      configurable: true,
      enumerable: false,
      get() {
        return this._textSizing[field];
      },
      set(value) {
        TEXT_SIZING_SETTERS[key].call(this, value);
        this.remeasure();
      },
    });
  }
}

// Every node by id, as the document resolves an id: a painter's component
// need not sit on a page for an instance swap to find it.
const nodesById = new Map();

export class MockNode {
  constructor(type, name) {
    this.id = `${nextId++}:${nextId}`;
    nodesById.set(this.id, this);
    this.type = type;
    this.name = name || type;
    this.parent = null;
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.width = 100;
    this.height = 100;
    this.visible = true;
    this.opacity = 1;
    this.fills = [];
    this.strokes = [];
    this.strokeWeight = 1;
    this.strokeAlign = "INSIDE";
    this.dashPattern = [];
    this.effects = [];
    this.cornerRadius = 0;
    this.clipsContent = false;
    this.layoutMode = "NONE";
    this.primaryAxisSizingMode = "AUTO";
    this.counterAxisSizingMode = "AUTO";
    this.primaryAxisAlignItems = "MIN";
    this.counterAxisAlignItems = "MIN";
    this.itemSpacing = 0;
    this.paddingLeft = 0;
    this.paddingRight = 0;
    this.paddingTop = 0;
    this.paddingBottom = 0;
    this.layoutPositioning = "AUTO";
    this.layoutSizingHorizontal = "FIXED";
    this.layoutSizingVertical = "FIXED";
    this.constraints = { horizontal: "MIN", vertical: "MIN" };
    this.rotation = 0;
    this.sharedPluginData = {};
    this.pluginData = {};
    this.componentPropertyReferences = null;
    this.boundVariables = {};
    // Collection id to mode id, as setExplicitVariableModeForCollection sets it.
    this.explicitVariableModes = {};
    if (type === "TEXT") {
      this.characters = "";
      this.fontName = { family: "Inter", style: "Regular" };
      this.fontSize = 12;
      this.lineHeight = { unit: "PIXELS", value: 16 };
      this.letterSpacing = { unit: "PERCENT", value: 0 };
      defineTextSizing(this);
      this.textAutoResize = "WIDTH_AND_HEIGHT";
      this.textAlignHorizontal = "LEFT";
      this.textAlignVertical = "TOP";
      this.textDecoration = "NONE";
      this.textTruncation = "DISABLED";
      this.maxLines = null;
      this.textStyleId = "";
    }
    if (type === "COMPONENT_SET" || type === "COMPONENT") {
      this.componentPropertyDefinitions = {};
      this.description = "";
      this.documentationLinks = [];
    }
    if (type === "COMPONENT") {
      this.variantProperties = null;
    }
    if (type === "INSTANCE") {
      this.mainComponent = null;
      this.isExposedInstance = false;
    }
  }

  get fills() {
    return this._fills;
  }

  set fills(value) {
    this._fills = storePaints(this, value);
  }

  get strokes() {
    return this._strokes;
  }

  set strokes(value) {
    this._strokes = storePaints(this, value);
    this.holdAutoLayoutMinimum();
  }

  // See AUTO_LAYOUT_BOX_FIELDS.
  holdAutoLayoutMinimum() {
    const box = this._box;
    if (!box || !box.layoutMode || box.layoutMode === "NONE") return;
    const stroked =
      this.strokesIncludedInLayout !== false &&
      Array.isArray(this._strokes) &&
      this._strokes.some((paint) => paint && paint.visible !== false);
    const stroke =
      stroked && typeof box.strokeWeight === "number" ? box.strokeWeight : 0;
    const width = (box.paddingLeft || 0) + (box.paddingRight || 0) + 2 * stroke;
    const height =
      (box.paddingTop || 0) + (box.paddingBottom || 0) + 2 * stroke;
    if (this.width < width) this.width = width;
    if (this.height < height) this.height = height;
  }

  // A text's size and leading, as Figma keeps them: a literal written to a
  // field bound to a variable drops the binding. Apply Text Styles wrote
  // literals before attaching a style and unbound 4,957 texts in the live
  // file on 2026-09-21; a painter binds after it writes.
  get fontSize() {
    return this._fontSize;
  }

  set fontSize(value) {
    this._fontSize = value;
    if (this.boundVariables) delete this.boundVariables.fontSize;
  }

  get lineHeight() {
    return this._lineHeight;
  }

  set lineHeight(value) {
    this._lineHeight = value;
    if (this.boundVariables) delete this.boundVariables.lineHeight;
  }

  get characters() {
    return this._characters || "";
  }

  set characters(value) {
    this._characters = value;
    this.remeasure();
  }

  remeasure() {
    if (this.type !== "TEXT") return;
    const size = typeof this.fontSize === "number" ? this.fontSize : 12;
    const line =
      this.lineHeight && typeof this.lineHeight.value === "number"
        ? this.lineHeight.value
        : size * 1.3;
    const measured = this.characters.length * size * CHAR_ADVANCE;
    if (this.textAutoResize === "WIDTH_AND_HEIGHT") {
      this.width = Math.max(1, measured);
      this.height = line;
    } else if (this.textAutoResize === "HEIGHT") {
      const lines = Math.max(1, Math.ceil(measured / Math.max(1, this.width)));
      const capped =
        typeof this.maxLines === "number"
          ? Math.min(lines, this.maxLines)
          : lines;
      this.height = capped * line;
    }
  }

  appendChild(child) {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.push(child);
  }

  insertChild(index, child) {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.splice(index, 0, child);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    child.parent = null;
  }

  remove() {
    if (this.parent) this.parent.removeChild(this);
    this.removed = true;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.requestedSize = { width, height };
    this.holdAutoLayoutMinimum();
  }

  setExplicitVariableModeForCollection(collection, modeId) {
    const id = typeof collection === "string" ? collection : collection.id;
    this.explicitVariableModes = {
      ...this.explicitVariableModes,
      [id]: modeId,
    };
  }

  resizeWithoutConstraints(width, height) {
    this.resize(width, height);
  }

  rescale() {}

  findOne(predicate) {
    if (this.type === "PAGE") countPageSearch(this.name);
    for (const child of this.children) {
      searchStats.visits += 1;
      if (predicate(child)) return child;
      const nested = child.findOne(predicate);
      if (nested) return nested;
    }
    return null;
  }

  findAll(predicate) {
    if (this.type === "PAGE") countPageSearch(this.name);
    const out = [];
    for (const child of this.children) {
      searchStats.visits += 1;
      if (!predicate || predicate(child)) out.push(child);
      out.push(...child.findAll(predicate));
    }
    return out;
  }

  findChild(predicate) {
    return this.children.find(predicate) || null;
  }

  findChildren(predicate) {
    return this.children.filter(predicate);
  }

  async loadAsync() {}

  setSharedPluginData(namespace, key, value) {
    this.sharedPluginData[`${namespace}/${key}`] = value;
  }

  getSharedPluginData(namespace, key) {
    return this.sharedPluginData[`${namespace}/${key}`] || "";
  }

  setPluginData(key, value) {
    this.pluginData[key] = value;
  }

  getPluginData(key) {
    return this.pluginData[key] || "";
  }

  setBoundVariable(field, variable) {
    this.boundVariables[field] = variable
      ? { type: "VARIABLE_ALIAS", id: variable.id }
      : undefined;
  }

  async setTextStyleIdAsync(id) {
    this.textStyleId = id;
  }

  clone() {
    const copy = new MockNode(this.type, this.name);
    for (const key of Object.keys(this)) {
      if (key === "children" || key === "parent" || key === "id") continue;
      const value = this[key];
      copy[key] =
        value && typeof value === "object" ? structuredClone(value) : value;
    }
    for (const child of this.children) copy.appendChild(child.clone());
    return copy;
  }

  createInstance() {
    if (this.type !== "COMPONENT") {
      throw new Error("createInstance on a non-component");
    }
    const instance = this.clone();
    instance.type = "INSTANCE";
    instance.mainComponent = this;
    instance.isExposedInstance = false;
    instance.variantProperties = null;
    instance.componentProperties = {};
    return instance;
  }

  async getMainComponentAsync() {
    return this.mainComponent;
  }

  // An instance's own overrides. Only the name is modelled, and Figma resets
  // it with the rest: an instance renamed "Pointr Source" reads as its main
  // component's name again ("search-md") after resetOverrides(). Not
  // modelled until 2026-10-05, the reset passed here while in the file it
  // made every second Curated Icons run redraw every source it had kept.
  resetOverrides() {
    if (this.type === "INSTANCE" && this.mainComponent)
      this.name = this.mainComponent.name;
  }

  setProperties(properties) {
    if (this.type !== "INSTANCE")
      throw new Error("setProperties on a non-instance");
    for (const [key, value] of Object.entries(properties)) {
      const base = key.split("#")[0];
      this.componentProperties[key] = value;
      // An instance swap puts the chosen component's layers in the nested
      // instance, at the nested instance's size and name. What the layers it
      // replaced carried — a tint — goes with them.
      const swapped = this.findAll(
        (node) =>
          node.type === "INSTANCE" &&
          node.componentPropertyReferences &&
          node.componentPropertyReferences.mainComponent &&
          node.componentPropertyReferences.mainComponent.split("#")[0] === base,
      );
      if (swapped.length && typeof value === "string") {
        const component = nodesById.get(value);
        if (!component || component.type !== "COMPONENT") {
          throw new Error(`in setProperties: no component ${value} to swap in`);
        }
        for (const nested of swapped) {
          for (const child of [...nested.children]) nested.removeChild(child);
          for (const child of component.children) {
            nested.appendChild(child.clone());
          }
          nested.mainComponent = component;
        }
      }
      const text = this.findOne(
        (node) =>
          node.type === "TEXT" &&
          node.componentPropertyReferences &&
          node.componentPropertyReferences.characters &&
          node.componentPropertyReferences.characters.split("#")[0] === base,
      );
      if (text && typeof value === "string") text.characters = value;
    }
  }

  addComponentProperty(name, type, defaultValue, options) {
    const key = `${name}#${nextId++}:0`;
    this.componentPropertyDefinitions[key] = {
      type,
      defaultValue,
      preferredValues: options && options.preferredValues,
    };
    return key;
  }

  editComponentProperty(name, patch) {
    const definition = this.componentPropertyDefinitions[name];
    if (!definition) throw new Error(`no property ${name}`);
    Object.assign(definition, patch);
    return name;
  }

  deleteComponentProperty(name) {
    delete this.componentPropertyDefinitions[name];
  }
}

/** A component set whose variants are named `Axis=Value, …`. */
export function mockComponentSet(name, variants) {
  const set = new MockNode("COMPONENT_SET", name);
  for (const { properties, build } of variants) {
    const variant = new MockNode("COMPONENT");
    variant.name = Object.entries(properties)
      .map(([axis, value]) => `${axis}=${value}`)
      .join(", ");
    variant.variantProperties = { ...properties };
    if (build) build(variant);
    set.appendChild(variant);
  }
  return set;
}

/** A curated icon source: a 24 component holding one stroked vector. */
/** A wayfinding source, as Curated Icons draws it: solid shapes, no stroke. */
export function mockWayfindingIconComponent(name) {
  const component = new MockNode("COMPONENT", `Icon / ${name}`);
  component.resize(24, 24);
  const vector = new MockNode("VECTOR", "Vector");
  vector.resize(24, 24);
  vector.fills = [
    { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
  ];
  component.appendChild(vector);
  return component;
}

export function mockIconComponent(name) {
  const component = new MockNode("COMPONENT", `Icon / ${name}`);
  component.resize(24, 24);
  const vector = new MockNode("VECTOR", "Vector");
  vector.resize(24, 24);
  vector.strokes = [
    { type: "SOLID", color: { r: 0, g: 0, b: 0 }, opacity: 1, visible: true },
  ];
  vector.strokeWeight = 2;
  component.appendChild(vector);
  return component;
}

// An auto-layout frame is never smaller than its padding, nor than its stroke
// on each side when it has one: every frame in the live file lays its stroke
// out (strokesIncludedInLayout, the runtime's default, which no painter sets).
// No document says so; the file did, over REST on 2026-09-22. DynamicIsland's
// three slots were made 24 high with 12 above and below, took a 1px stroke,
// then had that padding cut to 3 and to 1 — and read 26, whatever their
// padding and their label, while every slot made taller than 26 kept its
// size. So a frame grows the moment its padding and stroke outgrow it, and a
// fixed frame does not shrink back when the padding falls. `requestedSize`
// keeps the size a painter last asked for, so a check can find every frame
// that did not get it.
const AUTO_LAYOUT_BOX_FIELDS = [
  "layoutMode",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "strokeWeight",
];
for (const field of AUTO_LAYOUT_BOX_FIELDS) {
  Object.defineProperty(MockNode.prototype, field, {
    configurable: true,
    get() {
      return this._box ? this._box[field] : undefined;
    },
    set(value) {
      if (!this._box) this._box = {};
      this._box[field] = value;
      this.holdAutoLayoutMinimum();
    },
  });
}

/** Auto-layout frames under `root` that are not the size last asked of them. */
export function framesLargerThanAsked(root) {
  const found = [];
  (function walk(node) {
    const asked = node.requestedSize;
    if (
      asked &&
      isAutoLayoutNode(node) &&
      (node.width > asked.width || node.height > asked.height)
    ) {
      found.push(node);
    }
    for (const child of node.children || []) walk(child);
  })(root);
  return found;
}

// Figma's rules for layout sizing, with its own messages, so a painter that
// asks for one Figma refuses is caught here rather than in the live file's
// run log: HUG takes an auto-layout frame, or text inside one; FILL takes a
// child of an auto-layout frame. The plugin's setters catch and record a
// refusal, as they do in Figma.
const layoutSizingValues = Symbol("layoutSizing");
function isAutoLayoutNode(node) {
  return Boolean(node && node.layoutMode && node.layoutMode !== "NONE");
}
for (const axis of ["layoutSizingHorizontal", "layoutSizingVertical"]) {
  Object.defineProperty(MockNode.prototype, axis, {
    configurable: true,
    get() {
      return (
        (this[layoutSizingValues] && this[layoutSizingValues][axis]) || "FIXED"
      );
    },
    set(value) {
      if (
        value === "HUG" &&
        !isAutoLayoutNode(this) &&
        !(this.type === "TEXT" && isAutoLayoutNode(this.parent))
      ) {
        throw new Error(
          `in set_${axis}: HUG can only be set on auto-layout frames or text children of auto-layout frames`,
        );
      }
      if (value === "FILL" && !isAutoLayoutNode(this.parent)) {
        throw new Error(
          `in set_${axis}: node must be an auto-layout frame or a child of an auto-layout frame`,
        );
      }
      if (!this[layoutSizingValues]) this[layoutSizingValues] = {};
      this[layoutSizingValues][axis] = value;
      // HUG sizes a text's height to its lines; a box that truncated keeps its
      // one line as a limit (see TEXT_SIZING_FIELDS).
      if (
        axis === "layoutSizingVertical" &&
        value === "HUG" &&
        this.type === "TEXT" &&
        this._textSizing
      ) {
        const sizing = this._textSizing;
        if (sizing.autoResize === "TRUNCATE") {
          sizing.autoResize = "HEIGHT";
          if (sizing.maxLines === null) sizing.maxLines = 1;
        } else if (sizing.autoResize === "NONE") {
          sizing.autoResize = "HEIGHT";
        }
        this.remeasure();
      }
    },
  });
}

/**
 * `library` maps a component key to the component `importComponentByKeyAsync`
 * returns for it, standing in for a team library.
 */
export function createFigmaMock({ pages, library, collections = [] }) {
  const root = new MockNode("DOCUMENT", "Document");
  for (const page of pages) root.appendChild(page);
  const figma = {
    root,
    currentPage: pages[0],
    mixed: Symbol("mixed"),
    editorType: "figma",
    apiVersion: "1.0.0",
    pluginId: "harness",
    createFrame: () => new MockNode("FRAME", "Frame"),
    createComponent: () => new MockNode("COMPONENT", "Component"),
    createText: () => new MockNode("TEXT", "Text"),
    createRectangle: () => new MockNode("RECTANGLE", "Rectangle"),
    createEllipse: () => new MockNode("ELLIPSE", "Ellipse"),
    createLine: () => new MockNode("LINE", "Line"),
    createVector: () => new MockNode("VECTOR", "Vector"),
    createPolygon: () => new MockNode("POLYGON", "Polygon"),
    createPage: () => {
      const page = new MockNode("PAGE", "Page");
      root.appendChild(page);
      return page;
    },
    // As Figma draws an SVG: a frame of the SVG's size, on the current page,
    // holding a vector for each path with that path's fill and stroke.
    createNodeFromSvg: (svg) => {
      const frame = new MockNode("FRAME", "Svg");
      frame.svg = svg;
      const root = svg.match(/<svg\b([^>]*)>/);
      const size = (key) => {
        const found =
          root && root[1].match(new RegExp(`\\b${key}="([\\d.]+)"`));
        return found ? Number(found[1]) : 100;
      };
      frame.resize(size("width"), size("height"));
      frame.fills = [];
      const paint = (hex) =>
        hex && hex !== "none"
          ? [{ type: "SOLID", color: parseHex(hex), opacity: 1, visible: true }]
          : [];
      for (const [, attributes] of svg.matchAll(/<path\b([^>]*?)\/?>/g)) {
        const attribute = (key) => {
          const found = attributes.match(
            new RegExp(`(?:^|\\s)${key}="([^"]*)"`),
          );
          return found ? found[1] : null;
        };
        const vector = new MockNode("VECTOR", "Vector");
        vector.resize(frame.width, frame.height);
        vector.fills = paint(attribute("fill"));
        vector.strokes = paint(attribute("stroke"));
        vector.path = attribute("d");
        frame.appendChild(vector);
      }
      figma.currentPage.appendChild(frame);
      return frame;
    },
    createSlot: () => new MockNode("SLOT", "Slot"),
    combineAsVariants: (components, parent) => {
      const set = new MockNode("COMPONENT_SET", "Component Set");
      for (const component of components) set.appendChild(component);
      parent.appendChild(set);
      return set;
    },
    setCurrentPageAsync: async (page) => {
      figma.currentPage = page;
    },
    loadFontAsync: async () => {},
    listAvailableFontsAsync: async () => [],
    getLocalTextStylesAsync: async () => [],
    getLocalPaintStylesAsync: async () => [],
    getLocalEffectStylesAsync: async () => [],
    getNodeByIdAsync: async (id) => root.findOne((node) => node.id === id),
    importComponentByKeyAsync: async (key) => {
      const component = library && library.get(key);
      if (!component) throw new Error(`no library component ${key}`);
      return component;
    },
    variables: {
      setBoundVariableForPaint: (paint, field, variable) => ({
        ...paint,
        boundVariables: {
          ...(paint.boundVariables || {}),
          [field]: { type: "VARIABLE_ALIAS", id: variable.id },
        },
      }),
      setBoundVariableForEffect: (effect, field, variable) => ({
        ...effect,
        boundVariables: {
          ...(effect.boundVariables || {}),
          [field]: { type: "VARIABLE_ALIAS", id: variable.id },
        },
      }),
      getLocalVariablesAsync: async () => [],
      getLocalVariableCollectionsAsync: async () => collections,
      getVariableByIdAsync: async () => null,
      createVariable: () => {
        throw new Error("the harness does not create variables");
      },
    },
    ui: { postMessage() {}, onmessage: null, on() {}, once() {}, off() {} },
    showUI() {},
    on() {},
    once() {},
    off() {},
    notify() {},
    closePlugin() {},
    viewport: { scrollAndZoomIntoView() {}, center: { x: 0, y: 0 }, zoom: 1 },
    clientStorage: { getAsync: async () => null, setAsync: async () => {} },
    util: {
      rgb: (hex) => parseHex(hex),
      solidPaint: (hex) => ({
        type: "SOLID",
        color: parseHex(hex),
        opacity: 1,
      }),
    },
  };
  return figma;
}

function parseHex(hex) {
  const clean = String(hex).replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

/** A variable index like the plugin's `variableByName`, from a list of names. */
export function mockVariables(names) {
  const byName = new Map();
  for (const name of names)
    byName.set(name, { id: `VariableID:${name}`, name });
  return byName;
}

/**
 * The variables the importer writes, from docs/figma-foundations-payload.json,
 * for a painter and for the audit together: `variableByName` holds every
 * payload variable (ids as `mockVariables` makes them) plus `extraNames` the
 * payload does not carry, such as component size variables; `collections` and
 * `variables` feed the plugin's `createVariableContext`, each colour with its
 * Light and Dark value and an alias kept as an alias. A painted node then
 * resolves in either mode the way Audit Library resolves it in the file.
 */
export function payloadVariables(extraNames = []) {
  const payload = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "docs/figma-foundations-payload.json"),
      "utf8",
    ),
  );
  const byCanonical = new Map(
    payload.variables.map((variable) => [variable.canonicalName, variable]),
  );
  const parseColor = (raw) => {
    const value = String(raw).trim().toLowerCase();
    const hex = value.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
    if (hex) {
      const channel = (i) => Number.parseInt(hex[1].slice(i, i + 2), 16) / 255;
      return {
        r: channel(0),
        g: channel(2),
        b: channel(4),
        a: hex[2] ? Number.parseInt(hex[2], 16) / 255 : 1,
      };
    }
    const rgba = value.match(/^rgba?\(([^)]+)\)$/);
    if (rgba) {
      const [r, g, b, a] = rgba[1].split(",").map(Number);
      return { r: r / 255, g: g / 255, b: b / 255, a: a === undefined ? 1 : a };
    }
    return null;
  };
  const collections = payload.collections.map((collection) => ({
    id: collection.name,
    name: collection.name,
    modes: collection.modes.map((mode) => ({
      modeId: mode.toLowerCase(),
      name: mode,
    })),
  }));
  const variables = [];
  const variableByName = new Map();
  for (const variable of payload.variables) {
    const record = {
      id: `VariableID:${variable.figmaName}`,
      name: variable.figmaName,
      resolvedType: variable.figmaType,
      variableCollectionId: variable.collection,
      valuesByMode: {},
    };
    for (const mode of ["light", "dark"]) {
      const value = variable.values[mode];
      if (value.kind === "alias") {
        const target = byCanonical.get(value.path);
        record.valuesByMode[mode] = target
          ? { type: "VARIABLE_ALIAS", id: `VariableID:${target.figmaName}` }
          : null;
      } else {
        record.valuesByMode[mode] =
          variable.figmaType === "COLOR"
            ? parseColor(value.value)
            : value.value;
      }
    }
    variables.push(record);
    variableByName.set(variable.figmaName, {
      id: record.id,
      name: variable.figmaName,
    });
  }
  for (const name of extraNames) {
    if (!variableByName.has(name)) {
      variableByName.set(name, { id: `VariableID:${name}`, name });
    }
  }
  return { collections, variables, variableByName };
}

export const FONTS = {
  regular: { family: "Inter", style: "Regular" },
  medium: { family: "Inter", style: "Medium" },
  bold: { family: "Inter", style: "Bold" },
};

export function freshStats() {
  return { warnings: [], created: false, variants: 0 };
}

/**
 * Evaluate the plugin in a context whose `figma` is the mock. Returns the
 * context: `context.updateCategoryTileVariant`, `context.KOZMOS_RADIUS` and
 * every other top-level binding of `code.js` are properties on it. `append`
 * is script run after the plugin's own, where a top-level function can be
 * reassigned for every caller: a check that wants the configuration a set's
 * Update hands its shared helper replaces the helper with one that returns it.
 */
export function loadPlugin({ pluginPath, figma, append = "" }) {
  const source = fs.readFileSync(pluginPath, "utf8") + append;
  const context = vm.createContext({
    figma,
    __html__: "",
    console,
    setTimeout,
    clearTimeout,
    Promise,
    structuredClone,
  });
  // The plugin's top-level `const`/`function` declarations are script-scoped
  // in a vm context, which keeps them off the context object. Appending an
  // export of every top-level binding puts them where a test can reach them.
  const bindings = [
    ...source.matchAll(/^(?:async )?function ([A-Za-z0-9_$]+)\s*\(/gm),
    ...source.matchAll(/^(?:const|let|var) ([A-Za-z0-9_$]+)\s*=/gm),
  ].map((m) => m[1]);
  const unique = [...new Set(bindings)];
  const exporter = `\n;(() => { const __h = {}; ${unique
    .map(
      (name) => `try { __h[${JSON.stringify(name)}] = ${name}; } catch (_) {}`,
    )
    .join(" ")} globalThis.__harness = __h; })();`;
  vm.runInContext(source + exporter, context, { filename: pluginPath });
  return context.__harness;
}

/** The name of the variable a paint is bound to, or null. */
export function boundVariableName(paint) {
  const alias = paint && paint.boundVariables && paint.boundVariables.color;
  if (!alias) return null;
  return String(alias.id).replace(/^VariableID:/, "");
}

export function hexOf(paint) {
  if (!paint || paint.type !== "SOLID") return null;
  const to = (x) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${to(paint.color.r)}${to(paint.color.g)}${to(paint.color.b)}`;
}
