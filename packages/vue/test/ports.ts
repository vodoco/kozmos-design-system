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
      themeChange: "parity/mounted.parity.spec.ts",
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
    elsewhere: { Emotions: "parity/button.parity.spec.ts" },
  },
];

/**
 * Composables the main entry exports, with the React hook each answers to.
 * The contract holds what each returns to React's: the same keys, a ref in
 * Vue for each value in React, the same functions.
 */
export const COMPOSABLES: { vue: string; react: string }[] = [
  { vue: "useTheme", react: "useTheme" },
];

export const REPOSITORY = path.resolve(__dirname, "../../..");
export const REACT_SOURCE = path.join(REPOSITORY, "packages/react/src");
export const VUE_DIST = path.resolve(__dirname, "../dist");
