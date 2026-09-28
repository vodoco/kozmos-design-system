import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import type { Demo, DemoModule } from "./types";

/**
 * The demos, one module per component slug, loaded on demand so that the
 * index and each page only carry the demos they show. A component with no
 * demo file is still documented — from its generated data — and says so.
 */
const demoModules = import.meta.glob<DemoModule>("./demos/*.tsx");
const demoSources = import.meta.glob<string>("./demos/*.tsx", {
  query: "?raw",
  import: "default",
});

function key(slug: string) {
  return `./demos/${slug}.tsx`;
}

export function hasDemos(slug: string): boolean {
  return key(slug) in demoModules;
}

export function loadDemos(slug: string): Promise<DemoModule> | undefined {
  return demoModules[key(slug)]?.();
}

export function loadDemoSource(slug: string): Promise<string> | undefined {
  return demoSources[key(slug)]?.();
}

type DemosRender = { children: (demos: readonly Demo[]) => ReactNode };
type SourceRender = { children: (source: string) => ReactNode };

/**
 * Lazy components, one per slug, made once and kept. A lazy component made
 * during a render is thrown away when that render suspends, so a page that
 * made its own would make a new one on every retry: going from Tree to
 * Tooltip, the same route with a new slug, never settled and the page kept
 * showing Tree under Tooltip's address.
 */
const demoLists = new Map<
  string,
  LazyExoticComponent<ComponentType<DemosRender>>
>();
const sources = new Map<
  string,
  LazyExoticComponent<ComponentType<SourceRender>>
>();

/** A component that loads the slug's demos and hands them to its child. */
export function lazyDemos(
  slug: string,
): LazyExoticComponent<ComponentType<DemosRender>> {
  let entry = demoLists.get(slug);
  if (!entry) {
    entry = lazy(async () => {
      const demos = (await loadDemos(slug))?.demos ?? [];
      return { default: ({ children }: DemosRender) => children(demos) };
    });
    demoLists.set(slug, entry);
  }
  return entry;
}

/** A component that loads the demo file's source and hands it to its child. */
export function lazyDemoSource(
  slug: string,
): LazyExoticComponent<ComponentType<SourceRender>> {
  let entry = sources.get(slug);
  if (!entry) {
    entry = lazy(async () => {
      const source = (await loadDemoSource(slug)) ?? "";
      return { default: ({ children }: SourceRender) => children(source) };
    });
    sources.set(slug, entry);
  }
  return entry;
}
