import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
import { assetPath } from "./asset";

test("a path from public/ hangs off the base, whatever the base is", () => {
  assert.equal(assetPath("/", "/media/a.svg"), "/media/a.svg");
  assert.equal(
    assetPath("/kozmos-design-system/", "/media/a.svg"),
    "/kozmos-design-system/media/a.svg",
  );
  // Written without its leading slash, or with two, it still joins once.
  assert.equal(assetPath("/base/", "media/a.svg"), "/base/media/a.svg");
  assert.equal(assetPath("/base/", "//media/a.svg"), "/base/media/a.svg");
});

/** Every .ts and .tsx under src/, so the scan below cannot miss a new file. */
function sources(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

test("no source addresses a file in public/ from the domain's root", () => {
  // A subpath deploy would 404 on each of these: they must go through
  // asset(). This file names the pattern, so it excludes itself.
  const offenders = sources("src")
    .filter((path) => path !== join("src", "lib", "asset.test.ts"))
    .flatMap((path) => {
      const lines = readFileSync(path, "utf8").split("\n");
      return (
        lines
          .map((line, index) => ({ line, number: index + 1 }))
          // What asset() is already given is the right way to write it; the
          // scan reads the rest of the line.
          .filter(({ line }) =>
            line
              .replace(/asset\((["'])[^"']*\1\)/g, "asset()")
              .match(/["'`(]\/(media|favicon|apple-)/),
          )
          .map(({ line, number }) => `${path}:${number}: ${line.trim()}`)
      );
    });
  assert.deepEqual(offenders, []);
});
