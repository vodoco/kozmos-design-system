import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import semver from "semver";

/**
 * Every Vue `@kozmos-ds/vue` admits must be one every package it installs
 * admits: reka-ui 2.11.0 takes Vue 3.4, but its `@vueuse/core` and
 * `@vueuse/shared` 14.4 need 3.5. Read from what is installed, so a new
 * dependency's floor shows up here.
 */
const MANIFEST = path.resolve(__dirname, "../package.json");

function vuePeersBelow(): { name: string; range: string }[] {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const seen = new Map<string, { name: string; range?: string }>();
  const visit = (name: string, from: string) => {
    let file: string;
    try {
      file = createRequire(from).resolve(`${name}/package.json`);
    } catch {
      return;
    }
    if (seen.has(file)) return;
    const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
    seen.set(file, {
      name: `${pkg.name}@${pkg.version}`,
      range: pkg.peerDependencies?.vue,
    });
    for (const dependency of Object.keys(pkg.dependencies ?? {}))
      visit(dependency, file);
  };
  for (const dependency of Object.keys(manifest.dependencies ?? {}))
    visit(dependency, MANIFEST);
  return [...seen.values()]
    .filter((entry): entry is { name: string; range: string } => !!entry.range)
    .map(({ name, range }) => ({ name, range }));
}

describe("the Vue peer range", () => {
  const ours = JSON.parse(fs.readFileSync(MANIFEST, "utf8")).peerDependencies
    .vue as string;
  const peers = vuePeersBelow();

  it("reads the Vue peers of what it installs", () => {
    expect(
      peers.map((peer) => peer.name.split("@").slice(0, -1).join("@")),
    ).toEqual(expect.arrayContaining(["reka-ui", "@vueuse/core"]));
  });

  it("admits no Vue a dependency refuses", () => {
    const refused = peers
      .filter((peer) => !semver.subset(ours, peer.range))
      .map(
        (peer) =>
          `${peer.name} needs vue ${peer.range}, and ${ours} admits less`,
      );
    expect(refused).toEqual([]);
  });
});
