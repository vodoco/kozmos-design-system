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
