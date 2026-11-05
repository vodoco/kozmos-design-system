import { describe, expect, it } from "vitest";
import { createSSRApp, type Component } from "vue";
import { renderToString } from "vue/server-renderer";
import meta, * as stories from "./Button.stories";

/**
 * Each story draws a button with only Button's own props: `label` is the
 * story's text, never an attribute of the <button>.
 */
type StoryModule = {
  args?: Record<string, unknown>;
  render?: (args: Record<string, unknown>, context: unknown) => Component;
};

describe("Button's Vue stories", () => {
  const entries = Object.entries(stories).filter(
    ([name]) => name !== "default",
  ) as [string, StoryModule][];

  for (const [name, story] of entries) {
    it(`${name} gives the button Button's props only`, async () => {
      const args = { ...(story.args ?? {}) };
      const render = story.render ?? meta.render!;
      const html = await renderToString(
        createSSRApp(render(args as never, {} as never) as Component),
      );
      expect(html).toContain("<button");
      expect(html).not.toMatch(/<button[^>]*\blabel=/);
      if (typeof args.label === "string") expect(html).toContain(args.label);
    });
  }
});
