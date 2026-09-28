import type { ComponentData } from "./types";

/**
 * The generated data for one component, loaded on demand. The loader that
 * calls this runs at build time (the pages are pre-rendered), so the JSON
 * never reaches the browser bundle; a navigation fetches the page's data.
 */
const files = import.meta.glob<{ default: ComponentData }>(
  "../generated/components/*.json",
);

export async function loadComponentData(
  slug: string,
): Promise<ComponentData | undefined> {
  const load = files[`../generated/components/${slug}.json`];
  if (!load) return undefined;
  return (await load()).default;
}
