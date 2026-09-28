/**
 * Files the site serves from public/ — the photos the examples show, the
 * icons the document links — are addressed through Vite's base, never from
 * the domain's root. On Pages the site lives under a project path, and a
 * a root-absolute media path there asks vodoco.github.io for a file that
 * only exists under /kozmos-design-system/. src/lib/asset.test.ts keeps
 * every such path in the source going through here.
 */

/** Joins a base that ends in "/" with a path from public/. */
export function assetPath(base: string, path: string): string {
  return `${base}${path.replace(/^\/+/, "")}`;
}

/** A file from public/, addressed through the base this build was given. */
export function asset(path: string): string {
  return assetPath(import.meta.env.BASE_URL, path);
}
