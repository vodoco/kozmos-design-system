// Read the live library over REST: which build each set carries, the new sets,
// a Button icon's paint, and the last write. The token comes from the
// environment and is never printed.
import fs from "node:fs";
import path from "node:path";
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const BUILD = fs.readFileSync("figma/foundations-importer/code.js", "utf8").match(/const PLUGIN_BUILD = "([^"]+)"/)[1];
const headers = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const get = async (u) => { const r = await fetch(u, { headers }); if (!r.ok) throw new Error(`${r.status} ${u.split("?")[0]}`); return r.json(); };
const page = await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=4:4&depth=2&plugin_data=shared`);
const walk = (n, out) => { if (n.type === "COMPONENT_SET") out.push(n); (n.children || []).forEach((c) => walk(c, out)); return out; };
const sets = walk(page.nodes["4:4"].document, []);
const stamp = (n) => n.sharedPluginData?.kozmos_ds_importer?.build || "(none)";
const byBuild = {}; for (const s of sets) (byBuild[stamp(s)] ||= []).push(s.name);
console.log(`plugin build in the worktree: ${BUILD}`);
console.log(`component sets on the Components page: ${sets.length}`);
for (const [b, names] of Object.entries(byBuild)) console.log(`  ${b}: ${names.length}${b === BUILD ? "" : ` — ${names.join(", ")}`}`);
for (const n of ["CategoryField", "AISearchButton"]) { const s = sets.find((x) => x.name === n); console.log(`${n}: ${s ? `present, ${s.id}, build ${stamp(s)}` : "absent"}`); }
const dupes = Object.entries(sets.reduce((m, s) => ((m[s.name] = (m[s.name] || 0) + 1), m), {})).filter(([, c]) => c > 1);
console.log(`duplicate set names: ${dupes.length ? dupes.map(([n, c]) => `${n}×${c}`).join(", ") : "none"}`);
const btn = await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=77:1055`);
const v = btn.nodes["77:1055"].document.children.find((c) => c.name === "Variant=Default, Size=Icon, State=Default");
const icon = v?.children?.find((c) => c.name === "Icon");
const stroke = JSON.stringify(icon || {}).match(/"strokes":\[\{[^\]]*?"color":\{"r":([0-9.]+),"g":([0-9.]+),"b":([0-9.]+)/);
console.log(`Button Default/Icon icon stroke: ${stroke ? "#" + [1, 2, 3].map((i) => Math.round(stroke[i] * 255).toString(16).padStart(2, "0")).join("").toUpperCase() : "(none)"}`);
const meta = await get(`https://api.figma.com/v1/files/${KEY}?depth=1`);
console.log(`lastModified: ${meta.lastModified}  (now ${new Date().toISOString().slice(0, 19)}Z)`);
