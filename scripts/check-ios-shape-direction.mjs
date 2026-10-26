/**
 * Every SwiftUI shape Kozmos draws says how it reads right to left.
 *
 * SwiftUI mirrors a `Shape` right to left by itself only in an app that
 * deploys to iOS 17 or later (macOS 14): unset, `layoutDirectionBehavior` is
 * `.mirrors(in: .rightToLeft)` there and `.fixed` in an app that deploys to
 * iOS 16. So a shape that leaves it unset draws differently in different
 * apps, and the test host decides which one a test sees. That hid five
 * drawings until 2026-10-21: the result tab and the route track mirrored
 * themselves and were mirrored again at 17 (#348); the tooltip's side tip and
 * the split button's halves were right only at 17 (#356).
 *
 * So, in packages/ios/Sources:
 *
 * - a type that conforms to `Shape` declares `layoutDirectionBehavior`, or is
 *   listed below as symmetric, with the reason it draws the same both ways;
 * - a `Path` or an `UnevenRoundedRectangle` is not drawn as a shape of its
 *   own, since neither declares one: either is fine where it builds a path,
 *   inside a function or property that returns a `Path` or one of Kozmos's
 *   shapes (a shape's `path(in:)`, a glyph built from path data), or inside
 *   a `Canvas`, whose drawing SwiftUI never mirrors. Elsewhere it is drawn
 *   with the default, and is listed with its reason or wrapped in a shape
 *   that declares one.
 *
 * Usage: node scripts/check-ios-shape-direction.mjs [<root>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Shapes, and places a `Path` is drawn, that draw the same both ways. */
export const SYMMETRIC = {
  "Components/POIDetailPanel/POIDetailPanel.swift:KozmosPanelShape":
    "its left and right halves are alike: only its bottom corners round, or do not",
  "Components/UserLocationMarker/UserLocationMarker.swift:ConeShape":
    "a cone about its own vertical axis; the heading turns it, in a left-to-right environment",
  "Components/LocationPin/LocationPin.swift:Pointer":
    "a triangle pointing straight down",
  "Components/LocationPin/LocationPin.swift:Teardrop":
    "a circle coming to a point straight below it",
};

/**
 * Blanks comments and the insides of string literals, keeping every offset
 * and line, so a word in a comment or a string is never read as code.
 */
export function stripSwift(source) {
  const out = source.split("");
  const blank = (from, to) => {
    for (let i = from; i < to; i++) if (out[i] !== "\n") out[i] = " ";
  };
  let i = 0;
  while (i < source.length) {
    if (source.startsWith("//", i)) {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
    } else if (source.startsWith("/*", i)) {
      let depth = 0;
      let j = i;
      while (j < source.length) {
        if (source.startsWith("/*", j)) {
          depth++;
          j += 2;
        } else if (source.startsWith("*/", j)) {
          depth--;
          j += 2;
          if (depth === 0) break;
        } else j++;
      }
      blank(i, j);
      i = j;
    } else if (source.startsWith('"""', i)) {
      const end = source.indexOf('"""', i + 3);
      const stop = end === -1 ? source.length : end + 3;
      blank(i + 3, stop - 3);
      i = stop;
    } else if (source[i] === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"' && source[j] !== "\n") {
        j += source[j] === "\\" ? 2 : 1;
      }
      blank(i + 1, j);
      i = j + 1;
    } else i++;
  }
  return out.join("");
}

/** The offset of the brace that closes the one at `open`. */
function closing(code, open) {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}" && --depth === 0) return i;
  }
  return code.length;
}

const lineOf = (code, offset) => code.slice(0, offset).split("\n").length;

/** Type and extension bodies: name, the range of the body, its conformances. */
function declarations(code) {
  const found = [];
  const pattern = /\b(struct|class|enum|actor|extension)\s+([A-Za-z_][\w.]*)\s*(<[^{}]*?>)?\s*(:\s*([^{}]*?))?\s*(where[^{}]*)?\{/g;
  for (const match of code.matchAll(pattern)) {
    const open = match.index + match[0].length - 1;
    const conformances = (match[5] ?? "")
      .split(",")
      .map((part) => part.trim().replace(/^SwiftUI\./, ""));
    found.push({
      kind: match[1],
      name: match[2],
      start: open,
      end: closing(code, open),
      line: lineOf(code, match.index),
      isShape: conformances.some((name) => name === "Shape" || name === "InsettableShape"),
    });
  }
  return found;
}

/**
 * Bodies that build a path: functions and properties that return a `Path` or
 * one of `shapeNames`, and `Canvas` closures.
 */
function pathBuilders(code, shapeNames) {
  const ranges = [];
  const returned = ["Path", ...shapeNames].join("|");
  const builder = new RegExp(`(->|\\bvar\\s+\\w+\\s*:)\\s*(?:${returned})\\??\\s*\\{`, "g");
  for (const match of code.matchAll(builder)) {
    const open = match.index + match[0].length - 1;
    ranges.push([open, closing(code, open)]);
  }
  for (const match of code.matchAll(/\bCanvas\s*(\([^()]*\))?\s*\{/g)) {
    const open = match.index + match[0].length - 1;
    ranges.push([open, closing(code, open)]);
  }
  return ranges;
}

/** The names of the types a Swift file declares as shapes. */
export function shapeNamesIn(source) {
  return declarations(stripSwift(source))
    .filter((t) => t.isShape && t.kind !== "extension")
    .map((t) => t.name);
}

/** What one Swift file asks of this check. `shapeNames` are every file's shapes. */
export function scan(source, file, shapeNames = shapeNamesIn(source)) {
  const code = stripSwift(source);
  const types = declarations(code);
  const builders = pathBuilders(code, shapeNames);
  const enclosing = (offset) =>
    types
      .filter((t) => t.kind !== "extension" && t.start < offset && offset < t.end)
      .sort((a, b) => b.start - a.start)[0]?.name ?? "(file scope)";
  const shapes = types
    .filter((t) => t.isShape && t.kind !== "extension")
    .map((t) => ({
      key: `${file}:${t.name}`,
      name: t.name,
      line: t.line,
      declares: /\bvar\s+layoutDirectionBehavior\b/.test(code.slice(t.start, t.end)),
    }));
  const extensionsDeclaring = types
    .filter((t) => t.kind === "extension" && /\bvar\s+layoutDirectionBehavior\b/.test(code.slice(t.start, t.end)))
    .map((t) => t.name);
  const drawn = [];
  for (const match of code.matchAll(/(?<!->\s*)(?<!:\s*)\b(Path|UnevenRoundedRectangle)\s*[({]|\.rect\s*\(\s*(?:topLeadingRadius|bottomLeadingRadius|cornerRadii)\b/g)) {
    if (builders.some(([from, to]) => from < match.index && match.index < to)) continue;
    const owner = enclosing(match.index);
    drawn.push({ key: `${file}:${owner}`, what: match[1] ?? "UnevenRoundedRectangle", owner, line: lineOf(code, match.index) });
  }
  return { shapes, extensionsDeclaring, drawn };
}

function swiftFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return swiftFiles(full);
    return entry.name.endsWith(".swift") ? [full] : [];
  });
}

export function check(root) {
  const sources = path.join(root, "packages/ios/Sources");
  const files = swiftFiles(sources).map((full) => ({ source: fs.readFileSync(full, "utf8"), file: path.relative(sources, full) }));
  const shapeNames = files.flatMap(({ source }) => shapeNamesIn(source));
  const scans = files.map(({ source, file }) => scan(source, file, shapeNames));
  const declaredInExtensions = new Set(scans.flatMap((s) => s.extensionsDeclaring));
  const problems = [];
  const passes = [];
  const listedSeen = new Set();
  for (const { shapes, drawn } of scans) {
    for (const shape of shapes) {
      const declares = shape.declares || declaredInExtensions.has(shape.name);
      if (declares && SYMMETRIC[shape.key]) {
        problems.push(`${shape.key} (line ${shape.line}) declares layoutDirectionBehavior and is listed as symmetric: take it off the list`);
      } else if (declares) {
        passes.push(`${shape.key} declares layoutDirectionBehavior`);
      } else if (SYMMETRIC[shape.key]) {
        listedSeen.add(shape.key);
        passes.push(`${shape.key} is symmetric: ${SYMMETRIC[shape.key]}`);
      } else {
        problems.push(`${shape.key} (line ${shape.line}) is a Shape that does not declare layoutDirectionBehavior: say .fixed, or .mirrors where it should mirror, or list it as symmetric with the reason`);
      }
    }
    for (const site of drawn) {
      if (SYMMETRIC[site.key]) {
        listedSeen.add(site.key);
        passes.push(`${site.key}: a ${site.what} drawn at line ${site.line} is symmetric: ${SYMMETRIC[site.key]}`);
      } else {
        problems.push(`${site.key} draws a ${site.what} as a shape at line ${site.line}, with SwiftUI's default layoutDirectionBehavior: wrap it in a shape that declares one, or list it as symmetric with the reason`);
      }
    }
  }
  for (const key of Object.keys(SYMMETRIC)) {
    if (!listedSeen.has(key) && !problems.some((p) => p.startsWith(key))) {
      problems.push(`${key} is listed as symmetric but is no longer a shape or a drawn path there: take it off the list`);
    }
  }
  return { problems, passes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { problems, passes } = check(path.resolve(process.argv[2] ?? process.cwd()));
  for (const line of passes) console.log(`  ok    ${line}`);
  for (const line of problems) console.log(`  FAIL  ${line}`);
  if (problems.length) {
    console.error(`\n${problems.length} SwiftUI shape(s) draw differently by the app's deployment target. See the header of scripts/check-ios-shape-direction.mjs.`);
    process.exit(1);
  }
  console.log(`\nEvery SwiftUI shape says how it reads right to left (${passes.length}).`);
}
