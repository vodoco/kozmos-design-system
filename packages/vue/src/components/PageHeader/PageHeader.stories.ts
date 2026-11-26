import type { Meta, StoryObj } from "@storybook/vue3";
import { InfoCircle, Plus } from "@kozmos-ds/icons/vue";
import {
  KozmosBreadcrumb,
  KozmosBreadcrumbItem,
  KozmosBreadcrumbLink,
  KozmosBreadcrumbList,
  KozmosBreadcrumbPage,
  KozmosBreadcrumbSeparator,
  KozmosButton,
  KozmosContainer,
  KozmosIconButton,
  KozmosPageHeader,
  KozmosText,
} from "../../index";

/**
 * Vue's PageHeader: the stories React's has, with the same names, its node
 * props given as slots, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. PageHeader, Breadcrumb, Button, IconButton,
 * Text and Container are native. test/parity/page-header.parity.spec.ts draws each in both
 * and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosPageHeader> = {
  title: "Vue/Core/Layout/PageHeader",
  component: KozmosPageHeader,
  parameters: { layout: "fullscreen" },
  argTypes: {
    tone: { control: "inline-radio", options: ["subtle", "default"] },
    size: { control: "inline-radio", options: ["md", "lg"] },
    inset: { control: "inline-radio", options: ["window", "panel"] },
  },
};

export default meta;
type Story = StoryObj<typeof KozmosPageHeader>;

const components = {
  KozmosBreadcrumb,
  KozmosBreadcrumbItem,
  KozmosBreadcrumbLink,
  KozmosBreadcrumbList,
  KozmosBreadcrumbPage,
  KozmosBreadcrumbSeparator,
  KozmosButton,
  KozmosPageHeader,
};

const crumbs = `
  <template #breadcrumb>
    <KozmosBreadcrumb>
      <KozmosBreadcrumbList>
        <KozmosBreadcrumbItem>
          <KozmosBreadcrumbLink href="#">Boston Logan Airport</KozmosBreadcrumbLink>
        </KozmosBreadcrumbItem>
        <KozmosBreadcrumbSeparator />
        <KozmosBreadcrumbItem>
          <KozmosBreadcrumbPage>Settings</KozmosBreadcrumbPage>
        </KozmosBreadcrumbItem>
      </KozmosBreadcrumbList>
    </KozmosBreadcrumb>
  </template>`;

/**
 * A section's page: the breadcrumb, a 24 title, a description and the page's
 * action, on the tinted band (decision 135), 32 above and 24 below (GAP-116).
 */
export const Default: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <KozmosPageHeader v-bind="args">
        ${crumbs}
        <template #title>Settings</template>
        <template #description>Manage the site's map, its levels and who can edit them.</template>
        <template #actions><KozmosButton>Save changes</KozmosButton></template>
      </KozmosPageHeader>`,
  }),
};

/** Home's band: a 30 title and an introduction, no breadcrumb. */
export const Landing: Story = {
  args: { size: "lg" },
  render: (args) => ({
    components: { ...components, Plus },
    setup: () => ({ args }),
    template: `
      <KozmosPageHeader v-bind="args">
        <template #title>Welcome back</template>
        <template #description>Pick up where you left off, or start a new map.</template>
        <template #actions>
          <KozmosButton><Plus aria-hidden="true" class="h-5 w-5" />New site</KozmosButton>
        </template>
      </KozmosPageHeader>`,
  }),
};

/**
 * The info button beside the title says more about the page; it names
 * itself, and is not part of the heading.
 */
export const WithInfo: Story = {
  render: (args) => ({
    components: { ...components, InfoCircle, KozmosIconButton },
    setup: () => ({ args }),
    template: `
      <KozmosPageHeader v-bind="args">
        ${crumbs}
        <template #title>Map content</template>
        <template #info>
          <KozmosIconButton aria-label="About map content" size="sm" variant="ghost">
            <InfoCircle aria-hidden="true" class="h-5 w-5" />
          </KozmosIconButton>
        </template>
        <template #description>Every feature on the map, by level and type.</template>
        <template #actions>
          <KozmosButton variant="outline">Import</KozmosButton>
          <KozmosButton>Publish</KozmosButton>
        </template>
      </KozmosPageHeader>`,
  }),
};

/**
 * With `tone="default"` no band is painted: the header sits on the page's
 * background, its content lined up with the Container under it.
 */
export const Plain: Story = {
  args: { tone: "default" },
  render: (args) => ({
    components: { ...components, KozmosContainer, KozmosText },
    setup: () => ({ args }),
    template: `
      <KozmosPageHeader v-bind="args">
        ${crumbs}
        <template #title>Settings</template>
        <template #description>Manage the site's map, its levels and who can edit them.</template>
        <template #actions><KozmosButton>Save changes</KozmosButton></template>
      </KozmosPageHeader>
      <KozmosContainer>
        <KozmosText size="sm">The content of the page starts here, on the same edge.</KozmosText>
      </KozmosContainer>`,
  }),
};
