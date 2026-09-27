/**
 * The product contracts, compared across the three platforms.
 *
 * `@kozmos-ds/product-contracts`, `ProductContracts.swift` and
 * `ProductContracts.kt` are the same contract written three times. Nothing
 * compared them until now, and the drift that found was not theoretical: on
 * 2026-09-25 the web had `POIResultMatch`, `SearchResponsePresentation`,
 * `SearchEmptyKind`, `unitLabel` and `nameLanguage`, and optional
 * `floorId`/`floorLabel`, and NONE of it existed on iOS or Android - while the
 * changeset shipping it said "on all three platforms". Three of the four rows
 * it claimed were web-only.
 *
 * What is compared, and why each matters:
 *
 *   - the set of types, so a contract cannot be added to one platform alone;
 *   - the field names of every shared struct, so a platform cannot quietly
 *     lack one;
 *   - whether each field is OMITTABLE - can a caller leave it out? That is
 *     the contract a caller actually experiences, and it is the one that
 *     broke: a required `floorLabel` forces a single-storey venue to invent
 *     one, which is the exact noise row 9 removed on the web and nowhere
 *     else. Omittable means `?` on the web, and a DEFAULT in the initialiser
 *     on Swift and Kotlin - `disabled: Bool = false` is the native way to
 *     write `disabled?: boolean`, and flagging it would be noise. Compared in
 *     one direction: a web field that may be omitted must be omittable
 *     natively too. The reverse is a language difference, since a TypeScript
 *     interface cannot carry a default at all. What this does NOT compare is
 *     nullability beyond that, or the types themselves;
 *   - the VALUES of every shared enumeration, compared as strings, because
 *     Swift writes `case openingSoon` and Kotlin `OpeningSoon("openingSoon")`
 *     and only the wire value is the contract.
 *
 * Types that are legitimately one platform's own are listed in WEB_ONLY with
 * the reason. Adding a name there is a decision, not a silence: it has to be
 * written down and it shows up in review.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const WEB = "packages/product-contracts/src/index.ts";
const IOS = "packages/ios/Sources/ProductContracts/ProductContracts.swift";
const DROID = "packages/android/src/main/java/com/kozmos/contracts/ProductContracts.kt";

/**
 * Web types with no native counterpart, each for a stated reason. A native
 * platform that grows one of these should lose its entry here, not keep it.
 */
const WEB_ONLY = new Map([
  ["AdaptiveMapLayout", "the web shell's own geometry; SwiftUI and Compose lay the panel out themselves"],
  ["AdaptiveMapLayoutSnapshot", "as AdaptiveMapLayout"],
  ["MapLayoutRect", "as AdaptiveMapLayout"],
  ["MapOcclusion", "as AdaptiveMapLayout"],
  ["MapPanelPresentation", "as AdaptiveMapLayout"],
  ["POIDetailsPresentation", "the web detail panel's view model; the native panels take a POIPresentation directly"],
  ["POIDetailSummary", "as POIDetailsPresentation"],
  ["POIDetailAttributeGroup", "as POIDetailsPresentation"],
  ["POIOpeningHoursPresentation", "as POIDetailsPresentation"],
  ["POISupplementaryAction", "as POIDetailsPresentation"],
]);

/** Native types with no web counterpart, each for a stated reason. */
const NATIVE_ONLY = new Map([
  ["POILogoPresentation", "the web declares the logo inline on POIPresentation; Swift and Kotlin need a named type for it"],
]);

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

// ---------------------------------------------------------------- web

const web = read(WEB);

function webInterfaces(source) {
  const out = new Map();
  const re = /^export interface (\w+)[^{]*\{$/gm;
  let m;
  while ((m = re.exec(source))) {
    const start = re.lastIndex;
    const end = source.indexOf("\n}", start);
    const body = source.slice(start, end);
    out.set(m[1], webFields(body));
  }
  return out;
}

/** Field names and optionality, with comments and nested literals removed. */
function webFields(body) {
  const flat = body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    // a nested object literal is one field's type, not a set of fields
    .replace(/\{[^{}]*\}/g, "OBJECT");
  const out = new Map();
  for (const line of flat.split("\n")) {
    const m = /^\s{2}(\w+)(\?)?:/.exec(line);
    if (m) out.set(m[1], Boolean(m[2]));
  }
  return out;
}

function webEnums(source) {
  const raw = new Map();
  const re = /^export type (\w+) =([\s\S]*?);$/gm;
  let m;
  while ((m = re.exec(source))) {
    const body = m[2].replace(/\/\*[\s\S]*?\*\//g, "");
    if (/\b(readonly|=>|\[\])|\{/.test(body)) continue; // not an enumeration
    raw.set(m[1], body);
  }
  // `POIResultAction = POIAction | "details"` is one enumeration to a native
  // platform, which flattens it. Resolve the references so the comparison is
  // between the same set of wire values, not between a literal and a name.
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) return [];
    seen.add(name);
    const body = raw.get(name);
    if (body === undefined) return [];
    const values = [...body.matchAll(/"([^"]+)"/g)].map((v) => v[1]);
    for (const ref of body.matchAll(/(?:^|\|)\s*([A-Z]\w+)\s*(?=\||$)/gm))
      values.push(...resolve(ref[1], seen));
    return values;
  };
  const out = new Map();
  for (const name of raw.keys()) {
    const values = resolve(name);
    if (values.length) out.set(name, [...new Set(values)].sort());
  }
  return out;
}

// ---------------------------------------------------------------- swift

const ios = read(IOS);

function swiftStructs(source) {
  const out = new Map();
  const re = /^public struct Kozmos(\w+)[^{]*\{$/gm;
  let m;
  while ((m = re.exec(source))) {
    const start = re.lastIndex;
    const end = source.indexOf("\n}", start);
    const body = source.slice(start, end);
    // Stored properties name the fields; the initialiser says which may be
    // left out. Swift puts the default on the parameter, never on the `let`.
    const names = [...body.matchAll(/^\s{4}public let (\w+):/gm)].map((f) => f[1]);
    const initAt = body.search(/^\s{4}public init\(/m);
    const signature =
      initAt === -1 ? "" : body.slice(initAt, body.indexOf(") {", initAt));
    const fields = new Map();
    for (const name of names) {
      const param = new RegExp(`(?:^|[(,]\\s*)${name}:\\s*([^,\\n]+)`, "m").exec(
        signature,
      );
      fields.set(name, param ? /=/.test(param[1]) : false);
    }
    out.set(m[1], fields);
  }
  return out;
}

function swiftEnums(source) {
  const out = new Map();
  const re = /^public enum Kozmos(\w+): String[^{]*\{([\s\S]*?)^\}/gm;
  let m;
  while ((m = re.exec(source))) {
    const values = [...m[2].matchAll(/^\s*case (\w+)(?:\s*=\s*"([^"]+)")?/gm)].map(
      (c) => c[2] ?? c[1],
    );
    out.set(m[1], values.sort());
  }
  return out;
}

// ---------------------------------------------------------------- kotlin

const droid = read(DROID);

function kotlinClasses(source) {
  const out = new Map();
  const re = /^data class Kozmos(\w+)\(([\s\S]*?)^\)/gm;
  let m;
  while ((m = re.exec(source))) {
    const body = m[2].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const fields = new Map();
    for (const line of body.split("\n")) {
      const f = /^\s{4}val (\w+): (.+?),?\s*$/.exec(line);
      if (f) fields.set(f[1], /=/.test(f[2]));
    }
    out.set(m[1], fields);
  }
  return out;
}

function kotlinEnums(source) {
  const out = new Map();
  const re = /^enum class Kozmos(\w+)\(val value: String\) \{([\s\S]*?)^\}/gm;
  let m;
  while ((m = re.exec(source))) {
    const values = [...m[2].matchAll(/^\s*\w+\("([^"]+)"\)/gm)].map((c) => c[1]);
    out.set(m[1], values.sort());
  }
  return out;
}

// ---------------------------------------------------------------- compare

const w = { structs: webInterfaces(web), enums: webEnums(web) };
const i = { structs: swiftStructs(ios), enums: swiftEnums(ios) };
const d = { structs: kotlinClasses(droid), enums: kotlinEnums(droid) };

const webNames = new Set([...w.structs.keys(), ...w.enums.keys()]);
const iosNames = new Set([...i.structs.keys(), ...i.enums.keys()]);
const droidNames = new Set([...d.structs.keys(), ...d.enums.keys()]);

for (const name of webNames) {
  if (WEB_ONLY.has(name)) continue;
  if (!iosNames.has(name)) fail(name, "on the web, missing on iOS");
  if (!droidNames.has(name)) fail(name, "on the web, missing on Android");
}
for (const name of new Set([...iosNames, ...droidNames])) {
  if (NATIVE_ONLY.has(name)) continue;
  if (!webNames.has(name))
    fail(name, `on ${iosNames.has(name) ? "iOS" : "Android"}, missing on the web`);
}
for (const [name, why] of WEB_ONLY) {
  if (!webNames.has(name)) fail(name, `listed in WEB_ONLY ("${why}") but no longer a web type`);
  if (iosNames.has(name) || droidNames.has(name))
    fail(name, "listed in WEB_ONLY but a native platform now has it - remove the entry");
}

for (const [name, fields] of w.structs) {
  if (WEB_ONLY.has(name)) continue;
  for (const [platform, structs] of [["iOS", i.structs], ["Android", d.structs]]) {
    const theirs = structs.get(name);
    if (!theirs) continue; // already reported as a missing type
    for (const [field, optional] of fields) {
      if (!theirs.has(field)) {
        fail(`${name}.${field}`, `on the web, missing on ${platform}`);
        continue;
      }
      // One direction only. A TypeScript interface cannot carry a default, so
      // `media: readonly POIMediaPresentation[]` and Kotlin's
      // `media: List<...> = emptyList()` are the same contract written the way
      // each language writes it - flagging that would be noise on every
      // collection and boolean in the file. What is NOT the same contract is
      // the web saying a field may be left out while a native SDK forces the
      // caller to invent a value: that is how `floorLabel` made every result
      // in a single-storey venue read "Ground Floor" on iOS and Android long
      // after the web had stopped.
      if (optional && !theirs.get(field))
        fail(
          `${name}.${field}`,
          `may be omitted on the web but is required on ${platform} - give the ` +
            `initialiser a default, or make it required on the web too`,
        );
    }
    for (const field of theirs.keys())
      if (!fields.has(field)) fail(`${name}.${field}`, `on ${platform}, missing on the web`);
  }
}

for (const [name, values] of w.enums) {
  if (WEB_ONLY.has(name)) continue;
  for (const [platform, enums] of [["iOS", i.enums], ["Android", d.enums]]) {
    const theirs = enums.get(name);
    if (!theirs) continue;
    if (theirs.join("|") !== values.join("|"))
      fail(name, `values differ - web [${values}] vs ${platform} [${theirs}]`);
  }
}

if (problems.length) {
  console.error(`Product contract parity: ${problems.length} problem(s)\n`);
  for (const p of problems.sort()) console.error("  " + p);
  console.error(
    "\nThe three contracts are one contract. Add the field or type to every" +
      "\nplatform, or, if it truly belongs to one, name it in WEB_ONLY /" +
      "\nNATIVE_ONLY in scripts/check-contract-parity.mjs with the reason.",
  );
  process.exit(1);
}

const shared = [...webNames].filter((n) => !WEB_ONLY.has(n)).length;
console.log(
  `Product contract parity ok: ${shared} types, ` +
    `${[...w.structs].reduce((n, [, f]) => n + f.size, 0)} fields, ` +
    `${w.enums.size} enumerations compared across web, iOS and Android.`,
);
