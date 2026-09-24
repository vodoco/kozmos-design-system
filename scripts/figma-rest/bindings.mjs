// Lists every paint in a node's subtree bound to a variable: id, where, painted colour. No credentials printed.
const key = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const ids = process.argv.slice(2);
const h = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const r = await fetch(`https://api.figma.com/v1/files/${key}/nodes?ids=${ids.join(",")}&depth=6`, { headers: h });
if (!r.ok) throw new Error(`${r.status}`);
const data = await r.json();
const seen = new Map();
const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
function walk(n, path) {
  for (const kind of ["fills", "strokes"]) {
    (n[kind] || []).forEach((p) => {
      const id = p.boundVariables?.color?.id;
      if (id && p.color) {
        const k = `${id} ${hex(p.color)}`;
        if (!seen.has(k)) seen.set(k, `${path}/${n.name} (${kind})`);
      }
    });
  }
  (n.children || []).forEach((c) => walk(c, `${path}/${n.name}`.slice(-80)));
}
for (const id of ids) walk(data.nodes[id.replace("-", ":")].document, "");
for (const [k, where] of [...seen].sort()) console.log(k.padEnd(34), where.slice(-90));
