/**
 * No SwiftUI text in Kozmos asks for a line SwiftUI cannot draw.
 *
 * SwiftUI sets no line tighter than the font's own: a negative `lineSpacing`
 * takes away a text style's leading and nothing more, and past that it is
 * ignored without a word (decision 203, #575: a wrapped display headline's
 * lines fall 57.3pt apart at 48pt bold, the platform's limit, where the web's
 * are 54). Whether a spacing is drawable depends on the font's measured
 * leading, so `KozmosLineSpacingTests` decides it on the simulator. This
 * makes sure everything reaches that test. In packages/ios/Sources:
 *
 * - every `.lineSpacing(…)` passes a non-negative number or one of
 *   KozmosTypography's spacings (`KozmosTypography.<name>LineSpacing`), never
 *   a negative number or an expression worked out at the call;
 * - every spacing KozmosTypography declares is one `KozmosLineSpacingTests`
 *   draws and measures.
 *
 * Usage: node scripts/check-ios-line-spacing.mjs [<root>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripSwift } from "./check-ios-shape-direction.mjs";

const SOURCES = "packages/ios/Sources";
const TYPOGRAPHY = "packages/ios/Sources/KozmosTypography.swift";
const TESTS = "packages/ios/Tests/KozmosTests/KozmosLineSpacingTests.swift";

const lineOf = (code, offset) => code.slice(0, offset).split("\n").length;

/** The argument of each `.lineSpacing(` call, with its line. */
export function lineSpacingCalls(source) {
  const code = stripSwift(source);
  const calls = [];
  for (const match of code.matchAll(/\.lineSpacing\s*\(/g)) {
    const open = match.index + match[0].length;
    let depth = 1;
    let i = open;
    while (i < code.length && depth > 0) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")") depth--;
      i++;
    }
    calls.push({
      argument: code.slice(open, i - 1).trim(),
      line: lineOf(code, match.index),
    });
  }
  return calls;
}

/** Why a `.lineSpacing` argument is refused, or null when it is fine. */
export function refusal(argument) {
  const number = /^[-+]?\s*\d+(\.\d+)?$/.test(argument)
    ? Number(argument.replace(/\s+/g, ""))
    : null;
  if (number !== null)
    return number < 0
      ? `a negative line spacing (${argument}): SwiftUI draws none past the style's leading`
      : null;
  if (/^KozmosTypography\.\w+LineSpacing$/.test(argument)) return null;
  return `\`${argument}\` is not one of KozmosTypography's spacings, which KozmosLineSpacingTests measures`;
}

/** The spacings a KozmosTypography source declares. */
export function declaredSpacings(source) {
  return [
    ...stripSwift(source).matchAll(
      /\bstatic\s+(?:let|var)\s+(\w+LineSpacing)\b/g,
    ),
  ].map((match) => match[1]);
}

/** The spacings the test draws, by the names it gives them. */
export function testedSpacings(source) {
  return [
    ...source.matchAll(
      /name:\s*"(\w+LineSpacing)"[\s\S]*?value:\s*KozmosTypography\.(\w+)/g,
    ),
  ]
    .filter((match) => match[1] === match[2])
    .map((match) => match[1]);
}

function swiftFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return swiftFiles(full);
    return entry.name.endsWith(".swift") ? [full] : [];
  });
}

export function check(root) {
  const problems = [];
  const calls = [];
  for (const file of swiftFiles(path.join(root, SOURCES))) {
    const rel = path.relative(root, file);
    for (const call of lineSpacingCalls(fs.readFileSync(file, "utf8"))) {
      calls.push(`${rel}:${call.line} ${call.argument}`);
      const why = refusal(call.argument);
      if (why) problems.push(`${rel}:${call.line}: ${why}`);
    }
  }
  const declared = declaredSpacings(
    fs.readFileSync(path.join(root, TYPOGRAPHY), "utf8"),
  );
  const tested = new Set(
    testedSpacings(fs.readFileSync(path.join(root, TESTS), "utf8")),
  );
  for (const name of declared)
    if (!tested.has(name))
      problems.push(
        `${TYPOGRAPHY}: KozmosTypography.${name} is not drawn by ${path.basename(TESTS)}; add it to its spacings`,
      );
  return { problems, calls, declared };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { problems, calls, declared } = check(
    path.resolve(process.argv[2] ?? process.cwd()),
  );
  if (problems.length) {
    console.error(
      `${problems.length} line spacing(s) SwiftUI may not draw:\n${problems.map((p) => `  ${p}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `${calls.length} .lineSpacing calls pass KozmosTypography's spacings, and its ${declared.length} spacings (${declared.join(", ")}) are each measured by KozmosLineSpacingTests.`,
  );
}
