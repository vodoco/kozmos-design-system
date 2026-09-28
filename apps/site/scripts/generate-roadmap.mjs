#!/usr/bin/env node
/**
 * Generates the roadmap page's data from the two documents the site keeps
 * for the design system, so the page never restates them by hand:
 *
 *  - GAPS.md's table: every gap's number, what it is, its lane and its
 *    status (open, composed, left visible, fixed);
 *  - DS-HANDOFF.md's sections: the priority each gap is given (P0 to P3),
 *    and what each priority means.
 *
 * A gap the handoff names that GAPS.md does not have, a status GAPS.md does
 * not define, or a gap given two priorities fails the run: the page must
 * not show what the documents do not say.
 *
 * Output (gitignored, rebuilt by `pnpm generate` before dev, build and
 * typecheck): src/generated/roadmap.json.
 *
 *   node scripts/generate-roadmap.mjs            # write
 *   node scripts/generate-roadmap.mjs --check    # fail if the output would change
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const GAPS = path.join(SITE_ROOT, "GAPS.md");
export const HANDOFF = path.join(SITE_ROOT, "DS-HANDOFF.md");
export const OUTPUT = path.join(SITE_ROOT, "src/generated/roadmap.json");

/** The statuses GAPS.md defines, in the order the page explains them. */
export const STATUSES = ["open", "composed", "left visible", "fixed"];

/** Every row of GAPS.md's table: `| GAP-nn | what | lane | status |`. */
export function readGaps(source) {
  const rows = [];
  for (const line of source.split("\n")) {
    const match = line.match(
      /^\|\s*(GAP-(\d+))\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/,
    );
    if (!match) continue;
    const [, id, number, title, lane, status] = match;
    if (!STATUSES.includes(status)) {
      throw new Error(`${id}: "${status}" is not a status GAPS.md defines.`);
    }
    rows.push({ id, number: Number(number), title, lane, status });
  }
  if (rows.length === 0) throw new Error("GAPS.md has no table of gaps.");
  const ids = rows.map((row) => row.id);
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) throw new Error(`${repeated} is in GAPS.md's table twice.`);
  return rows;
}

/** A section title as a heading shows it: its first letter a capital. */
const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The handoff's priorities: each `## Pn — what it means` section, and the
 * gaps it gives that priority — those its `### GAP-nn …` headings name, and
 * those its table rows start with. Reading stops at the first section that
 * is not a priority.
 */
export function readPriorities(source) {
  const priorities = [];
  const given = new Map();
  let current = null;
  for (const line of source.split("\n")) {
    const section = line.match(/^## (P\d) — (.+)$/);
    if (section) {
      current = {
        id: section[1],
        title: sentence(section[2].trim()),
        gaps: [],
      };
      priorities.push(current);
      continue;
    }
    if (/^## /.test(line)) {
      if (current) break;
      continue;
    }
    if (!current) continue;
    const named =
      line.match(/^### (.+)$/)?.[1] ?? line.match(/^\|\s*(GAP-[^|]+)\|/)?.[1];
    if (!named) continue;
    // "GAP-37 and GAP-20 · SearchBar" gives two gaps; a table's first cell
    // ("GAP-24 DynamicIsland fixed") one. The line after the name is not
    // read: "see GAP-04" in a description is not a priority.
    const lead = named.split(" · ")[0];
    for (const id of lead.match(/GAP-\d+/g) ?? []) {
      if (given.has(id) && given.get(id) !== current.id) {
        throw new Error(
          `${id} is given ${given.get(id)} and ${current.id} in DS-HANDOFF.md.`,
        );
      }
      if (!given.has(id)) current.gaps.push(id);
      given.set(id, current.id);
    }
  }
  if (priorities.length === 0) {
    throw new Error("DS-HANDOFF.md has no `## Pn — …` sections.");
  }
  return { priorities, given };
}

/** The roadmap: each priority's gaps, in the handoff's order, then the rest. */
export function roadmap(gapsSource, handoffSource) {
  const gaps = readGaps(gapsSource);
  const byId = new Map(gaps.map((gap) => [gap.id, gap]));
  const { priorities, given } = readPriorities(handoffSource);
  for (const id of given.keys()) {
    if (!byId.has(id)) {
      throw new Error(
        `DS-HANDOFF.md names ${id}, which GAPS.md does not have.`,
      );
    }
  }
  const groups = priorities.map(({ id, title, gaps: ids }) => ({
    id,
    title,
    items: ids.map((gap) => byId.get(gap)),
  }));
  const rest = gaps.filter((gap) => !given.has(gap.id));
  if (rest.length > 0) {
    groups.push({ id: null, title: "Not yet given a priority", items: rest });
  }
  const counts = Object.fromEntries(
    STATUSES.map((status) => [
      status,
      gaps.filter((gap) => gap.status === status).length,
    ]),
  );
  return { total: gaps.length, counts, groups };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const check = process.argv.includes("--check");
  const data = roadmap(
    fs.readFileSync(GAPS, "utf8"),
    fs.readFileSync(HANDOFF, "utf8"),
  );
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const current = fs.existsSync(OUTPUT)
    ? fs.readFileSync(OUTPUT, "utf8")
    : null;
  if (current !== content) {
    if (check) {
      console.error(
        "generate-roadmap: src/generated/roadmap.json is out of date.",
      );
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, content);
  }
  console.log(
    `generate-roadmap: ${data.total} items in ${data.groups.length} groups${current === content ? ", unchanged" : ", written"}.`,
  );
}
