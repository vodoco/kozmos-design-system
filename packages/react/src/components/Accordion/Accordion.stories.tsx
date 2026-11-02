import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Building02,
  Grid01,
  LayersThree01,
  LayersTwo01,
  Map01,
} from "@kozmos-ds/icons";
import { DensityScope } from "../../theme/DensityScope";
import { Box } from "../Box/Box";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { Stack } from "../Stack/Stack";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./Accordion";

const meta: Meta<typeof Accordion> = {
  id: "data-display-accordion",
  title: "Core/Data display/Accordion",
  component: Accordion,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that matches the other
          components&apos; aesthetic.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It&apos;s animated by default, but you can disable it if you
          prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

// The building editor's panel: 408 wide, or the width there is.
const panel = { width: 408, maxWidth: "100%" };

const sections = [
  { value: "details", icon: <Building02 />, title: "Building details" },
  { value: "location", icon: <Map01 />, title: "Location" },
  { value: "levels", icon: <LayersTwo01 />, title: "Levels" },
  { value: "plans", icon: <LayersThree01 />, title: "Floor plans" },
  { value: "review", icon: <Grid01 />, title: "Review" },
];

/**
 * Adding a building: a later section is disabled until the one before it is
 * done. What opens when, the "Step n/5" words and the buttons are the
 * product's; Kozmos draws the sections. Continue moves it on here.
 */
function AddBuilding() {
  const [reached, setReached] = React.useState(0);
  const [open, setOpen] = React.useState("details");
  return (
    <DensityScope density="compact">
      <Box style={panel}>
        <Accordion
          type="single"
          variant="boxed"
          value={open}
          onValueChange={setOpen}
        >
          {sections.map(({ value, icon, title }, index) => (
            <AccordionItem key={value} value={value} disabled={index > reached}>
              <AccordionTrigger icon={icon} label={`Step ${index + 1}/5`}>
                {title}
              </AccordionTrigger>
              <AccordionContent>
                <Stack gap={3}>
                  <Input aria-label={`${title} name`} placeholder="Name" />
                  <Button
                    onClick={() => {
                      const next = sections[index + 1]?.value;
                      if (!next) return;
                      setReached((was) => Math.max(was, index + 1));
                      setOpen(next);
                    }}
                  >
                    Continue
                  </Button>
                </Stack>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Box>
    </DensityScope>
  );
}

export const Boxed: Story = { render: () => <AddBuilding /> };

/**
 * Editing a building: Steps 3 and 4 are loading, so they say so and take no
 * press or focus until the product clears `loading` and they open.
 */
export const BoxedLoading: Story = {
  render: () => (
    <DensityScope density="compact">
      <Box style={panel}>
        <Accordion
          type="single"
          variant="boxed"
          collapsible
          defaultValue="details"
        >
          {sections.map(({ value, icon, title }, index) => (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger
                icon={icon}
                label={`Step ${index + 1}/5`}
                loading={value === "levels" || value === "plans"}
              >
                {title}
              </AccordionTrigger>
              <AccordionContent>The form for {title}.</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Box>
    </DensityScope>
  ),
};

/** Closed, open, disabled and loading, at the page's own density. */
export const BoxedStates: Story = {
  render: () => (
    <Box style={panel}>
      <Accordion type="single" variant="boxed" collapsible defaultValue="open">
        <AccordionItem value="closed">
          <AccordionTrigger icon={<Building02 />} label="Closed">
            Building details
          </AccordionTrigger>
          <AccordionContent>The form.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="open">
          <AccordionTrigger icon={<Building02 />} label="Open">
            Building details
          </AccordionTrigger>
          <AccordionContent>
            The form, in the panel&apos;s flow.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="disabled" disabled>
          <AccordionTrigger icon={<Building02 />} label="Disabled">
            Building details
          </AccordionTrigger>
          <AccordionContent>The form.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="loading">
          <AccordionTrigger icon={<Building02 />} label="Loading" loading>
            Building details
          </AccordionTrigger>
          <AccordionContent>The form.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="plain">
          <AccordionTrigger>No icon and no label</AccordionTrigger>
          <AccordionContent>The form.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Box>
  ),
};
