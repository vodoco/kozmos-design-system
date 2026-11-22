// Renders a parsed Code Connect document the way Figma's Dev Mode does, with
// a stand-in for the `figma` runtime its template is written against.
//
// `figma connect parse` turns each `figma.connect` into a template: plain
// JavaScript that reads the selected layer's properties through
// `figma.currentLayer.__properties__` and returns the snippet through the
// `figma.tsx` (React), `figma.swift` or `figma.kotlin` tag. Figma runs it in
// Dev Mode; no check of ours ever did, so a snippet that does not compile
// reached Dev Mode with every check green (22 Nov 2026: Table's undeclared
// `density`, DescriptionList's unimported IconButton).
//
// A nested instance, a slot or children are drawn by their own documents in
// Figma, with their own imports, so here they render as an empty fragment
// (React) or nothing (native): what is checked is the document's own code.

// Figma's own helpers (isReactComponentArray) take a nested value as an array
// of INSTANCE, SLOT, CODE or ERROR sections; any other type is dropped, which
// hid a required nested `icon` here until 22 Nov.
const NESTED = "INSTANCE";

/** The assignments a document is rendered at: its first value for every
 * enum and false for every boolean, then each other enum value and each
 * boolean true, one at a time. `variant` pins what the document is for. */
export function assignments(doc) {
  const props = Object.values(doc.templateData?.props ?? {});
  const pinned = doc.variant ?? {};
  const enums = new Map();
  const booleans = new Set();
  for (const prop of props) {
    const name = prop.args?.figmaPropName;
    if (!name) continue;
    if (prop.kind === "enum" && prop.args.valueMapping)
      enums.set(name, Object.keys(prop.args.valueMapping));
    if (prop.kind === "boolean") booleans.add(name);
  }
  const base = {};
  for (const [name, keys] of enums)
    base[name] = name in pinned ? pinned[name] : keys[0];
  for (const name of booleans)
    base[name] = name in pinned ? pinned[name] : false;
  const out = [base];
  for (const [name, keys] of enums) {
    if (name in pinned) continue;
    for (const key of keys.slice(1)) out.push({ ...base, [name]: key });
  }
  for (const name of booleans)
    if (!(name in pinned)) out.push({ ...base, [name]: true });
  return out;
}

function sectionText(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(sectionText).join("");
  if (typeof value === "object") {
    if (value.type === NESTED || value.type === "SLOT") return value.code;
    if (value.type === "CODE") return value.code;
    if ("$value" in value) {
      if (value.$type === "template-string") return `\`${value.$value}\``;
      return typeof value.$value === "string"
        ? value.$value
        : JSON.stringify(value.$value);
    }
    if (typeof value.code === "string") return value.code;
  }
  return String(value);
}

function tag(strings, ...values) {
  let code = strings[0];
  values.forEach((value, i) => {
    code += sectionText(value) + strings[i + 1];
  });
  return { code };
}

/** The stand-in runtime at one assignment of the layer's properties. */
export function runtime(assignment, { nested = "<></>" } = {}) {
  const placeholder = () => [{ type: NESTED, code: nested }];
  const properties = {
    enum(name, mapping) {
      const keys = Object.keys(mapping);
      const key = name in assignment ? assignment[name] : keys[0];
      return key in mapping ? mapping[key] : mapping[keys[0]];
    },
    boolean(name, mapping) {
      const on = Boolean(assignment[name]);
      if (!mapping) return on;
      return mapping[on ? "true" : "false"];
    },
    string(name) {
      return `${name.replace(/\s*Text$/, "")} words`;
    },
    instance: placeholder,
    children: placeholder,
    slot: placeholder,
    textContent: () => "Words",
    className: () => [],
  };
  // A nested layer (`figma.nestedProps`) answers with the same properties: its
  // own document is not what is checked here.
  const layer = {
    type: "INSTANCE",
    __properties__: properties,
    __find__: () => layer,
    __getPropertyValue__: () => undefined,
  };
  return {
    currentLayer: layer,
    selectedInstance: layer,
    tsx: tag,
    swift: tag,
    kotlin: tag,
    code: tag,
    html: tag,
    value: (v) => v,
    children: placeholder,
    slot: placeholder,
  };
}

/** The template's body as a function of `figma`: its `require('figma')`
 * removed and its `export default` returned. */
export function templateFunction(template) {
  const body = template
    .replace(/^\s*const figma = require\(['"]figma['"]\)\s*$/m, "")
    .replace(/^export default /m, "return ");
  // eslint-disable-next-line no-new-func
  return new Function("figma", body);
}

/** Every distinct snippet a document renders, with the assignment that made it. */
export function renderDocument(doc, options) {
  const run = templateFunction(doc.template);
  const seen = new Map();
  for (const assignment of assignments(doc)) {
    let code;
    try {
      const result = run(runtime(assignment, options));
      code =
        typeof result?.code === "string" ? result.code : sectionText(result);
    } catch (error) {
      code = null;
      if (!seen.has(`error:${error.message}`))
        seen.set(`error:${error.message}`, {
          assignment,
          error: error.message,
        });
      continue;
    }
    if (!seen.has(code)) seen.set(code, { assignment, code });
  }
  return [...seen.values()];
}
