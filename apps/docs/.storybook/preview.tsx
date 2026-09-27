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
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => (
      <DesignConfigProvider
        theme={context.globals.theme === "dark" ? "dark" : "light"}
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
