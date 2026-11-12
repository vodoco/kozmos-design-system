import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../Card/Card";
import { Label } from "../Label/Label";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import {
  Building01,
  Cube01,
  LayersThree01,
  MarkerPin01,
  Package,
} from "@kozmos-ds/icons";

const meta = {
  id: "components-tabs",
  title: "Core/Layout/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-mobile">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here. Click save when you&apos;re
              done.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here. After saving, you&apos;ll be logged
              out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save password</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// GAP-152: the type picker's family tabs, each an icon over its words. The
// active tab stays the raised segment (decision 65); the track grows to hold
// the stack.
const typeFamilies = [
  { value: "everything", label: "Everything", Icon: LayersThree01 },
  { value: "poi", label: "POI", Icon: MarkerPin01 },
  { value: "interior", label: "Interior asset", Icon: Package },
  { value: "structural", label: "Structural", Icon: Building01 },
  { value: "virtual", label: "Virtual", Icon: Cube01 },
];

// Each tab controls a panel, so every aria-controls names an element. Five
// stacked tabs are wider than a phone: the list sits in a box that scrolls
// sideways, as a narrow column would hold it, rather than widening the page.
function TypeFamilyTabs({ dir }: { dir?: "ltr" | "rtl" }) {
  return (
    <div dir={dir}>
      <Tabs defaultValue="poi" dir={dir}>
        <div className="max-w-full overflow-x-auto">
          <TabsList aria-label="Type family">
            {typeFamilies.map(({ value, label, Icon }) => (
              <TabsTrigger key={value} value={value} icon={<Icon />}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {typeFamilies.map(({ value, label }) => (
          <TabsContent key={value} value={value}>
            Types in {label}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export const IconOverLabel: Story = {
  name: "Icon over label",
  render: () => <TypeFamilyTabs />,
};

export const IconOverLabelRightToLeft: Story = {
  name: "Icon over label, right to left",
  render: () => <TypeFamilyTabs dir="rtl" />,
};
