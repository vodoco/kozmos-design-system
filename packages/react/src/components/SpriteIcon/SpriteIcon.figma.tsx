import figma from "@figma/code-connect";
import { SpriteIcon } from "./SpriteIcon";

/**
 * Figma Code Connect: SpriteIcon (GAP-150, decisions 86 and 219)
 * @url https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68551
 *
 * One cell of a published MapLibre sprite atlas: Sprite is the atlas's
 * version-pinned base URL, Cell Name the cell.
 */
figma.connect(
  SpriteIcon,
  "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68551",
  {
    props: {
      sprite: figma.string("Sprite"),
      name: figma.string("Cell Name"),
      size: figma.enum("Size", {
        "16": 16,
        "20": 20,
        "24": 24,
      }),
    },
    example: ({ name, size, sprite }) => (
      <SpriteIcon name={name} size={size} sprite={sprite} />
    ),
  },
);
