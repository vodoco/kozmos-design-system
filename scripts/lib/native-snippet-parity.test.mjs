import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  claimedTabs,
  firstDifference,
  leadingComment,
  parseHeader,
  readPage,
  snippetBody,
} from "./native-snippet-parity.mjs";

const header = (text) => parseHeader(leadingComment(text));
const CHECK = fileURLToPath(
  new URL("../check-native-snippet-parity.mjs", import.meta.url),
);

test("reads a claim on one line, with a section, wrapped, and plural", () => {
  assert.deepEqual(
    header(
      "// LocationPin.mdx's SwiftUI snippet, word for word below this comment:\nimport SwiftUI\n",
    ),
    {
      kind: "claim",
      page: "LocationPin",
      label: "SwiftUI",
      platform: "swift",
      plural: false,
      section: null,
    },
  );
  const wrapped = header(
    "// POIResultCard.mdx's Compose snippet (\"The name's language and the\n// summary's\"), word for word below the package line: compiled here.\npackage com.kozmos.docsnippets\n",
  );
  assert.equal(wrapped.platform, "kotlin");
  assert.equal(wrapped.section, "The name's language and the summary's");
  // The claim wraps before "word for word" as well as inside the title.
  assert.equal(
    header(
      '// Itinerary.mdx\'s SwiftUI snippet ("Changing an endpoint"), word\n// for word below this comment.\n',
    ).section,
    "Changing an endpoint",
  );
  const plural = header(
    '// RouteSummary.mdx\'s SwiftUI snippets ("Route preview"), word for word below\n// this comment.\n',
  );
  assert.equal(plural.plural, true);
  assert.equal(plural.section, "Route preview");
});

test("a file is marked as no tab, or fails: neither, both, or a garbled claim", () => {
  assert.deepEqual(
    header(
      "// Not a docs tab: no MDX page shows it.\n// How a prototype does it.\npackage x\n",
    ),
    { kind: "none" },
  );
  // A marker needs its reason on the line.
  assert.equal(header("// Not a docs tab:\npackage x\n"), null);
  assert.equal(header("// A helper the tests share.\nimport SwiftUI\n"), null);
  assert.equal(header("import SwiftUI\n"), null);
  assert.match(
    header(
      "// Not a docs tab: shown nowhere.\n// Chip.mdx's SwiftUI snippet, word for word.\n",
    ).error,
    /marked/,
  );
  assert.match(
    header("// Chip.mdx's iOS snippet, word for word below this comment.\n")
      .error,
    /does not read as/,
  );
});

test("the snippet is what follows the leading comment, and the package line", () => {
  const kotlin =
    "// Chip.mdx's Compose snippet, word for word below\n// the package line.\npackage com.kozmos.docsnippets\n\nimport a.B\n\n// Its own comment.\nfun x() {}\n";
  assert.deepEqual(snippetBody(kotlin, "kotlin").split("\n").filter(Boolean), [
    "import a.B",
    "// Its own comment.",
    "fun x() {}",
  ]);
  const swift =
    "// Chip.mdx's SwiftUI snippet, word for word.\nimport SwiftUI\n\n// Its own comment.\nstruct A {}\n";
  assert.deepEqual(snippetBody(swift, "swift").split("\n").filter(Boolean), [
    "import SwiftUI",
    "// Its own comment.",
    "struct A {}",
  ]);
});

const PAGE = [
  "# Page", // 1
  "", // 2
  "## First", // 3
  "<PlatformSnippets", // 4
  '  react={`<A label="## not a heading" />`}', // 5
  "  swift={`", // 6
  "## not a heading either", // 7
  'Text("\\\\(count) left")', // 8
  "`}", // 9
  '  kotlin={`Text("\\${count} left")`}', // 10
  "/>", // 11
  "", // 12
  "## Second", // 13
  "", // 14
  "```swift", // 15
  "# a comment line in a fence", // 16
  'Text("\\(count)")', // 17
  "```", // 18
  "", // 19
  "### Second, deeper", // 20
  '<PlatformSnippets swift={`Text("deeper")`} />', // 21
  "", // 22
  "## Third", // 23
  "Prose.", // 24
].join("\n");

test("reads headings and tabs outside literals and fences, as the page renders them", () => {
  const page = readPage(PAGE);
  assert.deepEqual(
    page.headings.map((h) => [h.level, h.text, h.line]),
    [
      [1, "Page", 1],
      [2, "First", 3],
      [2, "Second", 13],
      [3, "Second, deeper", 20],
      [2, "Third", 23],
    ],
  );
  assert.deepEqual(
    page.tabs.map((t) => [t.platform, t.form, t.line]),
    [
      ["swift", "literal", 6],
      ["kotlin", "literal", 10],
      ["swift", "fence", 15],
      ["swift", "literal", 21],
    ],
  );
  // A template literal's escapes render; a fence is as written.
  assert.match(page.tabs[0].code, /Text\("\\\(count\) left"\)/);
  assert.equal(page.tabs[1].code, 'Text("${count} left")');
  assert.equal(
    page.tabs[2].code,
    '# a comment line in a fence\nText("\\(count)")',
  );
});

test("a claim finds its section's tab, the second on the page included", () => {
  const page = readPage(PAGE);
  const first = claimedTabs(page, {
    platform: "kotlin",
    plural: false,
    section: "First",
  });
  assert.equal(first.tabs.length, 1);
  assert.equal(first.tabs[0].line, 10);
  // A heading matches without its code spans, in any case.
  const third = claimedTabs(
    readPage("## The `onOpen` tab\n```kotlin\nx\n```\n"),
    {
      platform: "kotlin",
      plural: false,
      section: "the onOpen tab",
    },
  );
  assert.equal(third.tabs[0].code, "x");
  // "Second" runs on through its "###" to "## Third": two SwiftUI tabs.
  assert.match(
    claimedTabs(page, { platform: "swift", plural: false, section: "Second" })
      .error,
    /2 SwiftUI tabs/,
  );
  assert.equal(
    claimedTabs(page, {
      platform: "swift",
      plural: false,
      section: "Second, deeper",
    }).tabs[0].line,
    21,
  );
  // With no section the page is the scope, and it has three.
  assert.match(
    claimedTabs(page, { platform: "swift", plural: false, section: null })
      .error,
    /the page has 3 SwiftUI tabs/,
  );
});

test("a missing section, or a section with no tab, is an error, never a pass", () => {
  const page = readPage(PAGE);
  assert.match(
    claimedTabs(page, { platform: "swift", plural: false, section: "Fourth" })
      .error,
    /no heading "Fourth" \(its headings: "Page", "First"/,
  );
  assert.match(
    claimedTabs(page, { platform: "kotlin", plural: true, section: "Third" })
      .error,
    /"Third" \(line 23\) has no Compose tab/,
  );
  assert.match(
    claimedTabs(readPage("## Twice\n## Twice\n"), {
      platform: "swift",
      plural: false,
      section: "Twice",
    }).error,
    /2 headings "Twice"/,
  );
});

test("snippets claims every tab in scope, in page order", () => {
  const page = readPage(PAGE);
  const all = claimedTabs(page, {
    platform: "swift",
    plural: true,
    section: "Second",
  });
  assert.deepEqual(
    all.tabs.map((t) => t.line),
    [15, 21],
  );
  const joined = all.tabs.map((t) => t.code).join("\n");
  assert.equal(
    firstDifference(
      '# a comment line in a fence\n\n    Text("\\(count)")\nText("deeper")\n',
      joined,
    ),
    null,
  );
  assert.deepEqual(
    firstDifference('# a comment line in a fence\nText("\\(count)")\n', joined),
    { line: 3, got: 'Text("deeper")', want: "(nothing)" },
  );
});

function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-parity-test-"));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}
const run = (root) =>
  spawnSync(process.execPath, [CHECK], { cwd: root, encoding: "utf8" });
const IOS = "packages/ios/Tests/KozmosTests/DocSnippets";
const ANDROID = "packages/android/src/test/java/com/kozmos/docsnippets";

test("the check compares every claim, and fails a file that neither claims nor is marked", () => {
  const files = {
    "packages/react/src/components/Pin/Pin.mdx":
      '## One\n<PlatformSnippets swift={`Text("\\\\(n)")`} />\n## Two\n<PlatformSnippets kotlin={`Text("two")`} />\n',
    "apps/docs/stories/.keep": "",
    [`${IOS}/Pin.swift`]:
      '// Pin.mdx\'s SwiftUI snippet ("One"), word for word below this\n// comment.\nText("\\(n)")\n',
    [`${ANDROID}/Pin.kt`]:
      '// Pin.mdx\'s Compose snippet ("Two"), word for word below the package\n// line.\npackage com.kozmos.docsnippets\n\nText("two")\n',
    [`${ANDROID}/Helper.kt`]:
      "// Not a docs tab: shown nowhere.\npackage com.kozmos.docsnippets\n",
  };
  const root = tree(files);
  try {
    const pass = run(root);
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(
      pass.stdout,
      /2 compiled snippets against 2 tabs, 1 files marked/,
    );
    fs.writeFileSync(
      path.join(root, ANDROID, "Stray.kt"),
      "// A helper.\npackage com.kozmos.docsnippets\n",
    );
    fs.writeFileSync(
      path.join(root, IOS, "Pin.swift"),
      '// Pin.mdx\'s SwiftUI snippet ("One"), word for word.\nText("(n)")\n',
    );
    const fail = run(root);
    assert.equal(fail.status, 1);
    assert.match(fail.stderr, /Stray\.kt: its leading comment claims no tab/);
    assert.match(
      fail.stderr,
      /Pin\.swift ↔ Pin\.mdx \("One"\): line 1 renders "Text\(\\"\\\\\(n\)\\"\)"/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the check fails when it compares nothing", () => {
  const root = tree({
    "packages/react/src/.keep": "",
    "apps/docs/stories/.keep": "",
    [`${IOS}/Helper.swift`]: "// Not a docs tab: shown nowhere.\n",
    [`${ANDROID}/.keep`]: "",
  });
  try {
    const result = run(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no tab was compared/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
