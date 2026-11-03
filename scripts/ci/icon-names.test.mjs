// The registry's rules, each broken on the real sources and each refusal read
// back: a green `pnpm icons:names:check` says nothing unless the check can fail.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findProblems, readFiles } from "../check-icon-names.mjs";

const files = readFiles();

/** The real sources with one replacement, which must have found its text. */
function broken(key, from, to) {
  assert.ok(files[key].includes(from), `no "${from}" in ${key}`);
  return { ...files, [key]: files[key].replace(from, to) };
}

const refused = (changed, pattern) => {
  const { problems } = findProblems(changed);
  assert.ok(
    problems.some((problem) => pattern.test(problem)),
    `nothing matched ${pattern}: ${problems.join(" | ") || "no problems"}`,
  );
};

test("the sources as they stand break no rule", () => {
  assert.deepEqual(findProblems(files).problems, []);
});

test("an alias that resolves to nothing is refused", () => {
  refused(
    broken("registry", '  add: "plus",', '  add: "pluss",'),
    /the alias add stands for pluss, which draws nothing/,
  );
});

test("an alias may stand for a name beyond the library", () => {
  const web = findProblems(files).web;
  assert.ok(web.beyond.includes("route-entrance-exit"));
  assert.ok(
    web.aliases.some(
      ([alias, target]) =>
        alias === "entrance-exit" && target === "route-entrance-exit",
    ),
  );
});

test("an alias spelled like a name is refused: it would take the name's place", () => {
  refused(
    broken("registry", '  add: "plus",', '  add: "plus",\n  plane: "bus",'),
    /the alias plane takes the place of the name plane/,
  );
});

test("a name with no definition, or a lookup that disagrees with its definition, is refused", () => {
  refused(
    broken(
      "registry",
      'export const kozmosIconNames = [\n  "activity",',
      'export const kozmosIconNames = [\n  "activity",\n  "train",',
    ),
    /train is in kozmosIconNames with no definition/,
  );
  refused(
    broken("registry", '  "beaker-01": Beaker01,', '  "beaker-01": Plane,'),
    /the lookup draws beaker-01 with Plane, and its definition with Beaker01/,
  );
});

test("a name SwiftUI does not draw is refused, wherever SwiftUI draws it from", () => {
  refused(
    broken("swiftGenerated", 'case "plane": return', 'case "plane-x": return'),
    /SwiftUI does not draw plane/,
  );
  refused(
    broken("swiftIcon", 'case "wifi": return "wifi"', ""),
    /SwiftUI does not draw wifi/,
  );
  refused(
    broken("swiftGlyph", '"elevator-up": "lift-up", ', ""),
    /SwiftUI does not draw elevator-up/,
  );
});

test("a name Compose does not draw is refused, wherever Compose draws it from", () => {
  refused(
    broken("kotlinGenerated", '"plane" -> Plane', '"plane-x" -> Plane'),
    /Compose does not draw plane/,
  );
  refused(
    broken("kotlinIcon", '"wifi" -> Icons.Default.Wifi', ""),
    /Compose does not draw wifi/,
  );
});

test("a name only a native draws is refused", () => {
  refused(
    broken(
      "kotlinGenerated",
      '"plane" -> Plane',
      '"plane" -> Plane\n        "train" -> Plane',
    ),
    /Compose draws train, which the web does not know/,
  );
  refused(
    broken(
      "swiftGenerated",
      'case "plane": return',
      'case "train": return ["M1 1"]\n        case "plane": return',
    ),
    /SwiftUI draws train, which the web does not know/,
  );
});

test("a platform's aliases are the web's, one for one", () => {
  refused(
    broken(
      "swiftGenerated",
      'case "atm": return "credit-card-01"',
      'case "atm": return "wifi"',
    ),
    /SwiftUI reads the alias atm as wifi, the web as credit-card-01/,
  );
  refused(
    broken("kotlinGenerated", '"atm" -> "credit-card-01"', ""),
    /Compose reads the alias atm as nothing, the web as credit-card-01/,
  );
  refused(
    broken(
      "kotlinGenerated",
      '"atm" -> "credit-card-01"',
      '"atm" -> "credit-card-01"\n        "bank" -> "credit-card-01"',
    ),
    /Compose has the alias bank, which the web does not/,
  );
});
