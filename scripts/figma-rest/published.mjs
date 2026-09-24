// When the library's published component sets were last published.
const KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const r = await fetch(`https://api.figma.com/v1/files/${KEY}/component_sets`, { headers: { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN } });
console.log("component_sets:", r.status);
if (r.ok) {
  const sets = (await r.json()).meta.component_sets || [];
  const times = sets.map((s) => s.updated_at).sort();
  console.log(`published sets: ${sets.length}; latest publish ${times[times.length - 1]}; earliest ${times[0]}`);
  const after = sets.filter((s) => s.updated_at > "2026-09-21T21:36:00Z").map((s) => s.name);
  console.log(`published after 21:36Z: ${after.length}${after.length ? " — " + after.slice(0, 8).join(", ") : ""}`);
}
