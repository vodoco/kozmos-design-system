import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { Backdrop } from "./Backdrop";
import { Button } from "../Button/Button";
import { Stack } from "../Stack/Stack";
import { Text } from "../Text/Text";

const meta: Meta<typeof Backdrop> = {
  id: "feedback-backdrop",
  title: "Core/Feedback/Backdrop",
  component: Backdrop,
};

export default meta;
type Story = StoryObj<typeof Backdrop>;

export const Default: Story = {
  render: () => (
    <div className="h-64 w-full relative border">
      <div className="absolute inset-0 flex items-center justify-center">
        Content behind backdrop
      </div>
      <Backdrop placement="inline" />
    </div>
  ),
};

/**
 * A tour's step lights the control it points at (GAP-189). The dim covers
 * the rest, the cut-out is ringed in the focus colour, and Update can be
 * pressed through it. The button stays where it is, in its own row.
 */
export const Target: Story = {
  render: () => {
    const update = useRef<HTMLButtonElement>(null);
    return (
      <div className="h-64 w-full relative">
        <Stack className="p-6" gap={4}>
          <Text>Draft saved 2 minutes ago</Text>
          <Stack direction="row" gap={2}>
            <Button variant="outline">Discard</Button>
            <Button ref={update}>Update</Button>
          </Stack>
        </Stack>
        <Backdrop placement="inline" target={update} />
      </div>
    );
  },
};

/**
 * Several things lit as one: the cut-out is the box round them all, padded
 * and rounded by the same tokens.
 */
export const TargetList: Story = {
  render: () => {
    const discard = useRef<HTMLButtonElement>(null);
    const update = useRef<HTMLButtonElement>(null);
    return (
      <div className="h-64 w-full relative">
        <Stack className="p-6" gap={4}>
          <Text>Draft saved 2 minutes ago</Text>
          <Stack direction="row" gap={2}>
            <Button ref={discard} variant="outline">
              Discard
            </Button>
            <Button ref={update}>Update</Button>
          </Stack>
        </Stack>
        <Backdrop placement="inline" target={[discard, update]} />
      </div>
    );
  },
};

/**
 * The lit button takes the tour on: the cut-out glides to the next one, or
 * moves at once when motion is reduced.
 */
export const MovingTarget: Story = {
  render: () => {
    const steps = [
      useRef<HTMLButtonElement>(null),
      useRef<HTMLButtonElement>(null),
      useRef<HTMLButtonElement>(null),
    ];
    const [step, setStep] = useState(0);
    const next = () => setStep((current) => (current + 1) % steps.length);
    return (
      <div className="h-64 w-full relative">
        <Stack className="p-6" gap={6}>
          <Stack direction="row" gap={2}>
            <Button ref={steps[0]} variant="outline" onClick={next}>
              Choose a floor
            </Button>
            <Button ref={steps[1]} variant="outline" onClick={next}>
              Draw a room
            </Button>
          </Stack>
          <Stack direction="row" justify="end">
            <Button ref={steps[2]} onClick={next}>
              Publish
            </Button>
          </Stack>
        </Stack>
        <Backdrop placement="inline" target={steps[step]} />
      </div>
    );
  },
};
