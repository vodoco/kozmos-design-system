import { beforeMount } from "@playwright/experimental-ct-react/hooks";
// Built by @kozmos-ds/styles (Vue 3 Phase 0); build it before running these.
import "@kozmos-ds/styles/style.css";
import { DesignConfigProvider } from "../src/context/DesignConfigContext";

export type HooksConfig = {
  routing?: boolean;
};

beforeMount(async ({ hooksConfig, App }) => {
  return (
    <DesignConfigProvider>
      <App />
    </DesignConfigProvider>
  );
});
