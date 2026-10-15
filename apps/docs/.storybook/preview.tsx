import type { Preview } from "@storybook/react";
import "../../../packages/react/dist/style.css";
import { DesignConfigProvider } from "@kozmos-ds/react";
import "./preview.css";

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
    (Story, context) => (
      <DesignConfigProvider
        theme={context.globals.theme === "dark" ? "dark" : "light"}
        density={context.globals.density === "compact" ? "compact" : "touch"}
      >
        <main
          className="kozmos-story-surface"
          data-layout={context.parameters.layout ?? "padded"}
          data-view-mode={context.viewMode}
        >
          <Story />
        </main>
      </DesignConfigProvider>
    ),
  ],
  parameters: {
    options: {
      storySort: {
        order: ["Foundations", "Core", "SDK", "Examples", "Guides"],
      },
    },
    // A canvas paint selector is not a component theme. The Theme toolbar
    // changes both together, including owned portal tokens.
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
