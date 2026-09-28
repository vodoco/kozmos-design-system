import index from "../generated/components.json";
import type { DocsSection } from "../site/DocsShell";
import type { ComponentIndex, ComponentSummary, Lane } from "./types";

export const componentIndex = index as ComponentIndex;

/** The lanes in the order the reference shows them. */
export const laneOrder: readonly Lane[] = [
  "core",
  "product-sdk",
  "platform-form-factor",
  "code-only",
];

export function laneTitle(lane: Lane): string {
  return componentIndex.lanes[lane];
}

export function componentsInLane(lane: Lane): ComponentSummary[] {
  return componentIndex.components.filter(
    (component) => component.lane === lane,
  );
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
  summary: `${componentIndex.components.length} components, live, with their props and code.`,
  pages: [{ to: "/components", title: "Overview" }],
  groups: laneOrder.map((lane) => ({
    title: laneTitle(lane),
    pages: componentsInLane(lane).map((component) => ({
      to: `/components/${component.slug}`,
      title: component.name,
    })),
  })),
};
