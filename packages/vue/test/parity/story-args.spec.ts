import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { readStoryArgs } from "./story-args";

/**
 * The story reader draws a story from its args only when it read all of
 * them: what it cannot read is reported, never silently left out, so a
 * story is never drawn as less than it is.
 */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kozmos-story-args-"));
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const read = (text: string) => {
  const file = path.join(dir, `${Math.random().toString(36).slice(2)}.tsx`);
  fs.writeFileSync(file, text);
  return readStoryArgs(file);
};

describe("readStoryArgs", () => {
  it("reads literals, arrays and objects, and a story's spread args", () => {
    const { stories } = read(`
      const meta = { args: { size: "sm" } } satisfies Meta;
      export default meta;
      export const Base = { args: { children: "Go", count: -2 } };
      export const Options = {
        args: { ...Base.args, options: [{ value: "a", label: "A" }], open: true },
      };
    `);
    expect(stories).toEqual([
      {
        name: "Base",
        args: { size: "sm", children: "Go", count: -2 },
        unread: [],
      },
      {
        name: "Options",
        args: {
          size: "sm",
          children: "Go",
          count: -2,
          options: [{ value: "a", label: "A" }],
          open: true,
        },
        unread: [],
      },
    ]);
  });

  it("leaves handlers out, and reports JSX, identifiers and other spreads", () => {
    const { stories, rendered } = read(`
      export default { args: { icon: <Plus />, onClick: fn() } };
      export const Icon = { args: { "aria-label": "Add" } };
      export const Labelled = { args: { icon: "none", label: LABEL, onPress: () => {} } };
      export const Shared = { args: { ...common, ...Icon.args } };
      export const Drawn = { render: () => <div /> };
    `);
    expect(stories.map(({ name, unread }) => ({ name, unread }))).toEqual([
      { name: "Icon", unread: ["icon"] },
      // A story's own value for a key the meta could not read counts.
      { name: "Labelled", unread: ["label"] },
      { name: "Shared", unread: ["icon", "...common"] },
    ]);
    expect(rendered).toEqual(["Drawn"]);
  });
});
