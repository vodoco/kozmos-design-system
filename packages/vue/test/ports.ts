import path from "node:path";
import type { StoryArgs } from "./parity/story-args";

/**
 * Every part `@kozmos-ds/vue` ports natively (Vue 3 Phase 0, P0.4), with the
 * React export it answers to. The API contract (`contract/`) holds each Vue
 * part's props, events and slots to its React part's; the DOM parity check
 * (`parity/stories.parity.spec.ts`) draws each React story's args in both,
 * and draws each part with attributes added to see they land as React's.
 * `coverage.spec.ts` fails when the main entry exports a part that is not
 * here, or when this file leaves a story, an event or a part undrawn, so a
 * new port cannot skip any of it.
 *
 * Specs named here are relative to `test/`; each must import the Vue part
 * and use it (`coverage.spec.ts`).
 */
export interface Port {
  /** The Vue export (`KozmosButton`). */
  vue: string;
  /** The React export it answers to (`Button`). */
  react: string;
  /**
   * React's stories file for the part, relative to `packages/react/src`, or
   * null when React has none of its own. Every story drawn from its args is
   * drawn in both, unless it is named in `elsewhere`.
   */
  stories: string | null;
  /**
   * The stories `stories.parity.spec.ts` cannot draw from their args, each
   * with the spec that draws in both what it shows: a story with its own
   * `render`, or one with args the reader cannot read (JSX, identifiers).
   */
  elsewhere?: Record<string, string>;
  /** Where a part without args stories is drawn in both. */
  drawnIn?: string;
  /**
   * The args a part without args stories is drawn with to see where
   * attributes land; a part with args stories is drawn with its first.
   */
  sample?: StoryArgs;
  /**
   * Each event the Vue part emits, and the spec that makes it fire beside
   * React's callback. Declaring an event is not emitting it.
   */
  events?: Record<string, string>;
  /**
   * The part of a compound this one draws only inside, by its React export
   * (`Avatar` for `AvatarFallback`): Radix's parts throw outside their
   * root, so the attributes and listeners checks draw it there, in both,
   * with that port's sample.
   */
  within?: string;
  /**
   * Why the part draws no element in a test's document, so an app's
   * attributes and listeners land nowhere in either framework (an image
   * that has not loaded), with the spec that draws it where it does.
   */
  unmarked?: { why: string; drawnIn: string };
}

export const PORTS: Port[] = [
  {
    vue: "KozmosThemeProvider",
    react: "ThemeProvider",
    stories: "components/ThemeProvider/ThemeProvider.stories.tsx",
    elsewhere: {
      // A provider whose buttons call useTheme().setTheme.
      Default: "parity/mounted.parity.spec.ts",
      // DensityScope at both densities; the controls it shows beyond Button
      // are not ported yet, and are drawn in both once they are.
      Density: "parity/provider-and-scope.parity.spec.ts",
    },
    drawnIn: "parity/button.parity.spec.ts",
    sample: { children: "Themed" },
    events: {
      "update:theme": "parity/mounted.parity.spec.ts",
    },
  },
  {
    vue: "KozmosDensityScope",
    react: "DensityScope",
    stories: null,
    drawnIn: "parity/provider-and-scope.parity.spec.ts",
    sample: { density: "compact", children: "Scoped" },
  },
  {
    vue: "KozmosButton",
    react: "Button",
    stories: "components/Button/Button.stories.tsx",
    elsewhere: {
      Emotions: "parity/button.parity.spec.ts",
      Subtle: "parity/button.parity.spec.ts",
      SubtleEmotions: "parity/button.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAnalyticsProvider",
    react: "AnalyticsProvider",
    stories: null,
    drawnIn: "parity/analytics.parity.spec.ts",
    sample: { children: "Reported" },
    events: {
      dispatch: "parity/analytics.parity.spec.ts",
    },
  },
  {
    vue: "KozmosBadge",
    react: "Badge",
    stories: "components/Badge/Badge.stories.tsx",
    elsewhere: {
      Icon: "parity/badge.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSeparator",
    react: "Separator",
    stories: "components/Separator/Separator.stories.tsx",
    elsewhere: {
      Default: "parity/separator.parity.spec.ts",
    },
    drawnIn: "parity/separator.parity.spec.ts",
    sample: { orientation: "vertical", decorative: false },
  },
  {
    vue: "KozmosText",
    react: "Text",
    stories: "components/Text/Text.stories.tsx",
  },
  {
    vue: "KozmosHeading",
    react: "Heading",
    stories: "components/Heading/Heading.stories.tsx",
    elsewhere: {
      AllLevels: "parity/heading.parity.spec.ts",
    },
  },
  {
    vue: "KozmosLabel",
    react: "Label",
    stories: "components/Label/Label.stories.tsx",
    elsewhere: {
      WithInput: "parity/label.parity.spec.ts",
    },
  },
  {
    vue: "KozmosIcon",
    react: "Icon",
    stories: "components/Icon/Icon.stories.tsx",
    elsewhere: {
      Sizes: "parity/icon.parity.spec.ts",
      Colors: "parity/icon.parity.spec.ts",
      Registry: "parity/icon.parity.spec.ts",
    },
  },
  {
    vue: "KozmosKbd",
    react: "Kbd",
    stories: "components/Kbd/Kbd.stories.tsx",
    elsewhere: {
      InAHint: "parity/kbd.parity.spec.ts",
    },
  },
  {
    vue: "KozmosCodeBlock",
    react: "CodeBlock",
    stories: "components/CodeBlock/CodeBlock.stories.tsx",
    elsewhere: {
      Default: "parity/code-block.parity.spec.ts",
      Scroll: "parity/code-block.parity.spec.ts",
    },
    drawnIn: "parity/code-block.parity.spec.ts",
    sample: { label: "JSON", code: "{}", copyable: true },
    events: {
      copy: "parity/code-block.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSpriteIcon",
    react: "SpriteIcon",
    stories: "components/SpriteIcon/SpriteIcon.stories.tsx",
    elsewhere: {
      Default: "parity/sprite-icon.parity.spec.ts",
    },
    drawnIn: "parity/sprite-icon.parity.spec.ts",
    sample: { sprite: "./sprite-fixture/sprite", name: "atm", label: "ATM" },
  },
  {
    vue: "KozmosBox",
    react: "Box",
    stories: "components/Box/Box.stories.tsx",
    elsewhere: {
      AsChild: "parity/box.parity.spec.ts",
    },
  },
  {
    vue: "KozmosStack",
    react: "Stack",
    stories: "components/Stack/Stack.stories.tsx",
    elsewhere: {
      Default: "parity/stack.parity.spec.ts",
      Horizontal: "parity/stack.parity.spec.ts",
    },
    drawnIn: "parity/stack.parity.spec.ts",
    sample: { direction: "row", gap: 4, children: "Stacked" },
  },
  {
    vue: "KozmosGrid",
    react: "Grid",
    stories: "components/Grid/Grid.stories.tsx",
    elsewhere: {
      Default: "parity/grid.parity.spec.ts",
      // Its renderItem is a function, Vue's render-item slot.
      Virtualized: "parity/grid.parity.spec.ts",
    },
    drawnIn: "parity/grid.parity.spec.ts",
    sample: { cols: 3, gap: 4, children: "Cells" },
    events: {
      rangeChange: "parity/grid.parity.spec.ts",
    },
  },
  {
    vue: "KozmosContainer",
    react: "Container",
    stories: "components/Container/Container.stories.tsx",
    elsewhere: {
      InAPanel: "parity/container.parity.spec.ts",
      BlockInset: "parity/container.parity.spec.ts",
      Default: "parity/container.parity.spec.ts",
      Fluid: "parity/container.parity.spec.ts",
    },
    drawnIn: "parity/container.parity.spec.ts",
    sample: { inset: "panel", block: "sm", children: "Region" },
  },
  {
    vue: "KozmosSurface",
    react: "Surface",
    stories: "components/Surface/Surface.stories.tsx",
    elsewhere: {
      // Drawn in React's frame, its meta's render.
      Solid: "parity/surface.parity.spec.ts",
      Glass: "parity/surface.parity.spec.ts",
      GlassPanel: "parity/surface.parity.spec.ts",
    },
    drawnIn: "parity/surface.parity.spec.ts",
    sample: { variant: "glass", children: "On glass" },
  },
  {
    vue: "KozmosTag",
    react: "Tag",
    stories: "components/Tag/Tag.stories.tsx",
    elsewhere: {
      Default: "parity/tag.parity.spec.ts",
      Removable: "parity/tag.parity.spec.ts",
      Emotions: "parity/tag.parity.spec.ts",
    },
    drawnIn: "parity/tag.parity.spec.ts",
    sample: { children: "Tag", emotion: "success" },
    events: {
      remove: "parity/tag.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAvatar",
    react: "Avatar",
    stories: "components/Avatar/Avatar.stories.tsx",
    elsewhere: {
      Default: "parity/avatar.parity.spec.ts",
      Fallback: "parity/avatar.parity.spec.ts",
    },
    drawnIn: "parity/avatar.parity.spec.ts",
    sample: { size: "sm" },
  },
  {
    vue: "KozmosAvatarImage",
    react: "AvatarImage",
    stories: null,
    drawnIn: "parity/avatar.parity.spec.ts",
    within: "Avatar",
    sample: { src: "https://example.com/a.png", alt: "Ada Lovelace" },
    // Radix's image draws nothing until it has loaded, which no image does
    // in a test's document; the Avatar spec loads one in both.
    unmarked: {
      why: "an image draws nothing until it has loaded, and none loads in jsdom",
      drawnIn: "parity/avatar.parity.spec.ts",
    },
    events: {
      loadingStatusChange: "parity/avatar.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAvatarFallback",
    react: "AvatarFallback",
    stories: null,
    drawnIn: "parity/avatar.parity.spec.ts",
    within: "Avatar",
    sample: { children: "CN" },
  },
  {
    vue: "KozmosSpinner",
    react: "Spinner",
    stories: "components/Spinner/Spinner.stories.tsx",
    elsewhere: {
      Default: "parity/spinner.parity.spec.ts",
      Small: "parity/spinner.parity.spec.ts",
      Large: "parity/spinner.parity.spec.ts",
      EverySize: "parity/spinner.parity.spec.ts",
      InAButton: "parity/spinner.parity.spec.ts",
    },
    drawnIn: "parity/spinner.parity.spec.ts",
    sample: { size: "lg", label: "Loading places" },
  },
  {
    vue: "KozmosSkeleton",
    react: "Skeleton",
    stories: "components/Skeleton/Skeleton.stories.tsx",
    elsewhere: {
      Default: "parity/skeleton.parity.spec.ts",
    },
    drawnIn: "parity/skeleton.parity.spec.ts",
    sample: { shape: "circle", width: 48 },
  },
  {
    vue: "KozmosProgress",
    react: "Progress",
    stories: "components/Progress/Progress.stories.tsx",
    elsewhere: {
      TopOfPage: "parity/progress.parity.spec.ts",
      CircularSizes: "parity/progress.parity.spec.ts",
      CircularComplete: "parity/progress.parity.spec.ts",
      LevelsAdded: "parity/progress.parity.spec.ts",
      Tones: "parity/progress.parity.spec.ts",
      SelectedSection: "parity/progress.parity.spec.ts",
      LivePosition: "parity/progress.parity.spec.ts",
      AnimatedUpdate: "parity/progress.parity.spec.ts",
    },
  },
  {
    vue: "KozmosProgressTrack",
    react: "ProgressTrack",
    stories: null,
    drawnIn: "parity/progress.parity.spec.ts",
    sample: { value: 0.3 },
  },
  {
    vue: "KozmosPersonaMark",
    react: "PersonaMark",
    stories: "components/PersonaMark/PersonaMark.stories.tsx",
    elsewhere: {
      Group: "parity/persona-mark.parity.spec.ts",
      InAPersonaList: "parity/persona-mark.parity.spec.ts",
    },
  },
  {
    vue: "KozmosPersonaMarkGroup",
    react: "PersonaMarkGroup",
    stories: null,
    drawnIn: "parity/persona-mark.parity.spec.ts",
    sample: {
      personas: [
        { name: "Customer", color: "#FF9800" },
        { name: "Visitor", color: "#2196F3" },
      ],
    },
  },
];

/**
 * Native parts the bridge still exports, by their Vue name, with why: one
 * name is one component, so each leaves `src/react-bridge/index.ts` when its
 * port lands (PORTING.md, step 9). `coverage.spec.ts` fails on a native
 * part the bridge exports that is not here, and on a name here that is not
 * both native and bridged.
 */
export const LEAVING_BRIDGE: Record<string, string> = {};

/**
 * Composables the main entry exports, with the React hook each answers to.
 * The contract holds what each returns to React's: the same keys, a ref in
 * Vue for each value in React, the same functions.
 */
export const COMPOSABLES: { vue: string; react: string }[] = [
  { vue: "useTheme", react: "useTheme" },
  { vue: "useKozmosAnalytics", react: "useKozmosAnalytics" },
];

export const REPOSITORY = path.resolve(__dirname, "../../..");
export const REACT_SOURCE = path.join(REPOSITORY, "packages/react/src");
export const VUE_DIST = path.resolve(__dirname, "../dist");
