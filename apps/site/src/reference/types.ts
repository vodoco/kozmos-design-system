import type { ComponentType } from "react";

/** One live example on a component's page. */
export interface Demo {
  title: string;
  /** What to notice, or what the props do. One or two sentences. */
  description?: string;
  Component: ComponentType;
  /** A taller stage for parts that need room (maps, sheets, panels). */
  tall?: boolean;
}

/** What `src/reference/demos/<slug>.tsx` exports. */
export interface DemoModule {
  demos: readonly Demo[];
}

/** The generated data for one component (src/generated/components/<slug>.json). */
export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
  /** The Radix package a prop comes from, when it is a primitive's own. */
  source: string | null;
}

export interface ComponentPart {
  name: string;
  description: string;
  props: ComponentProp[];
}

export type Lane =
  | "core"
  | "code-only"
  | "product-sdk"
  | "platform-form-factor";

export interface ComponentData {
  name: string;
  slug: string;
  lane: Lane;
  description: string;
  snippets: Partial<Record<"react" | "vue" | "swift" | "kotlin", string>>;
  parts: ComponentPart[];
}

export interface ComponentSummary {
  name: string;
  slug: string;
  lane: Lane;
  description: string;
  exports: string[];
  /** The platforms whose code the component's docs carry. */
  code: ("react" | "swift" | "kotlin")[];
}

export interface ComponentIndex {
  lanes: Record<Lane, string>;
  components: ComponentSummary[];
}
