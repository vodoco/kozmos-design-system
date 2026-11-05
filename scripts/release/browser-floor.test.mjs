import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// Styles builds the stylesheet for its own browserslist, and react's build and
// two of its checks (check-direction-rules, check-scoped-utilities) read
// react's. React ships styles' file, so the two lists are one floor: a list
// raised in one package and not the other would ship CSS built for browsers
// react's JavaScript and checks no longer agree with.
const root = fileURLToPath(new URL("../../", import.meta.url));
const manifests = fs
  .readdirSync(path.join(root, "packages"), { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isDirectory() &&
      fs.existsSync(path.join(root, "packages", entry.name, "package.json")),
  )
  .map((entry) =>
    JSON.parse(
      fs.readFileSync(
        path.join(root, "packages", entry.name, "package.json"),
        "utf8",
      ),
    ),
  );

/** The packages that declare a browserslist, by name, as one list each. */
export function browserFloors(packages) {
  return Object.fromEntries(
    packages
      .filter((manifest) => manifest.browserslist !== undefined)
      .map((manifest) => [manifest.name, [manifest.browserslist].flat()]),
  );
}

/** Throws unless every declared floor is the same list, and react and styles both declare one. */
export function assertOneFloor(packages) {
  const floors = browserFloors(packages);
  for (const name of ["@kozmos-ds/react", "@kozmos-ds/styles"])
    assert.ok(name in floors, `${name} declares no browserslist`);
  const [first, ...rest] = Object.entries(floors);
  for (const [name, list] of rest)
    assert.deepEqual(
      list,
      first[1],
      `${name}'s browserslist differs from ${first[0]}'s: they build one stylesheet`,
    );
}

test("every package that declares a browser floor declares the same one", () => {
  assertOneFloor(manifests);
});

test("a floor raised in one package and not the other fails", () => {
  const raised = manifests.map((manifest) =>
    manifest.name === "@kozmos-ds/styles"
      ? {
          ...manifest,
          browserslist: ["chrome >= 120", ...manifest.browserslist.slice(1)],
        }
      : manifest,
  );
  assert.throws(
    () => assertOneFloor(raised),
    /@kozmos-ds\/styles's browserslist differs/,
  );
  const dropped = manifests.map((manifest) =>
    manifest.name === "@kozmos-ds/styles"
      ? { ...manifest, browserslist: undefined }
      : manifest,
  );
  assert.throws(
    () => assertOneFloor(dropped),
    /@kozmos-ds\/styles declares no browserslist/,
  );
});
