// Every icon on the Components page, set by set: is its paint bound to a variable, as the importer
// lays it, or unbound, as an icon reads when the tint laid through its source was orphaned?
// An icon slot the importer drew names its token in shared plugin data ("foreground-token").
// Usage: node scripts/figma-rest/icon-tints.mjs [out.json] — exits 1 when any icon paint is unbound.
import fs from "node:fs";
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const headers = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const get = async (u) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(u, { headers });
    if (r.status === 429) { await new Promise((z) => setTimeout(z, 5000 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} ${u.split("?")[0]}`);
    return r.json();
  }
  throw new Error("rate limited");
};
const file = await get(`https://api.figma.com/v1/files/${KEY}?depth=1`);
const iconsPage = file.document.children.find((p) => p.name === "Icons");
const iconsDoc = (await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=${encodeURIComponent(iconsPage.id)}&depth=2`)).nodes[iconsPage.id].document;
const iconIds = new Set();
(function walk(n) { if (n.type === "COMPONENT" && /^Icon \//.test(n.name)) iconIds.add(n.id); (n.children || []).forEach(walk); })(iconsDoc);
const components = file.document.children.find((p) => p.name === "Components");
const top = (await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=${encodeURIComponent(components.id)}&depth=2&plugin_data=shared`)).nodes[components.id].document;
const sets = [];
(function walk(n) { if (n.type === "COMPONENT_SET") sets.push({ id: n.id, name: n.name, build: n.sharedPluginData?.kozmos_ds_importer?.build ?? "(none)" }); else (n.children || []).forEach(walk); })(top);
const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const SHAPES = new Set(["VECTOR", "BOOLEAN_OPERATION", "ELLIPSE", "RECTANGLE", "LINE", "STAR", "POLYGON", "TEXT"]);
const rows = [];
for (let i = 0; i < sets.length; i += 6) {
  const batch = sets.slice(i, i + 6);
  const nodes = (await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=${batch.map((s) => encodeURIComponent(s.id)).join(",")}&plugin_data=shared`)).nodes;
  for (const s of batch) {
    const doc = nodes[s.id]?.document;
    if (!doc) continue;
    const row = { set: s.name, id: s.id, build: s.build, icons: 0, slots: 0, tinted: 0, untinted: 0, unboundColours: {}, tokens: {}, samples: [] };
    (function walk(n) {
      if (n.type === "INSTANCE" && iconIds.has(n.componentId)) {
        row.icons += 1;
        const token = n.sharedPluginData?.kozmos_ds_importer?.["foreground-token"];
        if (token) { row.slots += 1; row.tokens[token] = (row.tokens[token] || 0) + 1; }
        let bound = 0, unbound = 0;
        (function paints(m) {
          if (SHAPES.has(m.type)) for (const kind of ["fills", "strokes"]) for (const p of m[kind] || []) {
            if (p.visible === false || p.type !== "SOLID") continue;
            if (p.boundVariables?.color) bound += 1;
            else { unbound += 1; const h = hex(p.color); row.unboundColours[h] = (row.unboundColours[h] || 0) + 1; }
          }
          (m.children || []).forEach(paints);
        })(n);
        if (unbound === 0 && bound > 0) row.tinted += 1;
        else { row.untinted += 1; if (row.samples.length < 3) row.samples.push(n.id); }
        return;
      }
      (n.children || []).forEach(walk);
    })(doc);
    if (row.icons) rows.push(row);
  }
}
const total = rows.reduce((t, r) => ({ icons: t.icons + r.icons, tinted: t.tinted + r.tinted, untinted: t.untinted + r.untinted }), { icons: 0, tinted: 0, untinted: 0 });
console.log(`lastModified ${file.lastModified}; ${iconIds.size} icon components; ${rows.length} sets hold icons`);
for (const r of rows) console.log(`${r.untinted ? "UNTINTED" : "ok      "} ${r.set.padEnd(24)} ${r.build.padEnd(13)} icons ${String(r.icons).padStart(4)}  slots ${String(r.slots).padStart(4)}  tinted ${String(r.tinted).padStart(4)}  untinted ${String(r.untinted).padStart(4)} ${r.untinted ? JSON.stringify(r.unboundColours) : ""}`);
console.log(`total: ${total.icons} icons, ${total.tinted} tinted, ${total.untinted} untinted in ${rows.filter((r) => r.untinted).length} sets`);
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify({ lastModified: file.lastModified, readAt: new Date().toISOString(), total, rows }, null, 1));
process.exit(total.untinted ? 1 : 0);
