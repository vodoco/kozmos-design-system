import { test } from "@playwright/test";
import { drawStory, storiesIn } from "./capture";

// Every story in the Storybook being measured, in the light theme and the
// dark. A story opts out with the tag `no-visual`, and says why beside it.
// How a story is drawn and compared is ./capture.ts, which Vue's Storybook
// (vue-stories.visual.ts) shares.
const stories = storiesIn("apps/docs/storybook-static/index.json", "react");

for (const story of stories) {
  for (const theme of ["light", "dark"] as const) {
    test(`${story.id} ${theme}`, async ({ page, baseURL }) => {
      await drawStory(page, baseURL, story, theme);
    });
  }
}
