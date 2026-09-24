// Paint every capturable set with two plugins and compare what they draw.
import fs from "node:fs";
import path from "node:path";
import { FONTS, MockNode, createFigmaMock, freshStats, loadPlugin, mockIconComponent, payloadVariables } from "../lib/figma-plugin-harness.mjs";
const capture = "\n;updateSingleAxisComponent = async function (config) { return { __singleAxis: config }; };\n;updateStateStatusComponent = async function (config) { return { __stateStatus: config }; };\n";
function snapshot(node) {
  const out = [];
  (function walk(n, depth, trail) {
    const bits = [n.type, n.name, n.visible === false ? "hidden" : "", Math.round(n.width * 100) / 100, Math.round(n.height * 100) / 100,
      n.layoutMode || "", [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].join("/"), n.itemSpacing, n.cornerRadius,
      JSON.stringify((n.fills || []).map((p) => [p.type, p.boundVariables && p.boundVariables.color && p.boundVariables.color.id, p.opacity])),
      JSON.stringify((n.strokes || []).map((p) => [p.type, p.boundVariables && p.boundVariables.color && p.boundVariables.color.id])), n.strokeWeight,
      n.type === "TEXT" ? JSON.stringify([n.characters, n.fontSize, n.textAutoResize, n.maxLines]) : "", n.opacity,
      n.mainComponent ? n.mainComponent.name : "", n.layoutSizingHorizontal, n.layoutSizingVertical];
    out.push("  ".repeat(depth) + bits.join(" | "));
    for (const c of n.children || []) walk(c, depth + 1);
  })(node, 0);
  return out.join("\n");
}
async function paintAll(pluginPath, sequenceName) {
  const pages = ["Components", "Icons", "Utilities"].map((n) => new MockNode("PAGE", n));
  const figma = createFigmaMock({ pages });
  const plugin = loadPlugin({ pluginPath, figma, append: capture });
  for (const d of plugin.KOSMOS_ICON_DEFINITIONS) if (d.componentKey) pages[1].appendChild(mockIconComponent(d.name));
  const tokens = payloadVariables([]);
  const result = new Map();
  for (const [name, update] of plugin[sequenceName]) {
    const captured = await update().catch(() => null);
    let jobs = null;
    if (captured && captured.__singleAxis) jobs = captured.__singleAxis.values.map((value) => [captured.__singleAxis.updateVariant, { value }]);
    else if (captured && captured.__stateStatus) { const c = captured.__stateStatus; jobs = []; for (const state of c.states) for (const status of c.statuses) for (const type of c.types || [null]) jobs.push([c.updateVariant, { state, status, type }]); }
    else { const f = plugin[name.charAt(0).toLowerCase() + name.slice(1) + "ComponentConfig"]; if (typeof f === "function") { const c = f(); jobs = c.combinations().map((props) => [c.updateVariant, { props }]); } }
    if (!jobs) continue;
    const snaps = [];
    for (const [painter, args] of jobs) {
      const component = figma.createComponent();
      pages[0].appendChild(component);
      try { await painter(component, { ...args, variableByName: tokens.variableByName, fonts: FONTS, stats: freshStats() }); snaps.push(snapshot(component)); }
      catch (error) { snaps.push("THREW " + error.message); }
      component.remove();
    }
    result.set(name, snaps.join("\n---\n"));
  }
  return result;
}
const [oldPath, newPath] = process.argv.slice(2);
for (const seq of ["PRODUCT_SDK_UPDATE_SEQUENCE", "CORE_UPDATE_SEQUENCE"]) {
  const a = await paintAll(oldPath, seq);
  const b = await paintAll(newPath, seq);
  const changed = [...b.keys()].filter((k) => a.get(k) !== b.get(k));
  console.log(seq, "compared", b.size, "changed:", changed.join(", ") || "none");
  for (const k of changed) fs.writeFileSync(path.join(process.env.S, "replay-" + k + ".old.txt"), a.get(k) || ""), fs.writeFileSync(path.join(process.env.S, "replay-" + k + ".new.txt"), b.get(k));
}
