import type { Preview } from "@storybook/vue3";
import "../../../packages/styles/dist/style.css"; // The shared stylesheet (@kozmos-ds/styles), as Vue parts will import it

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
