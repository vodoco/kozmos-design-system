import type { Meta, StoryObj } from "@storybook/react";
import { SpriteIcon } from "./SpriteIcon";

// Four cells cut from Pointr's published 10.17.0 light atlas, served beside
// the stories (apps/docs/src/sprite-fixture). A product passes the atlas's
// own version-pinned URL, such as
// https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite.
const SPRITE = "./sprite-fixture/sprite";

const meta = {
  id: "components-spriteicon",
  title: "Core/Media/SpriteIcon",
  component: SpriteIcon,
  parameters: { layout: "centered" },
  args: { sprite: SPRITE, name: "desk", size: 24 },
} satisfies Meta<typeof SpriteIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A type's icon as the map draws it (GAP-150, decision 219): each cell as
 * published, at 16, 20 and 24, its aspect ratio kept, the taller marker cell
 * ("1") narrower than its box. A missing cell keeps an empty box.
 */
export const Default: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12 }}>
      {([16, 20, 24] as const).map((size) => (
        <div
          key={size}
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          {["desk", "atm", "auditorium", "1", "not-in-the-atlas"].map(
            (name) => (
              <SpriteIcon
                key={name}
                {...args}
                name={name}
                size={size}
                label={name === "desk" ? "Desk" : undefined}
              />
            ),
          )}
        </div>
      ))}
    </div>
  ),
};
