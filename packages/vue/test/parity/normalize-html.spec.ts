import { describe, expect, it } from "vitest";
import { normalizeHtml } from "./normalize-html";
import { readStoryArgs } from "./story-args";
import path from "node:path";

describe("normalizeHtml settles spelling, never what is drawn", () => {
  const same = (a: string, b: string) =>
    expect(normalizeHtml(a)).toBe(normalizeHtml(b));
  const differ = (a: string, b: string) =>
    expect(normalizeHtml(a)).not.toBe(normalizeHtml(b));

  it("settles attribute order, boolean values, style spelling and anchors", () => {
    same(
      '<button class="a  b" disabled="" style="--x:1;color:red">Go</button>',
      '<!--[--><button style="--x: 1; color: red;" disabled class="a b"><!--[-->Go<!--]--></button><!--]-->',
    );
    same("<p>Go<!-- -->now</p>", "<p>Gonow</p>");
  });

  it("keeps a class's order, a missing or extra attribute, a style's order and the text", () => {
    differ('<b class="a b"></b>', '<b class="b a"></b>');
    differ("<b></b>", '<b style=""></b>');
    differ("<b></b>", '<b aria-hidden="true"></b>');
    differ('<b style="a:1;b:2"></b>', '<b style="b:2;a:1"></b>');
    differ("<b>Go</b>", "<b>Stop</b>");
    differ("<b><i></i></b>", "<b></b><i></i>");
  });
});

describe("readStoryArgs reads a stories file's own args", () => {
  it("merges the meta's literal args, skips functions, and lists render stories apart", () => {
    const { stories, rendered } = readStoryArgs(
      path.resolve(
        __dirname,
        "../../../react/src/components/Button/Button.stories.tsx",
      ),
    );
    expect(stories.find((story) => story.name === "Loading")?.args).toEqual({
      isLoading: true,
      children: "Please wait",
    });
    expect(rendered).toEqual(["Emotions"]);
  });
});
