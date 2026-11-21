import path from "node:path";

/**
 * What a package's tarball may contain at all, by kind: check-package-install.mjs
 * fails a tarball carrying anything else. FORBIDDEN there names the leaks we
 * know about; this catches the ones nobody thought to name (a stats.html from
 * a bundle analyser, a stray .ts source, an image).
 *
 * THIRD-PARTY-NOTICES carries the licences of what a package's build copies
 * into it (React's stylesheets hold Tailwind CSS's preflight and utilities).
 *
 * A `package.json` one folder down ships only where that folder is a subpath
 * the package's `exports` names: icons' `vue/package.json` points a resolver
 * that ignores `exports` (TypeScript's node10) at `@kozmos-ds/icons/vue`'s
 * files. Anywhere else, `dist/package.json` or `build/package.json`, it would
 * change how the files beside it resolve, so it fails. From 5 Nov until this
 * rule, any folder's passed.
 */
const ALLOWED_KINDS =
  /^package\/(package\.json|README\.md|LICENSE|THIRD-PARTY-NOTICES)$|\.(d\.ts|d\.mts|d\.cts|mjs|cjs|js|map|css|swift|kt|xml)$/;

/** The folders a package's `exports` keys name: `./vue` names `vue`. */
export function subpathFolders(manifest) {
  return Object.keys(manifest.exports ?? {})
    .map((key) => /^\.\/([a-z0-9-]+)$/.exec(key)?.[1])
    .filter(Boolean);
}

export function unexpectedFiles(files, manifest) {
  const redirects = new Set(
    subpathFolders(manifest).map((folder) => `package/${folder}/package.json`),
  );
  return files.filter(
    (entry) => !ALLOWED_KINDS.test(entry) && !redirects.has(entry),
  );
}

/**
 * The packages whose tarball must hold exactly what their `exports` reach:
 * @kozmos-ds/vue, from its first `next` (the owner's plan of 19-20 Nov 2026).
 * Its build once emitted a declaration map per .d.ts, each pointing at
 * ../src, which the tarball does not carry.
 */
export const EXACT_TARBALLS = ["@kozmos-ds/vue"];

/** Files any package ships whatever its exports say. */
const ALWAYS = ["package/package.json", "package/README.md", "package/LICENSE"];
const CODE = /\.(d\.[cm]?ts|[cm]?js)$/;

/** Every file path an exports map (and main, module, types) names. */
function exportTargets(manifest) {
  const targets = [];
  const walk = (value) => {
    if (typeof value === "string") targets.push(value);
    else if (value && typeof value === "object")
      Object.values(value).forEach(walk);
  };
  walk(manifest.exports);
  for (const field of ["main", "module", "types"])
    if (typeof manifest[field] === "string") targets.push(manifest[field]);
  return targets
    .filter((target) => !target.includes("*"))
    .map((target) => path.posix.join("package", target));
}

/** The relative paths a module or declaration imports, exports from or requires. */
function relativeImports(text) {
  return [
    ...text.matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["'](\.\.?\/[^"']+)["']/g,
    ),
  ].map((match) => match[1]);
}

/** The tarball file `specifier` names from `file`, as Node or TypeScript resolves it. */
function resolveIn(files, file, specifier) {
  const base = path.posix.join(path.posix.dirname(file), specifier);
  const declaration = /\.d\.[cm]?ts$/.test(file);
  const candidates = declaration
    ? [
        base.replace(/\.([cm]?)js$/, ".d.$1ts"),
        `${base}.d.ts`,
        `${base}/index.d.ts`,
        base,
      ]
    : [base, `${base}.mjs`, `${base}.cjs`, `${base}.js`];
  return candidates.find((candidate) => files.has(candidate)) ?? null;
}

/**
 * What a tarball holds beyond what its exports reach (`unreachable`), what an
 * export or an import names that it lacks (`missing`), and every source map in
 * it (`maps`). `files` are tar paths (`package/...`); `read(file)` returns a
 * file's text. Imports are followed from each export target through every
 * module and declaration, so dist/esm's modules, the CommonJS chunks and the
 * declarations count only when something a consumer resolves reaches them.
 */
export function exportClosure(files, manifest, read) {
  const present = new Set(files);
  const reached = new Set(ALWAYS.filter((file) => present.has(file)));
  const missing = new Set();
  const queue = exportTargets(manifest);
  // A subpath's own package.json (subpathFolders), for a resolver that
  // ignores `exports`, ships with the files it names.
  for (const folder of subpathFolders(manifest)) {
    const redirect = `package/${folder}/package.json`;
    if (!present.has(redirect)) continue;
    reached.add(redirect);
    const fields = JSON.parse(read(redirect) ?? "{}");
    for (const field of ["main", "module", "types"])
      if (typeof fields[field] === "string")
        queue.push(path.posix.join("package", folder, fields[field]));
  }
  const follow = () => {
    while (queue.length) {
      const file = queue.shift();
      if (reached.has(file)) continue;
      if (!present.has(file)) {
        missing.add(file);
        continue;
      }
      reached.add(file);
      if (!CODE.test(file)) continue;
      for (const specifier of relativeImports(read(file) ?? "")) {
        const target = resolveIn(present, file, specifier);
        if (target) queue.push(target);
        else missing.add(path.posix.join(path.posix.dirname(file), specifier));
      }
    }
  };
  follow();
  // A declaration ships with the module it declares, though no other
  // declaration names it (vue-tsc emits one per module, and the public ones
  // inline what they take): dist/<p>.d.ts declares dist/<p>.mjs, .cjs or .js,
  // or the ES build's dist/esm/<p>.mjs.
  for (let grew = true; grew; ) {
    grew = false;
    for (const file of files) {
      const match = /^package\/dist\/(.+)\.d\.[cm]?ts$/.exec(file);
      if (!match || reached.has(file)) continue;
      const twins = ["mjs", "cjs", "js"]
        .map((extension) => `package/dist/${match[1]}.${extension}`)
        .concat(`package/dist/esm/${match[1]}.mjs`);
      if (twins.some((twin) => reached.has(twin))) {
        queue.push(file);
        grew = true;
      }
    }
    follow();
  }
  const maps = files.filter((file) => file.endsWith(".map"));
  return {
    unreachable: files.filter(
      (file) => !reached.has(file) && !file.endsWith(".map"),
    ),
    missing: [...missing],
    maps,
  };
}
