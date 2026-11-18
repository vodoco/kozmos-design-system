import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "./CodeBlock";

const meta: Meta<typeof CodeBlock> = {
  id: "data-display-codeblock",
  title: "Core/Data display/CodeBlock",
  component: CodeBlock,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const MERGED_UNIT = `{
  "mergedUnit": {
    "fid": "f-1209",
    "name": "Bean & Leaf Café",
    "sources": ["f-1042", "f-1043"],
    "mergedAt": "2026-10-29T09:41:00Z",
    "geometry": { "type": "Polygon", "levels": [1] }
  }
}`;

/**
 * MAP-619's merged unit (GAP-216, decision 225): a custom field's JSON,
 * read-only, in the mono family on the muted surface, wrapping its long
 * lines, with a copy that says it copied.
 */
export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <CodeBlock label="mergedUnit JSON" code={MERGED_UNIT} copyable />
    </div>
  ),
};

/**
 * With `wrap={false}` each line stays whole and the block scrolls
 * sideways; the scroller is a stop on the keyboard's way.
 */
export const Scroll: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <CodeBlock label="mergedUnit JSON" code={MERGED_UNIT} wrap={false} />
    </div>
  ),
};
