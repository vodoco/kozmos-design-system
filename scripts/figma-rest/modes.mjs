// Walks up from a node's page to the node, printing any explicit variable modes and each ancestor's name.
const key = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const h = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const id = process.argv[2];
const r = await fetch(`https://api.figma.com/v1/files/${key}/nodes?ids=${id}&depth=1`, { headers: h });
const d = (await r.json()).nodes[id.replace("-", ":")];
const doc = d.document;
console.log("node", doc.name, "explicitVariableModes:", JSON.stringify(doc.explicitVariableModes || null));
for (const c of (doc.children || []).slice(0, 3)) console.log(" child", c.name, JSON.stringify(c.explicitVariableModes || null));
