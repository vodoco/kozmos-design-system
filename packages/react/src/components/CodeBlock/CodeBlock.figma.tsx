import figma from "@figma/code-connect";
import { CodeBlock } from "./CodeBlock";

/**
 * Figma Code Connect: CodeBlock (GAP-216, decision 225)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68538
 *
 * Overflow=Wrap is wrap, the default; Scroll is wrap={false}. Copy is
 * copyable. `label` names the region and is the product's.
 */
figma.connect(
  CodeBlock,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68538",
  {
    props: {
      code: figma.string("Code Text"),
      copyable: figma.boolean("Copy"),
      wrap: figma.enum("Overflow", {
        Wrap: undefined,
        Scroll: false,
      }),
    },
    example: ({ code, copyable, wrap }) => (
      <CodeBlock
        code={code}
        copyable={copyable}
        label="Merged unit"
        wrap={wrap}
      />
    ),
  },
);
