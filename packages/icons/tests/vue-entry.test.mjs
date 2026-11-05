/**
 * `@kozmos-ds/icons/vue`: the React entry's icons, as Vue functional components.
 *
 * The Vue entry is the same `src/index.ts`, built with each icon factory and the
 * props type resolved to its `.vue.ts` stand-in (vite.vue.config.mts), so it can
 * only differ from the React entry where a stand-in does. These check that it
 * does not: the same names in both module formats, the same `<svg>` for every
 * icon and for each prop React takes, one icon costing one icon, declarations
 * that name no React, and React's own entry untouched by it (no Vue there).
 *
 * It reads the built package, so build first: `pnpm test` does, through turbo.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const PACKAGE_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(PACKAGE_DIR, "package.json"), "utf8"),
);
const entry = (subpath, condition) =>
  path.join(PACKAGE_DIR, manifest.exports[subpath][condition].default);
const types = (subpath, condition) =>
  path.join(PACKAGE_DIR, manifest.exports[subpath][condition].types);

const requireFromPackage = createRequire(
  path.join(PACKAGE_DIR, "package.json"),
);
const React = requireFromPackage("react");
const { renderToStaticMarkup } = requireFromPackage("react-dom/server");
const Vue = requireFromPackage("vue");
const { renderToString } = requireFromPackage("vue/server-renderer");

let react;
let vue;

before(async () => {
  for (const file of [entry(".", "import"), entry("./vue", "import")]) {
    assert.ok(
      fs.existsSync(file),
      `${path.relative(PACKAGE_DIR, file)} is missing: build the package first (pnpm --filter @kozmos-ds/icons build)`,
    );
  }
  react = await import(pathToFileURL(entry(".", "import")).href);
  vue = await import(pathToFileURL(entry("./vue", "import")).href);
});

const isReactIcon = (value) =>
  value !== null &&
  typeof value === "object" &&
  typeof value.render === "function" &&
  typeof value.displayName === "string";
const isVueIcon = (value) =>
  typeof value === "function" &&
  typeof value.displayName === "string" &&
  value.props !== undefined;

const iconNames = (module, isIcon) =>
  Object.entries(module)
    .filter(([, value]) => isIcon(value))
    .map(([name]) => name)
    .sort();

/**
 * An element tree as text that ignores attribute order, which the two
 * renderers write differently: each tag with its attributes sorted.
 */
function normalise(markup) {
  return markup.replace(/<([a-z]+)((?:\s+[^\s=>]+="[^"]*")*)\s*(\/?)>/g, (_, tag, attrs) => {
    const sorted = [...attrs.matchAll(/([^\s=]+)="([^"]*)"/g)]
      .map(([, name, value]) => `${name}="${value}"`)
      .sort();
    return `<${[tag, ...sorted].join(" ")}>`;
  });
}

const renderReact = (Icon, props = {}) =>
  normalise(renderToStaticMarkup(React.createElement(Icon, props)));

async function renderVue(Icon, props = {}) {
  const app = Vue.createSSRApp({ render: () => Vue.h(Icon, props) });
  return normalise(await renderToString(app));
}

describe("the Vue entry exports what the React entry exports", () => {
  test("the same names, in ESM", () => {
    assert.deepEqual(Object.keys(vue).sort(), Object.keys(react).sort());
  });

  test("the same names, in CommonJS", () => {
    const reactCjs = requireFromPackage(entry(".", "require"));
    const vueCjs = requireFromPackage(entry("./vue", "require"));
    assert.deepEqual(Object.keys(vueCjs).sort(), Object.keys(reactCjs).sort());
    assert.deepEqual(Object.keys(vueCjs).sort(), Object.keys(vue).sort());
  });

  test("every React icon is a Vue icon of the same name", () => {
    const reactIcons = iconNames(react, isReactIcon);
    assert.ok(reactIcons.length > 1000, `only ${reactIcons.length} icons`);
    assert.deepEqual(iconNames(vue, isVueIcon), reactIcons);
    for (const name of reactIcons) {
      assert.equal(vue[name].displayName, react[name].displayName, name);
    }
  });

  test("the registry, the names and the lookups agree", () => {
    assert.deepEqual(vue.kozmosIconNames, react.kozmosIconNames);
    assert.deepEqual(vue.kozmosIconAliases, react.kozmosIconAliases);
    assert.deepEqual(
      vue.kozmosIconNamesBeyondTheLibrary,
      react.kozmosIconNamesBeyondTheLibrary,
    );
    assert.deepEqual(
      Object.keys(vue.kozmosIconRegistry),
      Object.keys(react.kozmosIconRegistry),
    );
    const keys = [
      ...react.kozmosIconNames,
      ...Object.keys(react.kozmosIconAliases),
      ...react.kozmosIconNamesBeyondTheLibrary,
    ];
    for (const key of keys) {
      const reactIcon = react.getIconComponent(key);
      const vueIcon = vue.getIconComponent(key);
      assert.ok(isVueIcon(vueIcon), `${key} is not a Vue icon`);
      assert.equal(vueIcon.displayName, reactIcon.displayName, key);
      assert.equal(vue.isKozmosIconKey(key), true, key);
      assert.equal(
        vue.getIconDefinition(key)?.name,
        react.getIconDefinition(key)?.name,
        key,
      );
    }
    assert.equal(vue.getIconComponent("no-such-icon"), undefined);
    assert.equal(vue.getIconComponent("constructor"), undefined);
  });
});

describe("a Vue icon draws the React icon's <svg>", () => {
  test("every icon, with its defaults", async () => {
    const mismatches = [];
    for (const name of iconNames(react, isReactIcon)) {
      const expected = renderReact(react[name]);
      const actual = await renderVue(vue[name]);
      if (actual !== expected) mismatches.push(name);
    }
    assert.deepEqual(mismatches, [], `${mismatches.length} icons differ`);
  });

  // One of each factory: a library outline, an outline with a fill rule, the
  // package's own outline and taxonomy symbol, a multi-tone symbol, and a
  // solid wayfinding glyph; at each size, and with each prop React takes.
  const SAMPLES = [
    "Check",
    "AlignBottom01",
    "Heart",
    "Utensils",
    "Accessibility",
    "Walking",
    "LocationHeading",
    "LocationFollowing",
    "ElevatorUp",
  ];
  const VARIANTS = [
    ...[16, 20, 24, 28, 32, 48, "1.5rem"].map((size) => ({ size })),
    { size: 20, strokeWidth: 1.5 },
    { size: 20, absoluteStrokeWidth: true },
    { size: 32, strokeWidth: 3, absoluteStrokeWidth: true },
    { color: "#1051e8" },
    { color: "red", size: 18, strokeWidth: "1" },
  ];

  for (const name of SAMPLES) {
    test(`${name} at each size and prop`, async () => {
      for (const props of VARIANTS) {
        assert.equal(
          await renderVue(vue[name], props),
          renderReact(react[name], props),
          `${name} ${JSON.stringify(props)}`,
        );
      }
    });
  }

  test("what a caller adds reaches the <svg>, and wins over the icon's own", async () => {
    const shared = {
      "aria-label": "Done",
      role: "img",
      "data-testid": "done",
      focusable: "false",
      viewBox: "0 0 48 48",
    };
    for (const name of SAMPLES) {
      const reactMarkup = renderReact(react[name], {
        ...shared,
        className: "kozmos-icon",
      });
      const vueMarkup = await renderVue(vue[name], {
        ...shared,
        class: "kozmos-icon",
      });
      assert.equal(vueMarkup, reactMarkup, name);
      assert.match(vueMarkup, /viewBox="0 0 48 48"/, name);
      assert.match(vueMarkup, /class="kozmos-icon"/, name);
    }
  });
});

describe("one Vue icon costs one icon", () => {
  const requireFromVite = createRequire(
    requireFromPackage.resolve("vite/package.json"),
  );
  const { rollup } = requireFromVite("rollup");
  const esbuild = requireFromVite("esbuild");
  let work;

  before(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-icons-vue-"));
  });
  after(() => {
    if (work) fs.rmSync(work, { recursive: true, force: true });
  });

  test("importing Check keeps Check alone, under 2 KB gzip", async () => {
    const input = path.join(work, "consumer.mjs");
    fs.writeFileSync(
      input,
      `import { Check } from "@kozmos-ds/icons/vue";\nconsole.log(Check);\n`,
    );
    const bundle = await rollup({
      input,
      external: (id) => id === "vue",
      onwarn: () => {},
      plugins: [
        {
          name: "resolve-kozmos-icons-vue",
          resolveId(id) {
            if (id !== "@kozmos-ds/icons/vue") return null;
            return {
              id: entry("./vue", "import"),
              moduleSideEffects: manifest.sideEffects !== false,
            };
          },
        },
      ],
    });
    const { output } = await bundle.generate({ format: "es" });
    await bundle.close();
    const code = (
      await esbuild.transform(output.map((chunk) => chunk.code ?? "").join("\n"), {
        minify: true,
        format: "esm",
      })
    ).code;
    const names = iconNames(vue, isVueIcon);
    const kept = names.filter(
      (name) => code.includes(`"${name}"`) || code.includes(`'${name}'`),
    );
    assert.deepEqual(kept, ["Check"]);
    const gzip = gzipSync(code).length / 1024;
    assert.ok(gzip < 2, `one Vue icon is ${gzip.toFixed(2)} KB gzip`);
  });
});

describe("the declarations", () => {
  test("the Vue entry's name no React, and React's no Vue", () => {
    for (const condition of ["import", "require"]) {
      const vueTypes = fs.readFileSync(types("./vue", condition), "utf8");
      assert.doesNotMatch(vueTypes, /from ['"]react/);
      assert.match(vueTypes, /import \{ FunctionalComponent \} from 'vue'/);
      const reactTypes = fs.readFileSync(types(".", condition), "utf8");
      assert.doesNotMatch(reactTypes, /from ['"]vue/);
    }
    for (const condition of ["import", "require"]) {
      const code = fs.readFileSync(entry(".", condition), "utf8");
      assert.doesNotMatch(code, /from ["']vue["']|require\(["']vue["']\)/);
      const vueCode = fs.readFileSync(entry("./vue", condition), "utf8");
      assert.doesNotMatch(vueCode, /from ["']react|require\(["']react/);
    }
  });

  test("a Vue consumer type-checks against them", () => {
    const ts = requireFromPackage("typescript");
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-icons-vue-types-"));
    try {
      const file = path.join(dir, "consumer.ts");
      fs.writeFileSync(
        file,
        [
          `import { h, type FunctionalComponent } from "vue";`,
          `import { Check, Heart, getIconComponent, kozmosIconRegistry, type KozmosIconProps } from "${types("./vue", "import").replace(/\.d\.mts$/, ".mjs")}";`,
          `const props: KozmosIconProps = { size: 20, color: "red", strokeWidth: 1.5, absoluteStrokeWidth: true };`,
          `const icon: FunctionalComponent<KozmosIconProps> = Check;`,
          `h(Heart, { size: "1.5rem", class: "x", "aria-label": "Like" });`,
          `const found = getIconComponent("check");`,
          `if (found) h(found, props);`,
          `h(kozmosIconRegistry["arrow-left"], { size: 24 });`,
          `// @ts-expect-error a React prop has no place here`,
          `const wrong: KozmosIconProps = { className: "x" };`,
          `export { icon, wrong };`,
          "",
        ].join("\n"),
      );
      const program = ts.createProgram([file], {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
        typeRoots: [path.join(PACKAGE_DIR, "node_modules", "@types")],
        baseUrl: PACKAGE_DIR,
        paths: { vue: [path.join(PACKAGE_DIR, "node_modules", "vue")] },
      });
      const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter(
          (d) =>
            !d.file ||
            d.file.fileName === file ||
            d.file.fileName.startsWith(path.join(PACKAGE_DIR, "dist")),
        )
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
      assert.deepEqual(diagnostics, []);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
