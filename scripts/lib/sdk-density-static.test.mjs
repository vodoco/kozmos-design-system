import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  COMPONENTS,
  checkComponent,
  checkSdkParts,
} from "./sdk-density-static.mjs";

// Each rule of the static half (decision 89), on small crafted parts: the
// held shape passes, and each way out of it is named.
const part = (body) => `
import React from "react";
export const Part = React.forwardRef((props, ref) => {
  ${body}
});`;
const scope = (child, attributes = 'density="touch" asChild') =>
  `<DensityScope ${attributes}>${child}</DensityScope>`;
const problems = (body) => checkComponent(part(body), "Part");

test("a touch DensityScope around one intrinsic element holds the root", () => {
  assert.deepEqual(problems(`return ${scope("<div ref={ref} />")};`), []);
  assert.deepEqual(
    problems(`return ${scope("<section />", 'density="touch" asChild={true}')};`),
    [],
  );
});

test("asChild must be bare or {true}", () => {
  assert.match(
    problems(`return ${scope("<div />", 'density="touch" asChild={false}')};`)[0],
    /asChild=\{false\}/,
  );
  assert.match(
    problems(`return ${scope("<div />", 'density="touch" asChild={wrap}')};`)[0],
    /asChild=\{wrap\}/,
  );
  assert.match(
    problems(`return ${scope("<div />", 'density="touch"')};`)[0],
    /no asChild/,
  );
  assert.match(
    problems(`return ${scope("<div />", 'density="compact" asChild')};`)[0],
    /density "compact"/,
  );
});

test("only a bare hidden is skipped; hidden={…} may show, so it is held", () => {
  assert.deepEqual(
    problems(`return <>{${scope("<div />")}}<div hidden /></>;`),
    [],
  );
  assert.match(
    problems(`return <>{${scope("<div />")}}<div hidden={closed} /></>;`)[0],
    /returns <div>/,
  );
  assert.match(problems(`return <div hidden={closed} />;`)[0], /returns <div>/);
});

test("a returned name is followed only to an unshadowed, unassigned const of the render's own block", () => {
  assert.deepEqual(
    problems(`const root = ${scope("<div />")};\n  return root;`),
    [],
  );
  assert.match(
    problems(`let root = ${scope("<div />")};\n  return root;`)[0],
    /not a const of the render's own block/,
  );
  assert.match(
    problems(
      `if (open) { const root = ${scope("<div />")}; }\n  return root;`,
    )[0],
    /not a const of the render's own block/,
  );
  assert.match(
    problems(
      `const root = ${scope("<div />")};\n  root = <div />;\n  return root;`,
    )[0],
    /reassigned/,
  );
  assert.match(
    problems(
      `const root = ${scope("<div />")};\n  if (open) { const root = <div />; return root; }\n  return root;`,
    )[0],
    /another declaration shadows/,
  );
  // A const of another function is not the render's.
  assert.match(
    problems(
      `const make = () => { const root = <div />; return root; };\n  return root;`,
    )[0],
    /not a const of the render's own block/,
  );
});

test("the DensityScope's child is one element that takes the mark", () => {
  assert.match(
    problems(`return ${scope("<><div /></>")};`)[0],
    /around a fragment/,
  );
  assert.match(
    problems(`return ${scope("{children}")};`)[0],
    /around \{children\}, which can't be read/,
  );
  assert.match(
    problems(`return ${scope("<div /><div />")};`)[0],
    /around 2 children/,
  );
  assert.match(
    problems(`return ${scope("<Stack />")};`)[0],
    /around <Stack> at line \d+, which is not known to pass data-\* on/,
  );
  // Button and Card spread their props onto their element.
  assert.deepEqual(problems(`return ${scope("<Card />")};`), []);
  assert.deepEqual(problems(`return ${scope("<Button />")};`), []);
  // A comment beside the child is no child.
  assert.deepEqual(
    problems(`return ${scope("{/* the root */}<div />")};`),
    [],
  );
});

test("a wrapper that renders no element is looked into", () => {
  assert.deepEqual(
    problems(`return <Dialog.Root open>${scope("<div />")}</Dialog.Root>;`),
    [],
  );
  assert.match(
    problems(`return <Dialog.Root open><div /></Dialog.Root>;`)[0],
    /returns <div>/,
  );
  assert.match(
    problems(`return <Tabs.Root>${scope("<div />")}</Tabs.Root>;`)[0],
    /returns <Tabs.Root>/,
  );
});

// Every component an SDK directory exports, not only its namesake: the
// second export here (MapInfo's shape) returns a plain element.
test("every exported component of an SDK directory is checked", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdk-density-"));
  try {
    for (const name of ["Button", "Card"])
      fs.cpSync(path.join(COMPONENTS, name), path.join(dir, name), {
        recursive: true,
      });
    const panel = path.join(dir, "Panel");
    fs.mkdirSync(panel);
    fs.writeFileSync(
      path.join(panel, "Panel.stories.tsx"),
      'export default { title: "SDK/Panel" };',
    );
    fs.writeFileSync(
      path.join(panel, "index.ts"),
      'export * from "./Panel";\nexport { Host } from "./Host";\nexport type { HostProps } from "./Host";\n',
    );
    fs.writeFileSync(
      path.join(panel, "Panel.tsx"),
      `export function Panel() { return ${scope("<div />")}; }\nexport const PANEL_SIZE = 4;`,
    );
    fs.writeFileSync(
      path.join(panel, "Host.tsx"),
      "export interface HostProps {}\nexport const Host = () => <Dialog.Root><div /></Dialog.Root>;",
    );
    const result = checkSdkParts(dir);
    assert.equal(result.parts, 1);
    assert.deepEqual(result.components, ["Panel", "Host"]);
    assert.ok(
      result.unheld.some((line) =>
        /^Panel: Host returns <div> at line 2, not a touch DensityScope root$/.test(
          line,
        ),
      ),
      result.unheld.join("\n"),
    );
    // DirectionIcon is exempt, so its absence here is named too.
    assert.ok(
      result.unheld.some((line) => /DirectionIcon is exempt/.test(line)),
    );
    // A density marked by hand is refused.
    fs.writeFileSync(
      path.join(panel, "Panel.tsx"),
      'export function Panel() { return <div data-kozmos-density="touch" />; }',
    );
    assert.ok(
      checkSdkParts(dir).unheld.some((line) =>
        /Panel\.tsx marks a density by hand/.test(line),
      ),
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a component listed as passing data-* on must spread its props", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdk-density-"));
  try {
    fs.cpSync(path.join(COMPONENTS, "Card"), path.join(dir, "Card"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(dir, "Button"));
    fs.writeFileSync(
      path.join(dir, "Button", "Button.tsx"),
      "export const Button = React.forwardRef((props, ref) => <button ref={ref} />);",
    );
    assert.ok(
      checkSdkParts(dir).unheld.some((line) =>
        /^Button is listed as passing data-\* on/.test(line),
      ),
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
