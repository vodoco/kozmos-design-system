/**
 * Find values that bypass a role the system already has.
 *
 * Every other parity check verifies the tokens, then verifies a *named list* of
 * consumers. That structure can only ever confirm what someone already looked
 * at. Elevation passed for a day while 44 raw Tailwind shadow classes sat in
 * 29 components the check did not name; the same blind spot covers radius and
 * colour today.
 *
 * So this one names nothing. It scans every component and counts what bypasses
 * a role, against a recorded baseline.
 *
 * The baseline is a ratchet, not a pass mark. It is deliberately the count that
 * existed on 2026-09-09, and the check fails when a number goes UP. That freezes
 * a real backlog in place rather than pretending it is clean, and stops it
 * growing while it is worked off. Lower a number here when you fix something;
 * never raise one.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { rawValuePatterns as PATTERNS } from "./lib/raw-value-patterns.mjs";

const ROOT = process.cwd();
const postcss = createRequire(path.join(ROOT, "packages/react/package.json"))(
  "postcss",
);
const DIR = "packages/react/src/components";
const problems = [];
const ok = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  problems.push(m);
  console.log(`  FAIL  ${m}`);
};

// Counts as they stood on 2026-09-09. Lower these as they are fixed.
const BASELINE = {
  // 19 across 6 until 2026-09-25, when FeedbackCard's success mark stopped
  // being bg-green-100 / dark:bg-green-900-30 — a fixed rgb(220 252 231) that
  // a re-themed product got here and nowhere else — and took the success role.
  colour: { total: 18, components: 6 },
  // 6 across 5 until 2026-09-22, when the four map cards took the panel role.
  radius: { total: 2, components: 1 },
};

console.log("Raw values that bypass a role\n");

const entries = fs.existsSync(path.join(ROOT, DIR))
  ? fs.readdirSync(path.join(ROOT, DIR), { withFileTypes: true })
  : [];

// CSS recipes are product source too. Count @apply tokens, not comments, so
// moving a literal out of JSX cannot make the debt disappear from this gate.
function cssSources(dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) cssSources(full, result);
    else if (entry.name.endsWith(".css")) result.push(full);
  }
  return result;
}
const recipes = cssSources(path.join(ROOT, "packages/react/src")).map(
  (file) => {
    const classes = [];
    postcss
      .parse(fs.readFileSync(file, "utf8"), { from: file })
      .walkAtRules("apply", (rule) => classes.push(rule.params));
    return [path.relative(ROOT, file), classes.join(" ")];
  },
);

for (const [kind, pattern] of Object.entries(PATTERNS)) {
  const byComponent = new Map();
  let total = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Stories and tests are demo fixtures, not the system speaking.
    const file = `${DIR}/${entry.name}/${entry.name}.tsx`;
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const hits = (fs.readFileSync(full, "utf8").match(pattern) || []).length;
    if (hits === 0) continue;
    byComponent.set(entry.name, hits);
    total += hits;
  }
  for (const [file, text] of recipes) {
    const hits = (text.match(pattern) || []).length;
    if (hits) {
      byComponent.set(file, hits);
      total += hits;
    }
  }

  const base = BASELINE[kind];
  const components = byComponent.size;
  const worse = total > base.total || components > base.components;
  const better = total < base.total || components < base.components;

  const detail = [...byComponent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([n, c]) => `${n} (${c})`)
    .join(", ");

  if (worse) {
    fail(
      `${kind}: ${total} across ${components} component(s), up from a baseline of ${base.total} across ${base.components}. New drift: ${detail}`,
    );
  } else if (better) {
    fail(
      `${kind}: down to ${total} across ${components} — better than the baseline of ${base.total}/${base.components}. Lower BASELINE in this file to lock the gain in.`,
    );
  } else {
    ok(
      `${kind}: ${total} across ${components} component(s), unchanged — ${detail}`,
    );
  }
}

console.log(
  `
  These are a frozen backlog, not a clean result. The largest piece is a
  missing surface: FeedbackCard, RoutingInputGroup and SaveLocationCard each
  repeat "bg-white/70 dark:bg-black/70 backdrop-blur-3xl ring-1 ring-black/5"
  because the system has no glass panel role for them to read. Naming that role
  removes most of the colour count at a stroke.`,
);

console.log(
  `\n${problems.length === 0 ? "ok    no new value bypassed a role" : `${problems.length} change(s) to the backlog`}`,
);
process.exit(problems.length === 0 ? 0 : 1);
