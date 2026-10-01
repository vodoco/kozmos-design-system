import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { contrastRatio, formatRatio, parseColour } from "../src/lib/contrast";
import { withoutCode } from "../src/site/inline-code";

type PlatformState = "implemented" | "linked" | "not-yet" | "not-expected";

/** The generated index: the walk over every component page needs no list of its own. */
const componentIndex = JSON.parse(
  readFileSync(
    new URL("../src/generated/components.json", import.meta.url),
    "utf8",
  ),
) as {
  lanes: Record<string, { title: string; description: string }>;
  components: {
    slug: string;
    name: string;
    lane: string;
    description: string;
    storybook: string | null;
    platforms: Record<"react" | "swiftui" | "compose" | "figma", PlatformState>;
  }[];
};

/** What a status cell says for each state (src/reference/nav.ts). */
const STATE_LABEL: Record<PlatformState, string> = {
  implemented: "Implemented",
  linked: "Linked",
  "not-yet": "Not yet",
  "not-expected": "Not expected",
};

const PLATFORMS = ["react", "swiftui", "compose", "figma"] as const;

/** The contrast contract the colour page measures, as the generator copied it. */
const contrastContract = JSON.parse(
  readFileSync(
    new URL("../src/generated/contrast-contract.json", import.meta.url),
    "utf8",
  ),
) as { pairs: unknown[] };

const pages = [
  { path: "/", title: "The design system for the Pointr SDK" },
  { path: "/get-started", title: "Get started" },
  { path: "/examples", title: "Examples" },
  { path: "/roadmap", title: "Roadmap" },
  { path: "/examples/account-settings", title: "Account settings" },
  { path: "/examples/venue-explorer", title: "Venue explorer" },
  { path: "/examples/wayfinding", title: "Wayfinding" },
  { path: "/examples/phone-search", title: "Phone search sheet" },
  { path: "/examples/kiosk-directory", title: "Kiosk directory" },
  { path: "/examples/sign-in", title: "Sign in" },
  { path: "/examples/dashboard", title: "Operations dashboard" },
  { path: "/examples/booking", title: "Room booking" },
  { path: "/examples/notifications", title: "Notifications inbox" },
  { path: "/examples/onboarding", title: "First-run onboarding" },
  { path: "/examples/states", title: "Loading, empty, error, offline" },
  { path: "/examples/feedback-survey", title: "Feedback survey" },
  { path: "/examples/saved-places", title: "Saved places" },
  { path: "/foundations", title: "Foundations" },
  { path: "/foundations/colour", title: "Colour" },
  { path: "/foundations/typography", title: "Typography" },
  { path: "/foundations/layout", title: "Layout" },
  { path: "/foundations/elevation", title: "Elevation and effects" },
  { path: "/foundations/motion", title: "Motion" },
  { path: "/foundations/icons", title: "Icons" },
  { path: "/foundations/theming", title: "Theming" },
  { path: "/components", title: "Components" },
  // One page per lane, and the odd cases: a component not on iOS or Android
  // yet, one with no docs page in Storybook, one with no description in its
  // docs. Every other page is walked in Chromium below.
  { path: "/components/button", title: "Button" },
  { path: "/components/ai-companion-panel", title: "AICompanionPanel" },
  { path: "/components/adaptive-map-shell", title: "AdaptiveMapShell" },
  { path: "/components/dynamic-island", title: "DynamicIsland" },
  { path: "/components/theme-provider", title: "ThemeProvider" },
  { path: "/components/category-field", title: "CategoryField" },
  { path: "/components/backdrop", title: "Backdrop" },
] as const;

/** Console errors and uncaught exceptions, which a clean page has none of. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    // A failed request's message names no address; its location does.
    if (message.type() === "error")
      errors.push(`${message.text()} (${message.location().url})`);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/**
 * The site mirrors the provider's theme onto <html> once it has hydrated.
 * A pre-rendered page starts in the light theme (GAPS.md, GAP-03), and the
 * components' colour transitions then run into the visitor's theme, so the
 * page is only measured once no animation is still running.
 */
async function hydrated(page: Page) {
  await page.waitForFunction(() =>
    Boolean(document.documentElement.dataset.theme),
  );
  // The location marker's pulse never ends; only finite animations are waited for.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== "running" ||
          animation.effect?.getTiming().iterations === Infinity,
      ),
  );
}

/** Scrolls the whole page once, so revealed sections and miniatures mount. */
async function scrolled(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    window.scrollTo(0, 0);
  });
  await hydrated(page);
}

/**
 * A sans wider than the one this host would pick. Nothing in the site loads
 * a font: the tokens name Readex Pro but ship no file, so everything falls
 * to `ui-sans-serif, system-ui, …` and the host decides — SF Pro on macOS,
 * a much wider DejaVu Sans on the Linux the CI runs. Text therefore wraps in
 * different places on the two, and a layout measured only here can overflow
 * there. Verdana is the wide one macOS has; DejaVu Sans is the one Linux
 * has; a layout that holds in both holds anywhere.
 */
const WIDE_SANS = "Verdana, 'DejaVu Sans', sans-serif";

/** Re-points the family every Kozmos component inherits, then lets it settle. */
async function widen(page: Page, stack: string) {
  await page.addStyleTag({
    content: `:root,[data-kozmos-root]{--semantics-typography-family-system:${stack} !important}`,
  });
  // The family must have taken, or the test would pass on the host's own
  // font. Read back loosely: each engine quotes the value its own way.
  const family = await page
    .locator("[data-kozmos-root]")
    .first()
    .evaluate((root) => getComputedStyle(root).fontFamily);
  expect(family.replace(/["']/g, "")).toBe(stack.replace(/["']/g, ""));
  await page.evaluate(() => document.body.getBoundingClientRect().height);
}

/**
 * Violations that come from inside a Kozmos component and are recorded in
 * GAPS.md. The tests expect exactly these: a new violation fails, and so does
 * one that has gone away, so the gap gets closed when Kozmos fixes it. An
 * entry may cover only some nodes (`only`) or only one theme (`theme`).
 */
type KnownEntry = { id: string; only?: RegExp; theme?: "light" | "dark" };
type KnownViolation = string | KnownEntry;

/**
 * GAP-17: AdaptiveMapShell's panel, an <aside> nested in the page's main,
 * named by its `data-slot`. Axe cuts every attribute value in a snippet to
 * 20 characters once the opening tag passes 300, and the class this matched
 * until 2026-09-28 lost its words that way; the slot's value is shorter.
 */
const SHELL_PANEL: KnownEntry = {
  id: "landmark-complementary-is-top-level",
  only: /<aside[^>]*\bdata-slot="map-shell-panel"/,
};

/** Not a gap: a Sidebar is an aside by nature, shown inside a page's main. */
const SIDEBAR: KnownEntry = {
  id: "landmark-complementary-is-top-level",
  only: /data-slot="sidebar"/,
};

const knownViolations: Record<string, readonly KnownViolation[]> = {
  "/examples/venue-explorer": [SHELL_PANEL],
  "/examples/wayfinding": [SHELL_PANEL],
  "/examples/phone-search": [SHELL_PANEL],
  // The assistant open over the phone's frame: the panel makes the map shell
  // under it inert (GAP-93, fixed), and axe leaves inert content out, so the
  // shell's panel is not measured then.
  "/examples/phone-search#assistant": [],
  "/examples/dashboard": [SIDEBAR],
  // The adaptive tile's shell.
  "/": [SHELL_PANEL],
};

/**
 * axe's findings on the page as it is now, less the known ones. `state`
 * names a state of the page with known findings of its own:
 * `knownViolations["<path>#<state>"]`.
 */
async function axeViolations(page: Page, state?: string) {
  // From the top of the page: scrolled, whatever passes under the sticky
  // header counts as covered, and axe's target-size rule then fails the
  // links there, which a visitor simply scrolls back to.
  await page.evaluate(() => window.scrollTo(0, 0));
  const results = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22aa",
      "best-practice",
    ])
    .analyze();
  const theme = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  const key = `${new URL(page.url()).pathname}${state ? `#${state}` : ""}`;
  const known = (knownViolations[key] ?? [])
    .map(
      (entry): KnownEntry =>
        typeof entry === "string" ? { id: entry } : entry,
    )
    .filter((entry) => !entry.theme || entry.theme === theme);
  // A known violation covers a rule on the page, or only the nodes it names.
  const isKnown = (violation: (typeof results.violations)[number]) =>
    known.some(
      ({ id, only }) =>
        id === violation.id &&
        (!only ||
          violation.nodes.every((node) =>
            only.test(`${node.target.join(" ")} ${node.html}`),
          )),
    );
  const missing = known.filter(
    (entry) =>
      !results.violations.some((violation) => violation.id === entry.id),
  );
  // Contrast findings carry their numbers, so a failure names the colours.
  const measured = (
    node: (typeof results.violations)[number]["nodes"][number],
  ) => {
    const data = [...node.any, ...node.all]
      .map((check) => check.data as Record<string, unknown> | null)
      .find((entry) => entry && "contrastRatio" in entry);
    return data
      ? ` ${String(data.fgColor)} on ${String(data.bgColor)} = ${String(data.contrastRatio)}:1`
      : "";
  };
  return [
    ...results.violations
      .filter((violation) => !isKnown(violation))
      .map(
        (violation) =>
          `${violation.id} (${violation.impact}): ${violation.nodes
            .map((node) => `${node.target.join(" ")}${measured(node)}`)
            .join(" | ")}`,
      ),
    ...missing.map(
      (entry) => `${entry.id} no longer occurs: close its gap in GAPS.md`,
    ),
  ];
}

/**
 * The site's and the examples' CSS that does not apply: a declaration a
 * Kozmos rule outranks does nothing, and nothing says so. Kozmos's utilities
 * are scoped (GAP-04), and so is its preflight, which zeroes the border of
 * every box inside the provider (GAP-52). Every site rule is added again with
 * one ID's more specificity, which puts it above any Kozmos rule and keeps
 * the site's rules in their own order among themselves; a longhand that
 * changes on an element the rule matches was losing. Declarations are read
 * as written, so a shorthand holding var() — `border: var(--w) solid
 * var(--c)` — is measured through its longhands, which the CSSOM leaves empty
 * in the rule. Rules for states (:hover, :focus…) are left out. A loss can
 * move the layout, and then a percentage size elsewhere reads differently
 * too: the first line of a failure is the cause. A property a running
 * animation drives reads as the animation's value at that moment, not the
 * cascade's — and WebKit moves it on between the two reads — so it is left
 * out for the element it animates (the home page's cover loops).
 */
async function overriddenSiteCss(page: Page) {
  return page.evaluate(() => {
    const BOOST = ":not(#site-css-check)";
    const STATE =
      /:(hover|focus|focus-visible|focus-within|active|empty|checked)/;
    // Splits at a character outside brackets and strings.
    const split = (text: string, separator: string) => {
      const parts: string[] = [];
      let depth = 0;
      let quote = "";
      let start = 0;
      for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (quote) {
          if (char === quote) quote = "";
        } else if (char === '"' || char === "'") quote = char;
        else if (char === "(" || char === "[") depth += 1;
        else if (char === ")" || char === "]") depth -= 1;
        else if (char === separator && depth === 0) {
          parts.push(text.slice(start, index));
          start = index + 1;
        }
      }
      parts.push(text.slice(start));
      return parts.map((part) => part.trim()).filter(Boolean);
    };
    // Where a selector's pseudo-element starts, outside brackets.
    const pseudoAt = (selector: string) => {
      let depth = 0;
      for (let index = 0; index < selector.length - 1; index += 1) {
        const char = selector[index];
        if (char === "(" || char === "[") depth += 1;
        else if (char === ")" || char === "]") depth -= 1;
        else if (depth === 0 && char === ":" && selector[index + 1] === ":")
          return index;
      }
      return -1;
    };
    const longhands = (property: string, value: string) => {
      const probe = document.createElement("div").style;
      probe.setProperty(property, value);
      return Array.from(probe);
    };
    type Declared = { property: string; value: string; longhands: string[] };
    const targets: {
      selector: string;
      match: string;
      pseudo: string | null;
      declared: Declared[];
    }[] = [];
    const boosted = (list: CSSRuleList): string[] => {
      const out: string[] = [];
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSStyleRule) {
          const selector = rule.selectorText;
          if (!/\.(site|ex)-/.test(selector) || STATE.test(selector)) continue;
          const declared = split(rule.style.cssText, ";")
            .map((declaration) => {
              const colon = declaration.indexOf(":");
              return {
                property: declaration.slice(0, colon).trim(),
                value: declaration
                  .slice(colon + 1)
                  .replace(/!\s*important\s*$/i, "")
                  .trim(),
              };
            })
            .filter(({ property }) => property && !property.startsWith("--"))
            .map((entry) => ({
              ...entry,
              longhands: longhands(entry.property, entry.value),
            }));
          if (declared.length === 0) continue;
          const complexes = split(selector, ",");
          const raised = complexes.map((complex) => {
            const at = pseudoAt(complex);
            return at === -1
              ? `${complex}${BOOST}`
              : `${complex.slice(0, at)}${BOOST}${complex.slice(at)}`;
          });
          out.push(`${raised.join(", ")} { ${rule.style.cssText} }`);
          for (const complex of complexes) {
            const at = pseudoAt(complex);
            targets.push({
              selector,
              match: at === -1 ? complex : complex.slice(0, at),
              pseudo: at === -1 ? null : complex.slice(at),
              declared,
            });
          }
        } else if (rule instanceof CSSKeyframesRule) {
          continue;
        } else if ("cssRules" in rule) {
          // @media, @supports, @container: kept, with their conditions.
          const inner = boosted((rule as CSSGroupingRule).cssRules);
          const header = rule.cssText.slice(0, rule.cssText.indexOf("{"));
          if (inner.length > 0) out.push(`${header} { ${inner.join("\n")} }`);
        }
      }
      return out;
    };
    const text: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        text.push(...boosted(sheet.cssRules));
      } catch {
        // A sheet from another origin cannot be read; the site has none.
      }
    }
    const measured = targets.flatMap((target) =>
      Array.from(document.querySelectorAll(target.match)).map((element) => ({
        element,
        ...target,
      })),
    );
    const read = () =>
      measured.map(({ element, pseudo, declared }) => {
        const style = getComputedStyle(element, pseudo);
        return declared.map((entry) =>
          entry.longhands.map((name) => style.getPropertyValue(name)),
        );
      });
    // A change that starts a transition reads as its first frame; finished,
    // it reads as the value the rule sets.
    const settle = () => {
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition) animation.finish();
      }
    };
    const animated = new Map<Element, Map<string | null, Set<string>>>();
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;
      if (
        animation.playState !== "running" ||
        !(effect instanceof KeyframeEffect) ||
        !effect.target
      )
        continue;
      const byPseudo =
        animated.get(effect.target) ?? new Map<string | null, Set<string>>();
      const names = byPseudo.get(effect.pseudoElement) ?? new Set<string>();
      for (const frame of effect.getKeyframes()) {
        for (const key of Object.keys(frame)) {
          if (["offset", "computedOffset", "easing", "composite"].includes(key))
            continue;
          names.add(
            key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
          );
        }
      }
      byPseudo.set(effect.pseudoElement, names);
      animated.set(effect.target, byPseudo);
    }
    const before = read();
    const raised = document.createElement("style");
    raised.textContent = text.join("\n");
    document.head.append(raised);
    settle();
    const after = read();
    raised.remove();
    settle();
    const lost = new Map<string, string>();
    measured.forEach(({ element, pseudo, selector, declared }, index) => {
      const moving = animated.get(element)?.get(pseudo);
      declared.forEach(({ property, value, longhands: names }, at) => {
        names.forEach((name, position) => {
          if (moving?.has(name)) return;
          const was = before[index]?.[at]?.[position];
          const meant = after[index]?.[at]?.[position];
          const key = `${selector} { ${property}: ${value} }`;
          if (was !== meant && !lost.has(key))
            lost.set(key, `${key} — ${name} is ${was}, not ${meant}`);
        });
      });
    });
    return [...lost.values()];
  });
}

/**
 * Edges a rounded box cuts short: a bordered element in the corner of a box
 * that clips, drawn with a smaller radius than the box clips at. The clip
 * takes its border off along the curve and leaves the corner unedged —
 * hidden by a shadow in the light theme, plain on a dark page. Content in an
 * inert miniature is a picture of a page that is checked itself.
 */
async function clippedEdges(page: Page) {
  const found = await page.evaluate(() => {
    const corners = [
      ["TopLeft", "Top", "Left", "top-left"],
      ["TopRight", "Top", "Right", "top-right"],
      ["BottomLeft", "Bottom", "Left", "bottom-left"],
      ["BottomRight", "Bottom", "Right", "bottom-right"],
    ] as const;
    type Side = "Top" | "Right" | "Bottom" | "Left";
    const width = (style: CSSStyleDeclaration, side: Side) =>
      parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`));
    // A colour is see-through only when it carries an alpha of 0: four
    // numbers with a last of 0. Reading the last number alone called every
    // black border (`rgb(0, 0, 0)`) invisible, and with it every edge a black
    // border drew.
    const seeThrough = (colour: string) => {
      if (colour === "transparent") return true;
      const parts = colour.match(/[\d.]+/g);
      return parts?.length === 4 && parseFloat(parts[3]) === 0;
    };
    const edged = (style: CSSStyleDeclaration, side: Side) => {
      const name = side.toLowerCase();
      return (
        width(style, side) > 0 &&
        !["none", "hidden"].includes(
          style.getPropertyValue(`border-${name}-style`),
        ) &&
        !seeThrough(style.getPropertyValue(`border-${name}-color`))
      );
    };
    const radius = (style: CSSStyleDeclaration, corner: string) =>
      parseFloat(
        style.getPropertyValue(
          `border-${corner.replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`).slice(1)}-radius`,
        ),
      );
    const describe = (element: Element) => {
      const classes = Array.from(element.classList).filter((name) =>
        /^(site|ex)-/.test(name),
      );
      const role = element.getAttribute("role");
      return `${element.localName}${classes.map((name) => `.${name}`).join("")}${role ? `[role=${role}]` : ""}`;
    };
    const lines = new Set<string>();
    for (const box of Array.from(document.querySelectorAll("body *"))) {
      if (box.closest("[inert]")) continue;
      const style = getComputedStyle(box);
      // A box cuts its corners when its overflow is not visible — or when
      // paint containment cuts them for it, which leaves `overflow` visible:
      // the screens that hold the parts pinned to the viewport are contained,
      // not overflowing (site.css, "A screen, for the parts that pin
      // themselves").
      const contained = /\b(paint|strict|content)\b/.test(style.contain);
      if (
        !contained &&
        style.overflowX === "visible" &&
        style.overflowY === "visible"
      )
        continue;
      const rect = box.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const inner = {
        Top: rect.top + width(style, "Top"),
        Right: rect.right - width(style, "Right"),
        Bottom: rect.bottom - width(style, "Bottom"),
        Left: rect.left + width(style, "Left"),
      };
      for (const [corner, vertical, horizontal, name] of corners) {
        const clip =
          radius(style, corner) -
          Math.max(width(style, vertical), width(style, horizontal));
        if (clip < 2) continue;
        for (const child of Array.from(box.querySelectorAll("*"))) {
          const at = child.getBoundingClientRect();
          if (at.width === 0 || at.height === 0) continue;
          const key = {
            Top: at.top,
            Right: at.right,
            Bottom: at.bottom,
            Left: at.left,
          };
          if (
            Math.abs(key[vertical] - inner[vertical]) > 1.5 ||
            Math.abs(key[horizontal] - inner[horizontal]) > 1.5
          )
            continue;
          const own = getComputedStyle(child);
          if (own.visibility === "hidden") continue;
          if (!edged(own, vertical) && !edged(own, horizontal)) continue;
          if (radius(own, corner) + 1 < clip)
            lines.add(`${describe(box)} cuts ${describe(child)} at ${name}`);
        }
      }
    }
    return [...lines];
  });
  const known = knownClippedEdges[new URL(page.url()).pathname] ?? [];
  return [
    ...found.filter((line) => !known.some((entry) => entry.test(line))),
    ...known
      .filter((entry) => !found.some((line) => entry.test(line)))
      .map((entry) => `${entry} no longer occurs: close its gap in GAPS.md`),
  ];
}

type PanelInset = { top: number; side: number; fromGrip: number | null };

/**
 * Where a part sits in a map shell's panel: how far below the panel's top,
 * how far in from its side, and, under a sheet's grip, how far from the
 * grip's centre. By default the part is the first place in the panel's
 * list; POIResultList brings no padding of its own.
 */
async function panelInset(page: Page, part?: Locator): Promise<PanelInset> {
  const target = part ?? page.locator("main aside article").first();
  await expect(target).toBeVisible();
  const inset = await target.evaluate((element) => {
    const aside = element.closest("aside");
    if (!aside) return null;
    const panel = aside.getBoundingClientRect();
    const own = element.getBoundingClientRect();
    const grip = aside
      .querySelector(".kozmos-map-sheet-grip")
      ?.getBoundingClientRect();
    let fromGrip: number | null = null;
    if (grip) {
      // From the grip's centre to the nearest point of the part.
      const x = grip.left + grip.width / 2;
      const y = grip.top + grip.height / 2;
      fromGrip = Math.round(
        Math.hypot(
          Math.max(own.left, Math.min(x, own.right)) - x,
          Math.max(own.top, Math.min(y, own.bottom)) - y,
        ),
      );
    }
    return {
      top: Math.round(own.top - panel.top),
      side: Math.round(own.left - panel.left),
      fromGrip,
    };
  });
  expect(inset, "the part sits in a map shell's panel").not.toBeNull();
  return inset ?? { top: 0, side: 0, fromGrip: null };
}

/**
 * The map shell's panel inset contract (AdaptiveMapShell, decision 14; #135,
 * #141): a part at the panel's top sits as far below it as in from the side,
 * the panel's 16 and its 1px edge, and 4px further under a grip, which keeps
 * it 12px from the grip's centre (WCAG 2.5.8). The examples' own holders pad
 * 16 and top it up to what the panel leaves above them; adding the two put
 * the first place 16px further down.
 */
function expectPanelContract({ top, side, fromGrip }: PanelInset) {
  expect(side, "in from the panel's side").toBeGreaterThanOrEqual(16);
  const expected = fromGrip === null ? side : side + 4;
  expect(
    Math.abs(top - expected),
    `${top}px below the panel's top, ${side}px in from its side${fromGrip === null ? "" : ", under a grip"}`,
  ).toBeLessThanOrEqual(1);
  if (fromGrip !== null) expect(fromGrip).toBeGreaterThanOrEqual(12);
}

/**
 * Records, as it changes, what the phone search's assistant says in its
 * field while a voice conversation runs, the thread's live region beside it
 * and the mark on the voice button: "Listening… · off · <path>". The
 * scripted beats are shorter than a slow run's steps, so they are caught as
 * they happen rather than polled for. Call it with the assistant open.
 */
async function recordVoiceBeats(page: Page) {
  await page.evaluate(() => {
    const panel = document.querySelector(".ex-phone-assistant");
    const field = panel?.querySelector("input");
    const thread = panel?.querySelector('[role="log"]');
    const voice = panel?.querySelector('form button[type="button"]');
    if (!panel || !field || !thread || !voice) throw new Error("no assistant");
    const beats: { words: string[]; marks: string[] } = {
      words: [],
      marks: [],
    };
    (window as unknown as { voiceBeats: typeof beats }).voiceBeats = beats;
    const read = () => {
      const words = `${field.placeholder} · ${thread.getAttribute("aria-live")}`;
      if (beats.words[beats.words.length - 1] === words) return;
      beats.words.push(words);
      beats.marks.push(voice.querySelector("path")?.getAttribute("d") ?? "");
    };
    new MutationObserver(read).observe(panel, {
      attributes: true,
      attributeFilter: ["placeholder", "aria-live"],
      subtree: true,
    });
  });
}

async function voiceBeats(page: Page, what: "words" | "marks" = "words") {
  return page.evaluate(
    (key) =>
      (
        window as unknown as {
          voiceBeats?: { words: string[]; marks: string[] };
        }
      ).voiceBeats?.[key] ?? [],
    what,
  );
}

/** Clipped edges that come from inside Kozmos, recorded in GAPS.md. */
const knownClippedEdges: Record<string, readonly RegExp[]> = {
  // GAP-53: the sheet keeps square, bordered bottom corners on a phone's
  // rounded screen.
  "/examples/phone-search": [
    /^div\.ex-phone cuts aside at bottom-(left|right)$/,
  ],
};

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const { path, title } of pages) {
      test(`${path} renders, hydrates cleanly and passes axe`, async ({
        page,
      }) => {
        const errors = collectErrors(page);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await hydrated(page);
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          colorScheme,
        );
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
        // Pre-release: no page may be indexed (src/lib/site.ts, SITE_INDEXABLE).
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          "noindex",
        );
        await scrolled(page);
        expect(await axeViolations(page)).toEqual([]);
        // The site's own CSS all applies: none of it is outranked by Kozmos.
        expect(await overriddenSiteCss(page)).toEqual([]);
        // No rounded box cuts the edge of what sits in its corner.
        expect(await clippedEdges(page)).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });
}

// GAP-17's exclusion must still name the shell's panel when the panel's
// opening tag grows. Past 300 characters axe cuts every attribute value in a
// node's snippet to 20: the class the exclusion first matched lost its
// words, and on 2026-09-28 nine tests failed for a style that grew. Here the
// tag is made long on purpose.
test("GAP-17's exclusion still names the shell's panel when its tag is long", async ({
  page,
}) => {
  await page.goto("/examples/phone-search");
  await hydrated(page);
  await scrolled(page);
  await page
    .locator('aside[class*="kozmos-surface-"]')
    .evaluate((aside) => aside.setAttribute("data-long", "x".repeat(400)));
  expect(await axeViolations(page)).toEqual([]);
});

// 320 CSS pixels is the width WCAG's reflow criterion (1.4.10) measures at.
test.describe("on a narrow phone", () => {
  test.use({ viewport: { width: 320, height: 700 } });

  for (const { path } of pages) {
    test(`${path} has no sideways scroll and no clipped edges`, async ({
      page,
    }) => {
      await page.goto(path);
      await scrolled(page);
      // Narrow, a map shell turns its panel into a bottom sheet.
      expect(await clippedEdges(page)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("a foundations page offers its navigation in a drawer", async ({
    page,
  }) => {
    await page.goto("/foundations/colour");
    await hydrated(page);
    await page.getByRole("button", { name: "Foundations" }).click();
    const drawer = page.getByRole("dialog", { name: "Foundations" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Motion" }).click();
    await expect(page).toHaveURL(/\/foundations\/motion$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Motion");
    await expect(drawer).toBeHidden();
    await focusStaysOnContent(page);
  });

  test("a component page offers the reference in a drawer, grouped by lane", async ({
    page,
  }) => {
    await page.goto("/components/button");
    await hydrated(page);
    await page.getByRole("button", { name: "Components" }).click();
    const drawer = page.getByRole("dialog", { name: "Components" });
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByText(componentIndex.lanes["product-sdk"].title),
    ).toBeVisible();
    await drawer.getByRole("link", { name: "Checkbox" }).click();
    await expect(page).toHaveURL(/\/components\/checkbox$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Checkbox",
    );
    await expect(drawer).toBeHidden();
    await focusStaysOnContent(page);
  });
});

// An address that names no page, and one that names no component: the
// component pages are one route each, so the second matches the not-found
// route in the browser as it did when the 404 page was pre-rendered.
for (const address of ["/no-such-page", "/components/no-such-component"]) {
  test(`${address} answers 404 with the not-found page`, async ({ page }) => {
    const errors = collectErrors(page);
    const response = await page.goto(address);
    expect(response?.status()).toBe(404);
    await hydrated(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );
    expect(await axeViolations(page)).toEqual([]);
    // The browser logs the page's own 404 response; nothing else may fail.
    expect(
      errors.filter(
        (error) => !(error.includes("404") && error.includes(address)),
      ),
    ).toEqual([]);
  });
}

test("the theme choice is kept across a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await hydrated(page);
  // The header's theme is a menu behind one small button.
  await page.getByRole("button", { name: "Theme: System" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Theme: Dark" })).toBeVisible();
  await page.reload();
  await hydrated(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() => window.localStorage.getItem("kozmos-site-theme")),
  ).toBe("dark");
  // System follows the device again.
  await page.getByRole("button", { name: "Theme: Dark" }).click();
  await page.getByRole("menuitemradio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("site navigation stays in the page and moves focus to the content", async ({
  page,
}) => {
  await page.goto("/");
  await hydrated(page);
  await page.evaluate(() => {
    (window as unknown as { sameDocument: boolean }).sameDocument = true;
  });
  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: "Examples" })
    .click();
  await expect(page).toHaveURL(/\/examples$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Examples");
  expect(
    await page.evaluate(
      () => (window as unknown as { sameDocument?: boolean }).sameDocument,
    ),
  ).toBe(true);
  await expect(page.locator("main#main")).toBeFocused();
  await expect(
    page
      .getByRole("navigation", { name: "Site" })
      .getByRole("link", { name: "Examples" }),
  ).toHaveAttribute("aria-current", "page");

  // Into an example: same document, focus on the new content again.
  await page
    .locator("main")
    .getByRole("link", { name: "Open Account settings" })
    .click();
  await expect(page).toHaveURL(/\/examples\/account-settings$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Account settings",
  );
  expect(
    await page.evaluate(
      () => (window as unknown as { sameDocument?: boolean }).sameDocument,
    ),
  ).toBe(true);
  await expect(page.locator("main#main")).toBeFocused();

  // Into the reference, where the sidebar takes over: still the same document.
  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: "Foundations" })
    .click();
  await expect(page).toHaveURL(/\/foundations$/);
  // Across the site's two frames, the new page's content still takes focus.
  await expect(page.locator("main#main")).toBeFocused();
  await page
    .getByRole("complementary", { name: "Foundations" })
    .getByRole("link", { name: "Icons" })
    .click();
  await expect(page).toHaveURL(/\/foundations\/icons$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Icons");
  expect(
    await page.evaluate(
      () => (window as unknown as { sameDocument?: boolean }).sameDocument,
    ),
  ).toBe(true);
  await expect(
    page
      .getByRole("complementary", { name: "Foundations" })
      .getByRole("link", { name: "Icons" }),
  ).toHaveAttribute("aria-current", "page");
});

test("the skip link is the first stop and moves focus to the content", async ({
  page,
  browserName,
}) => {
  // WebKit skips links on Tab unless the system's full keyboard access is on.
  test.skip(
    browserName === "webkit",
    "Tab does not reach links in WebKit by default",
  );
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  // Painted on top, not only placed on screen: the sticky header once drew
  // over it at the same layer.
  expect(await drawnOnTop(skip)).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("the skip link shows over the header on a phone too", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Tab does not reach links in WebKit by default",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/button");
  await hydrated(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  expect(await drawnOnTop(skip)).toBe(true);
});

/**
 * The space between a button's icon and its words: from the icon's edge to
 * the nearest edge of the text beside it, whichever side the icon is on.
 */
async function iconGap(button: Locator) {
  return button.evaluate((element) => {
    const icon = element.querySelector("svg")!.getBoundingClientRect();
    const range = document.createRange();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let left = Infinity;
    let right = -Infinity;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      range.selectNodeContents(node);
      const box = range.getBoundingClientRect();
      left = Math.min(left, box.left);
      right = Math.max(right, box.right);
    }
    return Math.round(
      icon.right <= left ? left - icon.right : icon.left - right,
    );
  });
}

/** Whether an element is what the page paints at its own centre. */
async function drawnOnTop(element: Locator) {
  return element.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    return hit !== null && (hit === node || node.contains(hit));
  });
}

/**
 * Focus on the new page's content, and still there once a closing drawer
 * or dialog has finished animating, which is when Radix gives focus back to
 * the button that opened it.
 */
async function focusStaysOnContent(page: Page) {
  await expect(page.locator("main#main")).toBeFocused();
  await page.waitForTimeout(600);
  await expect(page.locator("main#main")).toBeFocused();
}

test.describe("home", () => {
  test("the cover is drawn in the dark theme whatever the site's, and shows assistive technology only its words", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await hydrated(page);
    const cover = page.locator("section[aria-labelledby='home-title']");
    await expect(cover.locator("[data-kozmos-root]").first()).toHaveAttribute(
      "data-theme",
      "dark",
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    // The picture is hidden; the logo is an image named by its words.
    for (const layer of [
      ".site-cosmos-stars",
      ".site-cosmos-art",
      ".site-cosmos-nebula",
    ]) {
      await expect(cover.locator(layer)).toHaveAttribute("aria-hidden", "true");
    }
    const logo = cover.getByRole("img", { name: LOGO });
    await expect(logo).toBeVisible();
    const shape = await drawnShape(logo);
    expect(shape.decoded).toBe(true);
    expect(shape.ratio).toBeCloseTo(1605.6736 / 442.27, 1);
    // The ring and the orbits are drawn through SVG strokes; one that does
    // not decode paints nothing, and says nothing.
    for (const line of [
      ".site-cosmos-ring:not(.site-cosmos-ring-glow)",
      ".site-cosmos-orbit",
    ]) {
      expect(
        (await drawnShape(cover.locator(line).first())).decoded,
        line,
      ).toBe(true);
    }
    // Painted from the dark theme's ramps on a light page: the ring's
    // palest violet is the second brand ramp's 900 as the cover's provider
    // resolves it, not as the page's light theme does.
    const paint = await cover.evaluate((band) => {
      const resolve = (host: Element, name: string) => {
        const probe = document.createElement("div");
        probe.style.color = `var(${name})`;
        host.append(probe);
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
      };
      const provider = band.querySelector("[data-kozmos-root]")!;
      const ring = band.querySelector(
        ".site-cosmos-ring:not(.site-cosmos-ring-glow)",
      )!;
      return {
        ring: getComputedStyle(ring).backgroundImage,
        cover: resolve(provider, "--primitives-colors-theme-variant-2-900"),
        page: resolve(document.body, "--primitives-colors-theme-variant-2-900"),
      };
    });
    expect(paint.cover).not.toBe(paint.page);
    expect(paint.ring).toContain(paint.cover);
    expect(paint.ring).not.toContain(paint.page);
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1280, height: 800 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    // Twice: in the sans the host resolves, and in a deliberately wide one.
    // Nothing loads a brand font, so the claim wraps where the host's
    // system-ui decides — one line on macOS, two on the Linux the CI runs.
    // A hero tuned to one font fits only that font's machines, which is how
    // 52svh passed here and overflowed by 34px there.
    for (const { name, stack } of [
      { name: "", stack: null },
      { name: " in a wide system font", stack: WIDE_SANS },
    ]) {
      test(`the claim and both next steps are on the first screen at ${viewport.width} by ${viewport.height}${name}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.goto("/");
        await hydrated(page);
        if (stack) await widen(page, stack);
        const bottom = await page
          .locator("section[aria-labelledby='home-title'] .site-actions")
          .evaluate((actions) => actions.getBoundingClientRect().bottom);
        expect(bottom).toBeLessThanOrEqual(viewport.height);
      });
    }
  }

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`the words sit on the page's black at ${viewport.width}px: nothing of the cover is drawn behind a letter`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await hydrated(page);
      const words = page.locator(
        "section[aria-labelledby='home-title'] .site-cosmos-words",
      );
      // By element, not by role: hidden, a heading leaves the tree.
      for (const text of [words.locator("h1"), words.locator("p")]) {
        const box = await text.boundingBox();
        expect(box).not.toBeNull();
        if (!box) return;
        const colour = await text.evaluate(
          (element) => getComputedStyle(element).color,
        );
        // The letters hidden, their box shows what is drawn behind them.
        await text.evaluate((element) => {
          (element as HTMLElement).style.visibility = "hidden";
        });
        const picture = await page.screenshot({ clip: box });
        await text.evaluate((element) => {
          (element as HTMLElement).style.visibility = "";
        });
        const brightest = await page.evaluate(async (png) => {
          const image = new Image();
          image.src = `data:image/png;base64,${png}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0);
          const { data } = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const linear = (channel: number) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          };
          let best = { r: 0, g: 0, b: 0, a: 1 };
          let most = -1;
          for (let index = 0; index < data.length; index += 4) {
            const [r, g, b] = [
              data[index]!,
              data[index + 1]!,
              data[index + 2]!,
            ];
            const luminance =
              0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
            if (luminance > most) {
              most = luminance;
              best = { r, g, b, a: 1 };
            }
          }
          return best;
        }, picture.toString("base64"));
        const ink = parseColour(colour);
        expect(ink).toBeTruthy();
        if (!ink) return;
        // Against the brightest pixel behind the words, not an average.
        expect(contrastRatio(ink, brightest)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test("some of the cover moves, until it is paused, scrolled away or reduced", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const cover = page.locator("section[aria-labelledby='home-title']");
    const loops = () =>
      cover.evaluate((band) =>
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.target !== null &&
              band.contains(animation.effect.target) &&
              animation.effect.getTiming().iterations === Infinity,
          )
          .map((animation) => animation.playState),
      );
    const states = await loops();
    // Travellers, stars, panes, the galaxy and the ring.
    expect(states.length).toBeGreaterThanOrEqual(10);
    expect(new Set(states)).toEqual(new Set(["running"]));
    const rider = cover.locator(".site-cosmos-rider").first();
    const place = () =>
      rider.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.left, y: box.top, round: box.width - box.height };
      });
    const before = await place();
    await page.waitForTimeout(600);
    const after = await place();
    expect(after.x !== before.x || after.y !== before.y).toBe(true);
    // Upright and round wherever the orbit carries it.
    expect(Math.abs(after.round)).toBeLessThan(1);

    // WCAG 2.2.2: it moves for longer than five seconds, so it can be stopped.
    const pause = cover.getByRole("button", { name: "Pause motion" });
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await expect(cover).toHaveAttribute("data-motion", "paused");
    expect(new Set(await loops())).toEqual(new Set(["paused"]));
    await pause.click();
    await expect(cover).toHaveAttribute("data-motion", "running");
    expect(new Set(await loops())).toEqual(new Set(["running"]));

    // Out of view, it rests; back in view, it moves again.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(cover).toHaveAttribute("data-motion", "paused");
    expect(new Set(await loops())).toEqual(new Set(["paused"]));
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(cover).toHaveAttribute("data-motion", "running");

    // Under reduced motion nothing moves, and there is nothing to pause.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await hydrated(page);
    expect(await loops()).toEqual([]);
    await expect(pause).toBeHidden();
    // The travellers rest where their laps start, still round.
    expect(Math.abs((await place()).round)).toBeLessThan(1);
  });

  test("the live tiles respond", async ({ page }) => {
    await page.goto("/");
    await scrolled(page);
    const tile = (name: string) =>
      page.locator(".site-tile").filter({ hasText: name });

    // Tokens: the nested provider flips.
    const tokensTile = tile("One set of tokens");
    await tokensTile.getByRole("switch", { name: "Dark" }).click();
    await expect(
      tokensTile.locator("[data-kozmos-root]").first(),
    ).toHaveAttribute("data-theme", "dark");

    // Adaptive: a narrow host puts the panel below the map.
    const adaptive = tile("A map layout that fits its container");
    await expect(adaptive.getByText("side", { exact: true })).toBeVisible();
    const slider = adaptive.getByRole("slider", { name: "Host width" });
    await slider.focus();
    await page.keyboard.press("Home");
    await expect(adaptive.getByText("bottom", { exact: true })).toBeVisible();

    // Platforms: each one's count and what has not reached it, from the
    // status script's data. It opens on SwiftUI.
    const platforms = tile("Every part, on every platform");
    const on = (platform: (typeof PLATFORMS)[number]) => ({
      present: componentIndex.components.filter((component) =>
        ["implemented", "linked"].includes(component.platforms[platform]),
      ).length,
      expected: componentIndex.components.filter(
        (component) => component.platforms[platform] !== "not-expected",
      ).length,
      missing: componentIndex.components.filter(
        (component) => component.platforms[platform] === "not-yet",
      ),
    });
    const swiftui = on("swiftui");
    await expect(
      platforms.getByText(
        `${swiftui.present} of ${swiftui.expected} components in SwiftUI`,
      ),
    ).toBeVisible();
    await platforms.getByRole("radio", { name: "Compose" }).click();
    const compose = on("compose");
    await expect(
      platforms.getByText(
        `${compose.present} of ${compose.expected} components in Compose`,
      ),
    ).toBeVisible();
    for (const component of compose.missing) {
      await expect(
        platforms.getByRole("link", { name: component.name, exact: true }),
      ).toHaveAttribute("href", `/components/${component.slug}`);
    }
    await platforms.getByRole("radio", { name: "Figma" }).click();
    const figma = on("figma");
    await expect(
      platforms.getByText(
        `${figma.present} of ${figma.expected} components linked in Figma`,
      ),
    ).toBeVisible();

    // Contrast: four pairs, all passing.
    await expect(
      tile("Contrast, under contract").getByText("Pass"),
    ).toHaveCount(4);
  });

  test("make it yours re-points the theme ramp", async ({ page }) => {
    await page.goto("/");
    await scrolled(page);
    const section = page.getByRole("region", { name: "Make it yours" });
    await section
      .getByRole("group", { name: "Brand ramp" })
      .getByRole("radio", { name: "Variant 1" })
      .click();
    await expect(section.getByText(/variables re-pointed/)).toBeVisible();
    // The browser substitutes var() in a computed custom property, so the
    // module's theme-600 must now equal the variant's 600 and not the page's.
    const app = section.locator("[data-kozmos-root]").first();
    const read = (name: string) =>
      app.evaluate(
        (element, property) =>
          getComputedStyle(element).getPropertyValue(property).trim(),
        name,
      );
    const pageTheme = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primitives-colors-theme-600")
        .trim(),
    );
    expect(await read("--primitives-colors-theme-600")).toBe(
      await read("--primitives-colors-theme-variant-1-600"),
    );
    expect(await read("--primitives-colors-theme-600")).not.toBe(pageTheme);
    await section.getByRole("switch", { name: "Dark theme" }).click();
    await expect(app).toHaveAttribute("data-theme", "dark");
  });

  test("example miniatures mount once in view and stay inert", async ({
    page,
  }) => {
    await page.goto("/");
    await scrolled(page);
    const miniature = page.getByRole("img", {
      name: "Operations dashboard example, shown small",
    });
    await expect(miniature).toBeVisible();
    await expect(miniature.locator("[inert]")).toHaveCount(1);
    await expect(miniature.locator("input[type=search]")).toHaveCount(1);
    await expect(miniature.getByRole("searchbox")).toHaveCount(0);
  });
});

/**
 * What is painted inside the sticky header once each positioned, stacked
 * element of the page has been scrolled under it: anything that is not the
 * header's own is drawn over it.
 */
async function paintedOverHeader(page: Page) {
  return page.evaluate(async () => {
    const header = document.querySelector<HTMLElement>(
      'header[data-slot="navbar"]',
    );
    if (!header) return ["no header"];
    const stacked = [
      ...document.querySelectorAll<HTMLElement>("main *"),
    ].filter((element) => {
      const style = getComputedStyle(element);
      return style.position !== "static" && Number(style.zIndex) > 0;
    });
    const found = new Set<string>();
    for (const element of stacked) {
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - 24));
      await new Promise((resolve) => setTimeout(resolve, 20));
      const box = header.getBoundingClientRect();
      for (let x = 4; x < window.innerWidth; x += 16) {
        for (const y of [
          box.top + 3,
          box.top + box.height / 2,
          box.bottom - 3,
        ]) {
          const hit = document.elementFromPoint(x, y);
          if (hit && !header.contains(hit)) {
            found.add(
              `${hit.tagName.toLowerCase()} "${(hit.getAttribute("aria-label") ?? hit.textContent ?? "").trim().slice(0, 30)}"`,
            );
          }
        }
      }
    }
    window.scrollTo(0, 0);
    return [...found];
  });
}

/** What the logo shows, and so its name and the home link's (src/lib/site.ts). */
const LOGO = "Kozmos UI Design Systems";

/**
 * The artwork a logo Box is painted through, decoded as the browser would
 * decode it: an SVG that is not well-formed decodes to nothing, and a mask
 * made of it paints nothing, without an error anywhere. The build inlines a
 * small SVG into the stylesheet, so the artwork is known by its proportions,
 * not by its file's name.
 */
async function drawnShape(logo: Locator) {
  return logo.evaluate(async (element) => {
    const style = getComputedStyle(element);
    const mask =
      style.maskImage || style.getPropertyValue("-webkit-mask-image");
    const url = mask.match(/url\("?([^")]+)"?\)/)?.[1];
    if (!url) return { decoded: false, artwork: 0, height: 0, ratio: 0 };
    const image = new Image();
    image.src = url;
    const decoded = await image.decode().then(
      () => true,
      () => false,
    );
    const box = element.getBoundingClientRect();
    return {
      decoded,
      artwork: image.naturalWidth / image.naturalHeight,
      height: Math.round(box.height),
      ratio: box.width / box.height,
    };
  });
}

test.describe("the header", () => {
  test("shows the logo, named by the words it shows, and it takes you home", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/components");
    await hydrated(page);
    const home = page.getByRole("banner").getByRole("link", { name: LOGO });
    const logo = home.getByRole("img", { name: LOGO });
    await expect(logo).toBeVisible();
    // The full logo, at its own proportions (src/brand/kozmos-logo.svg).
    const shape = await drawnShape(logo);
    expect(shape.decoded).toBe(true);
    expect(shape.artwork).toBeCloseTo(1605.6736 / 442.27, 1);
    expect(shape.height).toBe(40);
    expect(shape.ratio).toBeCloseTo(1605.6736 / 442.27, 1);
    await home.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "The design system for the Pointr SDK",
    );
  });

  test("shows the logo's K alone on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await hydrated(page);
    const logo = page
      .getByRole("banner")
      .getByRole("link", { name: LOGO })
      .getByRole("img", { name: LOGO });
    const shape = await drawnShape(logo);
    expect(shape.decoded).toBe(true);
    expect(shape.artwork).toBeCloseTo(272.5726 / 293.54, 1);
    expect(shape.height).toBe(32);
    expect(shape.ratio).toBeCloseTo(272.5726 / 293.54, 1);
  });

  test("keeps the logo visible in a high-contrast mode", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Chromium is the browser that emulates forced colours",
    );
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    await hydrated(page);
    // Forced colours repaint every background with the page's own colour;
    // the logo, a painted background, must take the text colour instead.
    const colours = await page
      .getByRole("banner")
      .getByRole("img", { name: LOGO })
      .evaluate((logo) => ({
        logo: getComputedStyle(logo).backgroundColor,
        header: getComputedStyle(logo.closest("header") ?? document.body)
          .backgroundColor,
      }));
    expect(colours.logo).not.toBe(colours.header);
  });

  test("gives the browser tab the logo's K", async ({ page }) => {
    await page.goto("/");
    const icons = await page
      .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((links) =>
        links.map(
          (link) => `${link.getAttribute("rel")} ${link.getAttribute("href")}`,
        ),
      );
    expect(icons).toEqual([
      "icon /favicon.ico",
      "icon /favicon.svg",
      "apple-touch-icon /apple-touch-icon.png",
    ]);
    for (const [href, type] of [
      ["/favicon.ico", "image/x-icon"],
      ["/favicon.svg", "image/svg+xml"],
      ["/apple-touch-icon.png", "image/png"],
    ]) {
      const response = await page.request.get(href);
      expect(response.status(), href).toBe(200);
      expect(response.headers()["content-type"], href).toBe(type);
    }
    // Each one draws: decoded by the browser, not only served.
    const decoded = await page.evaluate(
      (hrefs) =>
        Promise.all(
          hrefs.map(async (href) => {
            const image = new Image();
            image.src = href;
            return image.decode().then(
              () => image.naturalWidth > 0,
              () => false,
            );
          }),
        ),
      ["/favicon.ico", "/favicon.svg", "/apple-touch-icon.png"],
    );
    expect(decoded).toEqual([true, true, true]);
  });

  /** Where the logo, the page links and the tools sit in the header's row. */
  const headerRow = (page: Page) =>
    page.getByRole("banner").evaluate((banner) => {
      const box = (selector: string) =>
        banner.querySelector(selector)!.getBoundingClientRect();
      const [logo, links, tools] = [
        box(".site-logo"),
        box(".site-header-links"),
        box(".site-header-tools"),
      ];
      const apart = (a: DOMRect, b: DOMRect) =>
        a.right <= b.left ||
        b.right <= a.left ||
        a.bottom <= b.top ||
        b.bottom <= a.top;
      return {
        centred:
          Math.abs(
            (links.left + links.right) / 2 -
              document.documentElement.clientWidth / 2,
          ) <= 1,
        clear: apart(logo, links) && apart(links, tools) && apart(logo, tools),
        afterLogo: links.left > logo.right,
      };
    });

  // From 64rem: narrower, the five links are in the drawer (site.css).
  for (const width of [1024, 1280, 1440]) {
    test(`centres the page links on the page at ${width}px, clear of the logo and the tools`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/components");
      await hydrated(page);
      expect(await headerRow(page)).toEqual({
        centred: true,
        clear: true,
        afterLogo: true,
      });
    });
  }

  test("keeps the page links in the row, after the logo, where enlarged text leaves the centre no room", async ({
    page,
  }) => {
    // WCAG 1.4.4: with the text a half or twice its size the centred row no
    // longer fits, so the links go back into the row, and the row wraps
    // rather than letting them run into the logo or the tools.
    for (const [width, text] of [
      [1024, "150%"],
      [1280, "200%"],
    ] as const) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/components");
      await hydrated(page);
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = size;
      }, text);
      expect(await headerRow(page), `${width}px, text at ${text}`).toEqual({
        centred: false,
        clear: true,
        afterLogo: true,
      });
    }
  });

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 780 },
  ]) {
    test(`is one row at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await hydrated(page);
      const height = await page
        .getByRole("banner")
        .evaluate((element) => element.getBoundingClientRect().height);
      // The Navbar's own minimum is 4rem; one row of controls fits inside it.
      expect(height).toBeLessThanOrEqual(66);
    });
  }

  for (const [path, width] of [
    ["/", 1280],
    ["/", 390],
    ["/examples/venue-explorer", 1280],
    ["/examples/kiosk-directory", 1280],
  ] as const) {
    test(`stays on top of ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await scrolled(page);
      expect(await paintedOverHeader(page)).toEqual([]);
    });
  }
});

// Below 64rem: a phone, and a tablet held upright.
for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]) {
  test(`at ${viewport.width}px, the site's pages are in the header's drawer`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    // A page with no known axe findings: behind an open drawer the page is
    // hidden, and so would be the findings the home page is known for.
    await page.goto("/get-started");
    await hydrated(page);
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Examples" })).toBeHidden();
    await banner.getByRole("button", { name: "Site menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Kozmos" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link")).toHaveText([
      "Foundations",
      "Components",
      "Examples",
      "Get started",
      "Storybook",
    ]);
    // Open, the drawer is the page: its navigation is the only one exposed.
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await drawer.getByRole("link", { name: "Examples" }).click();
    await expect(page).toHaveURL(/\/examples$/);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Examples",
    );
    await focusStaysOnContent(page);
  });
}

test("Storybook's link leaves the app, from the header, the drawer and the footer", async ({
  page,
}) => {
  // Storybook is published beside the site, in a folder of its own
  // (.github/workflows/pages.yml), and is no route of it: each link must
  // load a new document, never ask the router, which would find the
  // not-found page. This server has no Storybook, so the new document is
  // the site's own 404 page; that it is a new one is the point.
  const leaves = async (link: Locator) => {
    await expect(link).toHaveAttribute("href", "/storybook/");
    await page.evaluate(() => {
      (window as unknown as { sameDocument: boolean }).sameDocument = true;
    });
    await link.click();
    await page.waitForURL(/\/storybook\/$/);
    expect(
      await page.evaluate(
        () => (window as unknown as { sameDocument?: boolean }).sameDocument,
      ),
    ).toBeUndefined();
  };
  await page.goto("/components");
  await hydrated(page);
  await leaves(
    page
      .getByRole("navigation", { name: "Site" })
      .getByRole("link", { name: "Storybook" }),
  );
  await page.goto("/components");
  await hydrated(page);
  await leaves(
    page
      .getByRole("navigation", { name: "Footer" })
      .getByRole("link", { name: "Storybook" }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components");
  await hydrated(page);
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Site menu" })
    .click();
  await leaves(
    page
      .getByRole("dialog", { name: "Kozmos" })
      .getByRole("link", { name: "Storybook" }),
  );
});

test.describe("home layout", () => {
  test("the hero offers two next steps, and the examples come right after it", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    await expect(
      page.locator('section[aria-labelledby="home-title"] .site-actions a'),
    ).toHaveCount(2);
    await expect(
      page.locator("main .site-section-header h2").first(),
    ).toHaveText("Built from it");
  });

  test("the featured examples carry their short taglines, not their summaries", async ({
    page,
  }) => {
    await page.goto("/");
    await scrolled(page);
    const cards = page.locator(".site-example-card");
    await expect(cards).toHaveCount(3);
    for (const [title, tagline] of [
      ["Wayfinding", /^Choose a place, compare the quickest/],
      ["Phone search sheet", /^A phone’s map screen: search or browse/],
      ["Operations dashboard", /^The venues console: facts across/],
    ] as const) {
      const card = cards.filter({ hasText: title });
      await expect(card.locator("p").filter({ hasText: tagline })).toHaveCount(
        1,
      );
      await expect(
        card.getByRole("link", { name: `Open ${title}` }),
      ).toHaveAttribute("href", /\/examples\//);
    }
  });

  for (const width of [1280, 1024]) {
    test(`the featured examples' pictures share one shape, so their titles line up at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await scrolled(page);
      const cards = await page
        .locator(".site-example-card")
        .evaluateAll((elements) =>
          elements.map((card) => ({
            top: card.getBoundingClientRect().top,
            picture:
              card.querySelector('[role="img"]')?.getBoundingClientRect()
                .height ?? 0,
            title: card.querySelector("h3")?.getBoundingClientRect().top ?? 0,
          })),
        );
      expect(cards).toHaveLength(3);
      // One row: a picture taller than its neighbours pushes its title down.
      const row = cards.filter(
        (card) => Math.abs(card.top - cards[0]!.top) < 1,
      );
      expect(row).toHaveLength(3);
      for (const card of row) {
        expect(card.picture).toBeGreaterThan(0);
        expect(Math.abs(card.picture - row[0]!.picture)).toBeLessThan(1);
        expect(Math.abs(card.title - row[0]!.title)).toBeLessThan(1);
      }
    });
  }

  test("every muted band has a hairline at each edge, the footer's rule under the last", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const edges = await page.evaluate(() => {
      const hairline = (element: Element | null) =>
        element?.getAttribute("data-orientation") === "horizontal" &&
        Math.round(element.getBoundingClientRect().height) === 1;
      const bands = Array.from(document.querySelectorAll(".site-band-muted"));
      return bands.map((band, index) => ({
        above: hairline(band.previousElementSibling),
        below:
          index === bands.length - 1
            ? band.nextElementSibling === null
            : hairline(band.nextElementSibling),
      }));
    });
    // In the dark theme a muted band's tint is 1.04:1 against the page. The
    // last band ends the page's content, and the footer's rule is its edge.
    expect(edges.length).toBeGreaterThan(0);
    expect(edges).toEqual(edges.map(() => ({ above: true, below: true })));
    await expect(
      page.getByRole("contentinfo").locator('[data-orientation="horizontal"]'),
    ).toHaveCount(1);
  });

  test("the checklist's link lands on the checks, in view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await scrolled(page);
    await page.getByRole("link", { name: "What each check does" }).click();
    await expect(page).toHaveURL(/\/get-started#checks$/);
    const section = page.getByRole("region", {
      name: "What every pull request runs",
    });
    await expect(section).toBeInViewport();
    // Below the sticky header, not under it.
    const [top, header] = await Promise.all([
      section.evaluate((element) => element.getBoundingClientRect().top),
      page
        .getByRole("banner")
        .evaluate((element) => element.getBoundingClientRect().bottom),
    ]);
    expect(top).toBeGreaterThanOrEqual(header - 1);
    // Focus follows the link to the section, so Tab continues from there.
    await expect(section).toBeFocused();
  });

  for (const width of [1280, 1024]) {
    test(`every card grid ends on a full row at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await scrolled(page);
      const lastRows = await page.evaluate(() => {
        const grids = [
          document.querySelector(".site-bento"),
          document.querySelector("[aria-labelledby] .site-example-card")
            ?.parentElement ?? null,
        ].filter((grid): grid is Element => grid !== null);
        return grids.map((grid) => {
          const cards = [...grid.children].map((card) =>
            card.getBoundingClientRect(),
          );
          const lastTop = Math.max(
            ...cards.map((card) => Math.round(card.top)),
          );
          const row = cards.filter((card) => Math.round(card.top) === lastTop);
          const used =
            Math.max(...row.map((card) => card.right)) -
            Math.min(...row.map((card) => card.left));
          return {
            grid: grid.className,
            share: +(used / grid.getBoundingClientRect().width).toFixed(2),
          };
        });
      });
      expect(lastRows.length).toBe(2);
      for (const row of lastRows)
        expect(row.share, row.grid).toBeGreaterThan(0.98);
    });
  }

  test("every section keeps its distance from the one before", async ({
    page,
  }) => {
    await page.goto("/");
    await scrolled(page);
    const tight = await page.evaluate(() =>
      [...document.querySelectorAll("main .site-section-header h2")]
        .map((heading) => {
          const top = heading.getBoundingClientRect().top;
          // The lowest thing above the heading, and what it is, so a
          // failure names it. A miniature is a picture, clipped to its
          // frame: what runs past the frame inside it is not drawn (the
          // Wayfinding miniature's list reaches 18px under its band).
          let bottom = 0;
          let from = "";
          for (const element of document.querySelectorAll("main *")) {
            if (element.closest("[inert]")) continue;
            const box = element.getBoundingClientRect();
            if (box.height > 0 && box.width > 0 && box.bottom <= top + 1) {
              if (box.bottom > bottom) {
                bottom = box.bottom;
                const classes = [...element.classList]
                  .slice(0, 3)
                  .map((name) => `.${name}`)
                  .join("");
                from = `${element.localName}${classes}`;
              }
            }
          }
          return {
            title: heading.textContent,
            space: Math.round(top - bottom),
            from,
          };
        })
        .filter((section) => section.space < 48),
    );
    expect(tight).toEqual([]);
  });

  // A budget, so a page that grows by a section is noticed. It is not a
  // round six: the site loads no font, so every paragraph wraps where the
  // host's system-ui says — 5.9 screens in macOS's, 6.1 in the wider sans
  // the Linux CI resolves. The budget holds the content, not the metrics of
  // a font the site does not ship.
  test("the page stays within six and a half screens on a laptop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await scrolled(page);
    const screens = await page.evaluate(
      () => document.documentElement.scrollHeight / window.innerHeight,
    );
    expect(screens).toBeLessThanOrEqual(6.5);
  });

  test("the brand snippet is never an empty override", async ({ page }) => {
    await page.goto("/");
    await scrolled(page);
    const code = await page
      .getByRole("region", { name: "Make it yours" })
      .locator("pre")
      .first()
      .textContent();
    expect(code).not.toMatch(/tokens=\{\{\s*\}\}/);
  });
});

/**
 * Design-system gaps, measured. Each test pins what Kozmos draws today, so
 * it fails the day Kozmos fixes the gap: that is the signal to change the
 * expectation to the fixed one and close the gap in GAPS.md. DS-HANDOFF.md
 * lists each fix and the test it flips.
 */
test.describe("design-system gaps, measured", () => {
  test("GAP-38 is fixed: the map sheet's handle draws its grip", async ({
    page,
  }) => {
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const size = await page
      .getByRole("slider", { name: "Panel height" })
      .evaluate((handle) => {
        const grip = handle
          .querySelector(".kozmos-map-sheet-grip")
          ?.getBoundingClientRect();
        return {
          height: Math.round(handle.getBoundingClientRect().height),
          gripWidth: grip ? Math.round(grip.width) : null,
        };
      });
    // Fixed in the design system on 2026-09-22 (`de7a409`): the handle's
    // three declarations convert their unitless layout tokens, so the row is
    // 16px again and the grip 40 × 4, as it was drawn.
    expect(size).toEqual({ height: 16, gripWidth: 40 });
  });

  test("GAP-52: the provider's preflight zeroes a caller's border on its own box", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const widths = await page.evaluate(() => {
      const rule = document.createElement("style");
      rule.textContent = ".site-gap-probe { border: 1px solid; }";
      document.head.append(rule);
      const inside = document.createElement("div");
      inside.className = "site-gap-probe";
      document.querySelector("main")?.append(inside);
      const outside = document.createElement("div");
      outside.className = "site-gap-probe";
      document.body.append(outside);
      const result = {
        inside: getComputedStyle(inside).borderTopWidth,
        outside: getComputedStyle(outside).borderTopWidth,
      };
      inside.remove();
      outside.remove();
      rule.remove();
      return result;
    });
    // The same rule, the same box: inside the provider its scoped preflight
    // wins at equal specificity; outside it, the rule applies.
    expect(widths).toEqual({ inside: "0px", outside: "1px" });
  });

  test("GAP-53: on a phone's rounded screen the sheet keeps square, bordered bottom corners", async ({
    page,
  }) => {
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const sheet = await page.locator(".ex-phone aside").evaluate((aside) => {
      const own = getComputedStyle(aside);
      const screen = aside.closest(".ex-phone");
      return {
        screen: screen ? getComputedStyle(screen).borderEndStartRadius : "",
        corner: own.borderEndStartRadius,
        bottom: own.borderBlockEndWidth,
        side: own.borderInlineStartWidth,
      };
    });
    expect(sheet.screen).not.toBe("0px");
    expect({ ...sheet, screen: undefined }).toEqual({
      screen: undefined,
      corner: "0px",
      bottom: "1px",
      side: "1px",
    });
  });

  test("GAP-09: a link drawn as a button keeps its underline", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    const line = await page
      .locator('section[aria-labelledby="home-title"] .site-actions a')
      .first()
      .evaluate((link) => getComputedStyle(link).textDecorationLine);
    expect(line).toBe("underline");
  });

  test("GAP-57: a Button's label cannot wrap", async ({ page }) => {
    await page.goto("/");
    await scrolled(page);
    // `.kozmos-button` sets `white-space: nowrap`, which everything inside
    // inherits, so a label wider than the button cannot break. Measured on
    // a plain Button, the home page's emotions tile's first: until
    // 2026-09-24 through the icons page, where the longest name overflowed a
    // phone, then on the Button page's demo until the demos left the site
    // for Storybook (2026-09-28).
    const wrapping = await page
      .locator(".site-emotions button")
      .first()
      .evaluate((button) => getComputedStyle(button).whiteSpace);
    expect(wrapping).toBe("nowrap");
  });

  test("GAP-61: the breadcrumb's separator does not mirror in right to left", async ({
    page,
  }) => {
    await page.goto("/foundations/theming");
    await hydrated(page);
    const sample = page
      .getByRole("region", { name: "Right to left" })
      .locator(".site-theme-sample");
    await sample
      .page()
      .getByRole("region", { name: "Right to left" })
      .getByRole("switch")
      .click();
    await expect(sample).toHaveCSS("direction", "rtl");
    const trail = await sample.evaluate((node) => {
      const items = Array.from(node.querySelectorAll("nav li"));
      const separators = items.filter(
        (item) => item.getAttribute("role") === "presentation",
      );
      const named = items.filter(
        (item) => item.getAttribute("role") !== "presentation",
      );
      const glyph = separators[0]?.querySelector("svg");
      return {
        // The trail itself flips: the root sits at the right edge.
        rootIsRightmost:
          named.length > 1 &&
          named[0].getBoundingClientRect().left >
            named[named.length - 1].getBoundingClientRect().left,
        separatorPath:
          glyph?.querySelector("path")?.getAttribute("d")?.toLowerCase() ??
          null,
        separatorTransform: glyph ? getComputedStyle(glyph).transform : null,
      };
    });
    expect(trail.rootIsRightmost).toBe(true);
    // And the separator still points the way it was drawn: the Pointr set's
    // chevron-right path, with nothing mirroring it. (The built package
    // stopped emitting the glyph's class name, so the path is the anchor.)
    expect(trail.separatorPath).toBe("m9 18l15 12l9 6");
    expect(trail.separatorTransform).toBe("none");
  });

  test("GAP-55: a Listbox's column is as wide as its widest option", async ({
    page,
  }) => {
    await page.goto("/");
    await hydrated(page);
    await page.getByRole("button", { name: "Search the site" }).click();
    const list = page
      .getByRole("dialog", { name: "Search the site" })
      .getByRole("listbox", { name: "Results" });
    await expect(list).toBeVisible();
    // Without the site's column the options outgrow the list.
    const overflow = await list.evaluate((element) => {
      element.classList.remove("site-search-list");
      const sideways = element.scrollWidth - element.clientWidth;
      element.classList.add("site-search-list");
      return sideways;
    });
    expect(overflow).toBeGreaterThan(0);
  });

  test("GAP-40: MapView does not isolate its overlays", async ({ page }) => {
    // The kiosk directory floats a MapOverlay on its map.
    await page.goto("/examples/kiosk-directory");
    await hydrated(page);
    const isolation = await page
      .getByRole("region", { name: /Illustrative map$/ })
      .first()
      .evaluate((map) => getComputedStyle(map).isolation);
    expect(isolation).toBe("auto");
  });

  test("GAP-66 is fixed: an empty state's wrapped description is centred", async ({
    page,
  }) => {
    // Fixed in the design system on 2026-09-25 (`b9467b1f`): both of the
    // empty state's words take align="center". It only showed once the
    // description wrapped, and where a line breaks is the font's decision:
    // in CI's WebKit the components page's one line fits a 320px phone. So
    // the description is narrowed until it wraps whatever the face, and
    // each line is measured against the box: a centred line sits on its
    // centre, a ragged one does not.
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/components");
    await hydrated(page);
    await page
      .getByRole("searchbox", { name: "Search components" })
      .fill("zzzz");
    const description = page.getByText("Try another word, or clear the lane.");
    await expect(description).toBeVisible();
    const drawn = await description.evaluate((node) => {
      (node as HTMLElement).style.maxInlineSize = "14ch";
      const box = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const lines = new Map<number, { left: number; right: number }>();
      for (const rect of Array.from(range.getClientRects())) {
        const top = Math.round(rect.top);
        const line = lines.get(top) ?? { left: rect.left, right: rect.right };
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        lines.set(top, line);
      }
      const centre = (box.left + box.right) / 2;
      return {
        lines: lines.size,
        align: getComputedStyle(node).textAlign,
        offCentre: Math.max(
          ...Array.from(lines.values()).map((line) =>
            Math.abs((line.left + line.right) / 2 - centre),
          ),
        ),
      };
    });
    expect(drawn.lines, "the description wraps").toBeGreaterThan(1);
    expect(drawn.align).toBe("center");
    // Every line on the box's centre, to a pixel and a half of rounding.
    expect(drawn.offCentre).toBeLessThanOrEqual(1.5);
  });

  test("GAP-72 is fixed: MapOverlay keeps what floats in it whole", async ({
    page,
  }) => {
    // Fixed in the design system on 2026-09-28 (`ded56bc5`, its GAP-082):
    // the overlay's scroll box is padded by the floating shadow's reach, so
    // it no longer cuts the shadow of what it holds. Read on the kiosk
    // directory's overlay, which holds the floor list: the room round the
    // part that casts the shadow, against how far that shadow reaches.
    await page.goto("/examples/kiosk-directory");
    await hydrated(page);
    const fit = await page
      .locator(".kozmos-map-overlay-stack")
      .first()
      .evaluate((stack) => {
        const box = stack.getBoundingClientRect();
        const caster = [
          stack,
          ...Array.from(stack.querySelectorAll<HTMLElement>("*")),
        ].find(
          (node) =>
            node !== stack && getComputedStyle(node).boxShadow !== "none",
        );
        if (!caster) return null;
        // The shadow's opaque layer: "rgba(…) x y blur spread", the last
        // layer with any alpha.
        const layers = getComputedStyle(caster)
          .boxShadow.split(/,(?![^(]*\))/)
          .map((layer) => layer.trim())
          .filter((layer) => !/rgba\([^)]*,\s*0\)/.test(layer));
        const numbers = (layers[layers.length - 1] ?? "")
          .replace(/rgba?\([^)]*\)/, "")
          .trim()
          .split(/\s+/)
          .map((value) => parseFloat(value));
        const [x = 0, y = 0, blur = 0, spread = 0] = numbers;
        const at = caster.getBoundingClientRect();
        return {
          overflow: getComputedStyle(stack).overflowY,
          room: {
            top: Math.round(at.top - box.top),
            right: Math.round(box.right - at.right),
            bottom: Math.round(box.bottom - at.bottom),
            left: Math.round(at.left - box.left),
          },
          reach: {
            top: Math.max(0, blur + spread - y),
            right: Math.max(0, blur + spread + x),
            bottom: Math.max(0, blur + spread + y),
            left: Math.max(0, blur + spread - x),
          },
        };
      });
    expect(fit, "the overlay holds a part with a shadow").not.toBeNull();
    if (!fit) return;
    // Still a scroll box, which is what clipped: the room is what changed.
    expect(fit.overflow).toBe("auto");
    for (const side of ["top", "right", "bottom", "left"] as const) {
      expect(fit.room[side], side).toBeGreaterThanOrEqual(fit.reach[side]);
    }
  });

  test("GAP-91: the map shell's boxes cut the shadows of what they hold", async ({
    page,
  }) => {
    // AdaptiveMapShell holds its top bar and its controls in boxes that
    // scroll, each the size of what it holds, so what that casts past the
    // box is cut at its edge. MapOverlay's stack is padded by the shadows'
    // reach now (GAP-72); the shell's boxes are not. Read in the venue
    // explorer: each box's first part with a shadow, the room round it in
    // the box, and how far its shadow reaches. A fix gives it the room.
    await page.goto("/examples/venue-explorer");
    await hydrated(page);
    const app = page.getByRole("region", { name: "Venue explorer example" });
    for (const [name, inside] of [
      [
        "top bar",
        app.getByRole("searchbox", { name: "Search Riverside Centre" }),
      ],
      ["controls", app.getByRole("group", { name: "Floor" })],
    ] as const) {
      const fit = await inside.evaluate((start) => {
        // The shell's box: the nearest ancestor that scrolls.
        let box = start.parentElement;
        while (box && getComputedStyle(box).overflowY !== "auto")
          box = box.parentElement;
        if (!box) return null;
        const layers = (node: Element) => {
          const shadow = getComputedStyle(node).boxShadow;
          if (shadow === "none") return [];
          return shadow
            .split(/,(?![^(]*\))/)
            .map((layer) => layer.trim())
            .filter(
              (layer) =>
                !/rgba\([^)]*,\s*0\)/.test(layer) && !layer.includes("inset"),
            );
        };
        const caster = Array.from(box.querySelectorAll("*")).find(
          (node) => layers(node).length > 0,
        );
        if (!caster) return null;
        const reach = { top: 0, right: 0, bottom: 0, left: 0 };
        for (const layer of layers(caster)) {
          const [x = 0, y = 0, blur = 0, spread = 0] = layer
            .replace(/rgba?\([^)]*\)/, "")
            .trim()
            .split(/\s+/)
            .map((value) => parseFloat(value));
          reach.top = Math.max(reach.top, blur + spread - y);
          reach.right = Math.max(reach.right, blur + spread + x);
          reach.bottom = Math.max(reach.bottom, blur + spread + y);
          reach.left = Math.max(reach.left, blur + spread - x);
        }
        const own = box.getBoundingClientRect();
        const at = caster.getBoundingClientRect();
        const room = {
          top: at.top - own.top,
          right: own.right - at.right,
          bottom: own.bottom - at.bottom,
          left: at.left - own.left,
        };
        return {
          cut: (["top", "right", "bottom", "left"] as const).filter(
            (side) => room[side] + 0.5 < reach[side],
          ),
        };
      });
      expect(fit, `the ${name} box holds a part with a shadow`).not.toBeNull();
      // The defect: on some side the box leaves less room than the shadow
      // reaches, so it is cut there.
      expect(fit?.cut.length, `the ${name} box cuts it`).toBeGreaterThan(0);
    }
  });

  test("GAP-94: Text's muted colour stays grey on a glass Surface", async ({
    page,
  }) => {
    // Decision 48: on glass, text that is muted elsewhere takes the
    // foreground colour, so it reads over whatever shows through. The glass
    // says so through --kozmos-surface-muted-foreground, and Kozmos's own
    // parts read it (.kozmos-muted-text); a Text color="muted" does not.
    // Read on the elevation page's glass card, over the category colours,
    // since the examples are solid (decision 49): a muted Text's own
    // element, cloned from the page, beside an owned muted line, on the
    // glass and off it. A fix turns the Text to the foreground on the glass.
    await page.goto("/foundations/elevation");
    await hydrated(page);
    const drawn = await page.locator(".site-glass-card").evaluate((glass) => {
      const muted = document.querySelector(".kozmos-text-muted");
      if (!muted || !glass.classList.contains("kozmos-surface-glass"))
        return null;
      const probe = (host: Element) => {
        const text = muted.cloneNode(false) as HTMLElement;
        text.textContent = "Muted words";
        const owned = document.createElement("p");
        owned.className = "kozmos-reset kozmos-muted-text";
        owned.textContent = "Muted words";
        host.append(text, owned);
        const colours = {
          text: getComputedStyle(text).color,
          owned: getComputedStyle(owned).color,
        };
        text.remove();
        owned.remove();
        return colours;
      };
      return {
        glass: probe(glass),
        page: probe(glass.parentElement ?? document.body),
      };
    });
    expect(drawn, "a muted Text, and the page's glass card").not.toBeNull();
    if (!drawn) return;
    // Off the glass the two are the same muted grey.
    expect(drawn.page.text).toBe(drawn.page.owned);
    // On it the owned line takes the foreground colour; the Text stays grey.
    expect(drawn.glass.owned).not.toBe(drawn.page.owned);
    expect(drawn.glass.text, "a muted Text on glass").toBe(drawn.page.text);
  });

  test("GAP-95: the level switcher's column grows out of the phone's frame", async ({
    page,
  }) => {
    // FloorSelector's collapsible column is a Popover placed against the
    // window, and nothing gives it the map as its boundary. In the phone
    // search the tile sits under the search bar, the column grows up, and it
    // rises out of the phone's frame over the page. The same reading on the
    // wayfinding, whose map fills its canvas, finds the column inside. A fix
    // keeps the column in the frame: it would grow down, or stop at the edge.
    const aboveFrame = async (path: string, frame: string) => {
      await page.goto(path);
      await hydrated(page);
      await page.locator(frame).scrollIntoViewIfNeeded();
      await page
        .locator(".site-example-canvas")
        .getByRole("group", { name: "Floor" })
        .getByRole("button")
        .click();
      const column = page.getByRole("dialog", { name: "Floor" });
      await expect(column).toBeVisible();
      await hydrated(page);
      const drawn = await column.boundingBox();
      const edge = await page.locator(frame).boundingBox();
      return Math.round((edge?.y ?? 0) - (drawn?.y ?? 0));
    };
    expect(
      await aboveFrame("/examples/wayfinding", ".site-example-canvas"),
      "the wayfinding's column, above its canvas",
    ).toBeLessThanOrEqual(0);
    expect(
      await aboveFrame("/examples/phone-search", ".ex-phone"),
      "the phone search's column, above the phone's frame",
    ).toBeGreaterThan(0);
  });

  test("GAP-86 is fixed: the assistant's voice control draws its own marks", async ({
    page,
  }) => {
    // Fixed in the design system on 2026-09-28 (#140): AIInputBar draws its
    // voice control itself, with the Pointr set's microphone at rest and
    // while listening, its speaker while the assistant talks, and a spinner
    // while it connects. The outlines, read from the icons' source.
    test.slow();
    const icons = readFileSync(
      new URL(
        "../../../packages/icons/src/pointr/icons.generated.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const outline = (name: string) =>
      icons.match(
        new RegExp(`export const ${name} = [^[]*\\[\\s*\\{\\s*d: "([^"]+)"`),
      )?.[1];
    const microphone = outline("Microphone01");
    const speaker = outline("VolumeMax");
    expect(microphone, "Microphone01's outline").toBeTruthy();
    expect(speaker, "VolumeMax's outline").toBeTruthy();

    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Phone search sheet example",
    });
    await example.getByRole("button", { name: "Ask the assistant" }).click();
    const start = example
      .getByRole("region", { name: "Assistant" })
      .getByRole("button", { name: "Start voice conversation" });
    expect(await start.locator("path").first().getAttribute("d")).toBe(
      microphone,
    );
    await recordVoiceBeats(page);
    await start.click();
    await expect
      .poll(async () => (await voiceBeats(page)).length, { timeout: 10_000 })
      .toBeGreaterThanOrEqual(4);
    expect((await voiceBeats(page)).slice(0, 4)).toEqual([
      "Connecting… · off",
      "Listening… · off",
      "Assistant is speaking… · off",
      "Listening… · off",
    ]);
    const [connecting, listening, speaking, again] = await voiceBeats(
      page,
      "marks",
    );
    expect([listening, speaking, again]).toEqual([
      microphone,
      speaker,
      microphone,
    ]);
    expect(connecting, "the spinner, not a microphone").not.toBe(microphone);
    expect(connecting).not.toBe(speaker);
  });

  test("GAP-42: a CardTitle's line height equals its font size", async ({
    page,
  }) => {
    await page.goto("/");
    await scrolled(page);
    const ratio = await page
      .locator(".site-tile h3")
      .first()
      .evaluate((title) => {
        const style = getComputedStyle(title);
        return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
      });
    expect(ratio).toBe(1);
  });

  test("GAP-43: the Slider's thumb takes a touch only on its own 20px", async ({
    page,
  }) => {
    await page.goto("/");
    await scrolled(page);
    const thumb = page.getByRole("slider", { name: "Host width" });
    await thumb.scrollIntoViewIfNeeded();
    // 20px from its centre is inside a 44px target; today it is the track.
    const hit = await thumb.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const target = document.elementFromPoint(
        box.left + box.width / 2 + 20,
        box.top + box.height / 2,
      );
      return (
        target !== null && (target === element || element.contains(target))
      );
    });
    expect(hit).toBe(false);
  });

  test("GAP-03: a dark-mode visitor's page is drawn light until the scripts run", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    // No script file loads: only something inline, before the page's own
    // scripts, could set the theme before the first paint.
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // What the visitor sees is Kozmos's own surfaces, drawn light: a fix has
    // to reach the components, not only <html>.
    const background = await page
      .getByRole("banner")
      .evaluate((header) => getComputedStyle(header).backgroundColor);
    expect(background).toBe("rgb(255, 255, 255)");
  });

  test("GAP-41: at 320px the Navbar drops the header's tools to a second row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    await hydrated(page);
    // The navigation slot keeps a 16rem basis beside the logo, which leaves
    // a 320px screen no room for both on one row, whatever the logo.
    const height = await page
      .getByRole("banner")
      .evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(90);
  });

  test("GAP-45: the first brand variant's 600 reads 4.20:1 on the dark page", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await hydrated(page);
    const [variant, background] = await page.evaluate(() =>
      [
        "--primitives-colors-theme-variant-1-600",
        "--primitives-colors-background-0",
      ].map((name) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim(),
      ),
    );
    const [foreground, ground] = [
      parseColour(variant),
      parseColour(background),
    ];
    expect(foreground && ground).toBeTruthy();
    if (!foreground || !ground) return;
    // Text needs 4.5:1. The default ramp's 600 reads 6.17:1 here.
    expect(formatRatio(contrastRatio(foreground, ground))).toBe("4.20:1");
  });

  test("GAP-50 is fixed: the spinner and the skeleton rest under reduced motion", async ({
    page,
  }) => {
    // Both states, so a pass cannot come from an animation that was never
    // there: with no preference each must move, with the preference each
    // must stop. The design config's `motion: reduced` is the same rule
    // under [data-kozmos-motion=reduced]. Measured in the states example's
    // loading view, which shows a Spinner and Skeletons for 1.8s: each time
    // it has loaded, "Loading" starts it again, and both are read at once.
    await page.goto("/examples/states");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Loading, empty, error, offline example",
    });
    const loaded = example.getByText("3 shops, nearest first");
    const moving = async () => {
      await expect(loaded).toBeVisible({ timeout: 8000 });
      await example
        .getByRole("group", { name: "State" })
        .getByRole("radio", { name: "Loading" })
        .click();
      return page.evaluate(() =>
        [".kozmos-skeleton", ".kozmos-spinner-arc"].map((selector) => {
          const element = document.querySelector(selector);
          if (!element) return `${selector} missing`;
          const style = getComputedStyle(element);
          return style.animationName !== "none" && style.animationName !== "";
        }),
      );
    };
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await moving(), "with no preference").toEqual([true, true]);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await moving(), "under reduce").toEqual([false, false]);
    await page.emulateMedia({ reducedMotion: null });
  });

  test("GAP-37 is fixed: SearchBar hides the browser's own clear button", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "the cancel button is a Blink and WebKit pseudo-element; WebKit's field is unstyled anyway (GAP-20)",
    );
    await page.goto("/components");
    await hydrated(page);
    const field = page.getByRole("searchbox", { name: "Search components" });
    await field.fill("bookshop");
    // Read in the stylesheet, not off the element. getComputedStyle on a
    // -webkit- shadow pseudo-element answers with the host's own values —
    // measured on 2026-09-27, display, appearance and width all came back
    // as the input's 348px box — so the version of this test that read the
    // pseudo-element could only ever say "drawn": it never could have
    // caught the fix, whenever it landed. The promise is made in owned CSS;
    // that is where it is read.
    const hidden = await field.evaluate((input) => {
      const rules: CSSStyleRule[] = [];
      const walk = (list: CSSRuleList) => {
        for (const rule of Array.from(list)) {
          if (
            rule instanceof CSSStyleRule &&
            rule.selectorText.includes("::-webkit-search-cancel-button")
          ) {
            rules.push(rule);
          } else if ("cssRules" in rule) {
            walk((rule as CSSGroupingRule).cssRules);
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(sheet.cssRules);
        } catch {
          // A sheet from another origin cannot be read; the site has none.
        }
      }
      return rules.some(
        (rule) =>
          rule.selectorText
            .split(",")
            .some((selector) =>
              input.matches(
                selector.trim().replace("::-webkit-search-cancel-button", ""),
              ),
            ) &&
          (rule.style.getPropertyValue("appearance") === "none" ||
            rule.style.getPropertyValue("display") === "none"),
      );
    });
    expect(hidden).toBe(true);
  });
});

test.describe("foundations", () => {
  test("colour shows every ramp, and the contract passes in both themes", async ({
    page,
  }) => {
    await page.goto("/foundations/colour");
    await hydrated(page);
    await expect(
      page.getByRole("heading", { level: 3, name: "Theme variant 2" }),
    ).toBeVisible();
    const pairs = contrastContract.pairs.length;
    await expect(
      page.getByText(`All ${pairs} pairs pass in both themes`),
    ).toBeVisible();
    const table = page.getByRole("table", { name: "Contrast contract" });
    await expect(table.getByRole("row")).toHaveCount(pairs + 1);
    // Each result says pass or fail in words, not only in colour.
    await expect(table.getByText(/· Pass$/)).toHaveCount(pairs * 2);
    await expect(table.getByText(/· Fail$/)).toHaveCount(0);
  });

  test("swatches, samples and shapes are edged, so white on white shows", async ({
    page,
  }) => {
    for (const [address, selector] of [
      ["/foundations/colour", ".site-swatch-colour"],
      ["/foundations/colour", ".site-pair-sample"],
      ["/foundations/layout", ".site-shape"],
    ] as const) {
      await page.goto(address);
      await hydrated(page);
      const widths = await page
        .locator(selector)
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element).borderTopWidth),
        );
      expect(widths.length).toBeGreaterThan(0);
      expect(new Set(widths)).toEqual(new Set(["1px"]));
    }
  });

  test("icons search, filter and copy", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium grants clipboard permission headlessly",
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/foundations/icons");
    await hydrated(page);
    await expect(
      page.getByRole("heading", { level: 2, name: /^\d+ icons$/ }),
    ).toBeVisible();
    await page.getByRole("searchbox", { name: "Search icons" }).fill("arrow");
    await expect(
      page.getByRole("button", { name: "Copy arrow-left" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy heart" })).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "Copy arrow-left" }).click();
    await expect(
      page.getByText('Copied <Icon name="arrow-left" />'),
    ).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '<Icon name="arrow-left" />',
    );
    await page.getByRole("searchbox", { name: "Search icons" }).fill("zzzz");
    await expect(page.getByText("No icon matches")).toBeVisible();
    await page.getByRole("button", { name: "Show all" }).click();
    await expect(
      page.getByRole("button", { name: "Copy heart" }),
    ).toBeVisible();
  });

  test("typography measures the scale from the stylesheet", async ({
    page,
  }) => {
    await page.goto("/foundations/typography");
    await hydrated(page);
    await expect(page.getByText("4xl · 36px / 40px")).toBeVisible();
    await expect(page.getByText("xs · 12px / 16px")).toBeVisible();
  });

  test("the motion race runs on the tokens", async ({ page }) => {
    await page.goto("/foundations/motion");
    await hydrated(page);
    const track = page.locator(".site-track").first();
    const before = await track.locator(".site-runner").boundingBox();
    await page.getByRole("button", { name: "Run" }).click();
    await expect(track).toHaveAttribute("data-end", "true");
    await hydrated(page);
    const after = await track.locator(".site-runner").boundingBox();
    expect(before && after && after.x - before.x).toBeGreaterThan(50);
  });
});

/** The example itself, not the page around it (which also shows its source). */
function canvas(page: Page) {
  return page.getByRole("region", { name: "Account settings example" });
}

test.describe("account settings example", () => {
  test("the profile form refuses a bad email and confirms a good one", async ({
    page,
  }) => {
    await page.goto("/examples/account-settings");
    await hydrated(page);
    const example = canvas(page);
    const email = example.getByRole("textbox", { name: "Email" });
    await email.fill("not-an-email");
    await example.getByRole("button", { name: "Save profile" }).click();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(
      example.getByText("Enter an email address, like name@example.com."),
    ).toBeVisible();
    await email.fill("sam@example.com");
    await example.getByRole("button", { name: "Save profile" }).click();
    await expect(
      example.getByRole("status").filter({ hasText: "Your profile is saved." }),
    ).toBeVisible();
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
  });

  test("the notification and security tabs work", async ({ page }) => {
    await page.goto("/examples/account-settings");
    await hydrated(page);
    const example = canvas(page);
    await example.getByRole("tab", { name: "Notifications" }).click();
    await example.getByRole("radio", { name: "Once a week" }).click();
    await expect(
      example.getByRole("radio", { name: "Once a week" }),
    ).toBeChecked();
    await example.getByRole("button", { name: "Save notifications" }).click();
    await expect(
      example
        .getByRole("status")
        .filter({ hasText: "notification choices are saved" }),
    ).toBeVisible();

    await example.getByRole("tab", { name: "Security" }).click();
    await example.getByLabel("Current password").fill("correct horse");
    await example.getByLabel("New password", { exact: true }).fill("short");
    await example.getByLabel("Confirm new password").fill("different");
    await example.getByRole("button", { name: "Change password" }).click();
    await expect(
      example.getByText("Use at least 12 characters."),
    ).toBeVisible();
    await expect(
      example.getByText("The two new passwords do not match."),
    ).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
});

test.describe("every example", () => {
  test("the SDK's map screens switch levels from one tile; the venue explorer and the kiosk list them (decision 38)", async ({
    page,
  }) => {
    // The phone search and the wayfinding are the SDK's map screens, and
    // take FloorSelector's collapsible level switcher (#144): one tile at
    // rest. The venue explorer and the kiosk directory keep every level on
    // screen.
    for (const [path, switcher] of [
      ["/examples/phone-search", true],
      ["/examples/wayfinding", true],
      ["/examples/venue-explorer", false],
      ["/examples/kiosk-directory", false],
    ] as const) {
      await page.goto(path);
      await hydrated(page);
      const levels = page
        .locator(".site-example-canvas")
        .getByRole("group", { name: "Floor" })
        .getByRole("button");
      if (switcher) {
        await expect(levels, `${path}: one tile`).toHaveCount(1);
        await expect(levels).toHaveAttribute("aria-expanded", "false");
      } else {
        await expect(levels, `${path}: every level`).toHaveCount(3);
      }
    }
  });

  test("draws solid: no example puts a glass surface on the page (decision 49)", async ({
    page,
  }) => {
    // Decision 49 (Olcay, 2026-09-28): every example takes Kozmos's solid
    // default, so the site shows one surface, not a mix. Before it the phone
    // search's sheet and the wayfinding's panel, manoeuvre card and route
    // summary were glass (#150), and so was the kiosk's attract screen,
    // while the venue explorer was solid. Each example is read as it loads,
    // and the map examples in the states that draw their other surfaces: a
    // place's details, a route and its walk, the attract screen; then the
    // miniatures that show examples on the home page and the index.
    //
    // Glass is every glass surface Kozmos draws, not only Surface's: a glass
    // Button, the glass utilities, and whatever else paints the glass role,
    // which is the one backdrop filter that saturates what shows through
    // (the map controls blur the map by 32px and saturate nothing, and they
    // are opaque). Counting `.kozmos-surface-glass` alone, a glass Button
    // passed (the night audit's X7).
    test.slow();
    const found: string[] = [];
    const canvas = () => page.locator(".site-example-canvas");
    const glassIn = (selector: string) =>
      page.locator(selector).evaluateAll((roots) => {
        const classes = [
          "kozmos-surface-glass",
          "kozmos-button-glass",
          "glass",
          "glass-spotlight",
          "glass-bevel",
          "glass-edge-spotlight",
        ];
        const glass: string[] = [];
        for (const root of roots)
          for (const node of [root, ...root.querySelectorAll("*")]) {
            const named = classes.filter((name) =>
              node.classList.contains(name),
            );
            const style = getComputedStyle(node);
            const filter =
              style.backdropFilter ||
              style.getPropertyValue("-webkit-backdrop-filter");
            const painted = /saturate\(/.test(filter);
            if (named.length > 0 || painted)
              glass.push(
                `${node.tagName.toLowerCase()}${named.map((name) => `.${name}`).join("")}${painted ? ` (${filter})` : ""}`,
              );
          }
        return glass;
      });
    const read = async (where: string) => {
      const glass = await glassIn(".site-example-canvas");
      if (glass.length > 0)
        found.push(`${where}: ${glass.length} glass: ${glass.join(", ")}`);
      for (const panel of await canvas()
        .locator('aside[data-slot="map-shell-panel"]')
        .all()) {
        const solid = await panel.evaluate((node) =>
          node.classList.contains("kozmos-surface-solid"),
        );
        if (!solid) found.push(`${where}: the map shell's panel is not solid`);
      }
    };
    const open = async (path: string) => {
      await page.goto(path);
      await hydrated(page);
      return canvas();
    };

    const examplePaths = pages
      .map(({ path }) => path)
      .filter((path) => path.startsWith("/examples/"));
    expect(examplePaths, "every example").toHaveLength(13);

    // The reading sees glass it is shown, in a probe of its own in an
    // example's Kozmos root: a glass Button, and a node that paints the glass
    // role with no Kozmos class. The next page it opens has neither.
    await open(examplePaths[0]);
    await canvas()
      .first()
      .evaluate((canvasNode) => {
        const root =
          canvasNode.querySelector("[data-kozmos-root]") ?? canvasNode;
        const probe = document.createElement("div");
        probe.setAttribute("data-glass-probe", "");
        const button = document.createElement("button");
        button.className = "kozmos-button-glass";
        const painted = document.createElement("div");
        painted.style.cssText =
          "backdrop-filter: blur(8px) saturate(1.8); -webkit-backdrop-filter: blur(8px) saturate(1.8); background: rgba(255, 255, 255, 0.5)";
        probe.append(button, painted);
        root.append(probe);
      });
    expect(
      await glassIn("[data-glass-probe]"),
      "the reading misses a glass Button, or glass painted by no Kozmos class",
    ).toEqual([
      expect.stringMatching(/^button\.kozmos-button-glass\b/),
      expect.stringMatching(/^div \(.*saturate\(/),
    ]);

    for (const path of examplePaths) {
      await open(path);
      await read(path);
    }

    let example = await open("/examples/venue-explorer");
    await example
      .getByRole("searchbox", { name: "Search Riverside Centre" })
      .fill("book");
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(
      example.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await read("venue explorer, a place");

    example = await open("/examples/wayfinding");
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(example.getByRole("button", { name: "Start" })).toBeVisible();
    await read("wayfinding, a route");
    await example.getByRole("button", { name: "Start" }).click();
    await expect(
      example.getByText("Head towards the atrium").first(),
    ).toBeVisible();
    await read("wayfinding, walking");
    for (let step = 0; step < 5; step += 1)
      await example.getByRole("button", { name: "Next step" }).click();
    await expect(example.getByText("You have arrived")).toBeVisible();
    await read("wayfinding, arrived");

    example = await open("/examples/phone-search");
    await example.getByRole("button", { name: "Shops 3 places" }).click();
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(
      example.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await read("phone search, a place");

    example = await open("/examples/kiosk-directory");
    await example.getByRole("button", { name: "Shops 3 places" }).click();
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await example.getByRole("button", { name: "Take me there" }).click();
    await expect(example.getByText("Head towards the atrium")).toBeVisible();
    await read("kiosk, a route");
    await example.getByRole("button", { name: "Start over" }).click();
    await expect(
      example.getByRole("button", { name: "Touch to start" }),
    ).toBeVisible();
    await read("kiosk, the attract screen");

    for (const path of ["/", "/examples"]) {
      await page.goto(path);
      await scrolled(page);
      const glass = await glassIn(".site-miniature-canvas");
      if (glass.length > 0)
        found.push(
          `${path}, the miniatures: ${glass.length} glass: ${glass.join(", ")}`,
        );
    }
    expect(found, "glass in the examples").toEqual([]);
  });
});

test.describe("venue explorer example", () => {
  test("the list of places sits in the panel as the shell's own parts do", async ({
    page,
  }) => {
    // A side panel at 1280, a sheet with its grip at 390. A short list shows
    // the holder's padding. A list long enough to scroll takes focus as the
    // results replace the categories, and focus alone would scroll its top
    // to the panel's scroll box, padding and all: ../focus.ts puts the box
    // back at its top and focuses the list where it is.
    for (const width of [1280, 390]) {
      for (const query of ["book", "o"]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/examples/venue-explorer");
        await hydrated(page);
        await page
          .getByRole("region", { name: "Venue explorer example" })
          .getByRole("searchbox", { name: "Search Riverside Centre" })
          .fill(query);
        const inset = await panelInset(page);
        expect(inset.fromGrip === null, `a side panel at ${width}`).toBe(
          width === 1280,
        );
        expectPanelContract(inset);
        expect(await clippedEdges(page)).toEqual([]);
      }
    }
  });

  function explorer(page: Page) {
    return page.getByRole("region", { name: "Venue explorer example" });
  }

  function mapPins(page: Page) {
    return explorer(page)
      .getByRole("region", { name: /Illustrative map$/ })
      .getByRole("button");
  }

  test("browse a category, open a place, act on it and come back", async ({
    page,
  }) => {
    await page.goto("/examples/venue-explorer");
    await hydrated(page);
    const app = explorer(page);
    await expect(mapPins(page)).toHaveCount(4);

    await app.getByRole("button", { name: "Transport 2 places" }).click();
    // The category takes the search field's place, with a way to clear it.
    await expect(app.getByRole("searchbox")).toHaveCount(0);
    await expect(
      app.getByRole("button", { name: "Clear Transport" }),
    ).toBeVisible();
    await expect(app.getByText("2 places").first()).toBeVisible();
    await expect(mapPins(page)).toHaveCount(2);

    await app
      .getByRole("button", { name: /Bus interchange/ })
      .first()
      .click();
    await expect(
      app.getByRole("heading", { level: 2, name: "Bus interchange" }),
    ).toBeVisible();
    await app.getByRole("button", { name: "Directions" }).click();
    await expect(
      app.getByText("Directions need a routing service"),
    ).toBeVisible();
    const favourite = app.getByRole("button", { name: "Favourite" });
    await favourite.click();
    await expect(favourite).toHaveAttribute("aria-pressed", "true");
    expect(await axeViolations(page)).toEqual([]);

    await app.getByRole("button", { name: "Back to the list" }).click();
    await expect(
      app.getByRole("heading", { level: 2, name: "Bus interchange" }),
    ).toHaveCount(0);
    await app.getByRole("button", { name: "Clear Transport" }).click();
    await expect(
      app.getByRole("searchbox", { name: "Search Riverside Centre" }),
    ).toBeVisible();
    await expect(
      app.getByRole("button", { name: "Shops 3 places" }),
    ).toBeVisible();
  });

  test("search finds a place on another floor and goes to that floor", async ({
    page,
  }) => {
    await page.goto("/examples/venue-explorer");
    await hydrated(page);
    const app = explorer(page);
    await app
      .getByRole("searchbox", { name: "Search Riverside Centre" })
      .fill("book");
    await app
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(
      app.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await expect(
      app.getByRole("button", { name: "First floor", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(mapPins(page)).toHaveCount(1);
  });

  test("the search field is drawn as Kozmos draws it", async ({
    page,
    browserName,
  }) => {
    // GAP-20: WebKit does not apply Kozmos's @scope-d utilities to <input>, and
    // SearchBar's field is one. Expected to fail there until Kozmos moves it to
    // component-owned CSS, as it did Input's; a pass then fails this test.
    test.fail(
      browserName === "webkit",
      "GAP-20: SearchBar's input is unstyled in WebKit",
    );
    await page.goto("/examples/venue-explorer");
    await hydrated(page);
    const field = explorer(page).getByRole("searchbox", {
      name: "Search Riverside Centre",
    });
    const style = await field.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        fontSize: computed.fontSize,
        borderTopWidth: computed.borderTopWidth,
      };
    });
    expect(style).toEqual({ fontSize: "15px", borderTopWidth: "0px" });
  });

  test("floors, zoom, and the SDK's location control", async ({ page }) => {
    await page.goto("/examples/venue-explorer");
    await hydrated(page);
    const app = explorer(page);
    await app
      .getByRole("button", { name: "Second floor", exact: true })
      .click();
    await expect(
      app.getByRole("region", {
        name: "Riverside Centre, Second floor. Illustrative map",
      }),
    ).toBeVisible();
    await expect(mapPins(page)).toHaveCount(4);

    const pin = mapPins(page).first();
    const before = await pin.boundingBox();
    await app.getByRole("button", { name: "Zoom in" }).click();
    const after = await pin.boundingBox();
    expect(
      before &&
        after &&
        Math.abs(after.x - before.x) + Math.abs(after.y - before.y),
    ).toBeGreaterThan(1);

    // The SDK's control (decision 40, #143): icon-only over the map, named
    // "Focus" and its state, and "Focus / On" drawn for a moment when the
    // mode changes. A press goes off, following, heading, off.
    const focus = app
      .getByRole("group", { name: "Map controls" })
      .getByRole("button", { name: /^Focus/ });
    await expect(focus).toHaveAccessibleName("Focus, Off");
    await expect(focus).toHaveAttribute("aria-pressed", "false");
    await expect(focus).toHaveAttribute("data-presentation", "icon-only");
    await expect(app.getByLabel("You are here")).toHaveCount(0);

    // Following: back to the visitor's floor, with the marker on it.
    await focus.click();
    await expect(focus).toHaveAccessibleName("Focus, On");
    await expect(focus).toHaveAttribute("aria-pressed", "true");
    await expect(focus).toHaveAttribute("data-presentation", "labelled");
    await expect(
      app.getByRole("button", { name: "Ground floor", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(app.getByLabel("You are here")).toBeVisible();
    // Then icon-only again, so it stops covering the map.
    await expect(focus).toHaveAttribute("data-presentation", "icon-only", {
      timeout: 5_000,
    });

    // Heading: "On" as following is, and only the mark and the name's
    // description tell the two apart.
    await focus.click();
    await expect(focus).toHaveAccessibleName("Focus, On, map turns with you");
    await expect(focus).toHaveAttribute("aria-pressed", "true");
    await focus.click();
    await expect(focus).toHaveAccessibleName("Focus, Off");
    await expect(app.getByLabel("You are here")).toHaveCount(0);

    // Another floor than the visitor's: the map stops following them.
    await focus.click();
    await expect(focus).toHaveAccessibleName("Focus, On");
    await app
      .getByRole("button", { name: "Second floor", exact: true })
      .click();
    await expect(focus).toHaveAccessibleName("Focus, Off");
  });

  test("the map controls keep their place when one widens to say its mode", async ({
    page,
  }) => {
    // GAP-92: the shell does not say which edge it sets its controls
    // against, so the example reads it from onLayoutChange and lines its
    // column up on that edge (controls-edge.ts): the inline start beside the
    // side panel at 1280, the inline end over the sheet at 390. Lined up on
    // the end beside the side panel, the floor selector jumped 48px right.
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/examples/venue-explorer");
      await hydrated(page);
      const app = explorer(page);
      const floors = app.getByRole("group", { name: "Floor" });
      const focus = app
        .getByRole("group", { name: "Map controls" })
        .getByRole("button", { name: /^Focus/ });
      const rest = await floors.boundingBox();
      const narrow = await focus.boundingBox();
      await focus.click();
      await expect(focus).toHaveAttribute("data-presentation", "labelled");
      // The words are in: the control has widened.
      await expect
        .poll(async () => (await focus.boundingBox())?.width ?? 0)
        .toBeGreaterThan((narrow?.width ?? 0) + 24);
      const wide = await focus.boundingBox();
      const shown = await floors.boundingBox();
      expect(shown?.x, `the floor selector at ${width}`).toBeCloseTo(
        rest?.x ?? -1,
        0,
      );
      // It grows away from the edge it is set against.
      if (width === 1280) expect(wide?.x).toBeCloseTo(narrow?.x ?? -1, 0);
      else
        expect((wide?.x ?? 0) + (wide?.width ?? 0)).toBeCloseTo(
          (narrow?.x ?? 0) + (narrow?.width ?? 0),
          0,
        );
    }
  });
});

test.describe("wayfinding example", () => {
  function app(page: Page) {
    return page.getByRole("region", { name: "Wayfinding example" });
  }

  test("the list and the walk sit in the panel as the shell's own parts do", async ({
    page,
  }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/examples/wayfinding");
      await hydrated(page);
      const example = app(page);
      expectPanelContract(await panelInset(page));
      expect(await clippedEdges(page)).toEqual([]);
      // Back from the route options, focus returns to the list; focusing it
      // must not scroll its padding away.
      await example
        .getByRole("button", { name: /Bookshop/ })
        .first()
        .click();
      await example.getByRole("button", { name: "Back" }).click();
      await expect(
        example.getByRole("region", { name: "Where to?" }),
      ).toBeFocused();
      expectPanelContract(await panelInset(page));
      // Walking: the summary is the panel's first row.
      await example
        .getByRole("button", { name: /Bookshop/ })
        .first()
        .click();
      await example.getByRole("button", { name: "Start" }).click();
      expectPanelContract(
        await panelInset(page, example.locator(".ex-way-stack > *").first()),
      );
    }
  });

  test("step-free takes the location control's place while a route is shown", async ({
    page,
  }) => {
    await page.goto("/examples/wayfinding");
    await hydrated(page);
    const example = app(page);
    const controls = example.getByRole("group", { name: "Map controls" });
    const floors = example.getByRole("group", { name: "Floor" });

    // Planning: the location control, and no step-free.
    await expect(
      controls.getByRole("button", { name: "Focus, Off" }),
    ).toBeVisible();
    await expect(
      controls.getByRole("button", { name: /^Step-free/ }),
    ).toHaveCount(0);

    // A route on the map: the same button, in the same place, is step-free
    // (#143), and it says which route is shown.
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    const stepFree = controls.getByRole("button", { name: /^Step-free/ });
    await expect(stepFree).toHaveAccessibleName("Step-free, Off");
    await expect(controls.getByRole("button", { name: /^Focus/ })).toHaveCount(
      0,
    );
    const rest = await floors.boundingBox();
    const narrow = await stepFree.boundingBox();
    await stepFree.click();
    await expect(stepFree).toHaveAccessibleName("Step-free, On");
    await expect(stepFree).toHaveAttribute("aria-pressed", "true");
    await expect(example.getByText("Step-free selected")).toBeAttached();
    // Saying "Step-free / On", it widens away from the floor selector,
    // which stays where it was (GAP-92).
    await expect(stepFree).toHaveAttribute("data-presentation", "labelled");
    await expect
      .poll(async () => (await stepFree.boundingBox())?.width ?? 0)
      .toBeGreaterThan((narrow?.width ?? 0) + 24);
    expect((await floors.boundingBox())?.x).toBeCloseTo(rest?.x ?? -1, 0);
    await stepFree.click();
    await expect(stepFree).toHaveAccessibleName("Step-free, Off");
    await expect(example.getByText("Quickest selected")).toBeAttached();

    // Walking the step-free route, the control still says so.
    await stepFree.click();
    await example.getByRole("button", { name: "Start" }).click();
    await expect(
      controls.getByRole("button", { name: "Step-free, On" }),
    ).toBeVisible();

    // The route ended, the location control is back.
    await example.getByRole("button", { name: "End" }).click();
    await expect(
      controls.getByRole("button", { name: "Focus, Off" }),
    ).toBeVisible();
    await expect(
      controls.getByRole("button", { name: /^Step-free/ }),
    ).toHaveCount(0);
  });

  test("choose a place, compare the routes, walk the step-free one and rate it", async ({
    page,
  }) => {
    await page.goto("/examples/wayfinding");
    await hydrated(page);
    const example = app(page);

    // The level switcher's tile shows the ground floor, the visitor's.
    const floorTile = example
      .getByRole("group", { name: "Floor" })
      .getByRole("button");
    await expect(floorTile).toHaveAccessibleName("Ground floor, your level");

    // Plan: every place is offered, and typing narrows the list.
    await expect(example.getByText("11 places")).toBeVisible();
    await example.getByPlaceholder("Where to?").fill("book");
    await expect(example.getByText("1 place")).toBeVisible();
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();

    // Preview: quickest and step-free, and one route that is not available.
    await expect(example.getByText("Via the terrace")).toBeVisible();
    await expect(
      example.getByText("The terrace is closed for the season."),
    ).toBeVisible();
    // The route option, not the step-free control over the map (#143).
    await example
      .getByRole("complementary", { name: "Route options" })
      .getByText("Step-free", { exact: true })
      .click();
    await expect(example.getByText("Step-free selected")).toBeAttached();
    await example.getByRole("button", { name: "Start" }).click();

    // Walking: the manoeuvre card, the summary with its rail, the announcer.
    await expect(
      example.getByText("Head towards the atrium").first(),
    ).toBeVisible();
    await expect(example.getByLabel("Step 1 of 5")).toBeAttached();
    await expect(example.getByRole("button", { name: "End" })).toBeVisible();
    const next = example.getByRole("button", { name: "Next step" });
    await next.click();
    await expect(
      example.getByText("Turn left for the lifts").first(),
    ).toBeVisible();
    await next.click();
    await expect(
      example.getByText("Take the lift to the first floor").first(),
    ).toBeVisible();
    await next.click();
    // Up the lift: the map follows the visitor to the first floor, and the
    // tile marks it as theirs.
    await expect(floorTile).toHaveAccessibleName("First floor, your level");
    await expect(
      example.getByRole("region", {
        name: "Riverside Centre, First floor. Illustrative map",
      }),
    ).toBeVisible();
    await expect(example.getByLabel("Step 4 of 5")).toBeAttached();
    expect(await axeViolations(page)).toEqual([]);
    await next.click();
    await next.click();

    // Arrived: the feedback card, then back to the start.
    await expect(example.getByText("You have arrived")).toBeVisible();
    await example.getByRole("button", { name: "Plan another route" }).click();
    await expect(example.getByPlaceholder("Where to?")).toHaveValue("");
    await expect(example.getByText("11 places")).toBeVisible();
  });
});

test.describe("phone search example", () => {
  function phone(page: Page) {
    return page.getByRole("region", { name: "Phone search sheet example" });
  }

  test("the list of places sits in the sheet as the shell's own parts do", async ({
    page,
  }) => {
    // A short list shows the holder's padding; a long one, which takes focus
    // as the results replace the categories, that focus does not scroll it
    // (../focus.ts).
    for (const query of ["book", "o"]) {
      await page.goto("/examples/phone-search");
      await hydrated(page);
      await phone(page)
        .getByRole("searchbox", { name: "Search Riverside Centre" })
        .fill(query);
      const inset = await panelInset(page);
      expect(inset.fromGrip, "the phone's sheet has a grip").not.toBeNull();
      expectPanelContract(inset);
      expect(await clippedEdges(page)).toEqual([]);
    }
  });

  test("the floor control is the SDK's level switcher, with the visitor's level marked", async ({
    page,
  }) => {
    // Decision 38 (#144): at rest one map-control tile with the current
    // level's short label; pressed, a column of every level over it, top
    // floor first; the visitor's level carries a dot and "your level".
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    const tile = example
      .getByRole("group", { name: "Floor" })
      .getByRole("button");
    const dot = "[data-floor-selector-user-level]";
    // The tile's mark is the short label; its name, which the map control
    // also keeps as clipped words, is the level's full one.
    const mark = tile.locator(".kozmos-map-control-mark");
    await expect(tile).toHaveAccessibleName("Ground floor, your level");
    await expect(tile).toHaveAttribute("data-presentation", "icon-only");
    await expect(mark).toHaveText("G");
    await expect(tile).toHaveAttribute("aria-expanded", "false");
    await expect(tile.locator(dot)).toHaveCount(1);

    await tile.click();
    const column = page.getByRole("dialog", { name: "Floor" });
    await expect(column).toBeVisible();
    await expect(tile).toHaveAttribute("aria-expanded", "true");
    const levels = column.getByRole("button");
    await expect(levels).toHaveText(["2", "1", "G"]);
    expect(
      await levels.evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
    ).toEqual(["Second floor", "First floor", "Ground floor, your level"]);
    const ground = column.getByRole("button", {
      name: "Ground floor, your level",
    });
    await expect(ground).toHaveAttribute("aria-pressed", "true");
    await expect(ground).toBeFocused();
    expect(await axeViolations(page)).toEqual([]);

    // Another level: the column closes, and focus is back on the tile, which
    // names the level now shown and marks nothing, the visitor not being on it.
    await column
      .getByRole("button", { name: "First floor", exact: true })
      .click();
    await expect(column).toBeHidden();
    await expect(tile).toBeFocused();
    await expect(tile).toHaveAccessibleName("First floor");
    await expect(mark).toHaveText("1");
    await expect(tile.locator(dot)).toHaveCount(0);
    await expect(
      example.getByRole("region", {
        name: "Riverside Centre, First floor. Illustrative map",
      }),
    ).toBeVisible();

    // Open again: the visitor's level keeps its dot while another is shown,
    // and Escape closes the column and gives focus back.
    await tile.click();
    await expect(ground).toHaveAttribute("aria-pressed", "false");
    await expect(ground.locator(dot)).toHaveCount(1);
    await expect(
      column.getByRole("button", { name: "First floor", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(column).toBeHidden();
    await expect(tile).toBeFocused();
  });

  test("the map's location control is the SDK's, as in the venue explorer", async ({
    page,
  }) => {
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    const focus = example
      .getByRole("group", { name: "Map controls" })
      .getByRole("button", { name: /^Focus/ });
    await expect(focus).toHaveAccessibleName("Focus, Off");
    await expect(example.getByLabel("You are here")).toHaveCount(0);
    await focus.click();
    await expect(focus).toHaveAccessibleName("Focus, On");
    await expect(example.getByLabel("You are here")).toBeVisible();
  });

  test("the assistant answers with places, and hands one to the sheet", async ({
    page,
  }) => {
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    const ask = example.getByRole("button", { name: "Ask the assistant" });
    // From the keyboard, so every engine has focus on the button to hand
    // back: WebKit does not focus a button a pointer presses.
    await ask.press("Enter");

    // Opened with `open` (#133): the panel takes focus as it opens.
    const assistant = example.getByRole("region", { name: "Assistant" });
    await expect(assistant).toBeFocused();
    const thread = assistant.getByRole("log", {
      name: "Assistant conversation",
    });
    // GAP-83, composed: the thread scrolls, so it takes a tab stop.
    await expect(thread).toHaveAttribute("tabindex", "0");
    await expect(thread).toHaveAttribute("aria-live", "polite");
    expect(await axeViolations(page, "assistant")).toEqual([]);

    const field = assistant.getByRole("textbox", { name: "Ask the assistant" });
    await field.fill("Where can I buy a book?");
    await field.press("Enter");
    await expect(thread.getByText("Where can I buy a book?")).toBeVisible();
    await expect(
      thread.getByText("Bookshop is on the first floor, 3 min on foot."),
    ).toBeVisible();
    // GAP-88, left visible: the places come under a paragraph, not a heading.
    await expect(thread.getByText("1 place", { exact: true })).toBeVisible();
    await expect(thread.getByRole("heading", { name: "1 place" })).toHaveCount(
      0,
    );
    const result = thread.getByRole("button", { name: /^Bookshop/ });
    await expect(result).toBeVisible();

    // A place picked from the thread: the assistant closes, and the sheet
    // opens that place and keeps the focus the product gave it. The panel
    // does not hand focus back to the AI button on the way, where a screen
    // reader would announce it first (onCloseAutoFocus, AICompanionPanel.mdx).
    await ask.evaluate((button) => {
      const hits = { count: 0 };
      (window as unknown as { askFocus: typeof hits }).askFocus = hits;
      button.addEventListener("focus", () => (hits.count += 1));
    });
    await result.click();
    await expect(assistant).toHaveCount(0);
    await expect(
      example.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await expect(ask).not.toBeFocused();
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { askFocus: { count: number } }).askFocus.count,
      ),
      "times the AI button took focus",
    ).toBe(0);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.activeElement
              ?.closest("aside")
              ?.getAttribute("aria-label") ?? null,
        ),
      )
      .toBe("Bookshop");
  });

  test("a place in the assistant's answer and in the sheet's list draws no id twice", async ({
    page,
  }) => {
    // T1: a result card's id came from its place's id alone, so the Bookshop
    // the answer shows and the Bookshop the sheet lists drew one id twice, and
    // the answer's references could resolve into the sheet. Each answer's
    // cards take a prefix of their own (idPrefix).
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    await example
      .getByRole("searchbox", { name: "Search Riverside Centre" })
      .fill("book");
    await expect(
      example.getByRole("button", { name: /^Bookshop/ }).first(),
    ).toBeVisible();
    await example
      .getByRole("button", { name: "Ask the assistant" })
      .press("Enter");
    const assistant = example.getByRole("region", { name: "Assistant" });
    const field = assistant.getByRole("textbox", { name: "Ask the assistant" });
    await field.fill("Where can I buy a book?");
    await field.press("Enter");
    await expect(
      assistant.getByRole("button", { name: /^Bookshop/ }),
    ).toBeVisible();
    const twice = await page.evaluate(() => {
      const seen = new Set<string>();
      const repeated = new Set<string>();
      for (const node of document.querySelectorAll("[id]")) {
        if (seen.has(node.id)) repeated.add(node.id);
        seen.add(node.id);
      }
      return [...repeated];
    });
    expect(twice, "ids drawn twice").toEqual([]);
  });

  test("the assistant's voice conversation, from its script", async ({
    page,
  }) => {
    // #140: a press on the input bar's microphone starts a conversation the
    // product drives through `voiceState`. There is no voice model here, so
    // the example plays one: connecting, listening, one question heard and
    // answered aloud, then listening again.
    test.slow();
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    const ask = example.getByRole("button", { name: "Ask the assistant" });
    // From the keyboard, as above: the focus it moves is what is checked.
    await ask.press("Enter");
    const assistant = example.getByRole("region", { name: "Assistant" });
    const thread = assistant.getByRole("log", {
      name: "Assistant conversation",
    });
    const field = assistant.getByRole("textbox", { name: "Ask the assistant" });

    // Each beat the field says, with what the thread's live region is then,
    // as they happen: a beat is shorter than a slow run's step.
    await recordVoiceBeats(page);
    await assistant
      .getByRole("button", { name: "Start voice conversation" })
      .press("Enter");
    // One button through every state, so focus stays on it.
    const end = assistant.getByRole("button", {
      name: "End voice conversation",
    });
    await expect(end).toBeFocused();
    await expect
      .poll(() => voiceBeats(page), { timeout: 10_000 })
      .toContain("Assistant is speaking… · off");
    await expect(
      thread.getByText("Is there somewhere with Wi-Fi?"),
    ).toBeVisible();
    await expect(
      thread.getByText("Wi-Fi lounge is on the first floor, 3 min on foot."),
    ).toBeVisible();
    await expect(field).toHaveAttribute("placeholder", "Listening…", {
      timeout: 5_000,
    });
    // Live, the thread does not read turns out over the assistant saying
    // them: it is off from the first beat to the last.
    expect(await voiceBeats(page)).toEqual([
      "Connecting… · off",
      "Listening… · off",
      "Assistant is speaking… · off",
      "Listening… · off",
    ]);

    // The visitor ends it: the thread speaks for itself again.
    await end.press("Enter");
    const start = assistant.getByRole("button", {
      name: "Start voice conversation",
    });
    await expect(start).toBeFocused();
    await expect(thread).toHaveAttribute("aria-live", "polite");
    await expect(field).toHaveAttribute("placeholder", "Ask about the centre");

    // Closing ends a live conversation too, and hands focus back to the AI
    // button the panel covered.
    await start.press("Enter");
    await expect(field).toHaveAttribute("placeholder", "Listening…");
    await assistant.getByRole("button", { name: "Close assistant" }).click();
    await expect(assistant).toHaveCount(0);
    await expect(ask).toBeFocused();
    await ask.click();
    await expect(
      assistant.getByRole("button", { name: "Start voice conversation" }),
    ).toBeVisible();
    await expect(field).toHaveAttribute("placeholder", "Ask about the centre");
  });

  test("the assistant keeps the keyboard out of what it covers", async ({
    page,
  }) => {
    // GAP-93, fixed: the panel covered the frame but left what it covered in
    // the tab order, and Shift+Tab from it went to the sheet's tiles under it.
    // The example made the map shell inert itself; the panel does it now, and
    // the example passes nothing.
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = phone(page);
    await example.getByRole("button", { name: "Ask the assistant" }).click();
    const assistant = example.getByRole("region", { name: "Assistant" });
    await expect(assistant).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    const landed = await page.evaluate(() => {
      const active = document.activeElement;
      const frame = document.querySelector(".ex-phone");
      const panel = document.querySelector(".ex-phone-assistant");
      return {
        inFrame: Boolean(frame?.contains(active)),
        inPanel: Boolean(panel?.contains(active)),
      };
    });
    expect(landed.inFrame && !landed.inPanel, "focus under the panel").toBe(
      false,
    );
    // Nothing under the panel takes focus, even asked directly. (Playwright's
    // role queries do not count inert content as hidden.)
    const tile = example.getByRole("button", { name: "Shops 3 places" });
    await tile.evaluate((button) => button.focus());
    await expect(tile).not.toBeFocused();
  });

  test("browse a category, open a place in the sheet, turn its photos, and set the sheet's height", async ({
    page,
  }) => {
    await page.goto("/examples/phone-search");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Phone search sheet example",
    });

    await example.getByRole("button", { name: "Shops 3 places" }).click();
    await expect(
      example.getByRole("button", { name: "Clear Shops" }),
    ).toBeVisible();
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(
      example.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await example.getByRole("button", { name: "Next image" }).click();
    await expect(example.getByText("Image 2 of 3")).toBeVisible();

    // The sheet grows to the full detent from the toolbar.
    const sheet = example.getByRole("complementary", { name: "Bookshop" });
    const half = await sheet.boundingBox();
    await example
      .getByRole("group", { name: "Sheet" })
      .getByRole("radio", { name: "Full" })
      .click();
    await expect
      .poll(async () => (await sheet.boundingBox())?.height ?? 0)
      .toBeGreaterThan((half?.height ?? 0) + 50);
    expect(await axeViolations(page)).toEqual([]);

    await example.getByRole("button", { name: "Back to the list" }).click();
    await example.getByRole("button", { name: "Clear Shops" }).click();
    await example
      .getByRole("searchbox", { name: "Search Riverside Centre" })
      .fill("bus");
    await expect(example.getByText("1 place")).toBeVisible();
  });
});

test.describe("kiosk directory example", () => {
  test("the attract screen covers the whole directory, its map's floor list too", async ({
    page,
  }) => {
    // Solid since decision 49, the attract screen hides what it covers, so
    // anything drawn over it shows. The map's floor list sits in a
    // MapOverlay at z-index 50, which MapView does not contain (GAP-40), so
    // the screen takes the top layer token over it. Read as drawn: every
    // pixel where the selected floor's tile was, the theme's blue with its
    // letter, is the screen's own fill. (The tile's centre alone is its
    // white letter, which matches a white screen whatever is on top.)
    await page.goto("/examples/kiosk-directory");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Kiosk directory example",
    });
    await example.getByRole("button", { name: "Start over" }).click();
    const attract = example.locator(".ex-kiosk-attract");
    await expect(attract).toBeVisible();
    await hydrated(page);
    // Where the tile is while the screen rests over it: the directory lays
    // out again behind it. (Inert, but still in the layout.) Focus on
    // "Touch to start" scrolled the page, which would put the tile under
    // the sticky header, so the page goes back to its top first.
    await page.evaluate(() => window.scrollTo(0, 0));
    const tile = await example
      .getByRole("button", { name: "Ground floor", exact: true })
      .boundingBox();
    expect(tile, "the selected floor's tile").not.toBeNull();
    if (!tile) return;
    const fill = await attract.evaluate(
      (node) => getComputedStyle(node).backgroundColor,
    );
    const picture = await page.screenshot({ clip: tile });
    const other = await page.evaluate(
      async ({ png, fill }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const colours = new Set<string>();
        for (let index = 0; index < data.length; index += 4) {
          const colour = `rgb(${data[index]}, ${data[index + 1]}, ${data[index + 2]})`;
          if (colour !== fill) colours.add(colour);
        }
        return [...colours].slice(0, 5);
      },
      { png: picture.toString("base64"), fill },
    );
    expect(
      other,
      `drawn where the selected floor's tile is, not ${fill}`,
    ).toEqual([]);
  });

  test("browse a category, read a place, take the route and send it, then rest", async ({
    page,
  }) => {
    await page.goto("/examples/kiosk-directory");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Kiosk directory example",
    });

    await example.getByRole("button", { name: "Shops 3 places" }).click();
    await example
      .getByRole("button", { name: /Bookshop/ })
      .first()
      .click();
    await expect(
      example.getByRole("heading", { level: 2, name: "Bookshop" }),
    ).toBeVisible();
    await example.getByRole("button", { name: "Take me there" }).click();
    await expect(example.getByText("Head towards the atrium")).toBeVisible();
    await example.getByRole("button", { name: "Send to my phone" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Take the route with you",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("4821")).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
    expect(await axeViolations(page)).toEqual([]);

    await example.getByRole("button", { name: "Start over" }).click();
    // Focus is on the attract screen, and the directory under it is inert:
    // nothing in it takes focus. (Playwright's role queries do not count
    // inert content as hidden, so this asks the field to take focus.)
    const touch = example.getByRole("button", { name: "Touch to start" });
    await expect(touch).toBeFocused();
    const field = example.getByRole("searchbox", { name: "Search the centre" });
    await field.evaluate((input) => input.focus());
    await expect(field).not.toBeFocused();
    await expect(touch).toBeFocused();
    await touch.click();
    await expect(
      example.getByRole("heading", { level: 2, name: "Riverside Centre" }),
    ).toBeFocused();
    await expect(
      example.getByRole("button", { name: "Shops 3 places" }),
    ).toBeVisible();
  });
});

test.describe("sign-in example", () => {
  test("refuses a bad email and a short password, then a wrong code, then signs in", async ({
    page,
  }) => {
    await page.goto("/examples/sign-in");
    await hydrated(page);
    const example = page.getByRole("region", { name: "Sign in example" });
    const email = example.getByLabel("Email");
    const password = example.getByLabel("Password", { exact: true });
    await email.fill("not-an-email");
    await password.fill("short");
    await example.getByRole("button", { name: "Continue" }).click();
    await expect(
      example.getByText("Enter an email address, like name@example.com."),
    ).toBeVisible();
    await expect(
      example.getByText("Use at least 12 characters."),
    ).toBeVisible();
    await email.fill("sam@example.com");
    await password.fill("correct horse battery");
    await example.getByRole("button", { name: "Continue" }).click();
    await expect(example.getByText("Check your phone")).toBeVisible();
    // The step replaced the button that was pressed; its heading has focus.
    await expect(
      example.getByRole("heading", { name: "Check your phone" }),
    ).toBeFocused();

    const enterCode = async (code: string) => {
      for (const [index, digit] of [...code].entries()) {
        await example
          .getByRole("textbox", { name: `Digit ${index + 1} of 6` })
          .fill(digit);
      }
    };
    await enterCode("000000");
    await example.getByRole("button", { name: "Verify" }).click();
    await expect(
      example.getByText(
        "That code did not match. Check the message and try again.",
      ),
    ).toBeVisible();
    await enterCode("123456");
    await example.getByRole("button", { name: "Verify" }).click();
    await expect(example.getByText("Welcome back")).toBeVisible();
    await expect(
      example.getByText("You are signed in as sam@example.com."),
    ).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Sign out" }).click();
    await expect(example.getByText("Sign in to Venue Manager")).toBeVisible();
  });
});

test.describe("dashboard example", () => {
  test("pages, filters, searches, archives a venue and adds one", async ({
    page,
  }) => {
    await page.goto("/examples/dashboard");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Operations dashboard example",
    });
    await expect(example.getByText("12 venues · page 1 of 3")).toBeVisible();
    await example.getByRole("link", { name: /next page/i }).click();
    await expect(example.getByText("12 venues · page 2 of 3")).toBeVisible();

    const status = example.getByRole("group", { name: "Status" });
    await status.getByRole("button", { name: "Draft" }).click();
    await expect(example.getByText("2 venues")).toBeVisible();
    await status.getByRole("button", { name: "All" }).click();
    await example
      .getByRole("searchbox", { name: "Search venues" })
      .fill("harbour");
    await expect(example.getByText("1 venue")).toBeVisible();
    await example
      .getByRole("button", { name: "Actions for Harbour Terminal" })
      .click();
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(
      example.getByText("Harbour Terminal is now archived."),
    ).toBeVisible();
    await expect(example.getByRole("cell", { name: "Archived" })).toBeVisible();

    await example.getByRole("searchbox", { name: "Search venues" }).fill("");
    await example.getByRole("button", { name: "Add venue" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add a venue" });
    await dialog.getByRole("button", { name: "Add venue" }).click();
    await expect(dialog.getByText("Give the venue a name.")).toBeVisible();
    await dialog.getByLabel("Name").fill("Pier Market");
    await dialog.getByRole("button", { name: "Add venue" }).click();
    await expect(
      example.getByText("Pier Market was added as a draft."),
    ).toBeVisible();
    await expect(example.getByText("13 venues · page 1 of 3")).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
  });

  test("the console's sections go down the rail, and into a drawer below 48rem", async ({
    page,
  }) => {
    // The dashboard side menu's design (decision 42, #142): a 96px rail
    // whose items fill it, each icon over its label, the selected one in the
    // light tint with a 2px bar down its inline end.
    await page.goto("/examples/dashboard");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Operations dashboard example",
    });
    const rail = example.getByRole("complementary", { name: "Console" });
    const drawn = () =>
      rail.evaluate((aside) => {
        const own = aside.getBoundingClientRect();
        return {
          width: own.width,
          inner: aside.clientWidth,
          items: Array.from(aside.querySelectorAll("nav button")).map(
            (item) => {
              const box = item.getBoundingClientRect();
              const bar = item
                .querySelector('[data-slot="navigation-item-indicator"]')
                ?.getBoundingClientRect();
              return {
                name: item.textContent?.trim() ?? "",
                current: item.getAttribute("aria-current"),
                left: box.left - own.left,
                width: box.width,
                fill: getComputedStyle(item).backgroundColor,
                bar: bar
                  ? {
                      width: bar.width,
                      tall: bar.height === box.height,
                      end: box.right - bar.right,
                    }
                  : null,
              };
            },
          ),
        };
      });
    const rest = await drawn();
    expect(rest.width).toBe(96);
    expect(rest.items.map((item) => item.name)).toEqual([
      "Venues",
      "Places",
      "Reports",
      "Team",
      "Settings",
    ]);
    for (const item of rest.items) {
      expect([item.left, item.width], item.name).toEqual([0, rest.inner]);
      const selected = item.name === "Venues";
      expect(item.current, item.name).toBe(selected ? "page" : null);
      expect(item.fill === "rgba(0, 0, 0, 0)", item.name).toBe(!selected);
      expect(item.bar, item.name).toEqual(
        selected ? { width: 2, tall: true, end: 0 } : null,
      );
    }
    // Choosing a section moves the tint and the bar.
    await rail.getByRole("button", { name: "Places" }).click();
    const places = await drawn();
    expect(
      places.items.filter((item) => item.bar).map((item) => item.name),
    ).toEqual(["Places"]);
    expect(places.items.find((item) => item.name === "Places")?.current).toBe(
      "page",
    );

    // At 48rem the rail is there and the venue table fits beside it, in the
    // host's sans and in a wide one.
    await rail.getByRole("button", { name: "Venues" }).click();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(rail).toBeVisible();
    const overflow = () =>
      example.getByRole("table").evaluate((node) => {
        let box = node.parentElement;
        while (box && getComputedStyle(box).overflowX === "visible")
          box = box.parentElement;
        return box ? box.scrollWidth - box.clientWidth : null;
      });
    expect(await overflow(), "the table's scroll box overflows by").toBe(0);
    await widen(page, WIDE_SANS);
    expect(
      await overflow(),
      "in a wide sans, the table's scroll box overflows by",
    ).toBe(0);

    // Below it the rail goes, and its sections open from the navbar.
    await page.setViewportSize({ width: 767, height: 900 });
    await expect(rail).toBeHidden();
    await example.getByRole("button", { name: "Console menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Pointr operations" });
    await expect(
      drawer
        .getByRole("navigation", { name: "Console" })
        .getByRole("button", { name: "Reports" }),
    ).toBeVisible();
    await drawer.getByRole("button", { name: "Reports" }).click();
    await expect(drawer).toBeHidden();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(rail.getByRole("button", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("booking example", () => {
  test("checks each step before the next, then books", async ({ page }) => {
    await page.goto("/examples/booking");
    await hydrated(page);
    const example = page.getByRole("region", { name: "Room booking example" });
    await example.getByRole("button", { name: "Next" }).click();
    await expect(example.getByText("Choose a date.")).toBeVisible();
    await expect(example.getByText("Choose a start time.")).toBeVisible();
    await example.getByLabel("Date").fill("2026-10-05");
    await example.getByLabel("Start").fill("14:00");
    await example.getByRole("radio", { name: /Boardroom/ }).click();
    await example.getByRole("button", { name: "Next" }).click();
    await expect(
      example.getByRole("heading", { level: 3, name: "Details" }),
    ).toBeVisible();

    await example.getByRole("button", { name: "Next" }).click();
    await expect(example.getByText("Enter your name.")).toBeVisible();
    await expect(
      example.getByText("The room policy has to be accepted."),
    ).toBeVisible();
    await example.getByLabel("Your name").fill("Sam Rivera");
    await example.getByLabel("Email").fill("sam@example.com");
    await example.getByRole("checkbox", { name: /room policy/ }).click();
    await example.getByRole("button", { name: "Next" }).click();
    await expect(
      example.getByRole("heading", { level: 3, name: "Confirm" }),
    ).toBeVisible();
    await expect(example.getByText("Monday 5 October")).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Confirm booking" }).click();
    await expect(example.getByText("Booked.", { exact: true })).toBeVisible();
    await expect(
      example.getByText(/Boardroom on Monday 5 October at 14:00/),
    ).toBeVisible();
  });
});

test.describe("notifications example", () => {
  test("marks one read, shows only unread, marks all read and undoes it", async ({
    page,
  }) => {
    await page.goto("/examples/notifications");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Notifications inbox example",
    });
    await expect(example.getByLabel("4 unread")).toBeVisible();
    await example
      .getByRole("button", {
        name: "Mark “Lift 3 is out of service at Riverside Centre” as read",
      })
      .click();
    await expect(
      example.getByText("1 notification marked as read."),
    ).toBeVisible();
    await expect(example.getByRole("button", { name: "Undo" })).toBeFocused();
    await expect(example.getByLabel("3 unread")).toBeVisible();

    await example.getByRole("switch", { name: "Only unread" }).click();
    await expect(example.getByRole("button", { name: /^Mark “/ })).toHaveCount(
      3,
    );
    await example.getByRole("tab", { name: "System" }).click();
    await expect(example.getByRole("button", { name: /^Mark “/ })).toHaveCount(
      1,
    );
    await example.getByRole("button", { name: "Mark all as read" }).click();
    await expect(
      example.getByText("3 notifications marked as read."),
    ).toBeVisible();
    await expect(example.getByText("You are all caught up")).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Undo" }).click();
    await expect(example.getByLabel("3 unread")).toBeVisible();
  });
});

test.describe("onboarding example", () => {
  test("walks the five steps and sums them up", async ({ page }) => {
    await page.goto("/examples/onboarding");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "First-run onboarding example",
    });
    await example.getByRole("button", { name: "Let’s go" }).click();
    await example
      .getByRole("group", { name: "Distances" })
      .getByRole("radio", { name: "Feet" })
      .click();
    await example.getByRole("button", { name: "Next" }).click();
    await example
      .getByRole("group", { name: "Interests" })
      .getByRole("button", { name: "Events" })
      .click();
    await expect(example.getByText("2 picked.")).toBeVisible();
    await example.getByRole("button", { name: "Next" }).click();
    await example.getByRole("radio", { name: /^Always/ }).click();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Next" }).click();
    await expect(example.getByText(/Distances in feet/)).toBeVisible();
    await expect(example.getByText("Interests: Shops, Events.")).toBeVisible();
    await expect(example.getByText("Location: always.")).toBeVisible();
    await example.getByRole("button", { name: "Start exploring" }).click();
    await expect(example.getByText("You are set")).toBeVisible();
  });
});

test.describe("states example", () => {
  test("loads on its own, empties, fails and retries, and works offline", async ({
    page,
  }) => {
    await page.goto("/examples/states");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Loading, empty, error, offline example",
    });
    await expect(example.getByText("Loading shops")).toBeVisible();
    await expect(example.getByText("3 shops, nearest first")).toBeVisible({
      timeout: 8000,
    });
    const state = example.getByRole("group", { name: "State" });
    await state.getByRole("radio", { name: "Empty" }).click();
    await expect(example.getByText("No shops match")).toBeVisible();
    await example.getByRole("button", { name: "Show every shop" }).click();
    await expect(example.getByText("3 shops, nearest first")).toBeVisible();
    await state.getByRole("radio", { name: "Error" }).click();
    await expect(
      example.getByText(/The shops could not be loaded/),
    ).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Try again" }).click();
    await expect(example.getByText("3 shops, nearest first")).toBeVisible({
      timeout: 8000,
    });
    await state.getByRole("radio", { name: "Offline" }).click();
    await expect(example.getByText(/You are offline/)).toBeVisible();
    await expect(example.getByText("Saved copy")).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
  });
});

test.describe("feedback survey example", () => {
  test("asks two more questions after the rating and thanks the visitor", async ({
    page,
  }) => {
    await page.goto("/examples/feedback-survey");
    await hydrated(page);
    const example = page.getByRole("region", {
      name: "Feedback survey example",
    });
    await example.getByRole("radio", { name: "Rate 4 out of 5 stars" }).click();
    await example.getByRole("button", { name: "Submit Feedback" }).click();
    await expect(example.getByText("Two more questions")).toBeVisible();
    await expect(
      example.getByText("You rated the visit 4 of 5."),
    ).toBeVisible();
    await example.getByRole("radio", { name: "Signs in the centre" }).click();
    await example
      .getByRole("checkbox", { name: "Opening hours on the map" })
      .click();
    await example
      .getByRole("switch", { name: "Someone may contact me about this" })
      .click();
    await example.getByRole("button", { name: "Send" }).click();
    await expect(
      example.getByText("Enter an email address, like name@example.com."),
    ).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByLabel("Email").fill("sam@example.com");
    await example.getByRole("button", { name: "Send" }).click();
    await expect(
      example.getByText("Thank you.", { exact: true }),
    ).toBeVisible();
    await expect(
      example.getByText(
        /found the way by signs in the centre; one thing would help/,
      ),
    ).toBeVisible();
  });
});

test.describe("saved places example", () => {
  test("removes a place after confirming, undoes it, and searches", async ({
    page,
  }) => {
    await page.goto("/examples/saved-places");
    await hydrated(page);
    const example = page.getByRole("region", { name: "Saved places example" });
    await expect(example.getByText(/6 places across 3 venues/)).toBeVisible();
    const bookshop = example.getByRole("treeitem", { name: /Bookshop/ });
    await expect(bookshop).toBeVisible();
    await bookshop.hover();
    await example
      .getByRole("button", { name: "Remove Bookshop from saved places" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Remove Bookshop?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(
      example.getByText("Bookshop is no longer saved."),
    ).toBeVisible();
    // The row that opened the dialog is gone; focus is on the undo.
    await expect(example.getByRole("button", { name: "Undo" })).toBeFocused();
    await expect(example.getByText(/5 places across 3 venues/)).toBeVisible();
    await hydrated(page);
    expect(await axeViolations(page)).toEqual([]);
    await example.getByRole("button", { name: "Undo" }).click();
    await expect(example.getByText(/6 places across 3 venues/)).toBeVisible();
    await expect(
      example.getByRole("heading", { name: "Saved places" }),
    ).toBeFocused();
    await example
      .getByRole("searchbox", { name: "Search saved places" })
      .fill("gate");
    await expect(
      example.getByRole("treeitem", { name: /Gate B12/ }),
    ).toBeVisible();
    await expect(example.getByRole("treeitem")).toHaveCount(2);
  });
});

test.describe("roadmap", () => {
  /**
   * The roadmap as GAPS.md and DS-HANDOFF.md say it, read at build time
   * (scripts/generate-roadmap.mjs, whose own tests read the documents).
   */
  const expected = JSON.parse(
    readFileSync(
      new URL("../src/generated/roadmap.json", import.meta.url),
      "utf8",
    ),
  ) as {
    total: number;
    groups: {
      id: string | null;
      title: string;
      items: { id: string; title: string; status: string }[];
    }[];
  };
  const label: Record<string, string> = {
    open: "Open",
    composed: "Worked around",
    "left visible": "Shown as is",
    fixed: "Fixed",
  };

  test("lists every item in GAPS.md, by the handoff's priority, with its status", async ({
    page,
  }) => {
    await page.goto("/roadmap");
    await hydrated(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Roadmap");
    let rows = 0;
    for (const group of expected.groups) {
      const heading = group.id ? `${group.id} · ${group.title}` : group.title;
      await expect(
        page.getByRole("heading", { level: 2, name: heading }),
      ).toBeVisible();
      const table = page.getByRole("table", { name: group.id ?? group.title });
      const body = table.locator("tbody tr");
      await expect(body).toHaveCount(group.items.length);
      for (const [index, item] of group.items.entries()) {
        const row = body.nth(index);
        // The title as GAPS.md writes it, less its code marks.
        await expect(row).toContainText(item.title.replace(/`/g, ""));
        await expect(row).toContainText(item.id);
        await expect(
          row.getByText(label[item.status]!, { exact: true }),
        ).toBeVisible();
        rows += 1;
      }
    }
    expect(rows).toBe(expected.total);
  });

  test("links an item to the examples it shows in, and the examples to it", async ({
    page,
  }) => {
    await page.goto("/roadmap");
    await hydrated(page);
    // GAP-33 is shown in two examples; GAP-56's were deleted when the design
    // system fixed it and the workarounds went with it.
    const row = page.getByRole("row").filter({ hasText: "GAP-33" });
    await expect(row.getByRole("link")).toHaveText([
      "Wayfinding",
      "Kiosk directory",
    ]);
    await expect(
      page.getByRole("row").filter({ hasText: "GAP-56" }).getByRole("link"),
    ).toHaveCount(0);
    await row.getByRole("link", { name: "Wayfinding" }).click();
    await expect(page).toHaveURL(/\/examples\/wayfinding$/);
    // The example no longer lists its gaps: it points at the roadmap.
    await expect(
      page.getByRole("heading", { name: "Where Kozmos falls short" }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "roadmap", exact: true }).click();
    await expect(page).toHaveURL(/\/roadmap$/);
    await expect(page.locator("main#main")).toBeFocused();
    // The footer and the search reach it too.
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Roadmap" }),
    ).toHaveAttribute("href", "/roadmap");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search the site" });
    await dialog
      .getByRole("searchbox", { name: "Search the site" })
      .fill("roadmap");
    await expect(
      dialog.getByRole("option", { name: /^Roadmap/ }),
    ).toBeVisible();
  });
});

test("the search opens from the keyboard or the header and takes you there", async ({
  page,
}) => {
  await page.goto("/");
  await hydrated(page);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search the site" });
  await expect(dialog).toBeVisible();
  // Before a word: the pages and the foundations, as a contents list.
  await expect(dialog.getByRole("option", { name: /^Colour/ })).toBeVisible();
  await dialog.getByRole("searchbox", { name: "Search the site" }).fill("tree");
  await dialog.getByRole("option", { name: /^Tree/ }).click();
  await expect(page).toHaveURL(/\/components\/tree$/);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tree");

  // From the header, Enter opens the first result.
  await page.getByRole("button", { name: "Search the site" }).click();
  await dialog
    .getByRole("searchbox", { name: "Search the site" })
    .fill("wayfinding");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/examples\/wayfinding$/);
  await expect(page.locator("main#main")).toBeFocused();

  // The down arrow moves into the results; a result opens from there.
  await page.keyboard.press("Control+k");
  const field = dialog.getByRole("searchbox", { name: "Search the site" });
  await field.fill("button");
  // Purposeful component descriptions now match more than the twelve shown.
  // Verify the capped announcement and list, not just the uncapped wording.
  await expect(dialog.locator('[aria-live="polite"]')).toHaveText(
    /^The best 12 of \d+ results; type more to narrow them\.$/,
  );
  await expect(dialog.getByRole("option")).toHaveCount(12);
  await expect(dialog.getByRole("option").first()).toHaveText(/^Button/);
  await page.keyboard.press("ArrowDown");
  await expect(dialog.getByRole("listbox", { name: "Results" })).toBeFocused();

  // However it closes, the next search starts from an empty field.
  await page.keyboard.press("Control+k");
  await expect(dialog).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(field).toHaveValue("");

  // Nothing found says so.
  await field.fill("zzzz");
  await expect(dialog.getByText(/Nothing has “zzzz”/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a button that holds an icon and words keeps them 8px apart", async ({
  page,
}) => {
  // Seven pages, each loaded and scrolled end to end: nine took 16–22s in
  // WebKit on CI, and 31s, past the 30s limit, on a slower runner (run
  // 36432507904).
  test.slow();
  // GAP-56, fixed in Kozmos: its Button keeps the 8px Figma's keeps between
  // its indicator and its label, and so does every button the site draws.
  const cases: [string, (page: Page) => Locator, number?][] = [
    ["/", (p) => p.getByRole("banner").getByRole("button", { name: /^Theme/ })],
    [
      "/",
      (p) =>
        p
          .getByRole("region", { name: "Make it yours" })
          .getByRole("button", { name: "Directions" }),
    ],
    [
      "/foundations/icons",
      (p) => p.getByRole("button", { name: "Copy search-md" }),
    ],
    ["/foundations/theming", (p) => p.getByRole("button", { name: "Back" })],
    [
      "/examples/dashboard",
      (p) => p.getByRole("button", { name: "Add venue" }),
    ],
    [
      "/examples/notifications",
      (p) => p.getByRole("button", { name: "Preferences" }),
    ],
    // The reference's drawer button, below 64rem.
    [
      "/components/button",
      (p) => p.getByRole("button", { name: "Components" }),
      900,
    ],
  ];
  for (const [path, find, width] of cases) {
    await page.setViewportSize({ width: width ?? 1280, height: 800 });
    await page.goto(path);
    await scrolled(page);
    const button = find(page);
    await button.scrollIntoViewIfNeeded();
    expect(await iconGap(button), path).toBe(8);
  }
});

test("the search's results never scroll sideways: a long description ends in an ellipsis", async ({
  page,
}) => {
  await page.goto("/");
  await hydrated(page);
  await page.getByRole("button", { name: "Search the site" }).click();
  const list = page
    .getByRole("dialog", { name: "Search the site" })
    .getByRole("listbox", { name: "Results" });
  await expect(list).toBeVisible();
  const fit = await list.evaluate((element) => {
    const width = element.getBoundingClientRect().width;
    const options = [...element.querySelectorAll('[role="option"]')];
    const descriptions = options
      .map((option) => option.querySelector("span span:last-child"))
      .filter((line): line is HTMLElement => line instanceof HTMLElement);
    return {
      sideways: element.scrollWidth - element.clientWidth,
      widest: Math.max(
        ...options.map((option) => option.getBoundingClientRect().width),
      ),
      width,
      cut: descriptions.some(
        (line) =>
          line.scrollWidth > line.clientWidth &&
          getComputedStyle(line).textOverflow === "ellipsis",
      ),
    };
  });
  expect(fit.sideways).toBeLessThanOrEqual(0);
  expect(fit.widest).toBeLessThanOrEqual(fit.width);
  // The contents list holds descriptions longer than a line: they are cut.
  expect(fit.cut).toBe(true);
});

test.describe("components", () => {
  const total = componentIndex.components.length;
  const byName = (name: string) =>
    componentIndex.components.find((component) => component.name === name)!;
  /** The status cells of one component's row, in the table's order. */
  const rowOf = (table: Locator, name: string) =>
    table.getByRole("row").filter({
      has: table
        .page()
        .getByRole("rowheader")
        .getByRole("link", { name, exact: true }),
    });

  test("the index lists every component by platform, lane by lane, and searches and filters", async ({
    page,
  }) => {
    await page.goto("/components");
    await hydrated(page);
    await expect(page.getByText(`${total} of ${total} shown`)).toBeVisible();

    // One table per lane, one row per component, each row the status
    // script's four answers.
    const lanes = ["core", "product-sdk", "platform-form-factor", "code-only"];
    let rows = 0;
    for (const lane of lanes) {
      const table = page.getByRole("table", {
        name: `${componentIndex.lanes[lane].title} components by platform`,
      });
      const inLane = componentIndex.components.filter(
        (component) => component.lane === lane,
      );
      // The header row, and one per component.
      await expect(table.getByRole("row")).toHaveCount(inLane.length + 1);
      rows += inLane.length;
    }
    expect(rows).toBe(total);
    await expect(
      page.getByRole("table", { name: /components by platform$/ }),
    ).toHaveCount(lanes.length);

    const search = page.getByRole("searchbox", { name: "Search components" });
    await search.fill("otp");
    await expect(page.getByText(`1 of ${total} shown`)).toBeVisible();
    // In the table: the sidebar beside it lists every component too.
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: "OTPInput", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("table", { name: /components by platform$/ }),
    ).toHaveCount(1);
    await search.fill("zzzz");
    await expect(page.getByText("No component matches")).toBeVisible();
    await search.fill("");

    const platform = componentIndex.components.filter(
      (component) => component.lane === "platform-form-factor",
    );
    await page
      .getByRole("group", { name: "Lanes" })
      .getByRole("button", {
        name: componentIndex.lanes["platform-form-factor"].title,
      })
      .click();
    await expect(
      page.getByText(`${platform.length} of ${total} shown`),
    ).toBeVisible();
    for (const component of platform) {
      await expect(
        main.getByRole("link", { name: component.name, exact: true }),
      ).toBeVisible();
    }
    await page
      .getByRole("group", { name: "Lanes" })
      .getByRole("button", { name: "All" })
      .click();
    await expect(page.getByText(`${total} of ${total} shown`)).toBeVisible();
  });

  test("each row says what the status script says, in words", async ({
    page,
  }) => {
    await page.goto("/components");
    await hydrated(page);
    // Every component and every platform: the words in its cell are the
    // generated state's, so the page cannot drift from the data.
    const cells = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLTableRowElement>(
          'table[aria-label$="components by platform"] tbody tr',
        ),
      ).map((row) => ({
        name: row.querySelector("th")?.textContent?.trim() ?? "",
        states: Array.from(row.querySelectorAll("td")).map(
          (cell) => cell.textContent?.trim() ?? "",
        ),
      })),
    );
    expect(cells).toHaveLength(total);
    for (const { name, states } of cells) {
      const component = byName(name);
      expect({ name, states }).toEqual({
        name,
        states: PLATFORMS.map(
          (platform) => STATE_LABEL[component.platforms[platform]],
        ),
      });
    }
    // The cases the site was wrong about, and the one nobody expects.
    const core = page.getByRole("table", {
      name: "Core components by platform",
    });
    await expect(rowOf(core, "AICompanionPanel").getByRole("cell")).toHaveText([
      "Implemented",
      "Not yet",
      "Not yet",
      "Not yet",
    ]);
    const utilities = page.getByRole("table", {
      name: `${componentIndex.lanes["code-only"].title} components by platform`,
    });
    await expect(
      rowOf(utilities, "ThemeProvider").getByRole("cell").last(),
    ).toHaveText("Not expected");
    // A lane nobody expects in Figma says so, rather than "0 of 0".
    await expect(
      page.getByRole("region", {
        name: componentIndex.lanes["code-only"].title,
      }),
    ).toContainText("Figma not expected");
  });

  test("the marks say what they mean, and what none of them proves", async ({
    page,
  }) => {
    await page.goto("/components#marks");
    await hydrated(page);
    const marks = page.getByRole("region", { name: "What the marks mean" });
    await expect(marks.getByRole("table")).toBeVisible();
    await expect(marks.getByRole("row")).toHaveCount(5);
    for (const label of Object.values(STATE_LABEL)) {
      await expect(
        marks.getByRole("cell", { name: label, exact: true }),
      ).toBeVisible();
    }
    // What the status report's own scope section says: structure, not parity.
    await expect(marks).toContainText("proves structure only");
    await expect(marks).toContainText("It does not say the platforms match");
    await expect(marks).toContainText("check-completion.ts");
    // And Storybook for the detail.
    await expect(
      page.getByRole("link", { name: "Open Storybook" }),
    ).toHaveAttribute("href", "/storybook/");
  });

  test("the sidebar and the neighbour links move between components in the page", async ({
    page,
  }) => {
    await page.goto("/components");
    await hydrated(page);
    await page.evaluate(() => {
      (window as unknown as { sameDocument: boolean }).sameDocument = true;
    });
    const sidebar = page.getByRole("complementary", { name: "Components" });
    await sidebar.getByRole("link", { name: "Tree" }).click();
    await expect(page).toHaveURL(/\/components\/tree$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tree");
    await expect(page.locator("main#main")).toBeFocused();
    await expect(sidebar.getByRole("link", { name: "Tree" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const neighbours = page.getByRole("navigation", {
      name: "Neighbouring components",
    });
    const previous = neighbours.getByRole("link", { name: /^← / });
    const name = ((await previous.textContent()) ?? "").replace("← ", "");
    await previous.click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    expect(
      await page.evaluate(
        () => (window as unknown as { sameDocument?: boolean }).sameDocument,
      ),
    ).toBe(true);
  });

  test("a component's page is its description, where it exists and its Storybook page", async ({
    page,
  }) => {
    const button = byName("Button");
    await page.goto("/components/button");
    await hydrated(page);
    await expect(page.locator("main")).toContainText(button.description);
    await expect(
      page
        .getByRole("table", { name: "Where Button exists" })
        .getByRole("cell"),
    ).toHaveText(
      PLATFORMS.map((platform) => STATE_LABEL[button.platforms[platform]]),
    );
    // Nothing of the reference is left on the page: no code, no props.
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByRole("table")).toHaveCount(1);
    const open = page.getByRole("link", { name: "Open in Storybook" });
    await expect(open).toHaveAttribute(
      "href",
      "/storybook/?path=/docs/components-button--docs",
    );
    // A plain link: it loads Storybook, it does not ask the router.
    await page.evaluate(() => {
      (window as unknown as { sameDocument: boolean }).sameDocument = true;
    });
    await open.click();
    await page.waitForURL(
      /\/storybook\/\?path=\/docs\/components-button--docs$/,
    );
    expect(
      await page.evaluate(
        () => (window as unknown as { sameDocument?: boolean }).sameDocument,
      ),
    ).toBeUndefined();

    // Not on iOS or Android yet, and it says so.
    await page.goto("/components/ai-companion-panel");
    await hydrated(page);
    await expect(
      page
        .getByRole("table", { name: "Where AICompanionPanel exists" })
        .getByRole("cell"),
    ).toHaveText(["Implemented", "Not yet", "Not yet", "Not yet"]);

    // No docs page in Storybook: its first story, and a line that says so.
    await page.goto("/components/category-field");
    await hydrated(page);
    await expect(
      page.getByRole("link", { name: "Open in Storybook" }),
    ).toHaveAttribute(
      "href",
      `/storybook/?path=${byName("CategoryField").storybook}`,
    );
    await expect(
      page.getByText("Its docs page is not written yet"),
    ).toBeVisible();

    // GAP-81: the real description replaces the old placeholder notice.
    await page.goto("/components/backdrop");
    await hydrated(page);
    expect(byName("Backdrop").description).toContain("A full-viewport scrim");
    await expect(page.locator("main")).toContainText(
      withoutCode(byName("Backdrop").description),
    );
    await expect(
      page.getByText("Its docs have no description yet."),
    ).toHaveCount(0);
  });
});

// Every component page, in both themes, in one browser: the sampled pages
// above run in all three. Each page must answer, name itself, say where the
// component exists as the data does, link to Storybook, pass axe and log
// nothing. The dark theme is walked too: a token can pass on white and fail
// on black (GAP-45).
test.describe("every component page", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "one browser walks all the pages",
  );

  for (const colorScheme of ["light", "dark"] as const) {
    test.describe(`${colorScheme} theme`, () => {
      test.use({ colorScheme });

      for (const component of componentIndex.components) {
        componentPageTest(component, colorScheme);
      }
    });
  }
});

/** One component page's walk: it answers, names itself, says where it exists, passes axe. */
function componentPageTest(
  component: (typeof componentIndex.components)[number],
  colorScheme: "light" | "dark",
) {
  const { slug, name } = component;
  test(`/components/${slug} says where ${name} exists and passes axe`, async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const response = await page.goto(`/components/${slug}`);
    expect(response?.status()).toBe(200);
    await hydrated(page);
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    // A platform to a row: each row's header, then what the data says.
    const where = page.getByRole("table", { name: `Where ${name} exists` });
    await expect(where.getByRole("rowheader")).toHaveText([
      "React",
      "SwiftUI",
      "Compose",
      "Figma",
    ]);
    await expect(where.getByRole("cell")).toHaveText(
      PLATFORMS.map((platform) => STATE_LABEL[component.platforms[platform]]),
    );
    if (component.storybook) {
      await expect(
        page.getByRole("link", { name: "Open in Storybook" }),
      ).toHaveAttribute("href", `/storybook/?path=${component.storybook}`);
    }
    await scrolled(page);
    expect(await axeViolations(page)).toEqual([]);
    expect(await overriddenSiteCss(page)).toEqual([]);
    expect(await clippedEdges(page)).toEqual([]);
    // WCAG 1.4.10: no sideways scroll at 320px, on every page — in the
    // host's own sans and in a wider one, since a component's name is one
    // long identifier (BrowseCategoriesPanel) and where it breaks is the
    // font's decision, not the site's.
    await page.setViewportSize({ width: 320, height: 700 });
    const sideways = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
    expect(await sideways()).toBeLessThanOrEqual(0);
    await widen(page, WIDE_SANS);
    expect(await sideways()).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}
