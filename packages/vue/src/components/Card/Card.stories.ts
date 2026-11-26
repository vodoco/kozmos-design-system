import type { Meta, StoryObj } from "@storybook/vue3";
import { h } from "vue";
import { HelpCircle, Pencil01, X } from "@kozmos-ds/icons/vue";
import {
  KozmosButton,
  KozmosCard,
  KozmosCardContent,
  KozmosCardDescription,
  KozmosCardFooter,
  KozmosCardHeader,
  KozmosCardTitle,
  KozmosHeading,
  KozmosIconButton,
  KozmosInput,
  KozmosLabel,
} from "../../index";

/**
 * Vue's Card: the stories React's has, with the same names, each drawn as
 * React's story draws it, inside the KozmosThemeProvider the Storybook's
 * decorator gives every story. The card's parts, Button, IconButton, Input,
 * Label and Heading are native. test/parity/card.parity.spec.ts
 * draws each in both and holds Vue's render to React's.
 */
const meta: Meta<typeof KozmosCard> = {
  title: "Vue/Core/Layout/Card",
  component: KozmosCard,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof KozmosCard>;

const parts = {
  KozmosButton,
  KozmosCard,
  KozmosCardContent,
  KozmosCardDescription,
  KozmosCardFooter,
  KozmosCardHeader,
  KozmosCardTitle,
};

export const Default: Story = {
  render: (args) => ({
    components: { ...parts, KozmosInput, KozmosLabel },
    setup: () => ({ args }),
    template: `
      <KozmosCard class="w-mobile" v-bind="args">
        <KozmosCardHeader>
          <KozmosCardTitle>Create project</KozmosCardTitle>
          <KozmosCardDescription>Deploy your new project in one-click.</KozmosCardDescription>
        </KozmosCardHeader>
        <KozmosCardContent>
          <form>
            <div class="grid w-full items-center gap-4">
              <div class="flex flex-col space-y-1.5">
                <KozmosLabel for="name">Name</KozmosLabel>
                <KozmosInput id="name" placeholder="Name of your project" />
              </div>
            </div>
          </form>
        </KozmosCardContent>
        <KozmosCardFooter class="flex justify-between">
          <KozmosButton variant="outline">Cancel</KozmosButton>
          <KozmosButton>Deploy</KozmosButton>
        </KozmosCardFooter>
      </KozmosCard>`,
  }),
};

/**
 * The title's level follows the page's outline (GAP-205): under a page
 * titled with an `h1`, a card's title is `as="h2"`.
 */
export const TitleLevel: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    components: { ...parts, KozmosHeading },
    template: `
      <div class="flex w-mobile max-w-full flex-col gap-4">
        <KozmosHeading :level="1">Settings</KozmosHeading>
        <KozmosCard class="w-full">
          <KozmosCardHeader>
            <KozmosCardTitle as="h2">Client details</KozmosCardTitle>
            <KozmosCardDescription>The client this site belongs to.</KozmosCardDescription>
          </KozmosCardHeader>
          <KozmosCardContent class="text-sm text-muted-foreground">Pointr</KozmosCardContent>
        </KozmosCard>
      </div>`,
  }),
};

/** `padding` in both its values, side by side (GAP-034). */
export const Padding: Story = {
  parameters: { layout: "padded" },
  // Render functions, so each of React's text nodes is one here too.
  render: () => ({
    setup: () => () =>
      h(
        "div",
        { class: "flex flex-wrap gap-6" },
        (["default", "compact"] as const).map((padding) =>
          h(
            KozmosCard,
            { key: padding, padding, class: "w-[320px] max-w-full" },
            () => [
              h(KozmosCardHeader, null, () => [
                h(KozmosCardTitle, { class: "text-base" }, () => "Search"),
                h(
                  KozmosCardDescription,
                  null,
                  () => "How visitors search at this site.",
                ),
              ]),
              h(
                KozmosCardContent,
                { class: "text-sm text-muted-foreground" },
                () => [
                  'padding="',
                  padding,
                  '" — ',
                  String(padding === "default" ? 24 : 16),
                  "px",
                ],
              ),
            ],
          ),
        ),
      ),
  }),
};

/**
 * A card with no header, in both paddings: the content alone, and the
 * content above a footer, the first child paying the top (GAP-194).
 */
export const WithoutHeader: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    setup: () => () =>
      h(
        "div",
        { class: "flex flex-wrap gap-6" },
        (["default", "compact"] as const).map((padding) =>
          h(
            "div",
            {
              key: padding,
              class: "flex w-[320px] max-w-full flex-col gap-6",
            },
            [
              h(KozmosCard, { padding, class: "w-full" }, () => [
                h(
                  KozmosCardContent,
                  { class: "text-sm text-muted-foreground" },
                  () => [
                    "Content alone — ",
                    String(padding === "default" ? 24 : 16),
                    "px on every side.",
                  ],
                ),
              ]),
              h(KozmosCard, { padding, class: "w-full" }, () => [
                h(
                  KozmosCardContent,
                  { class: "text-sm text-muted-foreground" },
                  () => "Content above a footer.",
                ),
                h(KozmosCardFooter, { class: "justify-end gap-2" }, () => [
                  h(KozmosButton, { variant: "outline" }, () => "Cancel"),
                  h(KozmosButton, null, () => "Save"),
                ]),
              ]),
            ],
          ),
        ),
      ),
  }),
};

// GAP-169: Pointr Cloud's site card, an edit button at the header's end.
export const HeaderActions: Story = {
  render: (args) => ({
    components: { ...parts, KozmosIconButton, Pencil01 },
    setup: () => ({ args }),
    template: `
      <KozmosCard class="w-mobile" v-bind="args">
        <KozmosCardHeader>
          <template #actions>
            <KozmosIconButton aria-label="Edit Boston Logan Airport">
              <Pencil01 aria-hidden="true" class="h-5 w-5" />
            </KozmosIconButton>
          </template>
          <KozmosCardTitle>Boston Logan Airport</KozmosCardTitle>
          <KozmosCardDescription>3 buildings, 11 levels</KozmosCardDescription>
        </KozmosCardHeader>
        <KozmosCardContent>
          <p class="text-sm">Changes awaiting publish.</p>
        </KozmosCardContent>
      </KozmosCard>`,
  }),
};

/**
 * CardHeader's subtle tone (CLOUD-UI-001; decisions 135 and 139): a pale
 * theme strip, at least 52 tall, with a 14 title, its actions centred in it.
 */
export const SubtleHeader: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    components: { ...parts, KozmosIconButton, HelpCircle, X },
    template: `
      <div class="flex flex-wrap gap-6">
        <KozmosCard padding="compact" class="w-[400px] max-w-full">
          <KozmosCardHeader tone="subtle">
            <template #actions>
              <KozmosIconButton aria-label="Help" size="sm">
                <HelpCircle aria-hidden="true" class="h-5 w-5" />
              </KozmosIconButton>
              <KozmosIconButton aria-label="Close" size="sm">
                <X aria-hidden="true" class="h-5 w-5" />
              </KozmosIconButton>
            </template>
            <KozmosCardTitle>Add beacon</KozmosCardTitle>
            <KozmosCardDescription>Terminal A / Level 2</KozmosCardDescription>
          </KozmosCardHeader>
          <KozmosCardContent>
            <KozmosButton variant="subtle" class="w-full">+ Add additional field</KozmosButton>
          </KozmosCardContent>
        </KozmosCard>
        <KozmosCard class="w-[320px] max-w-full">
          <KozmosCardHeader tone="subtle">
            <KozmosCardTitle>Landmark directions</KozmosCardTitle>
          </KozmosCardHeader>
          <KozmosCardContent class="text-sm text-muted-foreground">A lone title: the strip stays 52.</KozmosCardContent>
        </KozmosCard>
      </div>`,
  }),
};

/** CardTitle's size (GAP-035, decision 132): 24 `lg`, 18 `md`, 14 `sm`. */
export const TitleSize: Story = {
  parameters: { layout: "padded" },
  render: () => ({
    setup: () => () =>
      h(
        "div",
        { class: "flex flex-wrap gap-6" },
        (["lg", "md", "sm"] as const).map((size) =>
          h(
            KozmosCard,
            { key: size, padding: "compact", class: "w-[240px] max-w-full" },
            () => [
              h(KozmosCardHeader, null, () => [
                h(KozmosCardTitle, { size }, () => "Lunch nearby"),
                h(KozmosCardDescription, null, () => ['size="', size, '"']),
              ]),
            ],
          ),
        ),
      ),
  }),
};
