import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import {
  GAPS,
  HANDOFF,
  STATUSES,
  readGaps,
  readPriorities,
  roadmap,
} from "./generate-roadmap.mjs";

const table = [
  "| ID     | What                  | Lane          | Status       |",
  "| ------ | --------------------- | ------------- | ------------ |",
  "| GAP-01 | `Thing` throws        | Core          | open         |",
  "| GAP-02 | Another               | Product / SDK | left visible |",
  "| GAP-03 | A third               | Core          | composed     |",
].join("\n");

const handoff = [
  "## At a glance",
  "| P0 | GAP-02 | Part | One line. |",
  "## P0 — broken for people using it",
  "### GAP-02 · Another",
  "- **Why:** see GAP-03, which is not given P0 by being mentioned.",
  "## P1 — visible on the first screens",
  "### GAP-01 and GAP-03 · Two at once",
  "### The package is not tree-shaken",
  "## Also found, outside the components",
  "### GAP-04 · not a priority section",
].join("\n");

test("GAPS.md's rows are read, and only its statuses are accepted", () => {
  assert.deepEqual(readGaps(table), [
    {
      id: "GAP-01",
      number: 1,
      title: "`Thing` throws",
      lane: "Core",
      status: "open",
    },
    {
      id: "GAP-02",
      number: 2,
      title: "Another",
      lane: "Product / SDK",
      status: "left visible",
    },
    {
      id: "GAP-03",
      number: 3,
      title: "A third",
      lane: "Core",
      status: "composed",
    },
  ]);
  assert.throws(
    () => readGaps("| GAP-09 | What | Core | pending |"),
    /"pending" is not a status/,
  );
  assert.throws(
    () =>
      readGaps("| GAP-09 | A | Core | open |\n| GAP-09 | B | Core | open |"),
    /GAP-09 is in GAPS.md's table twice/,
  );
});

test("the handoff's priorities come from its headings and table rows, not its prose", () => {
  const { priorities, given } = readPriorities(
    `${handoff}\n## P2 — API and structure\n| GAP-99 Something | \`x.tsx\` | Change. | Check. |`,
  );
  assert.deepEqual(
    priorities.map(({ id, title, gaps }) => ({ id, title, gaps })),
    [
      { id: "P0", title: "Broken for people using it", gaps: ["GAP-02"] },
      {
        id: "P1",
        title: "Visible on the first screens",
        gaps: ["GAP-01", "GAP-03"],
      },
    ],
  );
  // Reading stops at the first section that is not a priority.
  assert.equal(given.has("GAP-04"), false);
  assert.equal(given.has("GAP-99"), false);
  assert.throws(
    () =>
      readPriorities(
        "## P0 — first\n### GAP-01 · a\n## P1 — second\n### GAP-01 · again",
      ),
    /GAP-01 is given P0 and P1/,
  );
});

test("the roadmap groups every gap, and refuses a gap the table lacks", () => {
  const data = roadmap(table, handoff);
  assert.equal(data.total, 3);
  assert.deepEqual(
    data.groups.map((group) => [group.id, group.items.map((item) => item.id)]),
    [
      ["P0", ["GAP-02"]],
      ["P1", ["GAP-01", "GAP-03"]],
    ],
  );
  assert.deepEqual(data.counts, {
    open: 1,
    composed: 1,
    "left visible": 1,
    fixed: 0,
  });
  // A gap with no priority is listed after the priorities, not dropped.
  const partial = roadmap(
    `${table}\n| GAP-05 | Later | Core | open |`,
    handoff,
  );
  assert.deepEqual(partial.groups.at(-1), {
    id: null,
    title: "Not yet given a priority",
    items: [
      { id: "GAP-05", number: 5, title: "Later", lane: "Core", status: "open" },
    ],
  });
  assert.throws(
    () => roadmap(table, `${handoff.split("## Also")[0]}### GAP-42 · missing`),
    /names GAP-42, which GAPS.md does not have/,
  );
});

test("the site's own documents make a roadmap with every gap prioritised", () => {
  const data = roadmap(
    fs.readFileSync(GAPS, "utf8"),
    fs.readFileSync(HANDOFF, "utf8"),
  );
  const items = data.groups.flatMap((group) => group.items);
  assert.equal(items.length, data.total);
  assert.equal(new Set(items.map((item) => item.id)).size, data.total);
  assert.equal(
    STATUSES.reduce((sum, status) => sum + data.counts[status], 0),
    data.total,
  );
  assert.deepEqual(
    data.groups.map((group) => group.id),
    ["P0", "P1", "P2", "P3"],
  );
});
