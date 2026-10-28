/**
 * GAP-204: a tree composed from Tree's rows is a tree, in Storybook, in the
 * engine ADAPTIVE_BROWSER names, light and dark.
 *
 * TreeParentItemRow and TreeChildItemRow drew plain divs, so a tree composed
 * from them in Tree's role="tree" container had no items: axe's
 * aria-required-children (critical) failed on every MAP-64 board with the
 * Map Content tree, and a screen reader heard a tree with nothing in it. Each
 * row is now a treeitem whose level, expansion, selection and disabled state
 * are the props it already takes.
 *
 * Stories: Composed (rows, with a parent's children in a role="group", as
 * the docs compose them), RowPrimitive (rows with actions, no groups), and
 * the data-driven Default, before and after a click opens and selects `src`,
 * and WithRowActions, before and after a click selects a leaf. In each:
 *
 * - axe finds nothing in the story, and its tree rules ran on it:
 *   aria-required-children and aria-required-parent passed.
 * - Every row is one treeitem, and no treeitem is inside another, so Tree's
 *   own renderer adds no second role.
 * - Each row has the role, level, expanded, selected and disabled state the
 *   story means. The level is aria-level or, with none, one more than the
 *   groups the row is in, as browsers compute it; where a story nests its
 *   rows in groups, an aria-level agrees with them.
 * - In Chromium, the browser's own accessibility tree says the same.
 *
 *   pnpm --filter @kozmos-ds/docs build-storybook
 *   python3 -m http.server <port> --bind 127.0.0.1 --directory apps/docs/storybook-static
 *   STORYBOOK_URL=http://127.0.0.1:<port> ADAPTIVE_BROWSER=chromium|firefox|webkit \
 *     node scripts/check-tree-semantics.mjs
 */
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const TREE_RULES = ["aria-required-children", "aria-required-parent"];

/** A row as the story means it: expanded null for a row with no children. */
const row = (
  name,
  level,
  { expanded = null, selected = false, disabled = false } = {},
) => ({
  name,
  level,
  expanded,
  selected,
  disabled,
});

const SCENARIOS = [
  {
    id: "data-display-tree--composed",
    nested: true,
    rows: [
      row("Outdoor map content", 1, { expanded: true }),
      row("Terminal C", 2, { expanded: true }),
      row("Burger King", 3, { selected: true }),
      row("McDonald's", 3),
      row("Terminal D", 2, { expanded: false }),
      row("Archived content", 1, { disabled: true }),
    ],
  },
  {
    // Its child is drawn at depth 2 under a parent at 0, with no group: the
    // level is the row's own.
    id: "data-display-tree--row-primitive",
    nested: false,
    rows: [
      row("Content group", 1, { expanded: true }),
      row("Place item", 3, { selected: true }),
    ],
  },
  {
    id: "data-display-tree--default",
    nested: true,
    rows: [row("src", 1, { expanded: false }), row("package.json", 1)],
    click: "src",
    after: [
      row("src", 1, { expanded: true, selected: true }),
      row("components", 2, { expanded: false }),
      row("App.tsx", 2),
      row("index.tsx", 2),
      row("package.json", 1),
    ],
  },
  {
    id: "data-display-tree--with-row-actions",
    nested: true,
    rows: [
      row("Outdoor map content", 1, { expanded: true }),
      row("Terminal C", 2, { expanded: true }),
      row("Ground Floor (GF)", 3, { expanded: true }),
      row("Fast Food", 4, { expanded: true }),
      row("Burger King", 5),
      row("McDonald's", 5),
    ],
    click: "Burger King",
    after: [
      row("Outdoor map content", 1, { expanded: true }),
      row("Terminal C", 2, { expanded: true }),
      row("Ground Floor (GF)", 3, { expanded: true }),
      row("Fast Food", 4, { expanded: true }),
      row("Burger King", 5, { selected: true }),
      row("McDonald's", 5),
    ],
  },
];

/** The tree's rows as the page's ARIA says them, in document order. */
function readRows(page) {
  return page.evaluate(() => {
    const root = document.querySelector("#storybook-root");
    const trees = root.querySelectorAll('[role="tree"]');
    const tree = trees[0];
    // Every row Tree draws carries data-depth, whatever its role.
    const rows = [...tree.querySelectorAll("[data-depth]")];
    const items = [...tree.querySelectorAll('[role="treeitem"]')];
    return {
      trees: trees.length,
      notItems: rows
        .filter((node) => node.getAttribute("role") !== "treeitem")
        .map((node) => node.textContent),
      nested: items
        .filter((node) => node.parentElement.closest('[role="treeitem"]'))
        .map((node) => node.textContent),
      items: items.map((node) => {
        let groups = 0;
        for (
          let up = node.parentElement;
          up && up !== tree;
          up = up.parentElement
        )
          if (up.getAttribute("role") === "group") groups++;
        const level = node.getAttribute("aria-level");
        return {
          text: node.textContent,
          level: level === null ? null : Number(level),
          byGroups: groups + 1,
          expanded: node.getAttribute("aria-expanded"),
          selected: node.getAttribute("aria-selected"),
          disabled: node.getAttribute("aria-disabled"),
        };
      }),
    };
  });
}

/** Chromium's own accessibility tree: the tree's treeitems, in order. */
async function readChromium(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const byId = new Map(nodes.map((node) => [node.nodeId, node]));
    const tree = nodes.find((node) => node.role?.value === "tree");
    const items = [];
    const walk = (node) => {
      for (const id of node.childIds ?? []) {
        const child = byId.get(id);
        if (!child) continue;
        if (child.role?.value === "treeitem") items.push(child);
        walk(child);
      }
    };
    if (tree) walk(tree);
    return items.map((node) => {
      const p = Object.fromEntries(
        (node.properties ?? []).map((prop) => [prop.name, prop.value.value]),
      );
      return {
        name: node.name?.value ?? "",
        level: p.level ?? null,
        expanded: p.expanded ?? null,
        selected: p.selected ?? null,
        disabled: p.disabled ?? false,
      };
    });
  } finally {
    await cdp.detach();
  }
}

const browser = await launchFixtureBrowser();
const chromium = browser.browserType().name() === "chromium";
const failures = [];
let checked = 0;
const expect = (label, ok, detail) => {
  checked++;
  if (!ok)
    failures.push(`${label}${detail === undefined ? "" : `: ${detail}`}`);
};

async function verify(page, label, scenario, wanted) {
  const axe = await new AxeBuilder({ page })
    .include("#storybook-root")
    .withTags(TAGS)
    .analyze();
  expect(
    `${label}: axe finds nothing`,
    axe.violations.length === 0,
    axe.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}) at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}: ${v.nodes[0]?.failureSummary?.replace(/\s+/g, " ")}`,
      )
      .join("; "),
  );
  for (const rule of TREE_RULES)
    expect(
      `${label}: axe's ${rule} ran on the tree and passed`,
      axe.passes.some((pass) => pass.id === rule),
    );

  const read = await readRows(page);
  expect(`${label}: one tree`, read.trees === 1, `${read.trees}`);
  expect(
    `${label}: every row is a treeitem`,
    read.notItems.length === 0,
    `not: ${JSON.stringify(read.notItems)}`,
  );
  expect(
    `${label}: no treeitem is inside another`,
    read.nested.length === 0,
    JSON.stringify(read.nested),
  );
  expect(
    `${label}: ${wanted.length} treeitems`,
    read.items.length === wanted.length,
    `read ${read.items.length}`,
  );
  wanted.forEach((want, i) => {
    const got = read.items[i];
    const at = `${label}: ${want.name}`;
    if (!got) return;
    expect(
      `${at} is row ${i + 1}`,
      got.text.startsWith(want.name),
      JSON.stringify(got.text),
    );
    expect(
      `${at}: level ${want.level}`,
      (got.level ?? got.byGroups) === want.level,
      `aria-level ${got.level}, groups say ${got.byGroups}`,
    );
    if (scenario.nested && got.level !== null)
      expect(
        `${at}: aria-level agrees with its groups`,
        got.level === got.byGroups,
        `aria-level ${got.level}, groups say ${got.byGroups}`,
      );
    expect(
      `${at}: aria-expanded ${want.expanded ?? "absent"}`,
      got.expanded === (want.expanded === null ? null : String(want.expanded)),
      `read ${got.expanded}`,
    );
    expect(
      `${at}: aria-selected ${want.selected}`,
      got.selected === String(want.selected),
      `read ${got.selected}`,
    );
    expect(
      `${at}: ${want.disabled ? "aria-disabled" : "not disabled"}`,
      want.disabled
        ? got.disabled === "true"
        : got.disabled === null || got.disabled === "false",
      `read ${got.disabled}`,
    );
  });

  if (chromium) {
    const ax = await readChromium(page);
    expect(
      `${label}: Chromium's accessibility tree has ${wanted.length} treeitems`,
      ax.length === wanted.length,
      `read ${ax.length}`,
    );
    wanted.forEach((want, i) => {
      const got = ax[i];
      if (!got) return;
      const at = `${label}: Chromium reads ${want.name}`;
      const as = {
        name: got.name.startsWith(want.name),
        level: got.level,
        expanded: got.expanded,
        selected: got.selected,
        disabled: got.disabled,
      };
      const is = {
        name: true,
        level: want.level,
        expanded: want.expanded,
        selected: want.selected,
        disabled: want.disabled,
      };
      expect(
        at,
        JSON.stringify(as) === JSON.stringify(is),
        `${JSON.stringify({ ...as, name: got.name })}, wanted ${JSON.stringify({ ...is, name: want.name })}`,
      );
    });
  }
}

try {
  for (const theme of ["light", "dark"]) {
    for (const scenario of SCENARIOS) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const label = `${theme}/${scenario.id}`;
      try {
        await page.goto(
          `${base}/iframe.html?id=${scenario.id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        const tree = page.locator('#storybook-root [role="tree"]');
        await tree.waitFor();
        await verify(page, label, scenario, scenario.rows);
        if (scenario.click) {
          // Tree's own renderer: a click on the row's name selects it, and
          // opens a parent.
          await tree.getByText(scenario.click, { exact: true }).click();
          await page.waitForFunction(
            (name) =>
              [...document.querySelectorAll('[role="treeitem"]')].some(
                (node) =>
                  node.textContent.startsWith(name) &&
                  node.getAttribute("aria-selected") === "true",
              ),
            scenario.click,
            { polling: 50, timeout: 5000 },
          );
          await verify(
            page,
            `${label}, after a click on ${scenario.click}`,
            scenario,
            scenario.after,
          );
        }
      } catch (error) {
        failures.push(`${label}: ${error.message.split("\n")[0]}`);
      }
      if (errors.length)
        failures.push(`${label}: page errors: ${errors.join("; ")}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`FAIL tree semantics (${failures.length} of ${checked}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(
  `PASS tree semantics: ${checked} checks in ${SCENARIOS.length} stories, light and dark — axe finds nothing and its tree rules ran; ` +
    "every row, composed or Tree's own, is one treeitem with its level, expanded, selected and disabled" +
    (chromium ? ", and Chromium's accessibility tree says the same" : ""),
);
