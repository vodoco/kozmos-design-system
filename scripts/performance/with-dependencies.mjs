// What one import costs an app that uses it alone, its dependencies counted
// (the owner's ruling of 27 Nov 2026). React's parts lean on Radix and
// floating-ui, Vue's on Reka UI and on code of their own, so a count that
// leaves every bare import out reads Vue's behaviour and not React's. Here
// only the frameworks every app already has are left out: React, ReactDOM and
// Vue (with the @vue/* packages Vue is made of). Everything else an import
// reaches is bundled as a Vite app's production build bundles it: Rollup,
// each import resolved with Vite's production conditions (`module`,
// `browser`, `production`, then `import` and `default`; esbuild's resolver,
// which reads `exports`, `module` and `browser` as Vite's does), each file's
// package `sideEffects` declaration honoured, and `process.env.NODE_ENV`
// replaced before tree-shaking; then minified with esbuild and gzipped, as
// the analyzer's other lines are.
//
// Rollup, not esbuild, bundles: esbuild takes an object spread in a
// component's options (`props: { ...POPPER_PROPS }`) to have side effects and
// keeps every Vue part of a module once one is imported (KozmosTooltipProvider
// alone read 1.48 KB more than Rollup keeps), which no Vite build does.
//
// The sibling packages count as any dependency does: @kozmos-ds/icons (and
// ./vue) to the icons a part imports, since each icon is a pure call in a
// package free of side effects (a part that looks icons up by name imports
// the registry, and pays for it); @kozmos-ds/product-contracts and
// @kozmos-ds/tokens to what a part reads from them. Stylesheets are not
// JavaScript: the built parts import none, and one imported would count
// nothing here (the stylesheet is measured whole, on its own line).
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { gzipSync } from "node:zlib";

/** The frameworks an app has before it adds Kozmos: never counted. */
export const FRAMEWORKS = ["react", "react-dom", "vue"];

/** @param {string} id an import as written */
export function isFramework(id) {
  return (
    FRAMEWORKS.some((name) => id === name || id.startsWith(`${name}/`)) ||
    id.startsWith("@vue/")
  );
}

/** The npm package a file belongs to, or the Kozmos package it is built in. */
export function ownerOf(file) {
  const parts = file.split(/[\\/]node_modules[\\/]/);
  if (parts.length > 1) {
    const tail = parts[parts.length - 1].split(/[\\/]/);
    return tail[0].startsWith("@") ? `${tail[0]}/${tail[1]}` : tail[0];
  }
  const kozmos = /(?:^|[\\/])packages[\\/]([^\\/]+)[\\/]/.exec(file);
  return kozmos ? `@kozmos-ds/${kozmos[1]}` : "(the app)";
}

const APP = "\0kozmos-app";
const CONDITIONS = ["module", "browser", "production"];
const DEFINE = { "process.env.NODE_ENV": '"production"' };
const frameworksExternal = {
  name: "kozmos-frameworks-external",
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, (args) =>
      isFramework(args.path) ? { path: args.path, external: true } : undefined,
    );
  },
};

function typeOf(file) {
  for (let dir = path.dirname(file); ; dir = path.dirname(dir)) {
    const manifest = path.join(dir, "package.json");
    if (fs.existsSync(manifest))
      return JSON.parse(fs.readFileSync(manifest, "utf8")).type;
    if (path.dirname(dir) === dir) return undefined;
  }
}

/**
 * A CommonJS file, which a Vite build reads through its CommonJS plugin:
 * here esbuild turns it into a module with its named exports (as read by
 * requiring it), and it is counted whole, as that plugin keeps it.
 * use-sync-external-store's shim, under Radix, is one.
 */
export function isCommonJs(file, code) {
  if (file.endsWith(".mjs")) return false;
  if (!file.endsWith(".cjs") && typeOf(file) === "module") return false;
  return (
    /\b(?:module\.exports|exports\.[\w$]+\s*=|require\()/.test(code) &&
    !/^\s*(?:import|export)\b/m.test(code)
  );
}

/**
 * @param {object} tools
 * @param {(options: Record<string, unknown>) => Promise<any>} tools.rollup
 * @param {{ context(options: Record<string, unknown>): Promise<any>, build(options: Record<string, unknown>): Promise<any>, transform(code: string, options: Record<string, unknown>): Promise<{ code: string }> }} tools.esbuild
 * @param {unknown[]} [tools.plugins] Rollup plugins every build runs (the
 *   analyzer's `process.env.NODE_ENV` replacement)
 */
export async function createDependencyCost({ rollup, esbuild, plugins = [] }) {
  /** @type {(path: string, options: Record<string, unknown>) => Promise<any>} */
  let resolve = async () => {
    throw new Error("esbuild's resolver is not ready");
  };
  const resolver = await esbuild.context({
    stdin: { contents: "" },
    write: false,
    platform: "browser",
    conditions: CONDITIONS,
    logLevel: "silent",
    plugins: [
      {
        name: "kozmos-resolver",
        setup(build) {
          resolve = build.resolve;
        },
      },
    ],
  });
  await resolver.rebuild();
  // Its own cache: these builds resolve and shake differently from the
  // analyzer's, and a cache carries a module's side effects with it.
  let cache;

  /**
   * @param {string} source the app's module, e.g. `import { X } from "…"; console.log(X);`
   * @param {string} resolveDir where the app's own bare imports resolve from
   * @returns {Promise<{ raw: number, gzip: number, code: string, by: Record<string, number>, modules: string[] }>}
   *   minified and gzipped bytes, the minified code, Rollup's rendered bytes
   *   by package, and every module bundled
   */
  async function cost(source, resolveDir) {
    const bundle = await rollup({
      input: APP,
      cache,
      onwarn: () => {},
      plugins: [
        {
          name: "kozmos-with-dependencies",
          async resolveId(id, importer, options) {
            if (id === APP) return { id: APP, moduleSideEffects: true };
            if (isFramework(id)) return { id, external: true };
            const result = await resolve(id, {
              kind: options?.isEntry
                ? "entry-point"
                : options?.kind === "dynamic-import"
                  ? "dynamic-import"
                  : "import-statement",
              resolveDir:
                importer && importer !== APP
                  ? path.dirname(importer)
                  : resolveDir,
            });
            if (result.errors.length)
              throw new Error(
                `cannot resolve ${id} from ${importer}: ${result.errors[0].text}`,
              );
            return {
              id: result.path,
              external: result.external,
              moduleSideEffects: result.sideEffects !== false,
            };
          },
          async load(id) {
            if (id === APP) return source;
            const code = fs.readFileSync(id, "utf8");
            if (!isCommonJs(id, code)) return code;
            let names = [];
            try {
              names = Object.keys(createRequire(id)(id)).filter(
                (name) => name !== "default" && /^[A-Za-z_$][\w$]*$/.test(name),
              );
            } catch {
              // no named exports, then: the default one still counts it
            }
            const converted = await esbuild.build({
              stdin: {
                contents: `import m from ${JSON.stringify(id)}; export default m;${
                  names.length
                    ? ` export const { ${names.join(", ")} } = m;`
                    : ""
                }`,
                resolveDir: path.dirname(id),
                loader: "js",
              },
              bundle: true,
              write: false,
              format: "esm",
              platform: "browser",
              conditions: CONDITIONS,
              define: DEFINE,
              logLevel: "silent",
              plugins: [frameworksExternal],
            });
            return converted.outputFiles[0].text;
          },
        },
        ...plugins,
      ],
    });
    cache = bundle.cache;
    const { output } = await bundle.generate({ format: "es" });
    const code = output.map((chunk) => chunk.code ?? "").join("\n");
    const minified = (
      await esbuild.transform(code, {
        minify: true,
        format: "esm",
        define: DEFINE,
      })
    ).code;
    /** @type {Record<string, number>} */
    const by = {};
    const modules = [];
    for (const chunk of output)
      for (const [id, { renderedLength }] of Object.entries(
        chunk.modules ?? {},
      )) {
        modules.push(id);
        if (!renderedLength) continue;
        const owner = id === APP ? "(the app)" : ownerOf(id);
        by[owner] = (by[owner] ?? 0) + renderedLength;
      }
    return {
      raw: Buffer.byteLength(minified),
      gzip: gzipSync(minified).length,
      code: minified,
      by,
      modules,
    };
  }

  return { cost, dispose: () => resolver.dispose() };
}
