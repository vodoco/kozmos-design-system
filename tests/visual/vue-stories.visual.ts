import { test } from "@playwright/test";
import { drawStory, storiesIn } from "./capture";

// Every story in the Vue Storybook (apps/docs/.storybook-vue, built into
// apps/docs/storybook-internal/vue), in the light theme and the dark, drawn
// and compared as React's are (./capture.ts). Its decorator gives every story
// a KozmosThemeProvider at the toolbar's theme, which the `theme` global in
// the story's URL sets, as it does React's DesignConfigProvider. Each story's
// id starts `vue-`, so its baselines sit beside React's under names of their
// own. The `vue` project in playwright.visual.config.ts serves this build.
const stories = storiesIn("apps/docs/storybook-internal/vue/index.json");

for (const story of stories) {
  for (const theme of ["light", "dark"] as const) {
    test(`${story.id} ${theme}`, async ({ page, baseURL }) => {
      await drawStory(page, baseURL, story, theme);
    });
  }
}
