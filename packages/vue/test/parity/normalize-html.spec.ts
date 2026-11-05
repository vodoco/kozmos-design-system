import { describe, expect, it } from "vitest";
import { normalizeHtml } from "./normalize-html";
import { readStoryArgs } from "./story-args";
import path from "node:path";

describe("normalizeHtml settles spelling, never what is drawn", () => {
  const same = (a: string, b: string) =>
    expect(normalizeHtml(a)).toBe(normalizeHtml(b));
  const differ = (a: string, b: string) =>
    expect(normalizeHtml(a)).not.toBe(normalizeHtml(b));

  it("settles attribute order, style spelling and anchors", () => {
    same(
      '<button class="a b" disabled="" style="--x:1;color:red">Go</button>',
      '<!--[--><button style="--x: 1; color: red;" disabled class="a b"><!--[-->Go<!--]--></button><!--]-->',
    );
    same("<p>Go<!-- --> now</p>", "<p>Go now</p>");
  });

  it("keeps every attribute value, a class's order and spacing, and the text exactly", () => {
    differ('<b class="a b"></b>', '<b class="b a"></b>');
    differ('<b class="a  b"></b>', '<b class="a b"></b>');
    differ("<b hidden></b>", '<b hidden="until-found"></b>');
    differ("<b></b>", '<b style=""></b>');
    differ("<b></b>", '<b aria-hidden="true"></b>');
    differ('<b style="a:1;b:2"></b>', '<b style="b:2;a:1"></b>');
    differ("<b>Go</b>", "<b>Stop</b>");
    differ("<b>Go</b>", "<b> Go</b>");
    differ("<b>Go now</b>", "<b>Go  now</b>");
    differ("<b><i></i></b>", "<b></b><i></i>");
  });

  it("compares what refers to what, not how each framework spells an id", () => {
    // React's Tabs and Reka's each generate their own ids.
    same(
      '<button id="radix-_R_0_-trigger-a" aria-controls="radix-_R_0_-content-a"></button><div id="radix-_R_0_-content-a" aria-labelledby="radix-_R_0_-trigger-a"></div>',
      '<button id="reka-tabs-v-1-trigger-a" aria-controls="reka-tabs-v-1-content-a"></button><div id="reka-tabs-v-1-content-a" aria-labelledby="reka-tabs-v-1-trigger-a"></div>',
    );
    // A reference to the wrong element, or to none, still differs.
    differ(
      '<label for="a">A</label><input id="a"><input id="b">',
      '<label for="b">A</label><input id="a"><input id="b">',
    );
    differ(
      '<label for="a">A</label><input id="a">',
      '<label>A</label><input id="a">',
    );
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
