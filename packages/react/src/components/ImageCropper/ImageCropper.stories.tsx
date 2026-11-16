import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Button } from "../Button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../Dialog/Dialog";
import { Text } from "../Text/Text";
import { ImageCropper, type ImageCropperCrop } from "./ImageCropper";

// A 1600 × 1200 picture, drawn in the page so the stories need no network:
// a client's logo on a wide background, as an upload would be.
const PICTURE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1200'%3E%3Crect width='1600' height='1200' fill='%23DCE7FD'/%3E%3Ccircle cx='800' cy='600' r='360' fill='%23135BEC'/%3E%3Ctext x='800' y='680' text-anchor='middle' fill='white' font-family='sans-serif' font-size='240' font-weight='700'%3EAB%3C/text%3E%3C/svg%3E";

const meta: Meta<typeof ImageCropper> = {
  id: "components-imagecropper",
  title: "Core/Inputs/ImageCropper",
  component: ImageCropper,
  parameters: { layout: "padded" },
  args: { src: PICTURE, alt: "Acme Airports logo" },
  decorators: [
    (Story) => (
      <div style={{ maxInlineSize: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ImageCropper>;

/** A square frame, as a client's logo takes (MAP-32), in the middle at 100%. */
export const Default: Story = {};

/** Any ratio: a 16:9 cover, opened on a frame the product kept. */
export const Landscape: Story = {
  args: {
    aspectRatio: 16 / 9,
    defaultValue: { x: 0.2, y: 0.2, width: 0.6, height: 0.45 },
  },
};

/**
 * What `onCrop` hands back: the frame as fractions of the image, never
 * pixels. The product crops. `onImageLoad` hands back the starting frame,
 * which a product applies if the person changes nothing.
 */
export const CropResult: Story = {
  render: (args) => {
    const [crop, setCrop] = React.useState<ImageCropperCrop | null>(null);
    const percent = (value: number) => `${Math.round(value * 100)}%`;
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <ImageCropper {...args} onImageLoad={setCrop} onCrop={setCrop} />
        <Text size="sm" color="muted">
          {crop
            ? `x ${percent(crop.x)}, y ${percent(crop.y)}, ${percent(crop.width)} × ${percent(crop.height)} of the image`
            : "Loading the image"}
        </Text>
      </div>
    );
  },
};

/** The crop step in a Dialog, with Apply and Cancel: the logo flow's. */
export const InADialog: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);
    const crop = React.useRef<ImageCropperCrop | null>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Frame the logo</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Frame the logo</DialogTitle>
              <DialogDescription>
                Drag the logo, or zoom, until it sits in the square.
              </DialogDescription>
            </DialogHeader>
            <ImageCropper
              {...args}
              onCrop={(next) => {
                crop.current = next;
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

/** Without the zoom row: the keyboard and a pinch still zoom. */
export const WithoutZoomControls: Story = {
  args: { showZoomControls: false },
};

export const Disabled: Story = { args: { disabled: true } };
