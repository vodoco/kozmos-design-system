import type { StorybookConfig } from "@storybook/vue3-vite";
import { dirname, join } from "path";

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../../../packages/vue/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("storybook-addon-performance"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/vue3-vite"),
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async viteFinal(config) {
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = ["../.."];

    config.plugins = config.plugins || [];
    config.plugins.push({
      name: "storybook-composition-cors",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const origin = req.headers.origin;
          const allowed = "http://localhost:6006";
          if (origin === allowed) {
            res.setHeader("Access-Control-Allow-Origin", allowed);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Vary", "Origin");
            if (req.method === "OPTIONS") {
              res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, HEAD, OPTIONS",
              );
              res.setHeader(
                "Access-Control-Allow-Headers",
                "Authorization, Content-Type",
              );
              res.statusCode = 204;
              res.end();
              return;
            }
          }
          next();
        });
      },
    });

    // The stories import packages/vue's source, which builds in the shared
    // recipes through this alias, as packages/vue/vite.config.mts does.
    const recipes = join(
      __dirname,
      "../../../packages/react/src/recipes/index.ts",
    );
    config.resolve = config.resolve || {};
    const alias = config.resolve.alias;
    config.resolve.alias = Array.isArray(alias)
      ? [...alias, { find: "#kozmos-recipes", replacement: recipes }]
      : { ...(alias || {}), "#kozmos-recipes": recipes };

    // Dynamically inject the Vue parser into the solitary Storybook Vite bundler
    const vue = (await import("@vitejs/plugin-vue")).default;
    config.plugins = config.plugins || [];
    config.plugins.push(vue());

    return config;
  },
};
export default config;
