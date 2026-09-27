import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Stack,
  Tag,
  Text,
} from "@kozmos-ds/react";

/**
 * Opening hours, composed from Kozmos components only.
 *
 * Source: the `openingHours` instance inside `fullPOIDetailCard`
 * (`HbFSXhCPxKUy2fWa5x9TKO`, node `241:4772`), read over the Figma REST API on
 * 2026-09-14 — a summary row carrying a status tag and "Closes 12:30 pm" over
 * seven `dayItem` rows that expand behind it. The scan counted 275 summaries
 * across five surfaces and 135 day rows across four.
 *
 * `docs/poi-detail-card-gaps-2026-09-14.md` reported it as missing; the ruling
 * was to build it as a Product / SDK example rather than a set, per §5.5 of
 * `docs/ds-handoff.md`. Days and times below are the file's own.
 */
const DAYS = [
  { day: "Monday", opens: "08:30 am", closes: "10:30 pm" },
  { day: "Tuesday", opens: "08:30 am", closes: "10:30 pm" },
  { day: "Wednesday", opens: "08:30 am", closes: "10:30 pm" },
  { day: "Thursday", opens: "08:30 am", closes: "10:30 pm" },
  { day: "Friday", opens: "08:30 am", closes: "10:30 pm" },
  { day: "Saturday", opens: null, closes: null },
  { day: "Sunday", opens: null, closes: null },
] as const;

const meta: Meta = {
  title: "Examples/Opening Hours",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The SDK's `openingHours` rebuilt from Kozmos components only. " +
          "See docs/poi-detail-card-gaps-2026-09-14.md for what it could not express.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="max-w-sm">
      {/* The source is 343 wide. `w-[343px]` would be a dead class here: the
          docs app ships the packages' prebuilt CSS and never compiles a utility
          the design system does not already emit, so `max-w-sm` (384) it is. */}
      <Accordion collapsible type="single">
        <AccordionItem value="hours">
          <AccordionTrigger>
            <Stack align="center" direction="row" gap={2}>
              {/* The source tag is green on a pale green field — `Tag` has no
                  `emotion` axis yet (ruled §5.9, built for `Button` only), so
                  this reads as a neutral outline instead. */}
              <Tag variant="outline" emotion="success">
                Open
              </Tag>
              <Text size="sm">
                Closes <strong className="font-medium">12:30 pm</strong>
              </Text>
            </Stack>
          </AccordionTrigger>

          <AccordionContent>
            {/* A day row is a three-column layout: day, opening time, closing
                time. There is no Kozmos part for it, so it is composed here —
                which is exactly what makes this an example rather than a set. */}
            <Stack gap={2}>
              {DAYS.map(({ day, opens, closes }) => (
                <Stack
                  align="baseline"
                  direction="row"
                  gap={2}
                  justify="between"
                  key={day}
                >
                  <Text className="font-medium" size="sm">
                    {day}
                  </Text>
                  <Text color={opens ? "default" : "muted"} size="sm">
                    {opens ? `${opens} – ${closes}` : "Closed"}
                  </Text>
                </Stack>
              ))}
            </Stack>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Alert className="mt-4" variant="warning">
        <AlertTitle>Composition note</AlertTitle>
        <AlertDescription>
          The status uses Tag&apos;s success emotion. Day rows are composed from
          Stack and Text; the example does not calculate live opening status
          from business hours or time zones.
        </AlertDescription>
      </Alert>
    </div>
  ),
};
