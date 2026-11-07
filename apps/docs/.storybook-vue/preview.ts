import type { Preview } from "@storybook/vue3";
import "../../../packages/styles/dist/style.css"; // The shared stylesheet (@kozmos-ds/styles), as Vue parts import it
// The story surface React's Storybook draws each story on, so a Vue story sits
// on the same themed canvas and the same padding as React's.
import "../.storybook/preview.css";
// From source, as the stories import @kozmos-ds/vue: one copy of the module,
// so the parts in a story find the provider this decorator gives them.
import { KozmosThemeProvider } from "../../../packages/vue/src/index";

/**
 * React's toolbar, for Vue: every story is drawn inside a KozmosThemeProvider
 * at the toolbar's theme and density, on the story surface React's preview
 * draws, as React's DesignConfigProvider decorator does. A story gives no
 * provider of its own: a nested provider follows the system's theme, not the
 * toolbar's. The browser suites (scripts/check-vue-*.mjs) and the visual
 * review choose the theme and the density through these globals.
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Kozmos component theme (tokens and canvas)",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    // Decision 82: compact is for pointer-first desktop tools such as Pointr
    // Cloud; touch, the default, is what products and the SDK draw.
    density: {
      description: "Kozmos control sizes",
      toolbar: {
        title: "Density",
        icon: "component",
        dynamicTitle: true,
        items: [
          { value: "touch", title: "Touch" },
          { value: "compact", title: "Compact" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light", density: "touch" },
  decorators: [
    (story, context) => ({
      components: { story, KozmosThemeProvider },
      setup: () => ({
        theme: context.globals.theme === "dark" ? "dark" : "light",
        density: context.globals.density === "compact" ? "compact" : "touch",
        layout: context.parameters.layout ?? "padded",
        viewMode: context.viewMode,
      }),
      template: `
        <KozmosThemeProvider :theme="theme" :density="density">
          <main class="kozmos-story-surface" :data-layout="layout" :data-view-mode="viewMode">
            <story />
          </main>
        </KozmosThemeProvider>`,
    }),
  ],
  parameters: {
    // A canvas paint selector is not a component theme. The Theme toolbar
    // changes both together, the provider's portal included.
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
