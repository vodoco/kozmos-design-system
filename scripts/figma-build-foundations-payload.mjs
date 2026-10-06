import fs from "node:fs";
import path from "node:path";
import {
  generatedJsonIsCurrent,
  writeGeneratedJson,
} from "./write-generated-json.mjs";

const ROOT = process.cwd();
const LIGHT_TOKENS = path.join(ROOT, "packages/tokens/src/tokens-light.json");
const DARK_TOKENS = path.join(ROOT, "packages/tokens/src/tokens-dark.json");
const OUT_FILE = path.join(ROOT, "docs/figma-foundations-payload.json");

const FIGMA_VARIABLE_TYPES = new Map([
  ["color", "COLOR"],
  ["number", "FLOAT"],
  ["dimension", "FLOAT"],
  ["spacing", "FLOAT"],
  ["borderRadius", "FLOAT"],
  ["borderWidth", "FLOAT"],
  ["opacity", "FLOAT"],
  ["fontSizes", "FLOAT"],
  ["lineHeights", "FLOAT"],
  ["letterSpacing", "FLOAT"],
  ["paragraphSpacing", "FLOAT"],
]);

const STYLE_ONLY_TYPES = new Set([
  "fontFamilies",
  "fontWeights",
  "cubicBezier",
  "shadow",
  "other",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function flattenTokens(value, segments = []) {
  if (!value || typeof value !== "object") return [];

  if ("$value" in value || "value" in value) {
    return [
      {
        path: segments,
        value: value.$value ?? value.value,
        type: value.$type ?? value.type ?? "unknown",
        description: value.$description ?? value.description,
      },
    ];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenTokens(child, [...segments, key]),
  );
}

function kebab(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cssVariableName(segments) {
  return `--${segments.map(kebab).filter(Boolean).join("-")}`;
}

function toCamelCase(segments) {
  let result = segments
    .join(" ")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => {
      const lower = part.toLowerCase();
      return index === 0
        ? lower
        : `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join("");

  if (/^[0-9]/.test(result)) result = `_${result}`;
  return result;
}

function aliasPath(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return null;
  return match[1]
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const numeric = Number.parseFloat(trimmed);
  if (Number.isNaN(numeric)) return null;

  if (trimmed.endsWith("rem")) return numeric * 16;
  return numeric;
}

function normalizeValue(token) {
  const alias = aliasPath(token.value);
  if (alias) {
    return {
      kind: "alias",
      path: alias.join("/"),
    };
  }

  const figmaType = FIGMA_VARIABLE_TYPES.get(token.type);
  if (figmaType === "FLOAT") {
    const parsed = parseNumber(token.value);
    return {
      kind: parsed === null ? "raw" : "number",
      value: parsed ?? token.value,
    };
  }

  return {
    kind: "raw",
    value: token.value,
  };
}

function collectionFor(pathSegments) {
  const [root] = pathSegments;
  if (root === "Primitives") return "Kozmos Primitives";
  if (root === "Semantics") return "Kozmos Semantics";
  if (root === "Components") return "Kozmos Components";
  if (root === "shadow") return "Kozmos Effects";
  return "Kozmos Misc";
}

function scopesFor(token) {
  const joined = token.path.join("/").toLowerCase();
  const type = token.type;

  if (type === "color") {
    if (
      joined.includes("text") ||
      joined.includes("foreground") ||
      joined.includes("content")
    ) {
      return ["TEXT_FILL"];
    }
    if (
      joined.includes("border") ||
      joined.includes("stroke") ||
      joined.includes("outline") ||
      // A ring is drawn as a stroke: the user-location dot's (Map marker).
      token.path.some((part) => part.toLowerCase() === "ring")
    ) {
      // Also fills: a divider is a border drawn as a 1px rectangle, and a
      // designer reaching for the divider colour should find the role in the
      // fill picker rather than a primitive.
      return ["STROKE_COLOR", "SHAPE_FILL", "FRAME_FILL"];
    }
    return ["FRAME_FILL", "SHAPE_FILL"];
  }

  if (type === "borderRadius") return ["CORNER_RADIUS"];
  if (type === "borderWidth") return ["STROKE_FLOAT"];
  if (type === "spacing" || joined.includes("gap") || joined.includes("space"))
    return ["GAP"];
  if (type === "fontSizes") return ["FONT_SIZE"];
  if (type === "lineHeights") return ["LINE_HEIGHT"];
  if (type === "letterSpacing") return ["LETTER_SPACING"];
  if (type === "paragraphSpacing") return ["PARAGRAPH_SPACING"];
  if (type === "opacity") return ["OPACITY"];

  return [];
}

function buildPayload() {
  const light = flattenTokens(readJson(LIGHT_TOKENS));
  const darkByPath = new Map(
    flattenTokens(readJson(DARK_TOKENS)).map((token) => [
      token.path.join("/"),
      token,
    ]),
  );

  const variables = [];
  const styleOnly = [];

  for (const token of light) {
    const canonicalName = token.path.join("/");
    const darkToken = darkByPath.get(canonicalName);
    const figmaType = FIGMA_VARIABLE_TYPES.get(token.type) ?? null;
    const record = {
      canonicalName,
      figmaName: token.path.slice(1).join("/") || canonicalName,
      collection: collectionFor(token.path),
      sourceType: token.type,
      figmaType,
      cssVariable: cssVariableName(token.path),
      syntax: {
        web: `var(${cssVariableName(token.path)})`,
        ios: toCamelCase(token.path),
        android: toCamelCase(token.path),
      },
      suggestedScopes: scopesFor(token),
      values: {
        light: normalizeValue(token),
        dark: normalizeValue(darkToken ?? token),
      },
    };

    if (figmaType && !STYLE_ONLY_TYPES.has(token.type)) {
      variables.push(record);
    } else {
      styleOnly.push(record);
    }
  }

  const bySourceType = [...variables, ...styleOnly].reduce((acc, token) => {
    acc[token.sourceType] = (acc[token.sourceType] ?? 0) + 1;
    return acc;
  }, {});

  const payload = {
    generatedAt: new Date().toISOString(),
    target: {
      // Not the library's key: it came from whoever's .env ran this, so the
      // file changed with the machine. Nothing reads it; the plugin imports
      // into the file it runs in.
      fileKey: null,
      fileName: "Kozmos DS - Core Library",
      modes: ["Light", "Dark"],
    },
    sources: {
      lightTokens: path.relative(ROOT, LIGHT_TOKENS),
      darkTokens: path.relative(ROOT, DARK_TOKENS),
    },
    collections: [
      { name: "Kozmos Primitives", modes: ["Light", "Dark"] },
      { name: "Kozmos Semantics", modes: ["Light", "Dark"] },
      { name: "Kozmos Components", modes: ["Light", "Dark"] },
      { name: "Kozmos Effects", modes: ["Light", "Dark"] },
    ],
    pages: [
      "Cover",
      "Getting Started",
      "Foundations",
      "Components",
      "Utilities",
      "Archive / Legacy Reference",
    ],
    summary: {
      totalTokens: variables.length + styleOnly.length,
      variableTokens: variables.length,
      styleOnlyTokens: styleOnly.length,
      bySourceType,
      note: "Variables REST is unavailable without file_variables:read, so this payload is intended for a Figma plugin/MCP import path.",
    },
    variables,
    styleOnly,
  };

  return payload;
}

const payload = buildPayload();
// CI runs --check: the payload went without seven tokens from 2026-09-28 to
// 10-05 because nothing compared it with the tokens it is built from.
if (process.argv.includes("--check")) {
  if (
    !generatedJsonIsCurrent(OUT_FILE, payload, {
      volatileKeys: ["generatedAt"],
    })
  ) {
    console.error(
      `${path.relative(ROOT, OUT_FILE)} is stale: run \`pnpm figma:foundations\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log(
    `${path.relative(ROOT, OUT_FILE)} is current (${payload.summary.totalTokens} tokens)`,
  );
} else {
  await writeGeneratedJson(OUT_FILE, payload, {
    volatileKeys: ["generatedAt"],
  });
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`Variable tokens: ${payload.summary.variableTokens}`);
  console.log(`Style-only tokens: ${payload.summary.styleOnlyTokens}`);
}
