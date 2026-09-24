// Renders nodes to PNG over REST and saves them. No credentials printed.
import fs from "node:fs";
const key = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const [out, ...ids] = process.argv.slice(2);
const h = { "X-Figma-Token": process.env.FIGMA_ACCESS_TOKEN };
const r = await fetch(`https://api.figma.com/v1/images/${key}?ids=${ids.join(",")}&format=png&scale=2`, { headers: h });
if (!r.ok) throw new Error(`${r.status}`);
const { images } = await r.json();
for (const [id, url] of Object.entries(images)) {
  if (!url) { console.log(id, "no image"); continue; }
  const png = Buffer.from(await (await fetch(url)).arrayBuffer());
  const file = `${out}-${id.replace(":", "-")}.png`;
  fs.writeFileSync(file, png);
  console.log(id, file, png.length);
}
