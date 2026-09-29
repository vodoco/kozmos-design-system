/**
 * How `.ai-skills` code is checked against what @kozmos-ds publishes (the
 * review's T3).
 *
 * Each case is a small document written here, so what it must report is
 * decided by reading it, not by running the checker. The checker used to
 * take its export list from component directory names, so it refused the
 * real `DialogContent` and let an unexported `Radio` through, and it read
 * one line at a time, so an import or a tag written across lines, or a
 * second tag on a line, was never seen.
 *
 * They read the built declarations: `pnpm --filter "@kozmos-ds/react..." build`.
 */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readKozmosFacts } from "./ai-facts.mjs";
import { checkDocuments } from "./ai-snippets.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const facts = readKozmosFacts(root);

const fence = "```";
const doc = (lang, code) =>
  `# A fixture\n\nSome prose.\n\n${fence}${lang}\n${code}\n${fence}\n`;
const check = (text) =>
  checkDocuments(root, [{ file: "fixture.md", text }], facts);
const messages = (text) => check(text).map((p) => p.message);

test("real compound exports, type imports and hooks pass, and compile", () => {
  const text = doc(
    "tsx",
    `import { Dialog, DialogContent, DialogTitle, type ButtonProps, useTheme } from "@kozmos-ds/react";

export function Example({ children }: Pick<ButtonProps, "children">) {
  const { theme } = useTheme();
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>{theme}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}`,
  );
  assert.deepEqual(messages(text), []);
});

test("an import of something the package does not export is found, on one line or across several", () => {
  const oneLine = messages(
    doc("tsx", `import { NonexistentWidget } from "@kozmos-ds/react";`),
  );
  const multiline = messages(
    doc(
      "tsx",
      `import {\n  Button,\n  NonexistentWidget,\n} from "@kozmos-ds/react";`,
    ),
  );
  for (const found of [oneLine, multiline])
    assert.ok(
      found.some(
        (m) => /NonexistentWidget/.test(m) && /does not export/.test(m),
      ),
      found.join("\n"),
    );
});

test("a component the package does not export is refused, whatever its directory is called", () => {
  // packages/react/src/components/Radio exists, but exports RadioGroup and
  // RadioGroupItem; SpinnerArc is internal to Spinner.
  for (const name of ["Radio", "SpinnerArc"]) {
    const found = messages(
      doc(
        "tsx",
        `import { ${name} } from "@kozmos-ds/react";\nexport const x = <${name} />;`,
      ),
    );
    assert.ok(
      found.some((m) => m.includes(name) && /does not export/.test(m)),
      `${name}: ${found.join("\n")}`,
    );
  }
});

test("a JSX tag written across lines is checked", () => {
  const found = messages(
    doc(
      "tsx",
      `import { Button } from "@kozmos-ds/react";\nexport const x = (\n  <Button\n    variant="primary"\n  >\n    Save\n  </Button>\n);`,
    ),
  );
  assert.ok(
    found.some((m) => /Button/.test(m) && /"primary"/.test(m)),
    found.join("\n"),
  );
});

test("every tag on a line is checked, not only the first", () => {
  const found = messages(
    doc(
      "tsx",
      `// kozmos-skills: template — two tags on one line, the second one wrong\n<Badge variant="default">New</Badge> <Button variant="primary">Save</Button>`,
    ),
  );
  assert.ok(
    found.some((m) => /Button/.test(m) && /"primary"/.test(m)),
    found.join("\n"),
  );
  assert.ok(!found.some((m) => /Badge/.test(m)), found.join("\n"));
});

test("a value written as an expression string is checked too", () => {
  for (const value of [`{"primary"}`, "{`primary`}"]) {
    const found = messages(
      doc(
        "tsx",
        `// kozmos-skills: template — one tag, shown on its own\n<Button variant=${value}>Save</Button>`,
      ),
    );
    assert.ok(
      found.some((m) => /"primary"/.test(m)),
      `${value}: ${found.join("\n")}`,
    );
  }
});

test("the findings do not depend on how the code is laid out", () => {
  const compact = `import { Badge, Button, Tag } from "@kozmos-ds/react";
export const x = <div><Badge variant="primary">A</Badge><Tag emotion="angry" onRemove={() => {}}>B</Tag><Button emotion="danger" size="xl">C</Button></div>;`;
  const spread = `import {
  Badge,
  Button,
  Tag,
} from "@kozmos-ds/react";

export const x = (
  <div>
    <Badge
      variant="primary"
    >
      A
    </Badge>
    <Tag
      emotion="angry"
      onRemove={() => {}}
    >
      B
    </Tag>
    <Button emotion="danger" size="xl">C</Button>
  </div>
);`;
  const a = messages(doc("tsx", compact)).sort();
  const b = messages(doc("tsx", spread)).sort();
  assert.deepEqual(a, b);
  // And what they find is what is wrong: Badge has no "primary", Tag no
  // "angry", Button no size "xl"; Button's emotion "danger" is real.
  for (const wrong of [/Badge.*"primary"/, /Tag.*"angry"/, /Button.*"xl"/])
    assert.ok(
      a.some((m) => wrong.test(m)),
      `${wrong}: ${a.join("\n")}`,
    );
  assert.ok(!a.some((m) => /"danger"/.test(m)), a.join("\n"));
});

test("a prop the component does not take is found", () => {
  const found = messages(
    doc(
      "tsx",
      `// kozmos-skills: template — one tag, shown on its own\n<Button colour="red" data-testid="save" aria-label="Save">Save</Button>`,
    ),
  );
  assert.ok(
    found.some((m) => /Button/.test(m) && /colour/.test(m)),
    found.join("\n"),
  );
  assert.ok(
    !found.some((m) => /data-testid|aria-label/.test(m)),
    found.join("\n"),
  );
});

test("a package under the old @kozmos scope, or one the workspace does not have, is refused", () => {
  const found = messages(
    doc(
      "tsx",
      `// kozmos-skills: template — imports only\nimport { Button } from "@kozmos/react";\nimport { View } from "react-native";`,
    ),
  );
  assert.ok(
    found.some((m) => /@kozmos\/react/.test(m)),
    found.join("\n"),
  );
  assert.ok(
    found.some((m) => /react-native/.test(m)),
    found.join("\n"),
  );
});

test("a complete block is compiled against the build, and a template needs a reason", () => {
  // Nothing here is wrong by name: only the compiler sees that onClick takes
  // a function.
  const compiled = messages(
    doc(
      "tsx",
      `import { Button } from "@kozmos-ds/react";\nexport const x = <Button onClick={true}>Save</Button>;`,
    ),
  );
  assert.ok(
    compiled.some((m) => /TS2322/.test(m)),
    compiled.join("\n"),
  );
  // A fragment that does not compile has to say it is a template, and why.
  const unmarked = messages(doc("tsx", `<Button>{label}</Button>`));
  assert.ok(
    unmarked.some((m) => /TS2304/.test(m)),
    unmarked.join("\n"),
  );
  const reasonless = messages(
    doc("tsx", `// kozmos-skills: template\n<Button>{label}</Button>`),
  );
  assert.ok(
    reasonless.some((m) => /reason/.test(m)),
    reasonless.join("\n"),
  );
  // With one, it is not compiled, and what it names is still checked.
  assert.deepEqual(
    messages(
      doc(
        "tsx",
        `// kozmos-skills: template — a fragment of a render; label is the app's\n<Button>{label}</Button>`,
      ),
    ),
    [],
  );
});

test("an alias and a namespace import are followed to the component", () => {
  const found = messages(
    doc(
      "tsx",
      `import { Button as KozmosButton } from "@kozmos-ds/react";\nimport * as K from "@kozmos-ds/react";\nexport const x = <><KozmosButton variant="primary" /><K.Badge variant="loud" /></>;`,
    ),
  );
  assert.ok(
    found.some((m) => /"primary"/.test(m)),
    found.join("\n"),
  );
  assert.ok(
    found.some((m) => /"loud"/.test(m)),
    found.join("\n"),
  );
});

test("prose and other fences are held to the same facts, across lines", () => {
  const text = `# Prose\n\nWrite \`<Badge\n  variant="shouting">\` for emphasis, or import it:\n\n${fence}markdown\nimport {\n  Radio,\n} from "@kozmos-ds/react";\n${fence}\n`;
  const found = messages(text);
  assert.ok(
    found.some((m) => /"shouting"/.test(m)),
    found.join("\n"),
  );
  assert.ok(
    found.some((m) => /Radio/.test(m) && /does not export/.test(m)),
    found.join("\n"),
  );
});

test("a React tag named Kozmos-something must be an export: the prefix is SwiftUI's and Compose's", () => {
  // KozmosButton is Button in React; KozmosSkipLink is nothing at all. The one
  // React export with the prefix, KozmosTheme, is let through.
  const found = messages(
    doc(
      "tsx",
      `// kozmos-skills: template — tags only, shown on their own\n<KozmosTheme><KozmosButton variant="default">Go</KozmosButton><KozmosSkipLink href="#main" /></KozmosTheme>`,
    ),
  );
  assert.ok(
    found.some((m) => /KozmosButton/.test(m) && /\bButton\b/.test(m)),
    found.join("\n"),
  );
  assert.ok(
    found.some((m) => /KozmosSkipLink/.test(m)),
    found.join("\n"),
  );
  assert.ok(!found.some((m) => /KozmosTheme/.test(m)), found.join("\n"));
  // In prose too.
  const prose = messages("Wrap it in a `<KozmosModal open>` first.\n");
  assert.ok(
    prose.some((m) => /KozmosModal/.test(m)),
    prose.join("\n"),
  );
});

test("a CSS variable must be one the built stylesheets define, or the document does", () => {
  const found = messages(
    `# Tokens\n\n${fence}css\n.panel {\n  color: var(--kozmos-color-text-primary);\n  background: var(--primitives-colors-background-0);\n  --my-brand: #123456;\n  border-color: var(--my-brand);\n}\n${fence}\n\n${fence}tsx\n// kozmos-skills: template — a style prop, shown on its own\n<div style={{ padding: "var(--kozmos-space-400)" }} />\n${fence}\n`,
  );
  for (const name of ["--kozmos-color-text-primary", "--kozmos-space-400"])
    assert.ok(
      found.some((m) => m.includes(name)),
      `${name}: ${found.join("\n")}`,
    );
  for (const name of ["--primitives-colors-background-0", "--my-brand"])
    assert.ok(!found.some((m) => m.includes(name)), found.join("\n"));
});

test("no command runs a Kozmos package through npx: none provides one", () => {
  // Each of these would fetch and run whatever npm served under the name.
  const found = messages(
    `# Setup\n\n${fence}bash\nnpx kozmos-ai-setup --all\npnpm dlx @kozmos-ds/mcp-server\nnpx @kozmos/codemod v2-to-v3 --path ./src\nnpx tsc --noEmit\n${fence}\n\nOr run \`bunx @kozmos-ds/cli analyze\`.\n`,
  );
  for (const name of [
    "kozmos-ai-setup",
    "@kozmos-ds/mcp-server",
    "@kozmos/codemod",
    "@kozmos-ds/cli",
  ])
    assert.ok(
      found.some((m) => m.includes(name) && /npx|dlx|bunx/.test(m)),
      `${name}: ${found.join("\n")}`,
    );
  assert.ok(!found.some((m) => /\btsc\b/.test(m)), found.join("\n"));
});
