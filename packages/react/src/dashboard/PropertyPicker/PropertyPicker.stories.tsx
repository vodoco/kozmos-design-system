import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PropertyPicker, type PropertyPickerProperty } from "./PropertyPicker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/Card/Card";
import { Stack } from "../../components/Stack/Stack";
import { Text } from "../../components/Text/Text";

// A Dashboard module (decision 183): its stories are filed under Dashboard/,
// and draw only with Kozmos parts. src/dashboard is not scanned for
// style.css's utilities, so a story here writes no utility classes either.

// 58 properties in Pointr Cloud's types, as many as Cloud lists (QA, 11 Nov
// 2026). The names Cloud showed are Cloud's; the rest are samples.
const SAMPLE: Array<[string, string, string?]> = [
  ["Access Programs", "Array", "Named access program accepted"],
  ["Access Restrictions", "Enum", "Who may enter, and on what terms"],
  ["Accessibility Notes", "Text"],
  ["Address", "Text"],
  ["Alternative Names", "Array", "Other names visitors search for"],
  ["Amenities", "Array"],
  ["Booking Url", "Hyperlink", "Where a visitor books it"],
  ["Brand", "Text"],
  ["Capacity", "Integer", "How many people it holds"],
  ["Category", "Enum"],
  ["Contact Email", "Email"],
  ["Cover Image", "Image"],
  ["Currency", "Enum"],
  ["Description", "Text", "A sentence or two shown on the place's card"],
  ["Dress Code", "Text"],
  ["External Id", "Text", "The place's id in another system"],
  ["Facebook Url", "Hyperlink"],
  ["Floor Area", "Integer"],
  ["Gate Number", "Text"],
  ["Has Assistance", "Boolean", "Staff can help visitors here"],
  ["Has Baby Changing", "Boolean"],
  ["Has Charging Points", "Boolean"],
  ["Has Parking", "Boolean"],
  ["Has Wifi", "Boolean", "Visitors can connect to Wi-Fi here"],
  ["Images", "Image"],
  ["Instagram Url", "Hyperlink"],
  ["Is Accessible Toilet", "Boolean"],
  ["Is Gender Neutral", "Boolean"],
  ["Is Pet Friendly", "Boolean"],
  ["Is Smoking Area", "Boolean"],
  ["Is Wheelchair Accessible", "Boolean"],
  ["Keywords", "Array"],
  ["Languages Spoken", "Array"],
  ["Logo", "Image"],
  ["Max Occupancy", "Integer"],
  ["Menu Url", "Hyperlink"],
  ["Occupancy Status", "Enum", "Whether it is free, busy or full now"],
  ["Opening Hours", "Object", "When it is open, day by day"],
  ["Order Url", "Hyperlink"],
  ["Payment Methods", "Array"],
  ["Phone Number", "Hyperlink"],
  ["Price Range", "Enum"],
  ["Rating", "Object"],
  ["Reservation Email", "Email"],
  ["Room Number", "Text"],
  ["Seating", "Integer"],
  ["Security Level", "Enum"],
  ["Short Name", "Text"],
  ["Social Links", "Object"],
  ["Support Email", "Email"],
  ["Tags", "Array"],
  ["Terminal", "Text"],
  ["Ticket Required", "Boolean"],
  ["Twitter Url", "Hyperlink"],
  ["Vendor Code", "Text"],
  ["Video Tour", "Hyperlink"],
  ["Website Url", "Hyperlink"],
  ["Zone", "Enum"],
];

// Booth's five, as Cloud suggests them once a Booth is the type.
const BOOTH = new Set([
  "Access Restrictions",
  "Description",
  "Has Assistance",
  "Has Wifi",
  "Occupancy Status",
]);

function sample(suggest: boolean): PropertyPickerProperty[] {
  return SAMPLE.map(([name, type, description]) => ({
    id: name.toLowerCase().replace(/ /g, "-"),
    name,
    type,
    description,
    suggested: suggest && BOOTH.has(name) ? true : undefined,
  }));
}

// Cloud's form column is 368 wide.
const column = { width: 368, maxWidth: "100%" };

const meta: Meta<typeof PropertyPicker> = {
  id: "dashboard-propertypicker",
  title: "Dashboard/PropertyPicker",
  component: PropertyPicker,
  args: { properties: sample(false), onSelect: () => {} },
  decorators: [
    (Story) => (
      <div style={column}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PropertyPicker>;

/** No type chosen yet: one list of every property, then Custom field. */
export const Default: Story = {
  args: { onCustomField: () => {} },
};

/**
 * A Booth: its five suggested properties under Suggested, the other 53
 * under Others. A search looks through both.
 */
export const Suggested: Story = {
  args: { properties: sample(true), onCustomField: () => {} },
};

/** Open, as it draws on the page, with Booth's suggestions. */
export const Open: Story = {
  args: {
    properties: sample(true),
    onCustomField: () => {},
    defaultOpen: true,
  },
  parameters: { docs: { story: { height: "440px" } } },
};

/**
 * In a form: a chosen property is added above the button and leaves the
 * list. The picker closes on each choice, so it never covers the field just
 * added, and the focus goes back to the button for the next.
 */
export const InAForm: Story = {
  render: function InAForm(args) {
    const [added, setAdded] = React.useState<PropertyPickerProperty[]>([]);
    const ids = new Set(added.map((property) => property.id));
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booth 12</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap={3}>
            {added.map((property) => (
              <Text key={property.id}>
                {property.name} ({property.type})
              </Text>
            ))}
            <PropertyPicker
              {...args}
              properties={sample(true).filter(
                (property) => !ids.has(property.id),
              )}
              onSelect={(property) => setAdded((list) => [...list, property])}
              onCustomField={() => {}}
            />
          </Stack>
        </CardContent>
      </Card>
    );
  },
};
