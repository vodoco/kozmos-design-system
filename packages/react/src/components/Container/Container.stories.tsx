import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "./Container";

const meta: Meta<typeof Container> = {
  title: "Foundations/Container",
  component: Container,
};

export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
  args: {
    children: (
      <div className="bg-muted p-4 border border-dashed text-center">
        Container Content (Max Width 7xl)
      </div>
    ),
  },
};

export const Fluid: Story = {
  args: {
    centered: false,
    children: (
      <div className="bg-muted p-4 border border-dashed text-center">
        Fluid Container (Full Width)
      </div>
    ),
  },
};

/**
 * Side by side: the same content in a page and in a 390px side panel. The
 * page's padding steps with the window; the panel's does not, because
 * `lg:px-8` reads the WINDOW and a narrow region inside a wide one was taking
 * the widest step — 32px each side on a desktop against a phone's 16.
 */
export const InAPanel: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex flex-wrap gap-6 p-6">
      <div className="min-w-0 flex-1 basis-[280px]">
        <p className="mb-2 text-xs text-muted-foreground">
          inset=&quot;window&quot; (the default)
        </p>
        <Container centered={false}>
          <div className="border border-dashed bg-muted p-4 text-center">
            Page content
          </div>
        </Container>
      </div>
      {/* A side panel is 390 where there is room for one; below that the two
          stack, because a fixed 390 beside anything overflows a phone and the
          audit is right to say so. */}
      <div className="w-[390px] max-w-full rounded-container border">
        <p className="mb-2 p-2 text-xs text-muted-foreground">
          inset=&quot;panel&quot;
        </p>
        <Container centered={false} inset="panel">
          <div className="border border-dashed bg-muted p-4 text-center">
            Panel content
          </div>
        </Container>
      </div>
    </div>
  ),
};
