import type { Meta, StoryObj } from "@storybook/vue3";
import { HelpCircle } from "@kozmos-ds/icons/vue";
import { reactive } from "vue";
import {
  KozmosButton,
  KozmosList,
  KozmosListItem,
  KozmosListItemStatus,
} from "../../index";
import {
  KozmosCheckbox,
  KozmosIcon,
  KozmosIconButton,
  KozmosTag,
} from "../../react-bridge";

/**
 * Vue's List: the stories React's has, with the same names, each inside the
 * KozmosThemeProvider the Storybook's decorator gives every story. Each is
 * drawn by its own render, as React's is; test/parity/list.parity.spec.ts
 * draws each in both and holds Vue's render to React's. Tag, Checkbox,
 * IconButton and Icon have no native port yet, so they come from the
 * bridge, as an app would draw them today.
 */
const meta: Meta = {
  title: "Vue/Core/Data display/List",
  component: KozmosList,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    components: { KozmosList, KozmosListItem },
    template: `
      <KozmosList>
        <KozmosListItem>First item</KozmosListItem>
        <KozmosListItem>Second item</KozmosListItem>
        <KozmosListItem>Third item</KozmosListItem>
      </KozmosList>
    `,
  }),
};

export const Compact: Story = {
  render: () => ({
    components: { KozmosList, KozmosListItem },
    template: `
      <KozmosList density="compact">
        <KozmosListItem>First item</KozmosListItem>
        <KozmosListItem>Second item</KozmosListItem>
        <KozmosListItem>Third item</KozmosListItem>
      </KozmosList>
    `,
  }),
};

/**
 * The Get started checklist (GAP-195, decision 135): each tour is a
 * KozmosListItem filled in. A status mark at the start, read before the
 * name; the title with its role tag; a description; a meta line; one action
 * at the end.
 */
export const Checklist: Story = {
  render: () => ({
    components: {
      KozmosButton,
      KozmosList,
      KozmosListItem,
      KozmosListItemStatus,
      KozmosTag,
    },
    template: `
      <KozmosList class="w-mobile">
        <KozmosListItem>
          <template #leading><KozmosListItemStatus status="done" /></template>
          <template #title>Explore the map</template>
          <template #titleAddon><KozmosTag variant="secondary">Viewer</KozmosTag></template>
          <template #description>Pan, zoom and change levels.</template>
          <template #meta>2 min</template>
          <template #trailing><KozmosButton size="sm" variant="outline">Replay</KozmosButton></template>
        </KozmosListItem>
        <KozmosListItem>
          <template #leading><KozmosListItemStatus status="inProgress" /></template>
          <template #title>Add a point of interest</template>
          <template #titleAddon><KozmosTag variant="secondary">Editor</KozmosTag></template>
          <template #description>Place it, name it and choose its type.</template>
          <template #meta>Step 2 of 4 · 3 min</template>
          <template #trailing><KozmosButton size="sm">Resume</KozmosButton></template>
        </KozmosListItem>
        <KozmosListItem>
          <template #leading><KozmosListItemStatus status="todo" /></template>
          <template #title>Publish your changes</template>
          <template #titleAddon><KozmosTag variant="secondary">Admin</KozmosTag></template>
          <template #description>Review what changed and make it live.</template>
          <template #meta>4 min</template>
          <template #trailing><KozmosButton size="sm">Start</KozmosButton></template>
        </KozmosListItem>
      </KozmosList>
    `,
  }),
};

/**
 * Pointr Cloud's Map Persona Visibility list: a persona's mark (here a
 * stand-in; the mark is GAP-106's), its name, an info button and a checkbox
 * at the end, the row tinted while it is ticked.
 */
export const PersonaVisibility: Story = {
  render: () => ({
    components: {
      HelpCircle,
      KozmosCheckbox,
      KozmosIcon,
      KozmosIconButton,
      KozmosList,
      KozmosListItem,
    },
    setup() {
      const shown = reactive<Record<string, boolean>>({
        Visitor: true,
        Staff: false,
        Contractor: true,
      });
      return { shown };
    },
    template: `
      <KozmosList density="compact" class="w-mobile">
        <KozmosListItem v-for="(on, persona) in shown" :key="persona" :selected="on">
          <template #leading><KozmosIcon name="user" size="sm" color="muted" /></template>
          <template #title>{{ persona }}</template>
          <template #titleAddon>
            <KozmosIconButton :aria-label="'About ' + persona" size="sm" variant="ghost">
              <HelpCircle aria-hidden="true" class="h-4 w-4" />
            </KozmosIconButton>
          </template>
          <template #trailing>
            <KozmosCheckbox
              :aria-label="'Show to ' + persona"
              :checked="on"
              @update:checked="(checked) => (shown[persona] = checked === true)"
            />
          </template>
        </KozmosListItem>
      </KozmosList>
    `,
  }),
};
