import type { Meta, StoryObj } from "@storybook/vue3";
import {
  KozmosBreadcrumb,
  KozmosBreadcrumbItem,
  KozmosBreadcrumbLink,
  KozmosBreadcrumbList,
  KozmosBreadcrumbPage,
  KozmosBreadcrumbSeparator,
} from "../../index";

/**
 * Vue's Breadcrumb: the story React's has, drawn as React's draws it, inside
 * the KozmosThemeProvider the Storybook's decorator gives every story.
 * test/parity/breadcrumb.parity.spec.ts draws it in both and holds Vue's
 * render to React's.
 */
const meta: Meta<typeof KozmosBreadcrumb> = {
  title: "Vue/Core/Layout/Breadcrumb",
  component: KozmosBreadcrumb,
};

export default meta;
type Story = StoryObj<typeof KozmosBreadcrumb>;

export const Default: Story = {
  render: () => ({
    components: {
      KozmosBreadcrumb,
      KozmosBreadcrumbItem,
      KozmosBreadcrumbLink,
      KozmosBreadcrumbList,
      KozmosBreadcrumbPage,
      KozmosBreadcrumbSeparator,
    },
    template: `
      <KozmosBreadcrumb>
        <KozmosBreadcrumbList>
          <KozmosBreadcrumbItem>
            <KozmosBreadcrumbLink href="/">Home</KozmosBreadcrumbLink>
          </KozmosBreadcrumbItem>
          <KozmosBreadcrumbSeparator />
          <KozmosBreadcrumbItem>
            <KozmosBreadcrumbLink href="/components">Components</KozmosBreadcrumbLink>
          </KozmosBreadcrumbItem>
          <KozmosBreadcrumbSeparator />
          <KozmosBreadcrumbItem>
            <KozmosBreadcrumbPage>Breadcrumb</KozmosBreadcrumbPage>
          </KozmosBreadcrumbItem>
        </KozmosBreadcrumbList>
      </KozmosBreadcrumb>`,
  }),
};
