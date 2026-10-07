import type { Meta, StoryObj } from "@storybook/react";
import { Grid } from "./Grid";
import { Box } from "../Box/Box";

const meta: Meta<typeof Grid> = {
  id: "foundations-grid",
  title: "Core/Layout/Grid",
  component: Grid,
  argTypes: {
    cols: { control: "select", options: [1, 2, 3, 4, 6, 12, "none"] },
    gap: { control: "select", options: [0, 1, 2, 4, 8] },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

const Item = ({ children }: { children: React.ReactNode }) => (
  <Box className="p-4 bg-theme-fill text-theme-fill-foreground rounded flex items-center justify-center">
    {children}
  </Box>
);

export const Default: Story = {
  args: {
    cols: 3,
    gap: 4,
    children: (
      <>
        <Item>1</Item>
        <Item>2</Item>
        <Item>3</Item>
        <Item>4</Item>
        <Item>5</Item>
        <Item>6</Item>
      </>
    ),
  },
};
