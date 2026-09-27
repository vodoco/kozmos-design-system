#!/usr/bin/env node
/**
 * Holds the site to its one rule: what is on the page is Kozmos.
 *
 * TSX and TS (read with the TypeScript parser, not patterns):
 *  - imports come from React, React Router, the Kozmos packages or the site
 *    itself — no other UI library, icon set or class helper;
 *  - no raw HTML element where Kozmos has a component (div → Box, p → Text,
 *    button → Button, a → Link …); sectioning elements and <pre>/<code> are
 *    allowed, because Kozmos has no equivalent and they carry meaning;
 *  - `style` may only pass CSS custom properties, the way data reaches CSS;
 *  - a `className` names the site's own classes (`site-…`, `ex-…`), never
 *    Kozmos's utility classes, which are its internals, not an interface;
 *  - no colour literal in any string.
 *
 * CSS:
 *  - no colour literal, named colour or `!important`;
 *  - typography only from Kozmos typography tokens (a size, line height,
 *    family or spacing named by a token variable), never a literal — and
 *    normally not at all: it comes from Text and Heading;
 *  - radii and shadows only from tokens; fixed spacing only from tokens;
 *    a var()'s fallback counts as a value like any other;
 *  - no selector that reaches into Kozmos (.kozmos-*, [data-slot]), and no
 *    universal or element selector, which lands on whatever element is
 *    there, Kozmos's included (html and body excepted);
 *  - an example's stylesheet is shown and copied as it is, so it reads the
 *    tokens themselves, not the site's --site-* aliases.
 *
 * Every exception the site needs is a gap in Kozmos, recorded in GAPS.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const SITE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const ALLOWED_MODULES = [
  /^react$/,
  /^react-dom$/,
  /^react-router$/,
  /^@react-router\/dev\/(routes|config)$/,
  // A Kozmos package, a subpath of one, or its text (`?raw`) for the token pages.
  /^@kozmos-ds\/(react|tokens|icons|product-contracts)(\/[\w./-]+)?(\?raw)?$/,
  /^\.{1,2}\//,
];

/** Node built-ins, for the unit tests only. */
const TEST_MODULES = [/^node:/];

/** Elements Kozmos has no component for, which carry meaning of their own. */
const ALLOWED_ELEMENTS = new Set([
  "html",
  "head",
  "body",
  "meta",
  "link",
  "main",
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "nav",
  "form",
  "pre",
  "code",
  "kbd",
  "strong",
  "em",
  "br",
  "time",
  "abbr",
]);

const KOZMOS_FOR = {
  div: "Box, Stack or Surface",
  span: 'Text as="span"',
  p: "Text",
  h1: "Heading",
  h2: "Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  h6: "Heading",
  a: "Link (or SiteLink / ButtonLink for this site's pages)",
  button: "Button or IconButton",
  input: "Input, Checkbox, Switch or RadioGroupItem",
  select: "Select",
  textarea: "Textarea",
  label: "Label or FieldWrapper",
  ul: "List",
  ol: "List",
  li: "ListItem",
  table: "Table",
  hr: "Separator",
  svg: "Icon",
  img: "a Kozmos component (none draws a plain image: record a gap)",
};

const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const HEX_COLOUR = /(^|[^\w&])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;

// The CSS named colours (CSS Color 4), for the colour-bearing properties.
const NAMED_COLOURS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

const COLOUR_PROPERTY =
  /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration(-color)?|column-rule(-color)?)$/;
const TYPOGRAPHY_PROPERTY =
  /^(font(-[a-z-]+)?|line-height|letter-spacing|word-spacing|text-transform|text-decoration(-[a-z-]+)?|text-align|text-indent)$/;
const RADIUS_PROPERTY = /^border(-[a-z-]+)?-radius$/;
const SHADOW_PROPERTY = /^(box-shadow|text-shadow)$/;
const SPACING_PROPERTY =
  /^(gap|row-gap|column-gap|margin(-[a-z-]+)?|padding(-[a-z-]+)?|inset(-[a-z-]+)?|top|right|bottom|left)$/;

/**
 * Replaces each var(…) with its fallback, or with nothing when it has none,
 * however deeply they nest: `var(--y, 1.4)` leaves `1.4`, a literal like any
 * other, and `var(--a, var(--b))` leaves nothing.
 */
function withoutVars(value) {
  let out = "";
  let index = 0;
  while (index < value.length) {
    const start = value.indexOf("var(", index);
    if (start === -1) {
      out += value.slice(index);
      break;
    }
    out += value.slice(index, start);
    let depth = 0;
    let comma = -1;
    let cursor = start + 3;
    for (; cursor < value.length; cursor += 1) {
      if (value[cursor] === "(") depth += 1;
      else if (value[cursor] === ")") {
        depth -= 1;
        if (depth === 0) break;
      } else if (value[cursor] === "," && depth === 1 && comma === -1) {
        comma = cursor;
      }
    }
    if (comma !== -1) out += withoutVars(value.slice(comma + 1, cursor));
    index = cursor + 1;
  }
  return out;
}

/**
 * Whether a value is made of tokens and nothing else: every number in it
 * comes from a var(), allowing the `* 1px` that turns a unitless token into
 * a length.
 */
function tokenDriven(value) {
  if (!value.includes("var(")) return false;
  return !/\d/.test(withoutVars(value).replace(/\*\s*1(px|rem|em)\b/g, ""));
}

function lineOf(source, offset) {
  return source.slice(0, offset).split("\n").length;
}

/** Findings for one CSS file's text. */
export function checkCss(source, file = "input.css") {
  const findings = [];
  const report = (offset, rule, message) =>
    findings.push({ file, line: lineOf(source, offset), rule, message });

  // Keep offsets stable: blank comments out instead of removing them.
  const text = source.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    comment.replace(/[^\n]/g, " "),
  );

  // An example's files are shown, and copied, as they are: the site's
  // aliases would be undefined anywhere else.
  if (/(^|\/)examples\//.test(file)) {
    for (const alias of text.matchAll(/var\(--site-[\w-]+/g)) {
      report(
        alias.index,
        "example-alias",
        `${alias[0].slice(4)} is the site's alias; an example reads the token itself, e.g. calc(var(--primitives-layout-spacing-300) * 1px).`,
      );
    }
  }

  const blocks = /([^{}]*)\{([^{}]*)\}/g;
  for (const block of text.matchAll(blocks)) {
    const selector = block[1].trim();
    const selectorOffset = block.index + block[0].indexOf(block[1].trimStart());
    if (/\.kozmos-|\[data-slot|\[data-kozmos/.test(selector)) {
      report(
        selectorOffset,
        "kozmos-internals",
        `"${selector}" reaches into a Kozmos component. Style your own elements; ask Kozmos for the rest.`,
      );
    }
    for (const one of selector.split(",").map((part) => part.trim())) {
      // A keyframe's steps are not selectors.
      if (!one || /^(from|to|\d+(\.\d+)?%)$/.test(one)) continue;
      if (/(^|[\s>+~(])\*/.test(one)) {
        report(
          selectorOffset,
          "selector",
          `"${one}" selects every element there, Kozmos's included. Put a class on your own element.`,
        );
        continue;
      }
      for (const compound of one.split(/[\s>+~]+/)) {
        const element = compound.match(/^[a-z][a-z0-9-]*/i)?.[0];
        if (element && !/^(html|body)$/i.test(element)) {
          report(
            selectorOffset,
            "selector",
            `"${one}" selects the <${element}> elements there, Kozmos's included. Put a class on your own element.`,
          );
        }
      }
    }
    const bodyOffset = block.index + block[1].length + 1;
    let cursor = 0;
    for (const declaration of block[2].split(";")) {
      const offset = bodyOffset + cursor;
      cursor += declaration.length + 1;
      const colon = declaration.indexOf(":");
      if (colon === -1) continue;
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      if (!property || !value) continue;
      const at = offset + declaration.search(/\S/);

      if (/!important/i.test(value)) {
        report(at, "important", `${property} uses !important.`);
      }
      if (HEX_COLOUR.test(value) || COLOUR_FUNCTION.test(value)) {
        report(at, "colour-literal", `${property}: ${value} — use a token.`);
      } else if (COLOUR_PROPERTY.test(property)) {
        const words =
          withoutVars(value)
            .toLowerCase()
            .match(/[a-z]+/g) ?? [];
        const named = words.find((word) => NAMED_COLOURS.has(word));
        if (named) {
          report(
            at,
            "colour-literal",
            `${property} names the colour "${named}" — use a token.`,
          );
        }
      }
      if (property.startsWith("--")) continue;
      if (TYPOGRAPHY_PROPERTY.test(property) && !tokenDriven(value)) {
        report(
          at,
          "typography",
          `${property}: ${value} — typography comes from Text and Heading, or from a typography token.`,
        );
      }
      if (RADIUS_PROPERTY.test(property) && !value.includes("var(")) {
        report(at, "radius", `${property}: ${value} — use a radius token.`);
      }
      if (
        SHADOW_PROPERTY.test(property) &&
        !value.includes("var(") &&
        value !== "none"
      ) {
        report(at, "shadow", `${property}: ${value} — use an elevation token.`);
      }
      if (SPACING_PROPERTY.test(property)) {
        // Percentages are relative positions (centring, a pin on a map), which
        // a spacing scale cannot express; fixed lengths must be tokens.
        const bare = withoutVars(value).replace(/\*\s*1px/g, "");
        const length = bare.match(
          /(?<![\w-])-?(?:\d*\.)?\d+(?:px|rem|em|vh|vw|dvh|svh|lvh|ch|ex)\b/,
        );
        if (length && !/^-?0(?:\.0+)?[a-z%]*$/.test(length[0])) {
          report(at, "spacing", `${property}: ${value} — use a spacing token.`);
        }
      }
    }
  }
  return findings;
}

/** Findings for one TS or TSX file's text. */
export function checkScript(source, file = "input.tsx") {
  const findings = [];
  const isTest = /\.test\.[cm]?tsx?$/.test(file);
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const report = (node, rule, message) => {
    const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    findings.push({ file, line: line + 1, rule, message });
  };

  function checkModule(node, specifier) {
    const allowed = [...ALLOWED_MODULES, ...(isTest ? TEST_MODULES : [])];
    if (!allowed.some((pattern) => pattern.test(specifier))) {
      report(
        node,
        "import",
        `"${specifier}" is not Kozmos. Use a Kozmos component, or record the gap.`,
      );
    }
  }

  function checkElement(node, tagName) {
    const name = tagName.getText(tree);
    if (!/^[a-z]/.test(name) || name.includes(".") || name.includes("-"))
      return;
    if (ALLOWED_ELEMENTS.has(name)) return;
    const instead = KOZMOS_FOR[name];
    report(
      node,
      "element",
      instead
        ? `<${name}> — use ${instead}.`
        : `<${name}> is not on the list of allowed elements.`,
    );
  }

  /** The site's own classes: `site-…`, and an example's `ex-…`. */
  function checkClassName(attribute) {
    const initializer = attribute.initializer;
    const texts = [];
    // The strings that become the attribute: literals, templates, either
    // branch of a condition. A call's arguments are not class names
    // (buttonVariants({ variant: "outline" }) is Kozmos's own interface).
    const collect = (node) => {
      if (
        ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        texts.push(node.text);
      } else if (ts.isTemplateExpression(node)) {
        texts.push(
          node.head.text,
          ...node.templateSpans.map((span) => span.literal.text),
        );
      } else if (
        ts.isJsxExpression(node) ||
        ts.isParenthesizedExpression(node)
      ) {
        if (node.expression) collect(node.expression);
      } else if (ts.isConditionalExpression(node)) {
        collect(node.whenTrue);
        collect(node.whenFalse);
      } else if (ts.isBinaryExpression(node)) {
        collect(node.left);
        collect(node.right);
      }
    };
    if (initializer) collect(initializer);
    for (const name of texts.join(" ").split(/\s+/).filter(Boolean)) {
      if (!/^(site|ex)-/.test(name)) {
        report(
          attribute,
          "class",
          `"${name}" is not one of the site's classes. Kozmos's utility classes are its internals, not an interface: name your own (site-…, ex-…).`,
        );
      }
    }
  }

  function checkStyle(attribute) {
    const initializer = attribute.initializer;
    const expression =
      initializer && ts.isJsxExpression(initializer)
        ? initializer.expression
        : undefined;
    const onlyCustomProperties =
      expression &&
      ts.isObjectLiteralExpression(expression) &&
      expression.properties.every(
        (property) =>
          ts.isPropertyAssignment(property) &&
          ts.isStringLiteral(property.name) &&
          property.name.text.startsWith("--"),
      );
    if (!onlyCustomProperties) {
      report(
        attribute,
        "style",
        "style may only pass CSS custom properties; put the styling in CSS.",
      );
    }
  }

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      checkModule(node, node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      checkModule(node, node.arguments[0].text);
    } else if (
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node)
    ) {
      checkElement(node, node.tagName);
    } else if (ts.isJsxAttribute(node) && node.name.getText(tree) === "style") {
      checkStyle(node);
    } else if (
      ts.isJsxAttribute(node) &&
      node.name.getText(tree) === "className"
    ) {
      checkClassName(node);
    } else if (
      // A unit test's sample colours are inputs to a parser, not paint on a page.
      !isTest &&
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node) ||
        ts.isJsxText(node))
    ) {
      const text = node.text ?? node.getText(tree);
      if (HEX_COLOUR.test(text) || COLOUR_FUNCTION.test(text)) {
        report(
          node,
          "colour-literal",
          `"${text.trim().slice(0, 40)}" holds a colour — use a token.`,
        );
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return findings;
}

function sourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      // Generated data is read, not written by hand, and holds no markup.
      if (entry.name === "generated") continue;
      files.push(...sourceFiles(full));
    } else if (
      /\.(tsx?|css)$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(full);
    }
  }
  return files;
}

/** Every finding in the site's src directory (or another root). */
export function checkSite(root = path.join(SITE_ROOT, "src")) {
  return sourceFiles(root).flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(SITE_ROOT, file);
    return file.endsWith(".css")
      ? checkCss(source, relative)
      : checkScript(source, relative);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const findings = checkSite();
  for (const finding of findings) {
    console.error(
      `${finding.file}:${finding.line}  ${finding.rule}  ${finding.message}`,
    );
  }
  if (findings.length > 0) {
    console.error(
      `\n${findings.length} finding(s). The site draws only with Kozmos; see GAPS.md.`,
    );
    process.exit(1);
  }
  console.log("check-ds-only: every file draws with Kozmos only.");
}
