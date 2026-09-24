// Every set's build stamp, in the Core update sequence's order.
import fs from "node:fs";
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const headers = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const get = async (u) => { const r = await fetch(u, { headers }); if (!r.ok) throw new Error(`${r.status} ${u.split("?")[0]}`); return r.json(); };
const meta = await get(`https://api.figma.com/v1/files/${KEY}?depth=1`);
console.log(`lastModified: ${meta.lastModified}  (now ${new Date().toISOString().slice(0, 19)}Z)`);
const page = await get(`https://api.figma.com/v1/files/${KEY}/nodes?ids=4:4&depth=2&plugin_data=shared`);
const sets = {}; const walk = (n) => { if (n.type === "COMPONENT_SET") sets[n.name] = n; (n.children || []).forEach(walk); }; walk(page.nodes["4:4"].document);
const pd = (n) => (n && n.sharedPluginData && n.sharedPluginData.kozmos_ds_importer) || {};
const code = fs.readFileSync("figma/foundations-importer/code.js", "utf8");
const seq = (name) => { const i = code.indexOf(`const ${name} = [`); const body = code.slice(i, code.indexOf("];", i)); return [...body.matchAll(/\[\s*"([A-Za-z]+)"/g)].map((m) => m[1]); };
const byBuild = {};
for (const s of Object.values(sets)) (byBuild[pd(s).build || "-"] ||= []).push(s.name);
for (const [b, n] of Object.entries(byBuild)) console.log(`build ${b}: ${n.length}`);
for (const name of ["CORE_UPDATE_SEQUENCE", "PRODUCT_SDK_UPDATE_SEQUENCE"]) {
  console.log(`\n${name}:`);
  seq(name).forEach((set, i) => { const s = sets[set]; const d = pd(s); console.log(`  ${String(i + 1).padStart(2)} ${set.padEnd(22)} ${s ? `build ${d.build || "-"}  completed ${d.completedBuild || "-"}` : "(no set on the page)"}`); });
}
