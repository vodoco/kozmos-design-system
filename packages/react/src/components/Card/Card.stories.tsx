import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./Card";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Pencil01 } from "@kozmos-ds/icons";
import { Input } from "../Input/Input";
import { Label } from "../Label/Label";

const meta = {
  id: "components-card",
  title: "Core/Layout/Card",
  component: Card,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className="w-mobile" {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * `padding` in both its values, side by side. Until 2026-09-25 a card was 24
 * on every side and there was no way to say otherwise: a settings page that
 * wanted 16 could only pass `className="p-4"`, which restyles the component
 * from outside and would exist on the web alone (GAP-034). It is set on the
 * card and reaches the header, content and footer, because a card padded 16 at
 * the top and 24 at the bottom is the bug, not the fix.
 */
export const Padding: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-6">
      {(["default", "compact"] as const).map((padding) => (
        <Card key={padding} padding={padding} className="w-[320px] max-w-full">
          <CardHeader>
            <CardTitle className="text-base">Search</CardTitle>
            <CardDescription>How visitors search at this site.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            padding=&quot;{padding}&quot; — {padding === "default" ? 24 : 16}px
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

/**
 * A card with no header, in both paddings: the content alone, and the
 * content above a footer. Content and footer pad their sides and bottom,
 * because a header above them has already paid the top; with no header the
 * one that is the card's first child pays the top as well. It used not to,
 * and the content touched the card's top edge (GAP-194).
 */
export const WithoutHeader: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap gap-6">
      {(["default", "compact"] as const).map((padding) => (
        <div key={padding} className="flex w-[320px] max-w-full flex-col gap-6">
          <Card padding={padding} className="w-full">
            <CardContent className="text-sm text-muted-foreground">
              Content alone — {padding === "default" ? 24 : 16}px on every side.
            </CardContent>
          </Card>
          <Card padding={padding} className="w-full">
            <CardContent className="text-sm text-muted-foreground">
              Content above a footer.
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  ),
};

// GAP-169: Pointr Cloud's site card, an edit button at the header's end.
export const HeaderActions: Story = {
  render: (args) => (
    <Card className="w-mobile" {...args}>
      <CardHeader
        actions={
          <IconButton aria-label="Edit Boston Logan Airport">
            <Pencil01 aria-hidden="true" className="h-5 w-5" />
          </IconButton>
        }
      >
        <CardTitle>Boston Logan Airport</CardTitle>
        <CardDescription>3 buildings, 11 levels</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Changes awaiting publish.</p>
      </CardContent>
    </Card>
  ),
};
