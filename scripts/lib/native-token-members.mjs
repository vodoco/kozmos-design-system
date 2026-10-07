/**
 * The members the native token types declare, read from the sources, so a
 * documentation snippet's `KozmosColors.x` can be held to what SwiftUI and
 * Compose can actually compile.
 *
 * The token types are the types Compose's token package declares
 * (`com/kozmos/tokens`: KozmosColors, KozmosThemeTokens, KozmosDimensions,
 * KozmosTypography and the rest). SwiftUI has no token folder: the same types
 * sit at the top of its Sources, under the same names. Each platform's members
 * are read from every declaration of the type in that platform's sources,
 * extensions included, and only what a caller can reach counts: `public` (or
 * `open`) statics, cases and nested types in Swift; anything not `private`,
 * `internal` or `protected` in Kotlin.
 *
 * Nothing here lists a member. A token renamed in the build is a member gone
 * from the file, and the snippet that still names it fails.
 */
import fs from "node:fs";
import path from "node:path";

export const KOTLIN_TOKEN_PACKAGE =
  "packages/android/src/main/java/com/kozmos/tokens";

export const NATIVE_SOURCES = {
  swift: { roots: ["packages/ios/Sources"], ext: ".swift" },
  kotlin: { roots: ["packages/android/src/main"], ext: ".kt" },
};

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

/**
 * The source with its comments removed and its string literals emptied, so
 * neither a brace nor a declaration inside one is read as code. Newlines are
 * kept, so offsets still map to lines. Swift and Kotlin both nest block
 * comments.
 */
export function stripCommentsAndStrings(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    if (source.startsWith("//", i)) {
      const end = source.indexOf("\n", i);
      i = end === -1 ? source.length : end;
    } else if (source.startsWith("/*", i)) {
      let depth = 0;
      while (i < source.length) {
        if (source.startsWith("/*", i)) {
          depth += 1;
          i += 2;
        } else if (source.startsWith("*/", i)) {
          depth -= 1;
          i += 2;
          if (depth === 0) break;
        } else {
          if (source[i] === "\n") out += "\n";
          i += 1;
        }
      }
    } else if (source[i] === '"') {
      const triple = source.startsWith('"""', i);
      const close = triple ? '"""' : '"';
      i += close.length;
      out += '""';
      while (i < source.length && !source.startsWith(close, i)) {
        if (source[i] === "\\") i += 1;
        else if (source[i] === "\n") out += "\n";
        i += 1;
      }
      i += close.length;
    } else {
      out += source[i];
      i += 1;
    }
  }
  return out;
}

/** The text between the brace at `open` and the one that closes it. */
function bodyFrom(code, open) {
  let depth = 0;
  for (let i = open; i < code.length; i += 1) {
    if (code[i] === "{") depth += 1;
    else if (code[i] === "}") {
      depth -= 1;
      if (depth === 0) return code.slice(open + 1, i);
    }
  }
  return code.slice(open + 1);
}

/** A body with its nested blocks taken out: only its own declarations. */
function topLevelOf(body) {
  let out = "";
  let depth = 0;
  for (const char of body) {
    if (char === "{") depth += 1;
    if (depth === 0) out += char;
    if (char === "}") depth -= 1;
  }
  return out;
}

const SWIFT_MEMBER =
  /^\s*(?:@\w+(?:\([^)]*\))?\s+)*((?:(?:public|open|private|fileprivate|internal|static|class|final|nonisolated)\s+)*)(let|var|func|case|struct|enum|class|actor|typealias)\s+([A-Za-z_]\w*)([^\n]*)/gm;
const KOTLIN_MEMBER =
  /^\s*(?:@\w+(?:\([^)]*\))?\s+)*((?:(?:public|private|internal|protected|const|override|inline|lateinit|open|abstract|data|enum|sealed|value)\s+)*)(val|var|fun|object|class|interface)\s+(?:<[^>]*>\s*)?([A-Za-z_]\w*)(\.?)/gm;

/** The members one declaration body gives its callers. */
function membersOf(platform, body, typeIsPublic) {
  const members = [];
  const own = topLevelOf(body);
  if (platform === "swift") {
    for (const match of own.matchAll(SWIFT_MEMBER)) {
      const [, modifiers, kind, name, rest] = match;
      const reachable = /\b(?:public|open)\b/.test(modifiers);
      if (kind === "case") {
        // `case a, b(String)`: every name before an `=` or a parenthesis.
        if (!typeIsPublic) continue;
        members.push(name);
        const others = rest.replace(/\([^)]*\)/g, "").split("=")[0];
        for (const more of others.matchAll(/,\s*([A-Za-z_]\w*)/g))
          members.push(more[1]);
        continue;
      }
      if (!reachable) continue;
      const isStatic = /\b(?:static|class)\b/.test(modifiers);
      const isType = ["struct", "enum", "class", "actor", "typealias"].includes(
        kind,
      );
      // `KozmosColors.x` reaches statics and nested types, never instances.
      if (isStatic || isType) members.push(name);
    }
  } else {
    for (const match of own.matchAll(KOTLIN_MEMBER)) {
      const [, modifiers, , name, extension] = match;
      if (extension) continue;
      if (/\b(?:private|internal|protected)\b/.test(modifiers)) continue;
      members.push(name);
    }
  }
  return members;
}

const DECLARATION = {
  swift: (type) =>
    new RegExp(
      String.raw`^[ \t]*((?:(?:public|open|private|fileprivate|internal|final)\s+)*)(?:class|struct|enum|actor|extension)\s+${type}\b[^{\n]*\{`,
      "gm",
    ),
  kotlin: (type) =>
    new RegExp(
      String.raw`^[ \t]*((?:(?:public|private|internal|data)\s+)*)(?:object|class)\s+${type}\b[^{\n]*\{`,
      "gm",
    ),
};

/** Kotlin extension members, declared outside the type: `val KozmosColors.x`. */
function kotlinExtensionMembers(code, type) {
  const members = [];
  const pattern = new RegExp(
    String.raw`^\s*(?:@\w+(?:\([^)]*\))?\s+)*((?:(?:public|private|internal|inline)\s+)*)(?:val|var|fun)\s+(?:<[^>]*>\s*)?${type}\.([A-Za-z_]\w*)`,
    "gm",
  );
  for (const match of code.matchAll(pattern)) {
    if (/\b(?:private|internal)\b/.test(match[1])) continue;
    members.push(match[2]);
  }
  return members;
}

/** The names of the token types: every type Compose's token package declares. */
export function tokenTypeNames(root) {
  const names = new Set();
  for (const file of walk(path.join(root, KOTLIN_TOKEN_PACKAGE), ".kt")) {
    const code = stripCommentsAndStrings(fs.readFileSync(file, "utf8"));
    for (const match of code.matchAll(
      /^(?:(?:public|internal|data)\s+)*(?:object|class)\s+(Kozmos\w*)/gm,
    ))
      names.add(match[1]);
  }
  return names;
}

/**
 * For each platform, a Map from each token type it declares to the files that
 * declare it and the members a caller can reach.
 */
export function nativeTokenMembers(root, names = tokenTypeNames(root)) {
  const result = {};
  for (const [platform, spec] of Object.entries(NATIVE_SOURCES)) {
    const types = new Map();
    const files = spec.roots.flatMap((r) => walk(path.join(root, r), spec.ext));
    for (const file of files) {
      const raw = fs.readFileSync(file, "utf8");
      const named = [...names].filter((name) => raw.includes(name));
      if (!named.length) continue;
      const code = stripCommentsAndStrings(raw);
      for (const type of named) {
        const found = [];
        for (const match of code.matchAll(DECLARATION[platform](type))) {
          const isPublic =
            platform === "kotlin"
              ? !/\b(?:private|internal)\b/.test(match[1])
              : /\b(?:public|open)\b/.test(match[1]);
          const open = match.index + match[0].length - 1;
          found.push(...membersOf(platform, bodyFrom(code, open), isPublic));
        }
        if (platform === "kotlin")
          found.push(...kotlinExtensionMembers(code, type));
        const declares = DECLARATION[platform](type).test(code);
        if (!declares && !found.length) continue;
        const entry = types.get(type) ?? {
          files: new Set(),
          members: new Set(),
        };
        if (declares) entry.files.add(path.relative(root, file));
        for (const member of found) entry.members.add(member);
        types.set(type, entry);
      }
    }
    result[platform] = types;
  }
  return result;
}

/**
 * Every `Type.member` a snippet reads on one of the named types, with the
 * line it is on, counted from the snippet's first line (0).
 */
export function tokenMemberReads(code, names) {
  const reads = [];
  for (const match of code.matchAll(
    /\b(Kozmos[A-Za-z0-9]*)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)/g,
  )) {
    if (!names.has(match[1])) continue;
    reads.push({
      type: match[1],
      member: match[2],
      line: code.slice(0, match.index).split("\n").length - 1,
    });
  }
  return reads;
}
