/**
 * What scripts/check-native-snippet-parity.mjs reads: a compiled native
 * snippet's claim, the snippet below it, and the tabs a docs page shows.
 *
 * A snippet's claim is its leading comment, joined across lines:
 *
 *   // <Page>.mdx's SwiftUI snippet, word for word …
 *   // <Page>.mdx's Compose snippet ("<Section>"), word for word …
 *   // <Page>.mdx's SwiftUI snippets ("<Section>"), word for word …
 *
 * The section names a heading on the page, and the claim covers that
 * section's tabs for the platform (or the whole page's, with no section):
 * "snippet" says there is exactly one, "snippets" says the file holds all of
 * them, in page order. A file that is no page's tab says so on a line of its
 * leading comment instead:
 *
 *   // Not a docs tab: <where it is shown, and why it is compiled>
 */

export const NOT_A_TAB = "Not a docs tab:";

const PLATFORMS = {
  swift: { label: "SwiftUI", fences: ["swift"] },
  kotlin: { label: "Compose", fences: ["kotlin", "kt"] },
};
export const platformFor = (label) =>
  Object.keys(PLATFORMS).find((key) => PLATFORMS[key].label === label) ?? null;
export const labelFor = (platform) => PLATFORMS[platform].label;

// The file's leading comment: the `//` lines it opens with.
export function leadingComment(text) {
  const all = text.split("\n");
  let end = 0;
  while (end < all.length && /^\s*\/\//.test(all[end])) end += 1;
  const lines = all.slice(0, end);
  const joined = lines
    .map((line) => line.replace(/^\s*\/\/\s?/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { lines, joined, end };
}

const CLAIM =
  /(?:^|\s)(\S+)\.mdx's (SwiftUI|Compose) (snippets?)(?: \("(.+?)"\))?, word for word/;

// What a leading comment says the file is: a claim on a page's tab(s), a file
// marked as no docs tab, both (an error), or neither (null).
export function parseHeader(comment) {
  const marked = comment.lines.some((line) =>
    new RegExp(`^\\s*// ${NOT_A_TAB} \\S`).test(line),
  );
  const match = comment.joined.match(CLAIM);
  if (match && marked)
    return { error: `claims ${match[1]}.mdx and is marked "${NOT_A_TAB}"` };
  if (marked) return { kind: "none" };
  if (!match) {
    if (/\.mdx\b/.test(comment.joined) && /word for word/.test(comment.joined))
      return {
        error: `its claim does not read as <Page>.mdx's SwiftUI|Compose snippet[s] [("<Section>")], word for word`,
      };
    return null;
  }
  return {
    kind: "claim",
    page: match[1],
    label: match[2],
    platform: platformFor(match[2]),
    plural: match[3] === "snippets",
    section: match[4] ?? null,
  };
}

// The snippet as the page shows it: what follows the leading comment, and
// for Compose the package line under it.
export function snippetBody(text, platform) {
  const all = text.split("\n");
  let i = leadingComment(text).end;
  if (platform === "kotlin") {
    while (i < all.length && !all[i].trim()) i += 1;
    if (/^package\s/.test(all[i] ?? "")) i += 1;
  }
  return all.slice(i).join("\n");
}

// What a template literal renders: every backslash escape becomes the
// character after it (the snippets use no \n, \t or \u escapes).
export const rendered = (literal) => literal.replace(/\\([\s\S])/g, "$1");

export const lines = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

// A heading's words, as a claim may write them: no code spans, one kind of
// quote, single spaces, any case.
export const headingKey = (text) =>
  text
    .replace(/`/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * The page's headings and native tabs, in page order. A heading is a line of
 * one to six `#` and a space, outside a fenced block and outside a template
 * literal. A tab is a `swift={`…`}` or `kotlin={`…`}` literal (rendered as
 * the page renders it), or a ```swift or ```kotlin fenced block (as written).
 * Lines are 1-based.
 */
export function readPage(source) {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1)
    if (source[i] === "\n") starts.push(i + 1);
  const lineOf = (offset) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid] <= offset) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  };
  const lineEnd = (offset) => {
    const end = source.indexOf("\n", offset);
    return end === -1 ? source.length : end;
  };

  const headings = [];
  const tabs = [];
  let pos = 0;
  while (pos < source.length) {
    let end = lineEnd(pos);
    const text = source.slice(pos, end);
    const fence = text.match(/^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)/);
    if (fence) {
      const close = new RegExp(
        `^ {0,3}${fence[1][0]}{${fence[1].length},}[ \\t]*$`,
      );
      const line = lineOf(pos);
      const body = [];
      let next = end + 1;
      while (next < source.length) {
        const stop = lineEnd(next);
        const inner = source.slice(next, stop);
        next = stop + 1;
        if (close.test(inner)) break;
        body.push(inner);
      }
      const lang = fence[2].toLowerCase();
      const platform = Object.keys(PLATFORMS).find((key) =>
        PLATFORMS[key].fences.includes(lang),
      );
      if (platform)
        tabs.push({ platform, code: body.join("\n"), line, form: "fence" });
      pos = next;
      continue;
    }
    const heading = text.match(/^(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/);
    if (heading)
      headings.push({
        level: heading[1].length,
        text: heading[2],
        line: lineOf(pos),
      });
    // Template literals on this line; one may run on for many lines.
    let scan = pos;
    for (;;) {
      const open = source.indexOf("={`", scan);
      if (open === -1 || open > end) break;
      const name = source.slice(pos, open).match(/([A-Za-z_$][\w$]*)$/)?.[1];
      let i = open + 3;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "`") break;
        i += 1;
      }
      if (name && Object.hasOwn(PLATFORMS, name))
        tabs.push({
          platform: name,
          code: rendered(source.slice(open + 3, i)),
          line: lineOf(open),
          form: "literal",
        });
      scan = i + 1;
      if (scan > end) end = lineEnd(scan);
    }
    pos = end + 1;
  }
  return { headings, tabs };
}

// The tabs a claim covers, or why there are none to compare.
export function claimedTabs(page, claim) {
  const { headings, tabs } = page;
  let from = 0;
  let to = Infinity;
  let where = "the page";
  if (claim.section !== null) {
    const key = headingKey(claim.section);
    const found = headings.filter((h) => headingKey(h.text) === key);
    if (!found.length)
      return {
        error: `the page has no heading "${claim.section}" (its headings: ${headings.map((h) => `"${h.text}"`).join(", ") || "none"})`,
      };
    if (found.length > 1)
      return {
        error: `the page has ${found.length} headings "${claim.section}", on lines ${found.map((h) => h.line).join(", ")}`,
      };
    const [heading] = found;
    from = heading.line;
    to =
      headings.find((h) => h.line > heading.line && h.level <= heading.level)
        ?.line ?? Infinity;
    where = `"${heading.text}" (line ${heading.line})`;
  }
  const covered = tabs.filter(
    (t) => t.platform === claim.platform && t.line > from && t.line < to,
  );
  const label = labelFor(claim.platform);
  if (!covered.length) return { error: `${where} has no ${label} tab` };
  if (!claim.plural && covered.length > 1)
    return {
      error: `${where} has ${covered.length} ${label} tabs (lines ${covered.map((t) => t.line).join(", ")}): name the section, or say "snippets" for all of them`,
    };
  return { tabs: covered, where };
}

// The first line where the compiled snippet and the tab differ, or null.
export function firstDifference(snippet, tabCode) {
  const want = lines(snippet);
  const got = lines(tabCode);
  const length = Math.max(want.length, got.length);
  for (let index = 0; index < length; index += 1)
    if (want[index] !== got[index])
      return {
        line: index + 1,
        got: got[index] ?? "(nothing)",
        want: want[index] ?? "(nothing)",
      };
  return null;
}
