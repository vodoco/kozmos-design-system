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
const IMPORT = 'import { DensityScope } from "../../theme/DensityScope";';
const part = (body, before = "") => `
import React from "react";
${IMPORT}
${before}
export const Part = React.forwardRef((props, ref) => {
  ${body}
});`;
const scope = (child, attributes = 'density="touch" asChild') =>
  `<DensityScope ${attributes}>${child}</DensityScope>`;
const problems = (body, before) => checkComponent(part(body, before), "Part");

test("a touch DensityScope around one intrinsic element holds the root", () => {
  assert.deepEqual(problems(`return ${scope("<div ref={ref} />")};`), []);
  assert.deepEqual(
    problems(
      `return ${scope("<section />", 'density="touch" asChild={true}')};`,
    ),
    [],
  );
});

test("asChild must be bare or {true}", () => {
  assert.match(
    problems(
      `return ${scope("<div />", 'density="touch" asChild={false}')};`,
    )[0],
    /asChild=\{false\}/,
  );
  assert.match(
    problems(
      `return ${scope("<div />", 'density="touch" asChild={wrap}')};`,
    )[0],
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
  assert.deepEqual(problems(`return ${scope("{/* the root */}<div />")};`), []);
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
      `${IMPORT}\nexport function Panel() { return ${scope("<div />")}; }\nexport const PANEL_SIZE = 4;`,
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

// Every way a render returns is held: each side of a ternary, the right of
// an &&, every return, and a part of the same file followed into its own
// render. The review of 16 Oct found that a mutation dropping any one of
// these passed every test.
test("every path a render returns is held", () => {
  assert.match(
    problems(`return open ? ${scope("<div />")} : <span />;`)[0],
    /returns <span>/,
  );
  assert.match(
    problems(`return open ? <span /> : ${scope("<div />")};`)[0],
    /returns <span>/,
  );
  assert.match(problems(`return open && <span />;`)[0], /returns <span>/);
  assert.match(
    problems(`if (open) return <span />;\n  return ${scope("<div />")};`)[0],
    /returns <span>/,
  );
  assert.match(
    problems(`if (open) return ${scope("<div />")};\n  return <span />;`)[0],
    /returns <span>/,
  );
  // A callback's return is the callback's, not the render's.
  assert.deepEqual(
    problems(
      `const items = list.map((item) => {\n    return <li key={item} />;\n  });\n  return ${scope("<ul />")};`,
    ),
    [],
  );
});

test("a part of the same file is read, and its names are its own", () => {
  assert.match(
    problems(`return <Body />;`, "function Body() { return <section />; }")[0],
    /returns <section>/,
  );
  assert.deepEqual(
    problems(
      `return open ? <Body /> : <Body />;`,
      `function Body() { return ${scope("<section />")}; }`,
    ),
    [],
  );
  // The same name in two renders is two names: the part's root, followed,
  // does not stand for Body's.
  assert.match(
    problems(
      `const root = ${scope("<div />")};\n  return open ? root : <Body />;`,
      "function Body() { const root = <section />; return root; }",
    ).join("\n"),
    /returns <section>/,
  );
});

test("a DensityScope is the one imported, and nothing on it can override it", () => {
  // A local stand-in of the same name is not Kozmos's: it is read as any
  // part of the file is, and it holds no root.
  assert.notDeepEqual(
    checkComponent(
      `function DensityScope({ children }) { return children; }
export const Part = () => ${scope("<div />")};`,
      "Part",
    ),
    [],
  );
  // Renamed on import, it is still the scope.
  assert.deepEqual(
    checkComponent(
      `import { DensityScope as Scope } from "../../theme/DensityScope";
export const Part = () => <Scope density="touch" asChild><div /></Scope>;`,
      "Part",
    ),
    [],
  );
  assert.deepEqual(
    problems(`return ${scope("<div />", 'density={"touch"} asChild')};`),
    [],
  );
  assert.match(
    problems(
      `return ${scope("<div />", 'density="touch" asChild {...scopeProps}')};`,
    )[0],
    /spread/,
  );
});

test("a bare hidden is trusted only on a plain intrinsic element", () => {
  assert.match(
    problems(`return <>{${scope("<div />")}}<Panel hidden /></>;`)[0],
    /returns <Panel>/,
  );
  assert.match(
    problems(
      `return <>{${scope("<div />")}}<div hidden className="flex" /></>;`,
    )[0],
    /returns <div>/,
  );
});

test("what a render can't hold anything in is no problem", () => {
  assert.deepEqual(
    problems(`if (!open) return false;\n  return ${scope("<div />")};`),
    [],
  );
  assert.deepEqual(
    problems(`if (!open) return undefined;\n  return ${scope("<div />")};`),
    [],
  );
  assert.deepEqual(
    problems(`return (${scope("<div />")}) as React.ReactElement;`),
    [],
  );
  assert.deepEqual(problems(`return ${scope("<div />")}!;`), []);
});

test("memo's render is its first argument, never its comparator", () => {
  assert.match(
    checkComponent(
      `${IMPORT}
const Inner = () => <section />;
export const Part = React.memo(Inner, () => true);`,
      "Part",
    )[0],
    /returns <section>/,
  );
});

test("an SDK directory changes no density inside its parts, in any file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdk-density-"));
  try {
    for (const name of ["Button", "Card"])
      fs.cpSync(path.join(COMPONENTS, name), path.join(dir, name), {
        recursive: true,
      });
    const panel = path.join(dir, "Panel");
    fs.mkdirSync(path.join(panel, "parts"), { recursive: true });
    fs.writeFileSync(
      path.join(panel, "Panel.stories.tsx"),
      'export default { title: "SDK/Panel" };',
    );
    fs.writeFileSync(
      path.join(panel, "index.ts"),
      'export * from "./Panel";\n',
    );
    const write = (body) =>
      fs.writeFileSync(
        path.join(panel, "Panel.tsx"),
        `${IMPORT}\nexport function Panel() { return ${scope(`<div>${body}</div>`)}; }`,
      );
    const unheld = () => checkSdkParts(dir).unheld.join("\n");
    write("");
    assert.doesNotMatch(unheld(), /Panel:/);
    write('<DensityScope density="compact"><span /></DensityScope>');
    assert.match(unheld(), /Panel\.tsx sets density "compact" inside the part/);
    write('<ThemeProvider density="compact"><span /></ThemeProvider>');
    assert.match(unheld(), /Panel\.tsx sets density "compact" inside the part/);
    write("");
    fs.writeFileSync(
      path.join(panel, "parts", "Row.tsx"),
      'export const Row = () => <div {...{ "data-kozmos-density": "compact" }} />;',
    );
    assert.match(unheld(), /parts\/Row\.tsx marks a density by hand/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("an export the check can't read is named, never skipped", () => {
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
      path.join(panel, "Panel.tsx"),
      `${IMPORT}\nexport function Panel() { return ${scope("<div />")}; }\nexport const POI = () => <section />;\nconst Inner = () => <aside />;\nexport { Inner as Renamed };`,
    );
    for (const [index, expected] of [
      ['export * from "./Panel";', /Panel: POI returns <section>/],
      ['export * from "./Panel";', /Panel: Renamed returns <aside>/],
      [
        'export * as Parts from "./Panel";',
        /Panel: an export it can't read: export \* as Parts/,
      ],
      [
        'export { default } from "./Panel";',
        /Panel: an export it can't read: export \{ default \}/,
      ],
    ]) {
      fs.writeFileSync(path.join(panel, "index.ts"), index + "\n");
      assert.match(checkSdkParts(dir).unheld.join("\n"), expected, index);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a component listed as passing data-* on spreads its own props", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sdk-density-"));
  try {
    fs.cpSync(path.join(COMPONENTS, "Card"), path.join(dir, "Card"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(dir, "Button"));
    fs.writeFileSync(
      path.join(dir, "Button", "Button.tsx"),
      'export const Button = React.forwardRef((props, ref) => { const aria = { role: "button" }; return <button ref={ref} {...aria} />; });',
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
