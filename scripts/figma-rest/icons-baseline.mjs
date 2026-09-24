// Record every Icon / * component on the live Icons page with its source layer's id.
import fs from "node:fs";
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const headers = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const get = async (u) => { const r = await fetch(u, { headers }); if (!r.ok) throw new Error(`${r.status} ${u.split("?")[0]}`); return r.json(); };
const file = await get(`https://api.figma.com/v1/files/${KEY}?depth=1`);
const page = file.document.children.find((p) => p.name === "Icons");
if (!page) throw new Error("no Icons page");
const nodes = await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=${encodeURIComponent(page.id)}&depth=3`);
const doc = nodes.nodes[page.id].document;
const rows = [];
(function walk(n) {
  if (n.type === "COMPONENT" && /^Icon \//.test(n.name)) rows.push({ name: n.name, id: n.id, sources: (n.children || []).map((c) => ({ name: c.name, type: c.type, id: c.id })) });
  (n.children || []).forEach(walk);
})(doc);
const out = { lastModified: file.lastModified, page: page.id, readAt: new Date().toISOString(), icons: rows };
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`Icons page ${page.id}, lastModified ${file.lastModified}: ${rows.length} icon components; ${rows.filter((r) => r.sources.length === 1 && r.sources[0].name === "Pointr Source").length} with one Pointr Source; ${rows.filter((r) => /taxonomy-/.test(r.name)).length} taxonomy`);
