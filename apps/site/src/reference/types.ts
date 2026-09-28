/** The generated data (src/generated/components.json, scripts/generate-reference.mjs). */

export type Lane =
  | "core"
  | "code-only"
  | "product-sdk"
  | "platform-form-factor";

/** The four places a component can exist, in the order the site shows them. */
export type Platform = "react" | "swiftui" | "compose" | "figma";

/**
 * What exists on one platform. `implemented`: the platform's library has the
 * component. `linked`: Figma only — a Code Connect mapping ties it to a real
 * node in the Figma library. `not-yet`: not there yet. `not-expected`: Figma
 * only — a provider, a typography primitive or a nonvisual utility, which has
 * no Figma component set by design.
 */
export type PlatformState =
  | "implemented"
  | "linked"
  | "not-yet"
  | "not-expected";

export interface ComponentSummary {
  name: string;
  slug: string;
  lane: Lane;
  /** The docs' first paragraph, or the component's doc comment; "" when neither says anything. */
  description: string;
  /**
   * The `path` Storybook's address takes for the component's page: its docs
   * page (`/docs/…--docs`), or its first story (`/story/…`) where it has no
   * docs page; `null` where it has no stories.
   */
  storybook: string | null;
  platforms: Record<Platform, PlatformState>;
}

export interface ComponentIndex {
  lanes: Record<Lane, { title: string; description: string }>;
  components: ComponentSummary[];
}
