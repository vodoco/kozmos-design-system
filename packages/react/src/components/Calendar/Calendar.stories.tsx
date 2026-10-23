import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Calendar } from "./Calendar";
import { ThemeProvider } from "../ThemeProvider";

// Every story names its own today and month, so the drawing is the same on
// any day it is recorded: Figma's example, 22 May 2026, with the 25th chosen.
const TODAY = "2026-05-22";

/** The surface DatePicker's Popover gives it: Figma's panel, 12 inside. */
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-block rounded-control border bg-popover p-3 text-popover-foreground shadow-overlay">
    {children}
  </div>
);

const meta = {
  id: "components-calendar",
  title: "Core/Inputs/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    mode: { control: "inline-radio", options: ["single", "range"] },
    months: { control: "inline-radio", options: [1, 2] },
    locale: { control: "text" },
    min: { control: "text" },
    max: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's DatePicker panel (2262:43097): May 2026, the 25th chosen. */
export const Default: Story = {
  args: {
    defaultValue: "2026-05-25",
    locale: "en-US",
    today: TODAY,
  },
  render: (args) => (
    <Panel>
      <Calendar {...args} />
    </Panel>
  ),
};

/** A range in one month: the first day chosen starts it, the second ends it. */
export const Range: Story = {
  render: () => (
    <Panel>
      <Calendar
        mode="range"
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        locale="en-US"
        today={TODAY}
      />
    </Panel>
  ),
};

/** Figma's DateRangePicker panel (2262:45377): May and June 2026. */
export const TwoMonths: Story = {
  render: () => (
    <Panel>
      <Calendar
        mode="range"
        months={2}
        defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
        locale="en-US"
        today={TODAY}
      />
    </Panel>
  ),
};

/** Nothing before 10 May or after 20 June: the days outside are muted and
 * the previous month's button is off. */
export const Bounds: Story = {
  render: () => (
    <Panel>
      <Calendar
        defaultValue="2026-05-25"
        min="2026-05-10"
        max="2026-06-20"
        locale="en-US"
        today={TODAY}
      />
    </Panel>
  ),
};

/** The days a product closes: here the weekends. They are reached, read and
 * not chosen. */
export const Unavailable: Story = {
  render: () => (
    <Panel>
      <Calendar
        defaultValue="2026-05-25"
        isDateUnavailable={(date) =>
          [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay())
        }
        locale="en-US"
        today={TODAY}
      />
    </Panel>
  ),
};

/** Right to left in Arabic (Egypt): the week starts on Saturday, at the
 * right, the digits are Arabic-Indic and the arrows follow the page. */
export const RightToLeft: Story = {
  render: function RightToLeftStory(_args, { globals }) {
    return (
      <ThemeProvider
        dir="rtl"
        theme={globals.theme === "dark" ? "dark" : "light"}
      >
        <Panel>
          <Calendar
            mode="range"
            months={2}
            defaultValue={{ start: "2026-05-21", end: "2026-05-25" }}
            locale="ar-EG"
            today={TODAY}
            previousMonthLabel="الشهر السابق"
            nextMonthLabel="الشهر التالي"
          />
        </Panel>
      </ThemeProvider>
    );
  },
};

/** German: the week starts on Monday, and the months and days are named in
 * German. */
export const Locale: Story = {
  render: () => (
    <Panel>
      <Calendar
        defaultValue="2026-05-25"
        locale="de-DE"
        today={TODAY}
        previousMonthLabel="Vorheriger Monat"
        nextMonthLabel="Nächster Monat"
      />
    </Panel>
  ),
};
