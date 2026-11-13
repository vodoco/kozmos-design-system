import type { Meta, StoryObj } from "@storybook/react";
import { PropertyField } from "./PropertyField";
import {
  OpeningHoursEditor,
  DEFAULT_OPENING_HOURS,
} from "../OpeningHoursEditor/OpeningHoursEditor";
import { RatingEditor } from "../RatingEditor/RatingEditor";
import { KeyValueList } from "../KeyValueList/KeyValueList";
import { Input } from "../../components/Input/Input";
import { MultiSelect } from "../../components/MultiSelect/MultiSelect";
import { NumberInput } from "../../components/NumberInput/NumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/Select/Select";
import { Stack } from "../../components/Stack/Stack";

// A Dashboard module (decision 183): its stories are filed under Dashboard/,
// and draw only with Kozmos parts. src/dashboard is not scanned for
// style.css's utilities, so a story here writes no utility classes either.
const meta: Meta<typeof PropertyField> = {
  id: "dashboard-propertyfield",
  title: "Dashboard/PropertyField",
  component: PropertyField,
  parameters: { layout: "padded" },
  args: {
    name: "Capacity",
    info: "How many people the space holds at once.",
    onRemove: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof PropertyField>;

const occupancy = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "underConstruction", label: "Under construction" },
  { value: "temporarilyClosed", label: "Temporarily closed" },
];
const restrictions = [
  { value: "invite-only", label: "Invite only" },
  { value: "membership-required", label: "Membership required" },
  { value: "booking-required", label: "Booking required" },
  { value: "ticket-required", label: "Ticket required" },
];

/**
 * Properties in their frames: each name, what it is, and the red trash.
 * An Integer, an Enum and an Array (decision 177): Select and MultiSelect
 * take each option's value and label, and show the label, never Cloud's
 * raw keys ("underConstruction", "invite-only"); a chip's remove button is
 * named for its label, "Remove Invite only".
 */
export const Default: Story = {
  render: (args) => (
    <Stack gap={3}>
      <PropertyField {...args}>
        <NumberInput aria-label="Capacity" defaultValue={120} min={0} />
      </PropertyField>
      <PropertyField name="Occupancy Status" onRemove={() => {}}>
        <Select defaultValue="underConstruction">
          <SelectTrigger aria-label="Occupancy Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {occupancy.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyField>
      <PropertyField name="Access Restrictions" onRemove={() => {}}>
        <MultiSelect
          aria-label="Access Restrictions"
          options={restrictions}
          defaultValue={["invite-only", "booking-required"]}
        />
      </PropertyField>
    </Stack>
  ),
};

/**
 * Several items selected whose values differ (GAP-153): every editor here
 * keeps its mixed values, shows "Multiple values" and no value, until the
 * visitor edits it. A text, a number, an enum, a day of the opening hours,
 * the rating and a key–value row.
 */
export const MultiSelection: Story = {
  render: () => (
    <Stack gap={3}>
      <PropertyField name="Description">
        <Input aria-label="Description" mixed />
      </PropertyField>
      <PropertyField name="Capacity">
        <NumberInput aria-label="Capacity" mixed />
      </PropertyField>
      <PropertyField name="Occupancy Status">
        <Select mixed>
          <SelectTrigger aria-label="Occupancy Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {occupancy.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyField>
      <PropertyField name="Opening Hours">
        <OpeningHoursEditor
          defaultValue={DEFAULT_OPENING_HOURS}
          mixedDays={["saturday", "sunday"]}
        />
      </PropertyField>
      <PropertyField name="Rating">
        <RatingEditor
          defaultValue={{ rating: null, max: 5, count: null }}
          mixed={{ rating: true, count: true }}
        />
      </PropertyField>
      <PropertyField name="Extra Data">
        <KeyValueList
          defaultValue={[
            { id: "a", name: "vendor", type: "text", value: "", mixed: true },
            {
              id: "b",
              name: "floors",
              type: "number",
              value: null,
              mixed: true,
            },
          ]}
        />
      </PropertyField>
    </Stack>
  ),
};
