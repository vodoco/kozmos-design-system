import type { Meta, StoryObj } from "@storybook/react";
import { InfoCircle, Plus } from "@kozmos-ds/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../Breadcrumb/Breadcrumb";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import { Text } from "../Text/Text";
import { Container } from "../Container/Container";
import { PageHeader } from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  id: "navigation-pageheader",
  title: "Core/Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    tone: { control: "inline-radio", options: ["subtle", "default"] },
    size: { control: "inline-radio", options: ["md", "lg"] },
    inset: { control: "inline-radio", options: ["window", "panel"] },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

const crumbs = (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Boston Logan Airport</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Settings</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
);

/**
 * A section's page: the breadcrumb, a 24 title, a description and the page's
 * action, on the tinted band (decision 135), 32 above and 24 below (GAP-116).
 */
export const Default: Story = {
  args: {
    breadcrumb: crumbs,
    title: "Settings",
    description: "Manage the site's map, its levels and who can edit them.",
    actions: <Button>Save changes</Button>,
  },
};

/** Home's band: a 30 title and an introduction, no breadcrumb. */
export const Landing: Story = {
  args: {
    size: "lg",
    title: "Welcome back",
    description: "Pick up where you left off, or start a new map.",
    actions: (
      <Button>
        <Plus aria-hidden="true" className="h-5 w-5" />
        New site
      </Button>
    ),
  },
};

/**
 * The info button beside the title says more about the page; it names
 * itself, and is not part of the heading.
 */
export const WithInfo: Story = {
  args: {
    breadcrumb: crumbs,
    title: "Map content",
    info: (
      <IconButton aria-label="About map content" size="sm" variant="ghost">
        <InfoCircle aria-hidden="true" className="h-5 w-5" />
      </IconButton>
    ),
    description: "Every feature on the map, by level and type.",
    actions: (
      <>
        <Button variant="outline">Import</Button>
        <Button>Publish</Button>
      </>
    ),
  },
};

/**
 * With `tone="default"` no band is painted: the header sits on the page's
 * background, its content lined up with the Container under it.
 */
export const Plain: Story = {
  render: (args) => (
    <>
      <PageHeader {...args} />
      <Container>
        <Text size="sm">
          The content of the page starts here, on the same edge.
        </Text>
      </Container>
    </>
  ),
  args: {
    tone: "default",
    breadcrumb: crumbs,
    title: "Settings",
    description: "Manage the site's map, its levels and who can edit them.",
    actions: <Button>Save changes</Button>,
  },
};
