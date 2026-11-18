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

/**
 * GAP-172 (decision 209): Home's hundreds of site cards. Only the rows in
 * view and two past them are drawn, in reading order, each said as its place
 * in the 300; the Grid scrolls itself, so it has a height.
 */
export const Virtualized: Story = {
  args: {
    virtualized: true,
    cols: 3,
    gap: 4,
    itemCount: 300,
    rowHeight: 72,
    renderItem: (index: number) => <Item>Site {index + 1}</Item>,
    "aria-label": "Sites",
    style: { height: 320 },
  },
};
