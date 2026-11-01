import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TourStep } from "./TourStep";
import { Button } from "../Button/Button";
import { Stack } from "../Stack/Stack";
import { Tag } from "../Tag/Tag";
import { Text } from "../Text/Text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../Table/Table";
import { DensityScope } from "../../theme/DensityScope";
import { ThemeProvider } from "../ThemeProvider/ThemeProvider";

const meta: Meta<typeof TourStep> = {
  id: "overlay-tour-step",
  title: "Core/Overlays/TourStep",
  component: TourStep,
};

export default meta;
type Story = StoryObj<typeof TourStep>;

const SITES = ["Glasgow Airport", "Healthcare Center", "Boston Logan Airport"];

/** Shut on the docs page, where an open step would dim the page's text. */
function useShown(viewMode: string | undefined) {
  return React.useState(viewMode !== "docs");
}

/**
 * GAP-188: one TourStep through a whole tour, as a product holds it. "Start
 * the tour" opens it; Back and Next move it on, the cut-out glides to the
 * next target, and the card is drawn anew for each step, so a reader hears
 * the new one, with focus on its Next. The last step says Finish, which ends
 * the tour.
 */
export const Default: Story = {
  render: function Default() {
    const floor = React.useRef<HTMLButtonElement>(null);
    const room = React.useRef<HTMLButtonElement>(null);
    const publish = React.useRef<HTMLButtonElement>(null);
    const steps = [
      {
        target: floor,
        title: "Choose a floor",
        body: "Every floor of the building has its own map.",
        instruction: "Go ahead and choose a floor to proceed to the next step.",
      },
      {
        target: room,
        title: "Draw a room",
        body: "Click each corner of the room, then click the first again.",
        instruction: "Go ahead and draw a room to proceed to the next step.",
      },
      {
        target: publish,
        title: "Publish",
        body: "Apps show the new room once the site is published.",
        instruction: "Go ahead and select Publish to finish the tour.",
      },
    ];
    const [open, setOpen] = React.useState(false);
    const [at, setAt] = React.useState(0);
    const step = steps[at];
    return (
      <Stack gap={6} style={{ minHeight: "28rem" }}>
        <Stack direction="row" gap={2} wrap="wrap">
          <Button ref={floor} variant="outline">
            Choose a floor
          </Button>
          <Button ref={room} variant="outline">
            Draw a room
          </Button>
          <Button ref={publish}>Publish</Button>
        </Stack>
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setAt(0);
              setOpen(true);
            }}
          >
            Start the tour
          </Button>
        </div>
        <TourStep
          open={open}
          target={step.target}
          side="bottom"
          align="start"
          tourLabel="Add a room"
          step={at + 1}
          stepCount={steps.length}
          title={step.title}
          instruction={step.instruction}
          onBack={at > 0 ? () => setAt(at - 1) : undefined}
          onNext={() =>
            at < steps.length - 1 ? setAt(at + 1) : setOpen(false)
          }
          nextLabel={at < steps.length - 1 ? "Next" : "Finish"}
          onClose={() => setOpen(false)}
        >
          {step.body}
        </TourStep>
      </Stack>
    );
  },
};

/**
 * A step of the MAP-64 tour "How Pointr Cloud is organised",
 * beside the site it asks the reader to open, which Backdrop's cut-out
 * lights. Focus is on Next. On the docs page it starts shut; "Show the step"
 * opens it.
 */
export const Step: Story = {
  render: function Step(_args, { viewMode }) {
    const site = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <Stack gap={4} style={{ minHeight: "28rem" }}>
        <Stack direction="row" gap={2} wrap="wrap">
          {SITES.map((name) => (
            <Button
              key={name}
              ref={name === "Healthcare Center" ? site : undefined}
              variant="outline"
            >
              {name}
            </Button>
          ))}
        </Stack>
        <div>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Show the step
          </Button>
        </div>
        <TourStep
          open={open}
          target={site}
          side="bottom"
          align="start"
          tourLabel="How Pointr Cloud is organised"
          step={2}
          stepCount={5}
          title="Open a site"
          instruction="Go ahead and open a site to proceed to the next step."
          onBack={() => {}}
          onNext={() => {}}
          onClose={() => setOpen(false)}
        >
          Each site in this client is listed here. Open one to see its
          buildings.
        </TourStep>
      </Stack>
    );
  },
};

/**
 * The body takes any content: the boards put a row of Tags in it (A2) and a
 * Table ("A3 · 3 of 3"), here with the hint under it and Finish on the last
 * step.
 */
export const WithContent: Story = {
  render: function WithContent(_args, { viewMode }) {
    const level = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <Stack gap={4} style={{ minHeight: "36rem" }}>
        <div>
          <Button ref={level} variant="outline">
            First Floor (1F)
          </Button>
        </div>
        <div>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Show the step
          </Button>
        </div>
        <TourStep
          open={open}
          target={level}
          side="bottom"
          align="start"
          tourLabel="Level indexes"
          step={3}
          stepCount={3}
          title="Index orders levels; names are what people see"
          hint="Plan indexes the same way across the buildings of a site."
          onBack={() => {}}
          onNext={() => setOpen(false)}
          nextLabel="Finish"
          onClose={() => setOpen(false)}
        >
          <Text size="sm" color="muted">
            The index is the level’s place in the building’s stack.
          </Text>
          <Stack direction="row" gap={1} wrap="wrap">
            <Tag variant="outline">Client</Tag>
            <Tag variant="outline">Site</Tag>
            <Tag>Building</Tag>
            <Tag variant="outline">Level</Tag>
          </Stack>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index</TableHead>
                <TableHead>UK</TableHead>
                <TableHead>US</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>First floor</TableCell>
                <TableCell>Second floor</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>0</TableCell>
                <TableCell>Ground floor</TableCell>
                <TableCell>First floor</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TourStep>
      </Stack>
    );
  },
};

/**
 * "Step can’t be pointed to": with no target, or one that is not on the
 * page, the whole page is dimmed and the card places itself in the middle
 * of the window.
 */
export const NoTarget: Story = {
  render: function NoTarget(_args, { viewMode }) {
    const [open, setOpen] = useShown(viewMode);
    return (
      <Stack gap={4} style={{ minHeight: "28rem" }}>
        <div>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Show the step
          </Button>
        </div>
        <TourStep
          open={open}
          tourLabel="Edit a POI"
          step={2}
          stepCount={5}
          title="Choose a building and level"
          hint="This control can’t be pointed to right now. Select Next to continue, or close the tour."
          onBack={() => {}}
          onNext={() => {}}
          onClose={() => setOpen(false)}
        >
          Use the building and level picker at the top of the map.
        </TourStep>
      </Stack>
    );
  },
};

/**
 * A single hint (coachmark, GAP-157): TourStep with no `stepCount`, no Back
 * and no Next. No position and no dots; it closes by its button and by
 * Escape, and takes focus on itself when it opens.
 */
export const Coachmark: Story = {
  render: function Coachmark(_args, { viewMode }) {
    const tool = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <Stack gap={4} style={{ minHeight: "20rem" }}>
        <Stack direction="row" gap={2} wrap="wrap">
          <Button variant="outline">Select</Button>
          <Button ref={tool} variant="outline">
            Draw a room
          </Button>
          <Button variant="outline">Add a door</Button>
        </Stack>
        <div>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Show the hint
          </Button>
        </div>
        <TourStep
          open={open}
          target={tool}
          side="bottom"
          title="Draw rooms here"
          closeLabel="Dismiss"
          onClose={() => setOpen(false)}
        >
          Pick the room tool, then click each corner of the room.
        </TourStep>
      </Stack>
    );
  },
};

/**
 * Right to left, the card, its sections and the dots mirror. The direction
 * is the provider's, which its portal, where the card is drawn, carries.
 */
export const RightToLeft: Story = {
  render: function RightToLeft(_args, { viewMode, globals }) {
    const site = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <div lang="ar">
          <Stack gap={4} style={{ minHeight: "28rem" }}>
            <Stack direction="row" gap={2} wrap="wrap">
              <Button ref={site} variant="outline">
                مركز الرعاية الصحية
              </Button>
              <Button variant="outline">مطار غلاسكو</Button>
            </Stack>
            <div>
              <Button variant="ghost" onClick={() => setOpen(true)}>
                اعرض الخطوة
              </Button>
            </div>
            <TourStep
              open={open}
              target={site}
              side="bottom"
              align="start"
              tourLabel="كيف تنظم Pointr Cloud"
              step={2}
              stepCount={5}
              title="افتح موقعًا"
              instruction="افتح موقعًا للانتقال إلى الخطوة التالية."
              positionLabel="الخطوة {step} من {count}"
              backLabel="رجوع"
              nextLabel="التالي"
              closeLabel="إغلاق"
              onBack={() => {}}
              onNext={() => {}}
              onClose={() => setOpen(false)}
            >
              كل مواقع هذا العميل مدرجة هنا. افتح أحدها لترى مبانيه.
            </TourStep>
          </Stack>
        </div>
      </ThemeProvider>
    );
  },
};

/**
 * Compact density, as Pointr Cloud draws its controls (decision 82): Close
 * 32, Back and Next 40, the card unchanged.
 */
export const Compact: Story = {
  render: function Compact(_args, { viewMode }) {
    const site = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} style={{ minHeight: "28rem" }}>
          <div>
            <Button ref={site} variant="outline">
              Healthcare Center
            </Button>
          </div>
          <div>
            <Button variant="ghost" onClick={() => setOpen(true)}>
              Show the step
            </Button>
          </div>
          <TourStep
            open={open}
            target={site}
            side="bottom"
            align="start"
            tourLabel="How Pointr Cloud is organised"
            step={2}
            stepCount={5}
            title="Open a site"
            instruction="Go ahead and open a site to proceed to the next step."
            onBack={() => {}}
            onNext={() => {}}
            onClose={() => setOpen(false)}
          >
            Each site in this client is listed here. Open one to see its
            buildings.
          </TourStep>
        </Stack>
      </DensityScope>
    );
  },
};
