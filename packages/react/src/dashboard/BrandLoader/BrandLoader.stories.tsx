import type { Meta, StoryObj } from "@storybook/react";
import { BrandLoader } from "./BrandLoader";
import { Button } from "../../components/Button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Card/Card";
import { Stack } from "../../components/Stack/Stack";
import { Text } from "../../components/Text/Text";
import { DesignConfigProvider } from "../../context/DesignConfigContext";

// A Dashboard module (decision 183): its stories are filed under Dashboard/,
// and draw only with Kozmos parts. src/dashboard is not scanned for
// style.css's utilities, so a story here writes no utility classes either.
const meta: Meta<typeof BrandLoader> = {
  id: "dashboard-brandloader",
  title: "Dashboard/BrandLoader",
  component: BrandLoader,
  args: { label: "Loading Pointr Cloud" },
};

export default meta;
type Story = StoryObj<typeof BrandLoader>;

/** In place: the pin, and the rings rippling out from it. */
export const Default: Story = {};

/**
 * Under reduced motion, the reader's or the design config's, it stands
 * still: one ring at rest round the pin.
 */
export const Still: Story = {
  render: (args) => (
    <DesignConfigProvider persistKey={null} config={{ motion: "reduced" }}>
      <BrandLoader {...args} />
    </DesignConfigProvider>
  ),
};

/**
 * Over the page while it loads, as Pointr Cloud shows it until the app is
 * ready: the theme's scrim, the loader in the middle. The page under it is
 * inert and busy, and the scrim takes the pointer.
 */
export const Overlay: Story = {
  parameters: { layout: "fullscreen" },
  args: { overlay: true },
  render: (args) => (
    <Stack gap={4}>
      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap={3}>
            <Text>Istanbul Airport, Terminal 1</Text>
            <Button>Open</Button>
          </Stack>
        </CardContent>
      </Card>
      <BrandLoader {...args} />
    </Stack>
  ),
};
