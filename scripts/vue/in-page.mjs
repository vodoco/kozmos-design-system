/**
 * The readings the Vue browser suites take inside a story's page. Installed
 * before the page's own code (page.addInitScript), as `window.__kozmosVue`;
 * Playwright sends the function's source, so it closes over nothing.
 *
 * It reads the stylesheet as the browser parsed it (CSSOM), so what is
 * checked is what this engine applies: a rule inside `@scope` matches an
 * element when the element's nearest Kozmos root is the scope's root, and
 * `:scope` in its selector is that root, as the shared stylesheet writes
 * every scoped rule (`@scope ([data-kozmos-root]) to ([data-kozmos-root])`,
 * and its dark block `@scope (:scope[data-theme="dark"])` inside). A scope
 * written any other way stops the reading with its prelude, rather than be
 * read wrong.
 */
export function installVueProbes() {
  const ROOT = "[data-kozmos-root]";
  const MARK = "data-kozmos-vue-scope";
  const PSEUDO_ELEMENT =
    /::?(before|after|placeholder|marker|selection|backdrop|first-line|first-letter|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g;

  /** Split at the commas that are not inside parentheses or brackets. */
  function splitTopLevel(text, separator) {
    const parts = [];
    let depth = 0;
    let quote = null;
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (c === separator && depth === 0) {
        parts.push(text.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(text.slice(start));
    return parts.map((part) => part.trim()).filter(Boolean);
  }

  /** `prop: value` pairs of a declaration block, shorthands as written. */
  function declarations(cssText) {
    return splitTopLevel(cssText, ";")
      .map((pair) => {
        const colon = pair.indexOf(":");
        return colon < 0
          ? null
          : {
              property: pair.slice(0, colon).trim(),
              value: pair
                .slice(colon + 1)
                .replace(/!important\s*$/, "")
                .trim(),
            };
      })
      .filter(Boolean);
  }

  /**
   * Each var() a value reads, outermost first: its name, and the fallback's
   * text when it gives one (a var() inside a fallback is read only if the
   * outer name is missing).
   */
  function varReferences(value) {
    const found = [];
    let at = 0;
    while ((at = value.indexOf("var(", at)) >= 0) {
      let depth = 0;
      let end = at + 3;
      for (; end < value.length; end++) {
        if (value[end] === "(") depth++;
        else if (value[end] === ")" && --depth === 0) break;
      }
      const inner = value.slice(at + 4, end);
      const comma = splitTopLevel(inner, ",");
      const name = comma[0];
      const fallback = inner.includes(",")
        ? inner.slice(inner.indexOf(",") + 1)
        : null;
      found.push({ name, fallback });
      at = end + 1;
    }
    return found;
  }

  function preludeOf(rule) {
    const text = rule.cssText.slice(0, rule.cssText.indexOf("{"));
    const match = /^@scope\s*(?:\((.*?)\))?\s*(?:to\s*\((.*)\))?\s*$/.exec(
      text.trim(),
    );
    return match
      ? { start: (match[1] ?? "").trim(), end: (match[2] ?? "").trim() }
      : null;
  }

  /**
   * Every style rule this page applies, flattened: its selector parts with
   * pseudo-elements removed (a ::before rule is read on its element), its
   * declarations, whether it is in a Kozmos scope (and the dark one), and
   * whether it is an owned rule (outside @scope, naming a .kozmos- class).
   */
  function readRules() {
    const rules = [];
    const visit = (list, scope, sheet) => {
      for (const rule of list) {
        const kind = rule.constructor.name;
        if (kind === "CSSStyleRule") {
          const parts = splitTopLevel(rule.selectorText, ",").map((part) => ({
            text: part,
            pseudo: (part.match(PSEUDO_ELEMENT) ?? [])[0] ?? null,
            match: part.replace(PSEUDO_ELEMENT, "").trim() || "*",
          }));
          rules.push({
            selector: rule.selectorText,
            parts,
            declarations: declarations(rule.style.cssText),
            scope,
            owned: !scope && /\.kozmos-/.test(rule.selectorText),
            sheet,
          });
          if (rule.cssRules?.length) visit(rule.cssRules, scope, sheet);
        } else if (kind === "CSSScopeRule") {
          const prelude = preludeOf(rule);
          let next;
          if (!scope && prelude?.start === ROOT && prelude.end === ROOT)
            next = { dark: false };
          else if (
            scope &&
            !scope.dark &&
            /^:scope\[data-theme=["']?dark["']?\]$/.test(
              prelude?.start ?? "",
            ) &&
            prelude.end === ROOT
          )
            next = { dark: true };
          else
            throw new Error(
              `The Vue suites do not read this scope: ${rule.cssText.slice(0, rule.cssText.indexOf("{"))} (scripts/vue/in-page.mjs)`,
            );
          visit(rule.cssRules, next, sheet);
        } else if (kind === "CSSMediaRule") {
          if (matchMedia(rule.media.mediaText).matches)
            visit(rule.cssRules, scope, sheet);
        } else if (kind === "CSSSupportsRule") {
          if (CSS.supports(rule.conditionText))
            visit(rule.cssRules, scope, sheet);
        } else if (
          kind === "CSSLayerBlockRule" ||
          kind === "CSSContainerRule"
        ) {
          visit(rule.cssRules, scope, sheet);
        }
      }
    };
    for (const sheet of document.styleSheets) {
      let list;
      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }
      visit(list, null, sheet);
    }
    return rules;
  }

  let cachedRules = null;
  const rulesNow = () => (cachedRules ??= readRules());

  /** Whether `element` matches one of a rule's parts, :scope being its root. */
  function partsMatching(element, rule, root) {
    if (rule.scope) {
      if (!root) return [];
      if (rule.scope.dark && root.getAttribute("data-theme") !== "dark")
        return [];
    }
    const hits = [];
    for (const part of rule.parts) {
      const selector = rule.scope
        ? part.match.replaceAll(":scope", `[${MARK}]`)
        : part.match;
      try {
        if (element.matches(selector)) hits.push(part);
      } catch {
        // A selector this engine does not parse (another engine's prefix).
      }
    }
    return hits;
  }

  /**
   * The rules each element matches, as `{ rule, pseudo, part }` (the
   * selector part it matched): the element's nearest root is marked while
   * its elements are matched, so a scoped selector's :scope is that root and
   * no farther one.
   */
  function matchedRules(elements, filter = () => true) {
    const rules = rulesNow().filter(filter);
    const byRoot = new Map();
    for (const element of elements) {
      const root = element.closest(ROOT);
      if (!byRoot.has(root)) byRoot.set(root, []);
      byRoot.get(root).push(element);
    }
    const out = new Map(elements.map((element) => [element, []]));
    for (const [root, group] of byRoot) {
      root?.setAttribute(MARK, "");
      try {
        for (const element of group)
          for (const rule of rules)
            for (const part of partsMatching(element, rule, root))
              out.get(element).push({ rule, pseudo: part.pseudo, part });
      } finally {
        root?.removeAttribute(MARK);
      }
    }
    return out;
  }

  /**
   * Storybook's own chrome in its preview page (iframe.html), each named
   * exactly: the four status panels the page is served with (preparing a
   * story, preparing docs, no preview, the error display), each a child of
   * <body> that is a `div.sb-wrapper` with its own class and no other, and
   * the two mount points, `#storybook-root` and `#storybook-docs`, as boxes
   * of their own (what a story mounts in them is the story's). Nothing else
   * in <body> is Storybook's: a Teleport to <body>, a bridged React part's
   * portal that found no Kozmos root (React's ThemePortal falls back to
   * <body>), anything a story or a part appends, is drawn by the story.
   */
  const STORYBOOK_PANELS = [
    "sb-preparing-story",
    "sb-preparing-docs",
    "sb-nopreview",
    "sb-errordisplay",
  ];
  const isStorybookPanel = (element) =>
    element.parentElement === document.body &&
    element.tagName === "DIV" &&
    element.classList.length === 2 &&
    element.classList.contains("sb-wrapper") &&
    STORYBOOK_PANELS.some((name) => element.classList.contains(name));
  const isStorybookMount = (element) =>
    element.parentElement === document.body &&
    element.tagName === "DIV" &&
    (element.id === "storybook-root" || element.id === "storybook-docs");

  /** Whether an element has text of its own (not only its children's). */
  const hasOwnText = (element) =>
    [...element.childNodes].some(
      (node) => node.nodeType === 3 && node.textContent.trim(),
    );

  /** Whether a `display: contents` element's own text draws (it has no box of its own). */
  function contentsTextDrawn(element) {
    for (const node of element.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      if (box.width >= 1 && box.height >= 1) return true;
    }
    return false;
  }

  /**
   * What a story draws: every element in <body> that draws (a box of a pixel
   * or more, or a `display: contents` element's own text), but Storybook's
   * chrome (above) and what is never drawn (script, style, template,
   * noscript).
   */
  function drawn() {
    const panels = [...document.body.children].filter(isStorybookPanel);
    const out = [];
    for (const element of document.body.querySelectorAll("*")) {
      if (element.closest("script, style, template, noscript")) continue;
      if (isStorybookMount(element)) continue;
      if (panels.some((panel) => panel.contains(element))) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (style.display === "contents") {
        if (contentsTextDrawn(element)) out.push(element);
        continue;
      }
      const box = element.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) continue;
      out.push(element);
    }
    return out;
  }

  /** A short, stable name for an element in a failure message. */
  function describe(element) {
    const parts = [];
    for (
      let at = element;
      at && at.id !== "storybook-root" && at !== document.body;
      at = at.parentElement
    ) {
      const kozmos = [...at.classList].filter((c) => c.startsWith("kozmos-"));
      const name =
        at.tagName.toLowerCase() +
        (kozmos.length ? `.${kozmos.slice(0, 2).join(".")}` : "") +
        (at.getAttribute("role") ? `[role=${at.getAttribute("role")}]` : "");
      parts.unshift(name);
      if (parts.length === 4) break;
    }
    const text = element.textContent?.trim().slice(0, 24);
    return parts.join(" > ") + (text ? ` "${text}"` : "");
  }

  /**
   * Every var() a drawn element reads that resolves to nothing: from the
   * rules it matches and its own style attribute, a name with no value on
   * the element and no fallback (or a fallback that is itself unresolved).
   */
  function unresolvedReferences() {
    const elements = drawn();
    const matched = matchedRules(elements, (rule) =>
      rule.declarations.some((d) => d.value.includes("var(")),
    );
    const problems = [];
    let reads = 0;
    for (const element of elements) {
      const style = getComputedStyle(element);
      const sources = [
        ...matched.get(element).map(({ rule }) => ({
          from: rule.selector.slice(0, 80),
          declarations: rule.declarations,
        })),
        {
          from: "its style attribute",
          declarations: declarations(element.style.cssText),
        },
      ];
      for (const { from, declarations: list } of sources)
        for (const { property, value } of list) {
          const missing = (text) => {
            for (const { name, fallback } of varReferences(text)) {
              reads++;
              if (style.getPropertyValue(name).trim() !== "") continue;
              if (fallback === null) return name;
              const deeper = missing(fallback);
              if (deeper) return deeper;
            }
            return null;
          };
          const name = missing(value);
          if (name)
            problems.push({
              name,
              message: `${describe(element)}: ${property} reads ${name}, which is not set there (${from})`,
            });
        }
    }
    return { problems, reads, elements: elements.length };
  }

  /** A computed colour as sRGB channels 0–1 and alpha, through a canvas when need be. */
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  function readColour(text) {
    const legacy = text.match(
      /^rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\)$/,
    );
    if (legacy) {
      const alpha =
        legacy[4] === undefined
          ? 1
          : legacy[4].endsWith("%")
            ? parseFloat(legacy[4]) / 100
            : Number(legacy[4]);
      return {
        r: legacy[1] / 255,
        g: legacy[2] / 255,
        b: legacy[3] / 255,
        a: alpha,
      };
    }
    const srgb = text.match(
      /^color\(srgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)(?: \/ ([\d.e+-]+))?\)$/,
    );
    if (srgb)
      return {
        r: Number(srgb[1]),
        g: Number(srgb[2]),
        b: Number(srgb[3]),
        a: srgb[4] === undefined ? 1 : Number(srgb[4]),
      };
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillStyle = text;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return a === 0
      ? { r: 0, g: 0, b: 0, a: 0 }
      : { r: r / 255, g: g / 255, b: b / 255, a: a / 255 };
  }

  const COLOUR_IN_TEXT =
    /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\((?:[^()]|\([^()]*\))*\)/g;

  const close = (x, y, by) => Math.abs(x - y) <= by;
  /** Two colours that are the same to within rounding. */
  const sameColour = (a, b) =>
    close(a.r, b.r, 0.5 / 255) &&
    close(a.g, b.g, 0.5 / 255) &&
    close(a.b, b.b, 0.5 / 255) &&
    close(a.a, b.a, 0.002);

  /**
   * The one colour the colour checks allow without a colour token, by name:
   * the 1px edge of a glass surface. Design ruling §5.13 makes it a light
   * edge at Semantics.Effect.glass.border.opacity, the same in both themes,
   * as SwiftUI and Compose draw it, and Figma's Effect/glass holds that
   * opacity and no colour: decision 167 allows it here until design adds a
   * colour token (GAP-229, "the glass edge colour has no token").
   *
   * Allowed only as exactly that: a border colour (border-*-color) of the
   * element itself, not a pseudo-element's, on an element carrying a glass
   * class; white (255, 255, 255); at the alpha the opacity token computes
   * to on that element; and, read again with that token alone set to
   * `sentinel` on every Kozmos root, at that alpha too, so the alpha is
   * proven to follow the token. A white written in at the token's alpha
   * (`rgba(255, 255, 255, .2)`) stays put there and fails, as does any
   * other colour at the token's alpha, and the same edge on any other
   * element. `tolerance` is an alpha's read-back, one 8-bit step: 0.2 can
   * come back as 0.198. Every suite that reads colours fails when no story
   * it draws uses the allowance, so it cannot outlive its case.
   */
  const GLASS_EDGE = {
    name: "glass-edge",
    reason:
      "a glass surface's 1px edge is white at Semantics.Effect.glass.border.opacity in both themes, with no colour token for it yet (ruling §5.13, decision 167, GAP-229)",
    classes: ["kozmos-button-glass", "kozmos-surface-glass"],
    property: /^border-(top|right|bottom|left)-color$/,
    token: "--semantics-effect-glass-border-opacity",
    sentinel: 0.37,
    tolerance: 1 / 255,
  };
  const isGlassEdge = (element, pseudo, property) =>
    !pseudo &&
    GLASS_EDGE.property.test(property) &&
    GLASS_EDGE.classes.some((name) => element.classList.contains(name));
  const glassEdgeAlpha = (element) =>
    parseFloat(getComputedStyle(element).getPropertyValue(GLASS_EDGE.token));
  /** Whether a colour is white at `alpha` (a number), to within read-back. */
  const whiteAt = (colour, alpha) =>
    Number.isFinite(alpha) &&
    sameColour({ ...colour, a: 0 }, { r: 1, g: 1, b: 1, a: 0 }) &&
    close(colour.a, alpha, GLASS_EDGE.tolerance);

  /** A value with each colour in it (a shadow's, say) replaced by `by`. */
  function replaceColours(value, by) {
    let out = "";
    let word = "";
    let depth = 0;
    const flush = () => {
      out += word && CSS.supports("color", word) ? by : word;
      word = "";
    };
    for (const c of value) {
      if (c === "(") depth++;
      else if (c === ")") depth--;
      if (depth === 0 && (c === "," || /\s/.test(c))) {
        flush();
        out += c;
      } else word += c;
    }
    flush();
    return out;
  }

  /**
   * A colour no token holds, the same for a name in every page and theme:
   * three sRGB channels, 0.05 to 0.95, from the name's hash, to four
   * places. Two of a theme's few hundred tokens sharing one, or one landing
   * on a token's own colour, is a chance in billions, and the first stops
   * the reading.
   */
  function sentinelChannels(name) {
    let hash = 2166136261;
    for (let i = 0; i < name.length; i++) {
      hash ^= name.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    const channels = [];
    for (let i = 0; i < 3; i++) {
      // `^` gives a signed integer: `>>> 0` keeps each step unsigned, so
      // every channel stays inside sRGB.
      hash = (hash ^ (hash >>> 15)) >>> 0;
      hash = Math.imul(hash, 2246822507) >>> 0;
      hash = (hash ^ (hash >>> 13)) >>> 0;
      channels.push(Number((0.05 + (hash % 9001) / 10000).toFixed(4)));
    }
    return channels;
  }

  // A token written as channels for a colour function to wrap, as
  // `rgba(var(--kozmos-glass-rgb), .7)` reads `255,255,255`: three numbers
  // up to 255, or a hue and two percentages for hsl().
  const RGB_CHANNELS =
    /^(\d{1,3}(?:\.\d+)?)(\s*,\s*|\s+)(\d{1,3}(?:\.\d+)?)\2(\d{1,3}(?:\.\d+)?)$/;
  const HSL_CHANNELS = /^[\d.]+(?:deg)?(\s*,\s*|\s+)[\d.]+%\1[\d.]+%$/;

  /**
   * What stands in for a token's value: a sentinel colour for a colour, the
   * sentinel's channels for channels, and for a value that holds colours (a
   * shadow) the value with the sentinel for each. Null for anything else
   * (a length, a duration, a name).
   */
  function sentinelValue(name, value) {
    const [r, g, b] = sentinelChannels(name);
    if (CSS.supports("color", value)) return `color(srgb ${r} ${g} ${b})`;
    const rgb = RGB_CHANNELS.exec(value);
    if (rgb && [rgb[1], rgb[3], rgb[4]].every((n) => Number(n) <= 255))
      return [r, g, b].map((c) => Math.round(c * 255)).join(rgb[2]);
    const hsl = HSL_CHANNELS.exec(value);
    if (hsl)
      return [
        `${Math.round(r * 360)}`,
        `${Math.round(30 + g * 60)}%`,
        `${Math.round(20 + b * 60)}%`,
      ].join(hsl[1]);
    const replaced = replaceColours(value, `color(srgb ${r} ${g} ${b})`);
    return replaced === value ? null : replaced;
  }

  /** A selector part's subject: its last compound selector. */
  function subjectOf(selector) {
    let depth = 0;
    let start = 0;
    for (let i = 0; i < selector.length; i++) {
      const c = selector[i];
      if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (depth === 0 && /[\s>+~]/.test(c)) start = i + 1;
    }
    return selector.slice(start).trim();
  }

  /**
   * The theme's colour tokens, each with the value that stands in for it
   * (sentinelValue): every custom property a Kozmos root declares for
   * itself, by a rule whose subject names it (the theme's
   * `[data-kozmos-root]` block and its dark one) or on its style attribute
   * (a provider's `tokens`), whose value there is a colour, a colour's
   * channels, or holds colours (a shadow). Left out: what a part's rule
   * declares on its own elements, a rule for every element (`*`), and
   * Tailwind's own `--tw-*`. Those are how a colour is put together, and a
   * colour written into one is the part's, not the theme's.
   */
  function themeTokens() {
    const roots = [...document.querySelectorAll(ROOT)];
    const names = new Set();
    const matched = matchedRules(roots, (rule) =>
      rule.declarations.some(({ property }) => property.startsWith("--")),
    );
    for (const root of roots) {
      for (const { rule, pseudo, part } of matched.get(root))
        if (!pseudo && !subjectOf(part.match).startsWith("*"))
          for (const { property } of rule.declarations)
            if (property.startsWith("--")) names.add(property);
      for (const { property } of declarations(root.style.cssText))
        if (property.startsWith("--")) names.add(property);
    }
    const tokens = new Map();
    const owners = new Map();
    for (const name of [...names].sort()) {
      if (name.startsWith("--tw-")) continue;
      for (const root of roots) {
        const value = getComputedStyle(root).getPropertyValue(name).trim();
        if (!value) continue;
        const stand = sentinelValue(name, value);
        if (stand === null || stand === value) continue;
        const sentinel = sentinelChannels(name).join(" ");
        if (owners.has(sentinel))
          throw new Error(
            `${name} and ${owners.get(sentinel)} hash to one sentinel colour: change sentinelChannels (scripts/vue/in-page.mjs)`,
          );
        owners.set(sentinel, name);
        tokens.set(name, stand);
        break;
      }
    }
    return tokens;
  }

  /** The colours an element paints, by property, skipping what draws nothing. */
  function paintedColours(element, pseudo = null) {
    const style = getComputedStyle(element, pseudo);
    const out = [];
    // A `display: contents` element has no box: only its own text draws.
    if (style.display === "contents") {
      if (!pseudo && hasOwnText(element)) out.push(["color", style.color]);
      return out
        .map(([property, text]) => ({
          property,
          text,
          colour: readColour(text),
        }))
        .filter(({ colour }) => colour.a > 0.001);
    }
    const ownText =
      !pseudo &&
      (hasOwnText(element) ||
        (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) &&
          (element.value ?? "") !== ""));
    if (pseudo && style.content !== "none" && style.content !== "normal") {
      const text = style.content.replace(/^["']|["']$/g, "");
      if (text.trim()) out.push(["color", style.color]);
    }
    if (ownText) out.push(["color", style.color]);
    out.push(["background-color", style.backgroundColor]);
    for (const side of ["top", "right", "bottom", "left"])
      if (
        parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
        !/none|hidden/.test(style.getPropertyValue(`border-${side}-style`))
      )
        out.push([
          `border-${side}-color`,
          style.getPropertyValue(`border-${side}-color`),
        ]);
    if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0)
      out.push(["outline-color", style.outlineColor]);
    if (style.boxShadow && style.boxShadow !== "none")
      for (const [colour] of style.boxShadow.matchAll(COLOUR_IN_TEXT))
        out.push(["box-shadow", colour]);
    if (
      style.textDecorationLine &&
      style.textDecorationLine !== "none" &&
      ownText
    )
      out.push(["text-decoration-color", style.textDecorationColor]);
    if (element instanceof SVGElement && !pseudo)
      for (const property of ["fill", "stroke"]) {
        const value = style.getPropertyValue(property);
        if (value && value !== "none" && !value.startsWith("url("))
          out.push([property, value]);
      }
    return out
      .map(([property, text]) => ({ property, text, colour: readColour(text) }))
      .filter(({ colour }) => colour.a > 0.001);
  }

  /** Each colour the elements paint, keyed by place, pseudo-element and property. */
  function colourReadings(elements) {
    const out = new Map();
    elements.forEach((element, index) => {
      for (const pseudo of [null, "::before", "::after"]) {
        const count = {};
        for (const { property, text, colour } of paintedColours(
          element,
          pseudo,
        )) {
          const nth = (count[property] = (count[property] ?? 0) + 1);
          out.set(
            `${index} ${describe(element)}${pseudo ?? ""} ${property}${nth > 1 ? ` ${nth}` : ""}`,
            { text, colour, element, pseudo, property },
          );
        }
      }
    });
    return out;
  }

  function addStyle(id, css) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.append(style);
    return style;
  }

  /**
   * Where each colour a drawn element paints comes from, keyed by its place,
   * pseudo-element and property. Each is read twice, transitions off: as the
   * page draws it, and with every colour token of the theme (themeTokens)
   * set on every Kozmos root to a sentinel colour of its own. A colour taken
   * from a token moves with it: the token itself, at any alpha, mixed by
   * color-mix(), or reached through currentColor, inherit or another custom
   * property. One that stays put was written in (`#000` text, a `#fff`
   * fill, `rgba(0, 0, 0, .37)`), whatever token happens to hold the same
   * value. `sentinel` is what it reads under the sentinels: one token reads
   * one sentinel in either theme, so a colour that keeps its role across
   * the themes reads the same there in both.
   *
   * A colour that stays put and is a glass edge is read a third time, with
   * the glass edge's opacity token alone set to its sentinel: `allowance`
   * names GLASS_EDGE on one it allows, and `refused` says why on one it
   * does not. `allowances` counts each allowance's readings, none or more.
   */
  function colourProvenance() {
    const elements = drawn();
    const tokens = themeTokens();
    const still = addStyle(
      "kozmos-vue-still",
      "*, *::before, *::after { transition: none !important; }",
    );
    // What `read` returns with `css` added to the page. Each element's style
    // is taken again as before once it is gone, while transitions are still
    // off, so taking it back starts none from the sentinels.
    const under = (id, css, read) => {
      const style = addStyle(id, css);
      try {
        return read();
      } finally {
        style.remove();
        colourReadings(elements);
      }
    };
    try {
      const before = colourReadings(elements);
      const after = under(
        "kozmos-vue-sentinels",
        `${ROOT} { ${[...tokens].map(([name, value]) => `${name}: ${value} !important;`).join(" ")} }`,
        () => colourReadings(elements),
      );
      const colours = {};
      const edges = [];
      for (const [key, { text, colour, element, pseudo, property }] of before) {
        const moved = after.get(key);
        const fromToken = !moved || !sameColour(colour, moved.colour);
        colours[key] = { text, sentinel: moved?.text ?? "nothing", fromToken };
        if (!fromToken && isGlassEdge(element, pseudo, property))
          edges.push({
            key,
            colour,
            element,
            property,
            alpha: glassEdgeAlpha(element),
          });
      }
      // GLASS_EDGE: each glass edge that stays put, read again with its
      // opacity token alone set to the token's sentinel.
      const atSentinel = edges.length
        ? under(
            "kozmos-vue-glass-edge",
            `${ROOT} { ${GLASS_EDGE.token}: ${GLASS_EDGE.sentinel} !important; }`,
            () =>
              edges.map(({ element, property }) => {
                const text =
                  getComputedStyle(element).getPropertyValue(property);
                return {
                  alpha: glassEdgeAlpha(element),
                  text,
                  colour: readColour(text),
                };
              }),
          )
        : [];
      let allowed = 0;
      edges.forEach(({ key, colour, alpha }, i) => {
        const moved = atSentinel[i];
        if (
          whiteAt(colour, alpha) &&
          !close(alpha, GLASS_EDGE.sentinel, GLASS_EDGE.tolerance) &&
          close(moved.alpha, GLASS_EDGE.sentinel, 1e-6) &&
          whiteAt(moved.colour, GLASS_EDGE.sentinel)
        ) {
          colours[key].allowance = GLASS_EDGE.name;
          allowed++;
        } else
          colours[key].refused =
            `${GLASS_EDGE.name} allows a glass edge only as white at ${GLASS_EDGE.token}, following it: the token is ${alpha} here, and set alone to ${GLASS_EDGE.sentinel} it reads ${moved.alpha} and the edge ${moved.text}`;
      });
      return {
        tokens: tokens.size,
        colours,
        allowances: [
          { name: GLASS_EDGE.name, reason: GLASS_EDGE.reason, count: allowed },
        ],
      };
    } finally {
      still.remove();
    }
  }

  /**
   * Every colour a drawn element paints that no colour token of the theme
   * gives it, and that no allowance (GLASS_EDGE) names.
   */
  function hardCodedColours() {
    const { tokens, colours, allowances } = colourProvenance();
    const problems = [];
    for (const [key, { text, fromToken, allowance, refused }] of Object.entries(
      colours,
    ))
      if (!fromToken && !allowance)
        problems.push(
          `${key.slice(key.indexOf(" ") + 1)} is ${text}, and stays ${text} when every colour token of the theme changes: it is written in, not taken from a token${refused ? ` (${refused})` : ""}`,
        );
    return {
      problems,
      colours: Object.keys(colours).length,
      tokens,
      allowances,
    };
  }

  /** Each Kozmos root and portal, with its theme and density marks. */
  function roots() {
    return [...document.querySelectorAll(ROOT)].map((root) => ({
      portal: root.hasAttribute("data-kozmos-portal"),
      theme: root.getAttribute("data-theme"),
      density: root.getAttribute("data-kozmos-density"),
      // The density this root inherits: the nearest mark above it.
      inherited:
        root.parentElement
          ?.closest("[data-kozmos-density]")
          ?.getAttribute("data-kozmos-density") ?? null,
      describe: describe(root),
    }));
  }

  /** The drawn elements that sit in no Kozmos root or portal. */
  function outsideRoots() {
    return drawn()
      .filter((element) => !element.closest(ROOT))
      .map(describe);
  }

  /**
   * Every drawn control whose size reads a density token: the property,
   * the token, the density its nearest mark gives it, the token's value
   * there, the size it is drawn at, and which of `selectors` (a suite's
   * allowances) it matches.
   */
  function densityControls(selectors = []) {
    const sized =
      /^(height|min-height|block-size|min-block-size|width|min-width|inline-size|min-inline-size)$/;
    const elements = drawn();
    const matched = matchedRules(elements, (rule) =>
      rule.declarations.some(
        (d) => sized.test(d.property) && d.value.includes("var(--density-"),
      ),
    );
    const out = [];
    elements.forEach((element, index) => {
      for (const { rule, pseudo } of matched.get(element)) {
        if (pseudo) continue;
        for (const { property, value } of rule.declarations) {
          if (!sized.test(property)) continue;
          const token = /var\((--density-[\w-]+)/.exec(value)?.[1];
          if (!token) continue;
          const box = element.getBoundingClientRect();
          const vertical = /height|block/.test(property);
          out.push({
            key: `${index} ${property}`,
            element: describe(element),
            property,
            token,
            selector: rule.selector.slice(0, 80),
            density:
              element
                .closest("[data-kozmos-density]")
                ?.getAttribute("data-kozmos-density") ?? "touch",
            value: getComputedStyle(element).getPropertyValue(token).trim(),
            rootFontSize: parseFloat(
              getComputedStyle(document.documentElement).fontSize,
            ),
            drawn: vertical ? box.height : box.width,
            minimum: property.startsWith("min-"),
            matches: selectors.filter((selector) => element.matches(selector)),
          });
        }
      }
    });
    return out;
  }

  /** Each `.kozmos-*` class drawn that no rule of any stylesheet names. */
  function unnamedOwnedClasses() {
    const named = new Set();
    for (const rule of rulesNow())
      for (const [, name] of rule.selector.matchAll(/\.(kozmos-[\w-]+)/g))
        named.add(name);
    const problems = [];
    for (const element of drawn())
      for (const name of element.classList)
        if (name.startsWith("kozmos-") && !named.has(name))
          problems.push({
            name,
            message: `${describe(element)}: .${name} is a class no rule names`,
          });
    return problems;
  }

  /**
   * The elements an owned-CSS reading is taken over, fixed once, so the
   * readings before and after the stylesheet changes are of the same
   * elements, whatever the change does to which of them draw.
   */
  let held = null;
  function holdDrawn() {
    held = drawn();
    return held.length;
  }

  /** A shorthand's longhands, as this engine expands it (itself when none). */
  const scratch = document.createElement("div");
  function longhands(property, value) {
    scratch.style.cssText = "";
    scratch.style.setProperty(property, value);
    const names = [...scratch.style];
    return names.length ? names : [property];
  }

  // A declared length the layout resolves (a percentage, auto, a viewport or
  // container unit) computes as the box the page gives it, and a value
  // taken from the parent (inherit, currentColor, em, a relative weight or
  // size) as the parent is drawn: what a host's rules or @scope's utilities
  // do to the page around an element moves both, by design. Only the
  // declarations that compute the same in any page are held.
  const LAYOUT_RESOLVED =
    /^(width|height|min-width|min-height|max-width|max-height|inline-size|block-size|min-inline-size|min-block-size|max-inline-size|max-block-size|top|right|bottom|left|inset|inset-[\w-]+|margin|margin-[\w-]+|padding|padding-[\w-]+|translate|transform|transform-origin|flex-basis)$/;
  const RESOLVED_BY_LAYOUT =
    /%|\bauto\b|\d(?:v[hwbi]|vmin|vmax|dv[hw]|sv[hw]|lv[hw]|cq[whib])\b/;
  const FROM_THE_PARENT =
    /\binherit\b|\bunset\b|\brevert(?:-layer)?\b|currentcolor|\d(?:em|ex|ch|lh|cap)\b|\b(?:bolder|lighter|larger|smaller)\b/i;
  const relative = (property, value) =>
    FROM_THE_PARENT.test(value) ||
    (LAYOUT_RESOLVED.test(property) && RESOLVED_BY_LAYOUT.test(value));

  /**
   * What the owned rules (outside @scope, naming a .kozmos- class) declare
   * for each held element, as computed now, by longhand: `{ key: { value,
   * selector, declared, contested } }`, keyed by the element's place, its
   * pseudo-element and the longhand. `contested` says a rule inside @scope
   * that the element matches declares the same longhand: a utility a part
   * or its caller adds over the owned rule, which goes with @scope.
   */
  function ownedDeclarations() {
    const elements = held ?? drawn();
    const matched = matchedRules(
      elements,
      (rule) => rule.owned || !!rule.scope,
    );
    const out = {};
    elements.forEach((element, index) => {
      const scoped = new Set();
      for (const { rule, pseudo } of matched.get(element))
        if (rule.scope)
          for (const { property, value } of rule.declarations)
            if (!property.startsWith("--"))
              for (const longhand of longhands(property, value))
                scoped.add(
                  `${pseudo ? pseudo.replace(/^:+/, "::") : ""} ${longhand}`,
                );
      for (const { rule, pseudo } of matched.get(element)) {
        if (!rule.owned) continue;
        for (const { property, value } of rule.declarations) {
          if (property.startsWith("--")) continue;
          const pseudoName = pseudo ? pseudo.replace(/^:+/, "::") : null;
          if (pseudoName && !/^::(before|after)$/.test(pseudoName)) continue;
          const style = getComputedStyle(element, pseudoName);
          for (const longhand of longhands(property, value)) {
            if (relative(longhand, value)) continue;
            const key = `${index} ${describe(element)}${pseudoName ?? ""} ${longhand}`;
            out[key] = {
              value: style.getPropertyValue(longhand),
              selector: rule.selector.slice(0, 80),
              declared: `${property}: ${value}`.slice(0, 120),
              contested: scoped.has(`${pseudoName ?? ""} ${longhand}`),
            };
          }
        }
      }
    });
    return out;
  }

  /** A host page's own rules for its bare elements, loaded before Kozmos's. */
  function addHostRules(css) {
    const style = document.createElement("style");
    style.id = "kozmos-vue-host-rules";
    style.textContent = css;
    // Before every stylesheet, as a host's own CSS loads before a package's.
    document.head.prepend(style);
    cachedRules = null;
  }
  function removeHostRules() {
    document.getElementById("kozmos-vue-host-rules")?.remove();
    cachedRules = null;
  }

  /** Removes every @scope rule from every stylesheet, as WebKit drops them for a field. */
  function removeScopedRules() {
    let removed = 0;
    for (const sheet of document.styleSheets) {
      let list;
      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }
      for (let i = list.length - 1; i >= 0; i--)
        if (list[i].constructor.name === "CSSScopeRule") {
          sheet.deleteRule(i);
          removed++;
        }
    }
    cachedRules = null;
    return removed;
  }

  // Every click the page receives, by the control it lands on, for the
  // interaction suite: a press that fires no click, or two, is read here.
  const clicks = [];
  addEventListener(
    "click",
    (event) => {
      const control = event.target.closest?.(
        "button, a, input, textarea, select, [role]",
      );
      clicks.push(control ? describe(control) : describe(event.target));
    },
    true,
  );

  /** The look of a control: what a hover, a focus or a press may change. */
  function look(element) {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      background: `${style.backgroundColor} ${style.backgroundImage}`,
      border: `${style.borderTopColor} ${style.borderTopWidth}`,
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor} ${style.outlineOffset}`,
      shadow: style.boxShadow,
      decoration: style.textDecorationLine,
      opacity: style.opacity,
    };
  }

  window.__kozmosVue = {
    clicks,
    look,
    describe,
    drawn,
    roots,
    outsideRoots,
    unresolvedReferences,
    hardCodedColours,
    densityControls,
    unnamedOwnedClasses,
    colourProvenance,
    holdDrawn,
    addHostRules,
    removeHostRules,
    ownedDeclarations,
    removeScopedRules,
    reset: () => {
      cachedRules = null;
    },
  };
}
