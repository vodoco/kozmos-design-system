import { readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import type {
  POIAction,
  POIDetailsPresentation,
  POIPresentation,
} from "@kozmos-ds/product-contracts";
import {
  ArrowDownRight,
  ArrowUpRight,
  LogIn01,
  LogOut01,
  getIconComponent,
  kozmosIconAliases,
  kozmosIconNames,
  type KozmosIconComponent,
  type KozmosIconKey,
} from "@kozmos-ds/icons";
import { describe, expect, it, vi } from "vitest";
import { POIDetailPanel } from "./POIDetailPanel";

// Paths from this file, not `new URL(literal, import.meta.url)`: Vite rewrites
// that form into a served asset URL, which `readFileSync` cannot open.
const here = dirname(fileURLToPath(import.meta.url));
const read = (fromRepo: string) =>
  readFileSync(resolvePath(here, "../../../../..", fromRepo), "utf8");

/** The text between the first `start` and the next `end` after it. */
function between(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  if (from < 0) throw new Error(`no ${JSON.stringify(start)}`);
  const to = source.indexOf(end, from + start.length);
  if (to < 0) throw new Error(`no ${JSON.stringify(end)} after ${start}`);
  return source.slice(from + start.length, to);
}
const captures = (source: string, pattern: RegExp) =>
  Array.from(source.matchAll(pattern), (match) => match[1]);
const quoted = (source: string) => captures(source, /"([^"]+)"/g);

/**
 * The Pointr Maps - Express wayfinding artwork, as its one source lists it.
 * `@kozmos-ds/icons` exports each glyph under `name`, and SwiftUI and Compose
 * draw it by the kebab case of that name, as their own tests spell it:
 * ElevatorUpAndDown as elevator-up-and-down.
 */
const glyphs = (
  JSON.parse(read("packages/icons/src/owned/navigation-glyphs.json")) as {
    glyphs: { name: string; paths: string[] }[];
  }
).glyphs.map((glyph) => ({
  ...glyph,
  iconName: glyph.name.replace(/(?<=[a-z0-9])([A-Z])/g, "-$1").toLowerCase(),
}));

/**
 * Pointr Icon Library outlines `KozmosIcon` draws by name on iOS and Android
 * that the web registry does not list, each from the export of
 * `@kozmos-ds/icons` the native path data was copied from.
 */
const pointrOutlines: Record<string, KozmosIconComponent> = {
  "log-in-01": LogIn01,
  "log-out-01": LogOut01,
  "arrow-up-right": ArrowUpRight,
  "arrow-down-right": ArrowDownRight,
};

/**
 * Every name SwiftUI's `KozmosIcon` draws artwork for, which its POI detail
 * tag asks before drawing one (`KozmosIcon.drawsArtwork(for:)`): the SF
 * Symbols it maps, Pointr's outlines and wayfinding artwork, and each alias
 * of a name it draws. Read from the sources as text, never compiled.
 */
function namesSwiftUIDraws(): Set<string> {
  const icon = read("packages/ios/Sources/Components/Icon/Icon.swift");
  const glyph = read("packages/ios/Sources/Components/Icon/PointrGlyph.swift");
  const generated = read(
    "packages/ios/Sources/Components/Icon/PointrIcons.generated.swift",
  );
  const drawn = new Set([
    ...captures(
      between(icon, "func knownSymbolName", "default: return nil"),
      /case "([^"]+)": return "/g,
    ),
    ...captures(
      between(glyph, "static func named", "default:"),
      /case "([^"]+)":/g,
    ),
    ...captures(
      between(glyph, "static let wayfindingKinds", "]\n"),
      /"([^"]+)": "/g,
    ),
    ...captures(
      between(generated, "static func data", "default:"),
      /case "([^"]+)": return \[/g,
    ),
  ]);
  const aliases = between(
    icon,
    "func resolvedIconName",
    "default: return name",
  );
  for (const [, names, target] of aliases.matchAll(
    /case ([^:\n]+): return "([^"]+)"/g,
  )) {
    for (const alias of quoted(names)) if (drawn.has(target)) drawn.add(alias);
  }
  return drawn;
}

/**
 * Every name Compose's `knownIconVector` draws, which its POI detail chip
 * draws and a name it does not know leaves bare: its hand mapping, the
 * generated Pointr outlines, and each alias of a name it draws.
 */
function namesComposeDraws(): Set<string> {
  const icon = read(
    "packages/android/src/main/java/com/kozmos/components/Icon/Icon.kt",
  );
  const generated = read(
    "packages/android/src/main/java/com/kozmos/components/Icon/PointrIcons.generated.kt",
  );
  const drawn = new Set([
    ...captures(
      between(
        icon,
        "fun knownIconVector",
        "else -> KozmosPointrIcons.named(name)",
      ),
      /^\s*"([^"]+)" ->/gm,
    ),
    ...captures(
      between(generated, "fun named", "else ->"),
      /^\s*"([^"]+)" ->/gm,
    ),
  ]);
  const aliases = between(icon, "fun resolveIconName", "else -> name");
  for (const [, names, target] of aliases.matchAll(
    /^\s*([^\n]+?) -> "([^"]+)"/gm,
  )) {
    for (const alias of quoted(names)) if (drawn.has(target)) drawn.add(alias);
  }
  return drawn;
}

/** Names no platform draws: unknown, inherited, an export name, a direction kind. */
const notIconNames = [
  "not-a-registered-icon",
  "constructor",
  "toString",
  "hasOwnProperty",
  "__proto__",
  "ElevatorUp",
  "Elevator-Up",
  "lift-up",
  "wf-shuttle",
];

const labels: Record<POIAction, string> = {
  navigate: "Go",
  favourite: "Favourite",
  bookmark: "Bookmark",
  share: "Share",
  order: "Order",
};

const poi: POIPresentation = {
  id: "gate-b",
  name: "Gate B",
  floorId: "1",
  floorLabel: "First floor",
  media: [],
  availability: "open",
  availabilityLabel: "Open",
  actions: ["navigate"],
};

const labelFor = (iconName: string) => `Tag for ${iconName}`;

/** One panel with a tag per name; each name's tag's icon, or null. */
function renderTags(names: readonly string[]) {
  render(
    <POIDetailPanel
      poi={poi}
      actionLabels={labels}
      onAction={vi.fn()}
      details={{
        tags: names.map((iconName) => ({
          id: `tag-${iconName}`,
          label: labelFor(iconName),
          iconName,
        })),
      }}
    />,
  );
  return (iconName: string) => {
    const tag = screen.getByText(labelFor(iconName)).closest("li");
    if (!tag) throw new Error(`no tag for ${iconName}`);
    return tag.querySelector("svg");
  };
}

/** The markup an icon draws at a tag's size and decoration. */
function drawn(Icon: KozmosIconComponent): string {
  const { container, unmount } = render(<Icon aria-hidden="true" size={16} />);
  const markup = container.querySelector("svg")!.outerHTML;
  unmount();
  return markup;
}

describe("POIDetailPanel tag icons", () => {
  it("draws each wayfinding glyph by its kebab-case name, from navigation-glyphs.json's artwork, filled at 16", () => {
    expect(glyphs).toHaveLength(23);
    const iconOf = renderTags(glyphs.map((glyph) => glyph.iconName));
    const missing = glyphs
      .filter((glyph) => iconOf(glyph.iconName) === null)
      .map((glyph) => glyph.iconName);
    expect(missing, "tags that draw no icon").toEqual([]);
    for (const glyph of glyphs) {
      const svg = iconOf(glyph.iconName)!;
      expect(
        Array.from(svg.querySelectorAll("path"), (path) =>
          path.getAttribute("d"),
        ),
        `${glyph.iconName} is not ${glyph.name}'s artwork`,
      ).toEqual(glyph.paths);
      expect(svg).toHaveAttribute("fill", "currentColor");
      expect(svg).toHaveAttribute("width", "16");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("draws the Pointr outlines iOS and Android draw by name beyond the registry", () => {
    const names = Object.keys(pointrOutlines);
    const iconOf = renderTags(names);
    for (const name of names) {
      expect(iconOf(name)?.outerHTML, name).toBe(drawn(pointrOutlines[name]));
    }
  });

  it("still draws every registry name and alias with the registry's artwork", () => {
    const names: KozmosIconKey[] = [
      ...kozmosIconNames,
      ...(Object.keys(kozmosIconAliases) as KozmosIconKey[]),
    ];
    expect(names).toHaveLength(57 + 17);
    const iconOf = renderTags(names);
    for (const name of names) {
      expect(iconOf(name)?.outerHTML, name).toBe(
        drawn(getIconComponent(name)!),
      );
    }
  });

  it("draws no icon, only the label, for a name Kozmos does not know", () => {
    const iconOf = renderTags(notIconNames);
    for (const name of notIconNames) {
      expect(screen.getByText(labelFor(name))).toBeVisible();
      expect(iconOf(name), name).toBeNull();
    }
  });

  it("draws exactly the names SwiftUI's and Compose's POI detail tags draw", () => {
    const swiftUI = namesSwiftUIDraws();
    const compose = namesComposeDraws();
    // At least the names each platform's own tests hold it to; fewer means
    // the sources above were not read.
    const floor = kozmosIconNames.length + 17 + glyphs.length;
    expect(swiftUI.size).toBeGreaterThanOrEqual(floor);
    expect(compose.size).toBeGreaterThanOrEqual(floor);
    const candidates = Array.from(
      new Set([
        ...kozmosIconNames,
        ...Object.keys(kozmosIconAliases),
        ...glyphs.map((glyph) => glyph.iconName),
        ...Object.keys(pointrOutlines),
        ...swiftUI,
        ...compose,
        ...notIconNames,
      ]),
    );
    const iconOf = renderTags(candidates);
    const web = candidates.filter((name) => iconOf(name) !== null).sort();
    expect(web, "the web's tags against SwiftUI's").toEqual(
      Array.from(swiftUI).sort(),
    );
    expect(web, "the web's tags against Compose's").toEqual(
      Array.from(compose).sort(),
    );
  });

  it("draws a wayfinding glyph in a service, a group's item and a tag alike", () => {
    const details: POIDetailsPresentation = {
      groups: [
        {
          id: "access",
          heading: "Access",
          items: [{ id: "lift", label: "Lift", iconName: "elevator-up" }],
        },
      ],
      tags: [{ id: "shuttle", label: "Shuttle stop", iconName: "shuttle" }],
    };
    render(
      <POIDetailPanel
        poi={{
          ...poi,
          services: [
            { id: "security", label: "Security", iconName: "security-control" },
          ],
        }}
        actionLabels={labels}
        onAction={vi.fn()}
        details={details}
      />,
    );
    for (const [label, glyph] of [
      ["Security", "SecurityControl"],
      ["Lift", "ElevatorUp"],
      ["Shuttle stop", "Shuttle"],
    ] as const) {
      const svg = screen.getByText(label).closest("li")?.querySelector("svg");
      expect(svg, label).not.toBeNull();
      expect(
        Array.from(svg!.querySelectorAll("path"), (path) =>
          path.getAttribute("d"),
        ),
        label,
      ).toEqual(glyphs.find((entry) => entry.name === glyph)!.paths);
    }
  });
});
