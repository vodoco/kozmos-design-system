import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { HelpCircle } from "@kozmos-ds/icons";
import { TourStep } from "./TourStep";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Stack } from "../Stack/Stack";
import { Tag } from "../Tag/Tag";
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

/** Shut on the docs page, where an open step would dim the page's text. */
function useShown(viewMode: string | undefined) {
  return React.useState(viewMode !== "docs");
}

/** The button that opens a step on the docs page. */
function ShowStep({ onShow }: { onShow: () => void }) {
  return (
    <div>
      <Button variant="ghost" onClick={onShow}>
        Show the step
      </Button>
    </div>
  );
}

/**
 * GAP-188: one TourStep through a whole tour, as a product holds it. "Start
 * the tour" opens it; Back and Next move it on, the cut-out glides to the
 * next target, and the card is drawn anew for each step, so a reader hears
 * the new one, with focus on its Next. The last step says Done, which ends
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
        instruction: "Choose a floor, or select Next to open the first one.",
      },
      {
        target: room,
        title: "Draw a room",
        body: "Click each corner of the room, then click the first again.",
        instruction: "Draw a room; the tour moves on when it is drawn.",
      },
      {
        target: publish,
        title: "Publish",
        body: "Apps show the new room once the site is published.",
        instruction: "Select Publish, or Done to finish the tour.",
      },
    ];
    const [open, setOpen] = React.useState(false);
    const [at, setAt] = React.useState(0);
    const step = steps[at];
    return (
      <Stack gap={6} style={{ minHeight: "30rem" }}>
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
          body={step.body}
          instruction={step.instruction}
          onBack={at > 0 ? () => setAt(at - 1) : undefined}
          onNext={() =>
            at < steps.length - 1 ? setAt(at + 1) : setOpen(false)
          }
          nextLabel={at < steps.length - 1 ? "Next" : "Done"}
          onClose={() => setOpen(false)}
        />
      </Stack>
    );
  },
};

/**
 * The MAP-64 welcome card (US1-Welcome, D9 and D20), at compact density as
 * Pointr Cloud draws it (decision 82): "Welcome", a title and a body beside
 * the help button. No position and no progress (no `stepCount`), no Back and
 * no Close (no `onClose`: its own actions close it, and Escape leaves it).
 * The dismiss link makes the card 432 wide, so Don't show again, Not now and
 * Show me the tours sit on one line.
 */
export const Welcome: Story = {
  render: function Welcome(_args, { viewMode }) {
    const help = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} style={{ minHeight: "22rem" }}>
          <Stack direction="row" justify="end">
            <IconButton ref={help} variant="ghost" aria-label="Help">
              <HelpCircle aria-hidden="true" />
            </IconButton>
          </Stack>
          <ShowStep onShow={() => setOpen(true)} />
          <TourStep
            open={open}
            target={help}
            side="bottom"
            align="end"
            tourLabel="Welcome"
            title="Welcome to Pointr Cloud"
            body="Learn the basics in your own maps. Tours, documentation and help for the page you are on now live under this button, on every page."
            onDismiss={() => setOpen(false)}
            onSecondary={() => setOpen(false)}
            onNext={() => setOpen(false)}
            nextLabel="Show me the tours"
          />
        </Stack>
      </DensityScope>
    );
  },
};

/**
 * A step of the MAP-64 tour "Add users and assign permissions" (US2-A1S1),
 * at compact density: the tour's name and its position, Close, the title,
 * the body, what to do now as an info Notice with a pointer, the progress
 * bar with "1 of 4", and Next. Its arrow points at Settings, which
 * Backdrop's cut-out lights. Focus is on Next.
 */
export const Step: Story = {
  render: function Step(_args, { viewMode }) {
    const settings = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} style={{ minHeight: "26rem" }}>
          <Stack direction="row" gap={2} justify="center">
            <Button variant="ghost">Maps</Button>
            <Button variant="ghost">Analytics</Button>
            <Button ref={settings} variant="ghost">
              Settings
            </Button>
          </Stack>
          <ShowStep onShow={() => setOpen(true)} />
          <TourStep
            open={open}
            target={settings}
            side="bottom"
            align="end"
            tourLabel="Add users and assign permissions"
            step={1}
            stepCount={4}
            title="Open User Management in Settings"
            body="User Management is where you give people access to Pointr Cloud. It is in Settings."
            instruction="Open Settings, then User Management, or select Next to go there."
            onNext={() => setOpen(false)}
            closeLabel="Close tour"
            onClose={() => setOpen(false)}
          />
        </Stack>
      </DensityScope>
    );
  },
};

/**
 * A step its own action completes (US2-A5S5, D4 and D11), at compact
 * density: Next is drawn disabled, not hidden, so the footer keeps one shape
 * on every step, and the tour moves on when the desk is saved. The card sits
 * above the tool it points at, and takes focus itself, as its Next can't.
 */
export const DoStep: Story = {
  render: function DoStep(_args, { viewMode }) {
    const polygon = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} justify="end" style={{ minHeight: "28rem" }}>
          <ShowStep onShow={() => setOpen(true)} />
          <Stack direction="row" gap={2} justify="center">
            <Button variant="ghost">Select</Button>
            <Button ref={polygon} variant="ghost">
              Polygon
            </Button>
            <Button variant="ghost">Point</Button>
            <Button variant="ghost">Circle</Button>
          </Stack>
        </Stack>
        <TourStep
          open={open}
          target={polygon}
          side="top"
          align="center"
          tourLabel="Add an office desk"
          step={5}
          stepCount={5}
          title="Draw the desk's outline"
          body="Polygon draws a closed shape on the map: click each corner, then click the first again to finish. Save is enabled once the outline is valid."
          instruction="Select Polygon and draw the outline, finish it, then Save; the tour finishes when the desk is saved."
          onBack={() => {}}
          onNext={() => setOpen(false)}
          nextDisabled
          closeLabel="Close tour"
          onClose={() => setOpen(false)}
        />
      </DensityScope>
    );
  },
};

/**
 * The tour's last step (US2-A1S4, D24), at compact density: Back, and
 * Finish without adding as the secondary action. It has no Next: adding the
 * user finishes the tour, or the secondary action does without saving.
 */
export const LastStep: Story = {
  render: function LastStep(_args, { viewMode }) {
    const add = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} justify="end" style={{ minHeight: "30rem" }}>
          <ShowStep onShow={() => setOpen(true)} />
          <Stack direction="row" gap={2} justify="center">
            <Button variant="secondary">Cancel</Button>
            <Button ref={add}>Add User</Button>
          </Stack>
        </Stack>
        <TourStep
          open={open}
          target={add}
          side="top"
          align="center"
          tourLabel="Add users and assign permissions"
          step={4}
          stepCount={4}
          title="Add the user"
          body="The user has access as soon as they are saved: you do not need to publish any site first."
          instruction="Select Add User; the tour finishes when the user is added, or select Finish without adding."
          onBack={() => {}}
          onSecondary={() => setOpen(false)}
          secondaryLabel="Finish without adding"
          closeLabel="Close tour"
          onClose={() => setOpen(false)}
        />
      </DensityScope>
    );
  },
};

/**
 * When the step can't go on as it should (US2-SaveFail), at compact
 * density: the instruction in the warning tone, with the warning's own mark,
 * says what to do instead.
 */
export const Warning: Story = {
  render: function Warning(_args, { viewMode }) {
    const add = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} justify="end" style={{ minHeight: "30rem" }}>
          <ShowStep onShow={() => setOpen(true)} />
          <Stack direction="row" gap={2} justify="center">
            <Button variant="secondary">Cancel</Button>
            <Button ref={add}>Add User</Button>
          </Stack>
        </Stack>
        <TourStep
          open={open}
          target={add}
          side="top"
          align="center"
          tourLabel="Add users and assign permissions"
          step={4}
          stepCount={4}
          title="Add the user"
          body="The user has access as soon as they are saved: you do not need to publish any site first."
          instruction="Fix what the Dashboard's message says and select Add User again; the tour finishes when the user is added, or select Finish without adding."
          instructionTone="warning"
          onBack={() => {}}
          onSecondary={() => setOpen(false)}
          secondaryLabel="Finish without adding"
          closeLabel="Close tour"
          onClose={() => setOpen(false)}
        />
      </DensityScope>
    );
  },
};

/**
 * "This step can't be shown" (US2-NoStep, US2-UP2), at compact density: with
 * no target, or one that is not on the page, the whole page is dimmed and
 * the card, with no arrow, places itself in the middle of the window, 420
 * wide (decision 139).
 */
export const NoTarget: Story = {
  render: function NoTarget(_args, { viewMode }) {
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} style={{ minHeight: "28rem" }}>
          <ShowStep onShow={() => setOpen(true)} />
          <TourStep
            open={open}
            tourLabel="Add users and assign permissions"
            step={1}
            stepCount={4}
            title="Open User Management in Settings"
            body="User Management is where you give people access to Pointr Cloud."
            instruction="This step can't be shown on this version of the Dashboard. Continue to the next step or close the tour."
            instructionTone="warning"
            onSecondary={() => setOpen(false)}
            secondaryLabel="Close tour"
            onNext={() => setOpen(false)}
            closeLabel="Close tour"
            onClose={() => setOpen(false)}
          />
        </Stack>
      </DensityScope>
    );
  },
};

/**
 * A tour's ending (US2-A2End), at compact density: no `stepCount`, so no
 * position and no progress, the tour's name carrying "completed", Done, and
 * the next tour offered as the secondary action. With nothing to point at,
 * it is in the middle of the window.
 */
export const Ending: Story = {
  render: function Ending(_args, { viewMode }) {
    const [open, setOpen] = useShown(viewMode);
    return (
      <DensityScope density="compact">
        <Stack gap={4} style={{ minHeight: "26rem" }}>
          <ShowStep onShow={() => setOpen(true)} />
          <TourStep
            open={open}
            tourLabel="How Pointr Cloud is organised · completed"
            title="Changes go live when you publish"
            body="Any changes you make here don't change the apps immediately. An Admin or Super Admin needs to publish it first. Next: how levels are numbered and named."
            onSecondary={() => setOpen(false)}
            secondaryLabel="Start Level indexes"
            onNext={() => setOpen(false)}
            nextLabel="Done"
            closeLabel="Close tour"
            onClose={() => setOpen(false)}
          />
        </Stack>
      </DensityScope>
    );
  },
};

/**
 * Content after the instruction (the design's `extra`): any content, in the
 * card's own ink. Here a row of Tags and a Table, on the last step of
 * "Level indexes".
 */
export const WithContent: Story = {
  render: function WithContent(_args, { viewMode }) {
    const level = React.useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useShown(viewMode);
    return (
      <Stack gap={4} style={{ minHeight: "40rem" }}>
        <div>
          <Button ref={level} variant="outline">
            First Floor (1F)
          </Button>
        </div>
        <ShowStep onShow={() => setOpen(true)} />
        <TourStep
          open={open}
          target={level}
          side="bottom"
          align="start"
          tourLabel="Level indexes"
          step={3}
          stepCount={3}
          title="Index orders levels; names are what people see"
          body="The index is the level’s place in the building’s stack."
          instruction="Plan indexes the same way across the buildings of a site."
          onBack={() => {}}
          onNext={() => setOpen(false)}
          nextLabel="Done"
          onClose={() => setOpen(false)}
        >
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
 * A single hint (coachmark, GAP-157): TourStep with no `stepCount`, no Back
 * and no Next. No position and no progress; it closes by its button and by
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
        <ShowStep onShow={() => setOpen(true)} />
        <TourStep
          open={open}
          target={tool}
          side="bottom"
          title="Draw rooms here"
          body="Pick the room tool, then click each corner of the room."
          closeLabel="Dismiss"
          onClose={() => setOpen(false)}
        />
      </Stack>
    );
  },
};

/**
 * Right to left, the card, its sections, the progress bar and the footer
 * mirror. The direction is the provider's, which its portal, where the card
 * is drawn, carries.
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
              body="كل مواقع هذا العميل مدرجة هنا. افتح أحدها لترى مبانيه."
              instruction="افتح موقعًا، أو اختر التالي لفتح أولها."
              positionLabel="{step} من {count}"
              progressLabel="تقدّم الجولة"
              backLabel="رجوع"
              nextLabel="التالي"
              closeLabel="إغلاق"
              onBack={() => {}}
              onNext={() => {}}
              onClose={() => setOpen(false)}
            />
          </Stack>
        </div>
      </ThemeProvider>
    );
  },
};
