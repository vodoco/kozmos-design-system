import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "./Popover";
import { Button } from "../Button";
import { Heading } from "../Heading";
import { Text } from "../Text";

const meta: Meta<typeof Popover> = {
  id: "overlay-popover",
  title: "Core/Overlays/Popover",
  component: Popover,
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

/**
 * GAP-190: a popover the product opens beside a control it does not own, as
 * a tour opens its step. "Add desk" is a plain button: PopoverAnchor adds no
 * popover attributes to it and no click that toggles. Open from the start, so
 * the step shows beside it (on the docs page, shut); "Show the step" opens it.
 * It needs no focus handling of its own: closed, it gives focus back to what
 * had it as it opened, or else to "Add desk".
 */
export const AnchoredToAControl: Story = {
  render: function AnchoredToAControl(_args, { viewMode }) {
    // Shut on the docs page, where an open step would sit over its text.
    const [open, setOpen] = React.useState(viewMode !== "docs");
    return (
      <div className="flex min-h-36 items-start gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <Button>Add desk</Button>
          </PopoverAnchor>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={8}
            aria-label="Step 2 of 5"
          >
            <div className="grid gap-3">
              <Heading level={4}>Add a desk</Heading>
              <Text size="sm" color="muted">
                Press Add desk, then choose where it goes on the floor.
              </Text>
              <Button size="sm" onClick={() => setOpen(false)}>
                Got it
              </Button>
            </div>
            <PopoverArrow />
          </PopoverContent>
        </Popover>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Show the step
        </Button>
      </div>
    );
  },
};

/**
 * PopoverAnchor's `virtualRef`: anchored to a rect rather than an element,
 * here a point on a map, so it draws nothing of its own. The rect names the
 * map's canvas as its `contextElement`, so the popover follows the canvas
 * when a box it sits in scrolls, and `hideWhenDetached` hides it once the
 * point is out of that box; it places itself again every frame
 * (`updatePositionStrategy="always"`), as a point that moves with the map
 * needs. It takes no focus as it opens, so a screen reader is not told of
 * it: a product announces it through a live region, or lets it take focus.
 */
export const AnchoredToARect: Story = {
  render: function AnchoredToARect() {
    const map = React.useRef<HTMLDivElement>(null);
    const feature = React.useRef({
      getBoundingClientRect: () => {
        const box = map.current?.getBoundingClientRect();
        return DOMRect.fromRect({
          x: box ? box.left + box.width * 0.6 : 0,
          y: box ? box.top + box.height * 0.6 : 0,
          width: 0,
          height: 0,
        });
      },
      get contextElement() {
        return map.current ?? undefined;
      },
    });
    return (
      <Popover open>
        <div ref={map} className="h-64 w-80 rounded-control bg-muted" />
        <PopoverAnchor virtualRef={feature} />
        <PopoverContent
          side="top"
          sideOffset={8}
          updatePositionStrategy="always"
          hideWhenDetached
          onOpenAutoFocus={(event) => event.preventDefault()}
          aria-label="Reception desk"
          className="w-auto"
        >
          <Text size="sm" weight="semibold">
            Reception desk
          </Text>
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    );
  },
};
