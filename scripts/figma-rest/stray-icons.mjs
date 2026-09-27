// Which `Icon / *` components on the Icons page have no Pointr Source instance
// inside them, and whether any component set still holds an instance of one.
//
// An icon with no source is one the importer does not draw: the eight taxonomy
// quick-access symbols, taken out of the design system on 2026-09-24, read this
// way, and the plugin's audit reports them as "missing-source". They can only
// leave the file once nothing instantiates them — delete one while a set still
// points at it and the set loses its artwork.
//
// Usage: node scripts/figma-rest/stray-icons.mjs — exits 1 while a stray is used.
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const headers = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const get = async (url) => {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers });
    if (response.status === 429) {
      await new Promise((done) => setTimeout(done, 5000 * (attempt + 1)));
      continue;
    }
    if (!response.ok)
      throw new Error(`${response.status} ${url.split("?")[0]}`);
    return response.json();
  }
  throw new Error("rate limited");
};

const file = await get(`https://api.figma.com/v1/files/${KEY}?depth=1`);
const page = (name) => file.document.children.find((p) => p.name === name);

const iconsDoc = (
  await get(
    `https://api.figma.com/v1/files/${KEY}/nodes?ids=${encodeURIComponent(page("Icons").id)}&depth=2`,
  )
).nodes[page("Icons").id].document;

// A drawn icon wraps a Pointr Source instance. One that wraps anything else was
// put there by hand and the importer will never refresh it.
const strays = new Map();
for (const node of iconsDoc.children ?? []) {
  if (node.type !== "COMPONENT" || !/^Icon \//.test(node.name)) continue;
  const hasSource = (node.children ?? []).some((c) => c.type === "INSTANCE");
  if (!hasSource) strays.set(node.id, node.name);
}
console.log(`icon components with no Pointr Source: ${strays.size}`);
for (const [id, name] of strays) {
  console.log(`  ${name.padEnd(52)} ${id.replace(":", "-")}`);
}
if (!strays.size) process.exit(0);

const componentsPage = page("Components");
const top = (
  await get(
    `https://api.figma.com/v1/files/${KEY}/nodes?ids=${encodeURIComponent(componentsPage.id)}&depth=2`,
  )
).nodes[componentsPage.id].document;
const sets = [];
(function walk(node) {
  if (node.type === "COMPONENT_SET") sets.push(node.id);
  else (node.children ?? []).forEach(walk);
})(top);

const used = {};
for (let i = 0; i < sets.length; i += 6) {
  const batch = sets.slice(i, i + 6);
  const nodes = (
    await get(
      `https://api.figma.com/v1/files/${KEY}/nodes?ids=${batch.map(encodeURIComponent).join(",")}`,
    )
  ).nodes;
  for (const id of batch) {
    const doc = nodes[id]?.document;
    if (!doc) continue;
    (function walk(node) {
      if (node.type === "INSTANCE" && strays.has(node.componentId)) {
        const key = `${doc.name} -> ${strays.get(node.componentId)}`;
        used[key] = (used[key] ?? 0) + 1;
      }
      (node.children ?? []).forEach(walk);
    })(doc);
  }
}

const keys = Object.keys(used).sort();
console.log(
  `\ninstances inside Components sets: ${keys.length ? keys.length + " kind(s)" : "NONE — safe to delete"}`,
);
for (const key of keys) console.log(`  ${key}  x${used[key]}`);
if (keys.length) {
  console.log(
    "\nUpdate the set(s) above first; they repaint onto curated icons. Only then delete.",
  );
  process.exitCode = 1;
}
