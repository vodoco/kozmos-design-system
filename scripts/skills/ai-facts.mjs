/**
 * Tests first: today's extraction, moved from build-ai-skills.mjs and
 * check-ai-skills.mjs behind the interface the new tests call, so that they
 * can be seen to fail against it. The next commit replaces it. (A regex's
 * exec() is written as String.match(), which is the same call for a
 * non-global pattern.)
 */
import fs from "node:fs";
import path from "node:path";
import { readPublishedApi } from "./claude-design-api.mjs";

const ALIAS_RE =
  /^(?:export )?type (\w+)\s*=\s*((?:\s*\|?\s*["'][^"']+["'])+)\s*;/gm;

function axesOfSource(source, name) {
  const found = {};
  const cva = source.match(/variants:\s*\{([\s\S]*?)\n\s{2}\},?\n/);
  if (cva)
    for (const axis of ["variant", "size", "status", "tone", "density"]) {
      const block = cva[1].match(
        new RegExp(`^\\s{4}${axis}:\\s*\\{([\\s\\S]*?)^\\s{4}\\},?$`, "m"),
      );
      if (!block) continue;
      const values = [...block[1].matchAll(/^\s{6}["']?([\w-]+)["']?:/gm)].map(
        (m) => m[1],
      );
      if (values.length) found[axis] = values;
    }
  const aliases = {};
  for (const a of source.matchAll(ALIAS_RE)) {
    const values = [...a[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
    if (values.length > 1) aliases[a[1]] = values;
  }
  const props =
    source.match(new RegExp(`export interface ${name}Props[\\s\\S]*?\\n\\}`)) ??
    source.match(new RegExp(`interface ${name}Props[\\s\\S]*?\\n\\}`));
  if (props)
    for (const m of props[0].matchAll(
      /^\s+([a-zA-Z][a-zA-Z0-9]*)\??:\s*(.+?);$/gm,
    )) {
      const inline = [...m[2].matchAll(/["']([^"']+)["']/g)].map((v) => v[1]);
      if (inline.length > 1) found[m[1]] = inline;
      else if (aliases[m[2].trim()]) found[m[1]] = aliases[m[2].trim()];
    }
  return found;
}

export function readKozmosFacts(root) {
  const REACT = path.join(root, "packages/react/src/components");
  const axes = new Map();
  for (const name of fs.readdirSync(REACT)) {
    const file = path.join(REACT, name, `${name}.tsx`);
    if (!fs.existsSync(file)) continue;
    const found = axesOfSource(fs.readFileSync(file, "utf8"), name);
    if (Object.keys(found).length) axes.set(name, found);
  }
  const dts = fs.existsSync(path.join(root, "packages/react/dist/index.d.ts"))
    ? fs.readFileSync(path.join(root, "packages/react/dist/index.d.ts"), "utf8")
    : "";
  for (const m of dts.matchAll(/export declare type (\w+)Props = (\w+)Props;/g))
    if (!axes.has(m[1]) && axes.has(m[2])) axes.set(m[1], axes.get(m[2]));
  const exportsOfReact = new Set();
  const indexPath = path.join(root, "packages/react/src/index.ts");
  if (fs.existsSync(indexPath)) {
    for (const m of fs
      .readFileSync(indexPath, "utf8")
      .matchAll(/export \* from "\.\/components\/(\w+)"/g))
      exportsOfReact.add(m[1]);
    for (const name of fs.readdirSync(REACT)) exportsOfReact.add(name);
  }
  return { api: readPublishedApi(root), axes, exportsOfReact };
}

export function factsFromSources(root, files) {
  const axes = new Map();
  for (const [file, text] of files)
    if (file.endsWith(".tsx")) {
      const name = path.basename(file, ".tsx");
      axes.set(name, axesOfSource(text, name));
    }
  return { axes, exportsOfReact: new Set() };
}

export const axesOf = (facts, name) => facts.axes.get(name) ?? {};

export const unknownsOf = () => ({ component: null, props: {} });
