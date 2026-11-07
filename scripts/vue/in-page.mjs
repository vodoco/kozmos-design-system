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
   * The rules each element matches, as `{ element, rule, pseudo }`: the
   * element's nearest root is marked while its elements are matched, so a
   * scoped selector's :scope is that root and no farther one.
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
              out.get(element).push({ rule, pseudo: part.pseudo });
      } finally {
        root?.removeAttribute(MARK);
      }
    }
    return out;
  }

  /** What a story draws: its root's elements and every Kozmos portal's. */
  function drawn() {
    const story = document.querySelector("#storybook-root");
    const scopes = [
      ...(story ? story.children : []),
      ...document.querySelectorAll("[data-kozmos-portal]"),
    ];
    const out = [];
    const seen = new Set();
    for (const scope of scopes)
      for (const element of [scope, ...scope.querySelectorAll("*")]) {
        if (element.closest("script, style, template, noscript")) continue;
        if (seen.has(element)) continue;
        seen.add(element);
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") continue;
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

  /** Every custom property any stylesheet or style attribute declares. */
  function customPropertyNames() {
    const names = new Set();
    for (const rule of rulesNow())
      for (const { property } of rule.declarations)
        if (property.startsWith("--")) names.add(property);
    for (const element of document.querySelectorAll("[style]"))
      for (const { property } of declarations(element.style.cssText))
        if (property.startsWith("--")) names.add(property);
    return [...names];
  }

  /**
   * The colours of every token where `root` is: each custom property's
   * value, and each colour written inside one (a shadow's), as the browser
   * computes them, with the tokens that hold each.
   */
  const palettes = new Map();
  function paletteOf(root) {
    if (palettes.has(root)) return palettes.get(root);
    const probe = document.createElement("span");
    probe.className = "kozmos-reset";
    (root ?? document.body).append(probe);
    const style = getComputedStyle(root ?? document.documentElement);
    const palette = [];
    const add = (value, token) => {
      probe.style.color = "";
      probe.style.color = value;
      if (!probe.style.color) return;
      const colour = readColour(getComputedStyle(probe).color);
      palette.push({ ...colour, token });
    };
    for (const name of customPropertyNames()) {
      const value = style.getPropertyValue(name).trim();
      if (!value) continue;
      if (CSS.supports("color", value)) add(value, name);
      else
        for (const [inner] of value.matchAll(COLOUR_IN_TEXT)) add(inner, name);
    }
    probe.remove();
    palettes.set(root, palette);
    return palette;
  }

  const close = (x, y, by = 1.01 / 255) => Math.abs(x - y) <= by;
  const sameRgb = (c, p, by) =>
    close(c.r, p.r, by) && close(c.g, p.g, by) && close(c.b, p.b, by);

  /**
   * The token a colour is, where `root` is: the same colour, or the same
   * colour at a lower alpha (a token with an alpha modifier). Null when no
   * token holds it.
   */
  function tokenFor(colour, root) {
    const palette = paletteOf(root);
    const exact = palette.find(
      (p) => sameRgb(colour, p) && close(colour.a, p.a, 0.01),
    );
    if (exact) return exact.token;
    const faded = palette.find(
      (p) => sameRgb(colour, p, 2.01 / 255) && colour.a <= p.a + 0.01,
    );
    return faded ? `${faded.token} at ${colour.a.toFixed(2)}` : null;
  }

  /** The colours an element paints, by property, skipping what draws nothing. */
  function paintedColours(element, pseudo = null) {
    const style = getComputedStyle(element, pseudo);
    const out = [];
    const ownText =
      !pseudo &&
      ([...element.childNodes].some(
        (node) => node.nodeType === 3 && node.textContent.trim(),
      ) ||
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

  /**
   * Every colour each drawn element paints, with the names of every token
   * of its root that holds it, keyed by element index, pseudo-element and
   * property: the same story drawn in the other theme is read the same way,
   * and each colour must come from a token both readings share.
   */
  function colourTokens() {
    const out = {};
    drawn().forEach((element, index) => {
      const root = element.closest(ROOT);
      const palette = paletteOf(root);
      for (const pseudo of [null, "::before", "::after"])
        for (const { property, text, colour } of paintedColours(
          element,
          pseudo,
        )) {
          const names = palette
            .filter(
              (p) => sameRgb(colour, p, 2.01 / 255) && colour.a <= p.a + 0.01,
            )
            .map((p) => p.token);
          out[`${index} ${describe(element)}${pseudo ?? ""} ${property}`] = {
            text,
            tokens: [...new Set(names)],
          };
        }
    });
    return out;
  }

  /** Every colour a drawn element paints that no token of its theme holds. */
  function untokenedColours() {
    const problems = [];
    let colours = 0;
    for (const element of drawn()) {
      const root = element.closest(ROOT);
      for (const pseudo of [null, "::before", "::after"])
        for (const { property, text, colour } of paintedColours(
          element,
          pseudo,
        )) {
          colours++;
          if (!tokenFor(colour, root))
            problems.push(
              `${describe(element)}${pseudo ?? ""}: ${property} is ${text}, which no token of its ${root?.getAttribute("data-theme") ?? "unthemed"} root holds`,
            );
        }
    }
    return { problems, colours };
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
   * there and the size it is drawn at.
   */
  function densityControls() {
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
    palettes.clear();
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
    untokenedColours,
    densityControls,
    unnamedOwnedClasses,
    colourTokens,
    holdDrawn,
    addHostRules,
    removeHostRules,
    ownedDeclarations,
    removeScopedRules,
    reset: () => {
      cachedRules = null;
      palettes.clear();
    },
  };
}
