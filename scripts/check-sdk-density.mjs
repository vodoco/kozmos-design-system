/**
 * SDK parts keep the SDK's touch geometry under any density (decision 82,
 * Olcay 15 Oct): a compact page, such as Pointr Cloud, can show an SDK part
 * and it draws as the apps draw it. Every SDK story is loaded twice, touch and
 * compact, and every element of each SDK part, and everything open in the
 * portals, must have the same size and place in both.
 *
 * A part keeps touch by rendering its root as <DensityScope density="touch"
 * asChild>, which marks it data-kozmos-density="touch" and holds the providers
 * nested in it and the popovers it opens at touch. The static half reads every
 * SDK part's source: each way its render returns must be such a root. The
 * check also confirms the compact load really was compact (the story's
 * provider says so), and a control strips the marks from one story and
 * expects it to change, or a pass would prove nothing.
 *
 *   pnpm --filter @kozmos-ds/docs build-storybook
 *   STORYBOOK_URL=http://127.0.0.1:<port> node scripts/check-sdk-density.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const ts = createRequire(
  path.join(process.cwd(), "packages/react/package.json"),
)("typescript");

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const response = await fetch(`${base}/index.json`);
assert(response.ok, `Storybook index is unavailable at ${base}`);
const stories = Object.values((await response.json()).entries).filter(
  (entry) =>
    entry.type === "story" &&
    entry.title.startsWith("SDK/") &&
    !entry.tags?.includes("no-visual"),
);
assert(stories.length > 0, "no SDK stories found");

const still = `*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}`;
const grey = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN4+P/ffwAJhgPdJDWOdgAAAABJRU5ErkJggg==",
  "base64",
);

async function geometry(page, id, density, { strip = false } = {}) {
  await page.goto(
    `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:light;density:${density};a11y.manual:!true`,
  );
  const shown = await page.waitForFunction(() => {
    const state = document.body.classList;
    if (state.contains("sb-show-errordisplay")) return "the error display";
    if (state.contains("sb-show-nopreview")) return "no preview";
    return state.contains("sb-show-main") &&
      !state.contains("sb-show-preparing-story")
      ? "the story"
      : false;
  });
  assert.equal(await shown.jsonValue(), "the story", `${id} did not render`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (strip)
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          for (const element of document.querySelectorAll(
            '[data-kozmos-density="touch"]:not([data-kozmos-root])',
          ))
            element.removeAttribute("data-kozmos-density");
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
    );
  return page.evaluate(() => {
    const provider = document.querySelector(
      "#storybook-root [data-kozmos-root]",
    );
    const label = (element) =>
      element.getAttribute("aria-label") ??
      element.getAttribute("data-testid") ??
      [...element.classList].find((name) => name.startsWith("kozmos-")) ??
      element.tagName.toLowerCase();
    const round = (values) => values.map((value) => Math.round(value * 2) / 2);
    // Each SDK part marks its root touch. Where a story has them, compare
    // each part from its own corner, so the story's own controls around it
    // (correctly compact) cannot move it; a story without one is compared
    // whole.
    const parts = [
      ...document.querySelectorAll(
        '#storybook-root [data-kozmos-density="touch"]:not([data-kozmos-root])',
      ),
    ].filter(
      (element) =>
        !element.parentElement?.closest(
          '[data-kozmos-density="touch"]:not([data-kozmos-root])',
        ),
    );
    const boxes = [];
    let portals = 0;
    const measure = (root, origin) => {
      for (const element of root.querySelectorAll("*")) {
        const box = element.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue;
        boxes.push({
          label: label(element),
          rect: round([
            box.x - origin.x,
            box.y - origin.y,
            box.width,
            box.height,
          ]),
        });
      }
    };
    if (parts.length) {
      for (const part of parts) {
        const box = part.getBoundingClientRect();
        boxes.push({
          label: `part ${label(part)}`,
          rect: round([0, 0, box.width, box.height]),
        });
        measure(part, box);
      }
      // What the portals hold, each from its own corner: an SDK part's
      // popover opens at the part's density, wherever the page puts it.
      for (const element of document.querySelectorAll(
        "body > [data-kozmos-portal] > *",
      )) {
        const box = element.getBoundingClientRect();
        if (box.width === 0 && box.height === 0) continue;
        portals += 1;
        boxes.push({
          label: `portal ${label(element)}`,
          rect: round([0, 0, box.width, box.height]),
        });
        measure(element, box);
      }
    } else {
      for (const root of [
        document.querySelector("#storybook-root"),
        ...document.querySelectorAll("body > [data-kozmos-portal]"),
      ].filter(Boolean))
        measure(root, { x: 0, y: 0 });
    }
    return {
      density: provider?.getAttribute("data-kozmos-density"),
      parts: parts.length,
      portals,
      boxes,
    };
  });
}

// The static half: every SDK part's root is a touch DensityScope, on every
// way its render returns, so a part or a path the stories don't reach is held
// too. A provider that renders no element may sit around it, a fragment's
// elements are each held (or hidden), and a returned variable is followed to
// its value. Nothing in a part marks a density by hand: a bare attribute
// would hold the CSS but not the providers and popovers inside.
const COMPONENTS = path.join(process.cwd(), "packages/react/src/components");
const unheld = [];
let parts = 0;
const unwrap = (node) => {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
};
const tagOf = (node, sf) =>
  (ts.isJsxElement(node) ? node.openingElement : node).tagName.getText(sf);
const attribute = (node, name, sf) =>
  (ts.isJsxElement(node)
    ? node.openingElement
    : node
  ).attributes.properties.find(
    (property) =>
      ts.isJsxAttribute(property) && property.name.getText(sf) === name,
  );
function held(node, sf, scope, seen = new Set()) {
  node = unwrap(node);
  if (!node || node.kind === ts.SyntaxKind.NullKeyword) return [];
  if (ts.isIdentifier(node)) {
    if (seen.has(node.text)) return [];
    seen.add(node.text);
    let value = null;
    const find = (child) => {
      if (
        ts.isVariableDeclaration(child) &&
        child.name.getText(sf) === node.text &&
        child.initializer
      )
        value = child.initializer;
      ts.forEachChild(child, find);
    };
    find(scope);
    return value
      ? held(value, sf, scope, seen)
      : [`returns ${node.text}, which can't be followed`];
  }
  if (ts.isConditionalExpression(node))
    return [
      ...held(node.whenTrue, sf, scope, seen),
      ...held(node.whenFalse, sf, scope, seen),
    ];
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
  )
    return held(node.right, sf, scope, seen);
  if (ts.isJsxFragment(node))
    return node.children.flatMap((child) => {
      if (ts.isJsxText(child)) return [];
      if (ts.isJsxExpression(child))
        return child.expression ? held(child.expression, sf, scope, seen) : [];
      if (
        (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) &&
        attribute(child, "hidden", sf)
      )
        return [];
      return held(child, sf, scope, seen);
    });
  if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node))
    return [`returns ${ts.SyntaxKind[node.kind]}, which can't be read`];
  // Hidden, it has no geometry to hold.
  if (attribute(node, "hidden", sf)) return [];
  const tag = tagOf(node, sf);
  if (tag === "DensityScope") {
    const density = attribute(node, "density", sf)?.initializer?.getText(sf);
    const asChild = attribute(node, "asChild", sf);
    return density === '"touch"' && asChild
      ? []
      : [
          `a DensityScope with density ${density ?? "unset"}${asChild ? "" : " and no asChild"}`,
        ];
  }
  // A context provider renders no element: look inside.
  if (/Provider$/.test(tag) && ts.isJsxElement(node)) {
    const children = node.children.filter((child) =>
      ts.isJsxText(child)
        ? child.text.trim()
        : !ts.isJsxExpression(child) || child.expression,
    );
    return children.length === 1
      ? held(
          ts.isJsxExpression(children[0])
            ? children[0].expression
            : children[0],
          sf,
          scope,
          seen,
        )
      : [`<${tag}> holds ${children.length} children`];
  }
  // A part of the same file: its own render must hold its root.
  const inner = /^[A-Z]\w*$/.test(tag) && !seen.has(tag) && renderOf(sf, tag);
  if (inner) {
    seen.add(tag);
    return returnsOf(inner).flatMap((expression) =>
      held(expression, sf, inner, seen),
    );
  }
  return [
    `returns <${tag}> at line ${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`,
  ];
}
function returnsOf(render) {
  const returns = [];
  if (render.body && !ts.isBlock(render.body)) returns.push(render.body);
  const walk = (node) => {
    if (node !== render && ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node) && node.expression)
      returns.push(node.expression);
    ts.forEachChild(node, walk);
  };
  if (render.body && ts.isBlock(render.body)) walk(render.body);
  return returns;
}
function renderOf(sf, name) {
  let render = null;
  const find = (node) => {
    if (render) return;
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sf) === name &&
      node.initializer
    ) {
      let init = node.initializer;
      while (
        init &&
        !ts.isArrowFunction(init) &&
        !ts.isFunctionExpression(init)
      )
        init = ts.isCallExpression(init)
          ? init.arguments.find(
              (argument) =>
                ts.isArrowFunction(argument) ||
                ts.isFunctionExpression(argument) ||
                ts.isCallExpression(argument),
            )
          : ts.isAsExpression(init) || ts.isParenthesizedExpression(init)
            ? init.expression
            : null;
      render = init ?? null;
    }
    if (ts.isFunctionDeclaration(node) && node.name?.getText(sf) === name)
      render = node;
    ts.forEachChild(node, find);
  };
  find(sf);
  return render;
}
for (const name of fs.readdirSync(COMPONENTS).sort()) {
  const dir = path.join(COMPONENTS, name);
  const source = path.join(dir, `${name}.tsx`);
  const story = path.join(dir, `${name}.stories.tsx`);
  if (!fs.existsSync(source) || !fs.existsSync(story)) continue;
  if (!/title:\s*"SDK\//.test(fs.readFileSync(story, "utf8"))) continue;
  parts += 1;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.tsx?$/.test(file) || /\.(test|stories|figma)\.tsx?$/.test(file))
      continue;
    if (
      /data-kozmos-density=/.test(fs.readFileSync(path.join(dir, file), "utf8"))
    )
      unheld.push(`${name}: ${file} marks a density by hand`);
  }
  const text = fs.readFileSync(source, "utf8");
  const sf = ts.createSourceFile(
    source,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const render = renderOf(sf, name);
  if (!render) {
    unheld.push(`${name}: no render function named ${name}`);
    continue;
  }
  const returns = returnsOf(render);
  if (!returns.length) unheld.push(`${name}: its render returns nothing`);
  for (const expression of returns)
    for (const problem of held(expression, sf, render))
      unheld.push(`${name}: ${problem}, not a touch DensityScope root`);
}

const browser = await launchFixtureBrowser();
const failures = [];
let compared = 0;
// The stories with something open in a portal (FloorSelector's open list):
// none would leave the portal comparison unproven.
let withPortals = 0;
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await context.addInitScript((css) => {
    const install = () => {
      if (!document.documentElement) return false;
      const style = document.createElement("style");
      style.textContent = css;
      document.documentElement.append(style);
      return true;
    };
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document, { childList: true });
  }, still);
  // Nothing from outside this Storybook: a map server, a font or a photo
  // could load in one pass and not the other.
  await context.route("**/*", (route) => {
    const request = route.request();
    if (request.url().startsWith(base)) return route.continue();
    if (request.resourceType() === "image")
      return route.fulfill({ contentType: "image/png", body: grey });
    return route.abort();
  });
  const page = await context.newPage();
  for (const story of stories) {
    const touch = await geometry(page, story.id, "touch");
    const compact = await geometry(page, story.id, "compact");
    compared += 1;
    if (compact.portals) withPortals += 1;
    if (compact.density !== "compact") {
      failures.push(
        `${story.id}: the compact load's provider says ${compact.density}`,
      );
      continue;
    }
    const differences = [];
    const length = Math.max(touch.boxes.length, compact.boxes.length);
    for (let index = 0; index < length; index += 1) {
      const a = touch.boxes[index];
      const b = compact.boxes[index];
      if (!a || !b || a.label !== b.label) {
        differences.push(
          `element ${index}: ${a?.label ?? "(none)"} in touch, ${b?.label ?? "(none)"} in compact`,
        );
        break;
      }
      if (a.rect.some((value, axis) => Math.abs(value - b.rect[axis]) > 0.5))
        differences.push(
          `${a.label} [x, y, w, h] ${JSON.stringify(a.rect)} in touch, ${JSON.stringify(b.rect)} in compact`,
        );
    }
    if (differences.length)
      failures.push(
        `${story.id}: ${differences.length} element(s) moved or resized, first ${differences.slice(0, 2).join("; ")}`,
      );
  }
  // The control: with the marks stripped, an SDK part with a Core button
  // must change under compact, or a pass above would prove nothing.
  const control = stories.find(
    (story) => story.id === "product-sdk-poidetailpanel--inline",
  );
  if (!control) failures.push("the control story is missing");
  else {
    const touch = await geometry(page, control.id, "touch", { strip: true });
    const compact = await geometry(page, control.id, "compact", {
      strip: true,
    });
    compared += 1;
    const same = JSON.stringify(touch.boxes) === JSON.stringify(compact.boxes);
    if (same)
      failures.push(
        `${control.id}: unmarked, it should change under compact and did not; the comparison is blind`,
      );
  }
} finally {
  await browser.close();
}

failures.push(...unheld);
if (withPortals === 0)
  failures.push(
    "no SDK story had anything open in a portal: the portal comparison is blind",
  );
if (failures.length) {
  console.error(
    `FAIL SDK density: ${failures.length} of ${compared} SDK stories change under compact\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS SDK density: all ${compared} SDK stories draw every SDK part, and what their portals hold, at the same size, with every element in the same place, in a compact provider as in a touch one, ${withPortals} of them with a popover open; all ${parts} SDK parts return a touch DensityScope root on every path`,
);
