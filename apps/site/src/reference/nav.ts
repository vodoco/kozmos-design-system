import index from "../generated/components.json";
import type { DocsSection } from "../site/DocsShell";
import type {
  ComponentIndex,
  ComponentSummary,
  Lane,
  Platform,
  PlatformState,
} from "./types";

export const componentIndex = index as ComponentIndex;

/** The lanes in the order the site shows them. */
export const laneOrder: readonly Lane[] = [
  "core",
  "product-sdk",
  "platform-form-factor",
  "code-only",
];

export function laneTitle(lane: Lane): string {
  return componentIndex.lanes[lane].title;
}

export function componentsInLane(lane: Lane): ComponentSummary[] {
  return componentIndex.components.filter(
    (component) => component.lane === lane,
  );
}

export function componentBySlug(slug: string): ComponentSummary | undefined {
  return componentIndex.components.find((component) => component.slug === slug);
}

/** The platforms in the order the site shows them, and their names. */
export const platformOrder: readonly Platform[] = [
  "react",
  "swiftui",
  "compose",
  "figma",
];

export const platformLabel: Record<Platform, string> = {
  react: "React",
  swiftui: "SwiftUI",
  compose: "Compose",
  figma: "Figma",
};

export const stateLabel: Record<PlatformState, string> = {
  implemented: "Implemented",
  linked: "Linked",
  "not-yet": "Not yet",
  "not-expected": "Not expected",
};

/** Whether a component is there on a platform: implemented, or linked in Figma. */
export function exists(state: PlatformState): boolean {
  return state === "implemented" || state === "linked";
}

/** How many of some components are there on a platform, and of how many it could be. */
export function countOn(
  platform: Platform,
  components: readonly ComponentSummary[] = componentIndex.components,
): { present: number; expected: number } {
  return {
    present: components.filter((component) =>
      exists(component.platforms[platform]),
    ).length,
    expected: components.filter(
      (component) => component.platforms[platform] !== "not-expected",
    ).length,
  };
}

/** The neighbours in reading order — lane by lane, alphabetical within one. */
export function neighbours(slug: string): {
  previous?: ComponentSummary;
  next?: ComponentSummary;
} {
  const ordered = laneOrder.flatMap((lane) => componentsInLane(lane));
  const at = ordered.findIndex((component) => component.slug === slug);
  return { previous: ordered[at - 1], next: ordered[at + 1] };
}

export const componentsSection: DocsSection = {
  title: "Components",
  summary: `${componentIndex.components.length} components, and where each one exists.`,
  pages: [{ to: "/components", title: "Overview" }],
  groups: laneOrder.map((lane) => ({
    title: laneTitle(lane),
    pages: componentsInLane(lane).map((component) => ({
      to: `/components/${component.slug}`,
      title: component.name,
    })),
  })),
};
