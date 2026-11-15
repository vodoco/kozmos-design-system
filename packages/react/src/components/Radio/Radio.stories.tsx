import type { Meta, StoryObj } from "@storybook/react";
import {
  ArrowNarrowRight,
  Contrast01,
  Edit05,
  Expand01,
  Globe01,
  Map01,
  MagicWand02,
  Minimize01,
  Move,
  Route,
  Stars02,
  ZoomIn,
  ZoomOut,
} from "@kozmos-ds/icons";
import { Box } from "../Box";
import { Grid } from "../Grid";
import { Icon } from "../Icon";
import { RadioGroup, RadioGroupItem } from "./Radio";

const meta: Meta<typeof RadioGroup> = {
  id: "components-radiogroup",
  title: "Core/Inputs/RadioGroup",
  component: RadioGroup,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one">
      <RadioGroupItem value="option-one" id="option-one" label="Option One" />
      <RadioGroupItem value="option-two" id="option-two" label="Option Two" />
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" disabled>
      <RadioGroupItem
        value="option-one"
        id="option-disabled-one"
        label="Option One"
      />
      <RadioGroupItem
        value="option-two"
        id="option-disabled-two"
        label="Option Two"
      />
    </RadioGroup>
  ),
};

export const Error: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" error="Selection required">
      <RadioGroupItem
        value="option-one"
        id="option-error-one"
        label="Option One"
        error
      />
      <RadioGroupItem
        value="option-two"
        id="option-error-two"
        label="Option Two"
        error
      />
    </RadioGroup>
  ),
};

// GAP-162 on a radio: a description under the label, read as the option's
// description.
export const WithDescription: Story = {
  render: () => (
    <RadioGroup aria-label="Levels shown" defaultValue="all">
      <RadioGroupItem
        value="all"
        label="All levels"
        description="Every level of the building, stacked"
      />
      <RadioGroupItem
        value="current"
        label="Current level"
        description="Only the level you are on"
      />
    </RadioGroup>
  ),
};

// GAP-158: radio cards. Each card is one radio named by its title; the image
// is decoration. The chosen card's edge is heavier and its ring shows its dot,
// so the choice is never told by colour alone. The arrows move between them.
export const Cards: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <RadioGroup aria-label="Map style" defaultValue="vector">
        <Grid cols={2} gap={2}>
          <RadioGroupItem
            value="vector"
            variant="card"
            label="Vector"
            description="Drawn from the building's plans"
            media={
              <Box className="flex h-20 w-full items-center justify-center bg-muted">
                <Icon icon={Map01} size="xl" color="muted" />
              </Box>
            }
          />
          <RadioGroupItem
            value="satellite"
            variant="card"
            label="Satellite"
            description="Aerial imagery under the plans"
            media={
              <Box className="flex h-20 w-full items-center justify-center bg-muted">
                <Icon icon={Globe01} size="xl" color="muted" />
              </Box>
            }
          />
        </Grid>
      </RadioGroup>
      <RadioGroup aria-label="Geometry" defaultValue="auto">
        <Grid cols={2} gap={2}>
          <RadioGroupItem
            value="auto"
            variant="card"
            label="Auto-generate"
            description="Kozmos traces the outline from the floor plan"
            media={<Icon icon={MagicWand02} size="lg" color="primary" />}
          />
          <RadioGroupItem
            value="manual"
            variant="card"
            label="Draw manually"
            description="Draw the outline point by point"
            media={<Icon icon={Edit05} size="lg" color="primary" />}
          />
        </Grid>
      </RadioGroup>
    </div>
  ),
};

const transitions = [
  { value: "fade", label: "Fade", icon: Contrast01 },
  { value: "slide", label: "Slide", icon: ArrowNarrowRight },
  { value: "move", label: "Move", icon: Move },
  { value: "zoom-in", label: "Zoom in", icon: ZoomIn },
  { value: "zoom-out", label: "Zoom out", icon: ZoomOut },
  { value: "grow", label: "Grow", icon: Expand01 },
  { value: "shrink", label: "Shrink", icon: Minimize01 },
  { value: "follow", label: "Follow route", icon: Route },
  { value: "sparkle", label: "Sparkle", icon: Stars02 },
];

// GAP-158: radio tiles, the transition editor's nine-tile grid. One Tab stop
// for the grid; the arrows move and choose. The chosen tile's edge is heavier
// and it shows a check.
export const Tiles: Story = {
  render: () => (
    <RadioGroup aria-label="Transition" defaultValue="slide">
      <Grid cols={3} gap={2}>
        {transitions.map((transition) => (
          <RadioGroupItem
            key={transition.value}
            value={transition.value}
            variant="tile"
            label={transition.label}
            media={<Icon icon={transition.icon} size="lg" />}
          />
        ))}
      </Grid>
    </RadioGroup>
  ),
};
