/**
 * Concentric corner radii: does each rounded shape hug the rounded shape inside
 * it?
 *
 * Two rounded rectangles nested one inside the other look right only when
 *
 *     R_outer = R_inner + padding
 *
 * That is not a heuristic. It is the only value that holds the gap between the
 * two curves constant all the way around the corner; at any other value the gap
 * pinches or flares exactly where the eye is most sensitive to it. The failure
 * reads as "uneven roundness" long before anyone can name the cause.
 *
 * A second rule bounds the first: a radius above `min(width, height) / 2`
 * cannot render, because opposite corners would overlap. Figma and CSS both
 * clamp silently, so a token above the cap is a number that lies about what it
 * draws. The `pill: 9999` role is that clamp used deliberately — a sentinel
 * meaning "as round as this box allows".
 *
 * This reads the published Figma file rather than the plugin source, because
 * the relationship is geometric: it needs the rendered box of both shapes and
 * the space between them, and none of that exists in the builder's arguments.
 *
 * When a flagged property is bound to a variable the report says so, because a
 * bound property renders the variable's value and ignores whatever the painter
 * wrote. The fix is then in the variable's definition, and reading the painter
 * will only say the number is already right.
 *
 * Reported, not enforced. Some pairs below are deliberate, and deciding which
 * is a design call — see docs/nested-radius.md. Pass --strict to fail on
 * violations once the backlog is closed.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FILE_KEY = "Yj4O8p6Y9h2Sa9zJVoAiVY";
const PAGE_NODE = "4:4";

/** Rounding slack, in px. A 1px disagreement is arithmetic, not a design flaw. */
const TOLERANCE = 1;

/**
 * How far a child may sit from a corner and still be judged against it.
 *
 * The rule only means anything for a child in the parent's corner. A chip in
 * the middle of a row is nowhere near the curve, and demanding concentricity
 * with it would be noise.
 */
const CORNER_REACH = 32;

function token() {
  if (process.env.FIGMA_ACCESS_TOKEN)
    return process.env.FIGMA_ACCESS_TOKEN.trim();
  const envPath = path.join(ROOT, ".env");
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("FIGMA_ACCESS_TOKEN="));
    if (line)
      return line
        .slice("FIGMA_ACCESS_TOKEN=".length)
        .replace(/["']/g, "")
        .trim();
  }
  return "";
}

/**
 * Is this shape actually drawn?
 *
 * Auto-layout frames with no fill and no stroke carry a cornerRadius that
 * renders nothing. Judging them would bury the real findings under structural
 * scaffolding, so only shapes with a visible fill or stroke count.
 */
const paints = (list) =>
  Array.isArray(list) && list.some((p) => p && p.visible !== false);
const isDrawn = (node) => paints(node.fills) || paints(node.strokes);

/**
 * Is this a control rather than a panel nested in one?
 *
 * A control keeps its role radius wherever it is placed — nobody squares a
 * button because a card contains it. The rule governs containers nested in
 * containers, and six buttons sitting inside cards were the whole of what this
 * check could never clear.
 *
 * Read from the stamp the importer writes, not from the layer name. It follows
 * that a set built before the stamp existed still reports its buttons, which is
 * honest: the file has not been rebuilt, and the checker should say so rather
 * than guess.
 */
const RUN_NAMESPACE = "kozmos_ds_importer";
const isControlSurface = (node) =>
  !!node.sharedPluginData &&
  !!node.sharedPluginData[RUN_NAMESPACE] &&
  node.sharedPluginData[RUN_NAMESPACE].surface === "control";

/**
 * Which of a node's layout properties are driven by a variable.
 *
 * Padding, gap and radius can each be bound, and a bound property renders the
 * variable and silently ignores a raw write. Naming the binding on a finding
 * sends the reader to the variable's definition instead of to a painter that
 * already writes the right number.
 */
const boundKeys = (node, re) => {
  const byId = new Map();
  for (const [k, v] of Object.entries(node.boundVariables || {})) {
    if (!re.test(k)) continue;
    // Corners bound one at a time arrive as one object holding four aliases,
    // which is how a bound radius hid from this check for a day.
    const entries =
      k === "rectangleCornerRadii"
        ? Object.values(v || {}).map((corner) => [
            "cornerRadius",
            corner && corner.id ? corner.id : "?",
          ])
        : [[k, v && v.id ? v.id : "?"]];
    for (const [key, id] of entries) {
      if (!byId.has(id)) byId.set(id, []);
      const side = /^padding(Left|Top|Right|Bottom)$/.exec(key);
      const label = side ? side[1].toLowerCase() : key;
      if (byId.get(id).indexOf(label) === -1) byId.get(id).push(label);
    }
  }
  return [...byId.entries()].map(([id, keys]) => {
    const sides = keys.filter((k) => /^(left|top|right|bottom)$/.test(k));
    const label =
      sides.length === keys.length
        ? sides.length === 4
          ? "padding"
          : `padding ${sides.join("/")}`
        : keys.join("/");
    return `${label}→${id}`;
  });
};

/** The radius a shape can actually render, after its own cap. */
function effectiveRadius(node) {
  const r = node.cornerRadius;
  if (typeof r !== "number") return null;
  const b = node.absoluteBoundingBox;
  if (!b) return null;
  return Math.min(r, Math.min(b.width, b.height) / 2);
}

async function main() {
  const t = token();
  if (!t) {
    console.error(
      "FIGMA_ACCESS_TOKEN is not set (env or .env). Needs file_content:read.",
    );
    process.exit(2);
  }

  // Full depth, no cap. A depth limit here silently drops the deepest nesting,
  // which is exactly the nesting this checks.
  // plugin_data=shared brings back what the importer stamped on each node,
  // which is how a control is told apart from a nested panel. Without it the
  // only signal is the layer name, and "Button" in a name is a convention
  // rather than a fact about what the node is.
  const res = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(PAGE_NODE)}&plugin_data=shared`,
    { headers: { "X-Figma-Token": t } },
  );
  if (res.status !== 200) {
    console.error(
      `Figma API returned ${res.status}.${res.status === 403 ? " Token expired or lacking file_content:read — FIGMA_ACCESS_TOKEN (env, .env or the CI secret) needs a new Figma personal access token with that scope." : ""}`,
    );
    process.exit(2);
  }
  const page = (await res.json()).nodes[PAGE_NODE].document;

  const findings = new Map();
  const setsWithFindings = new Set();
  let pairsChecked = 0;
  let pillChildren = 0;
  let controlChildren = 0;
  const pillInBox = new Map();

  (function walk(node, parent, setName) {
    if (node.visible === false) return;
    if (node.type === "COMPONENT_SET") setName = node.name;

    if (parent && setName) {
      const pr = effectiveRadius(parent);
      const cr = effectiveRadius(node);
      const pb = parent.absoluteBoundingBox;
      const cb = node.absoluteBoundingBox;

      if (
        pr !== null &&
        cr !== null &&
        pb &&
        cb &&
        isDrawn(parent) &&
        isDrawn(node)
      ) {
        // Which corner is this child sitting in, and how far off it?
        const padLeft = cb.x - pb.x;
        const padRight = pb.x + pb.width - (cb.x + cb.width);
        const padTop = cb.y - pb.y;
        const padBottom = pb.y + pb.height - (cb.y + cb.height);
        const padX = Math.min(padLeft, padRight);
        const padY = Math.min(padTop, padBottom);

        const insideParent = padX >= 0 && padY >= 0;
        const nearCorner = padX <= CORNER_REACH && padY <= CORNER_REACH;

        // A child at its own cap is a pill or a circle, and that is a distinct
        // shape sitting inside the parent rather than a panel nested in one.
        // Concentricity with it would drag every card holding a round icon
        // badge out to a full stadium, which is not what anyone means by
        // hugging. 46 of the first 65 findings were exactly this.
        const childCap = Math.min(cb.width, cb.height) / 2;
        const childIsPill = cr >= childCap - 0.01;

        if (insideParent && nearCorner && isControlSurface(node))
          controlChildren += 1;

        if (insideParent && nearCorner && childIsPill) {
          pillChildren += 1;
          // A pill inside a merely rounded box. The rule declines to judge it —
          // concentricity would force the parent to a stadium — but it is the
          // pairing people point at, so it is counted rather than hidden.
          const parentCap = Math.min(pb.width, pb.height) / 2;
          if (pr > 0 && pr < parentCap - 0.01) {
            const key = `${setName}|${parent.name}|${node.name}`;
            if (!pillInBox.has(key)) {
              pillInBox.set(
                key,
                `${setName} / ${parent.name} > ${node.name}` +
                  ` (parent r=${pr}, child is a pill)`,
              );
            }
          }
        }

        if (
          insideParent &&
          nearCorner &&
          !childIsPill &&
          !isControlSurface(node)
        ) {
          pairsChecked += 1;
          // Non-uniform padding has no exactly concentric answer, so take the
          // tighter axis: that is where the two curves come closest and where a
          // mismatch shows first. See docs/nested-radius.md.
          const pad = Math.min(padX, padY);
          const cap = Math.min(pb.width, pb.height) / 2;
          const ideal = Math.min(cr + pad, cap);
          const delta = pr - ideal;

          if (Math.abs(delta) > TOLERANCE) {
            const key = `${setName}|${parent.name}|${node.name}`;
            if (!findings.has(key)) {
              setsWithFindings.add(setName);
              findings.set(key, {
                setName,
                parent: parent.name,
                child: node.name,
                pr,
                cr,
                pad,
                ideal,
                cap,
                delta,
                childIdeal: Math.max(0, pr - pad),
                parentBound: boundKeys(
                  parent,
                  /^padding|^itemSpacing$|^cornerRadius$|^rectangleCornerRadii$/,
                ),
                childBound: boundKeys(
                  node,
                  /^cornerRadius$|^rectangleCornerRadii$/,
                ),
                parentBox: `${Math.round(pb.width)}x${Math.round(pb.height)}`,
              });
            }
          }
        }
      }
    }

    if (node.children) for (const c of node.children) walk(c, node, setName);
  })(page, null, null);

  const rows = [...findings.values()].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );

  console.log(
    `Nested corner radius — ${pairsChecked} corner-adjacent pair(s) on the Components page` +
      ` (${pillChildren} skipped as a pill or circle,` +
      ` ${controlChildren} as a control)\n`,
  );

  if (rows.length === 0) {
    console.log("  ok    every rounded shape hugs the one inside it");
    process.exit(0);
  }

  console.log(
    `  ${rows.length} pair(s) across ${setsWithFindings.size} set(s) are off the concentric ideal:\n`,
  );
  const limit = process.argv.includes("--all") ? rows.length : 25;
  for (const r of rows.slice(0, limit)) {
    const cappedNote = r.ideal === r.cap ? ", at the cap" : "";
    // Both ways out, because the parent is usually not the one that should
    // move. A card at 12 holding a slot at 16 is a child rounder than the box
    // around it; opening the card to 29 fixes the arithmetic and ruins the
    // card, while squaring the slot costs nothing.
    console.log(
      `  ${r.setName} / ${r.parent} > ${r.child}\n` +
        `      parent ${r.parentBox} r=${r.pr} · child r=${r.cr} · padding ${r.pad}` +
        `  (off by ${r.delta > 0 ? "+" : ""}${r.delta})\n` +
        `      either parent -> ${r.ideal}${cappedNote}, or child -> ${r.childIdeal}`,
    );
    const bound = [
      ...r.parentBound.map((b) => `parent ${b}`),
      ...r.childBound.map((b) => `child ${b}`),
    ];
    if (bound.length)
      console.log(
        `      bound: ${bound.join(", ")}\n` +
          `      a bound property renders the variable, not the painter's literal — fix the definition`,
      );
  }
  if (rows.length > limit)
    console.log(`  (+${rows.length - limit} more — pass --all to list them)`);

  const bySet = new Map();
  for (const r of rows) bySet.set(r.setName, (bySet.get(r.setName) || 0) + 1);
  console.log("\n  by set:");
  for (const [name, n] of [...bySet.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`      ${String(n).padStart(3)}  ${name}`);
  }

  if (pillInBox.size) {
    console.log(
      `\n  Not judged — ${pillInBox.size} pill(s) inside a merely rounded box.` +
        `\n  Concentricity would force each parent to a full stadium, so the rule` +
        `\n  stays out of it: whether a pill belongs there is a role decision.`,
    );
    for (const line of [...pillInBox.values()].slice(0, 8)) {
      console.log(`      ${line}`);
    }
    if (pillInBox.size > 8) console.log(`      (+${pillInBox.size - 8} more)`);
  }

  console.log(
    `\nRule: R_outer = min(R_inner + padding, min(w, h) / 2).` +
      ` Reported, not enforced — see docs/nested-radius.md.`,
  );
  process.exit(process.argv.includes("--strict") ? 1 : 0);
}

main().catch((e) => {
  console.error("nested radius check failed: " + e.message);
  process.exit(2);
});
