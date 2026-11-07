import { ref } from "vue";
import { KozmosMapOverlay, KozmosSearchBar } from "../../react-bridge";

// React's SearchBar through the bridge, its value held in Vue (v-model), on
// the classes React's stories use for the map they stand in for.
export default {
  title: "Vue/SearchBar",
  component: KozmosSearchBar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["inline", "floating"],
    },
    placeholder: {
      control: "text",
    },
  },
};

export const FloatingOverlay = {
  render: (args: any) => ({
    components: { KozmosSearchBar, KozmosMapOverlay },
    setup() {
      return { args, query: ref("") };
    },
    template: `
      <div class="relative w-full min-w-0 md:min-w-[800px] h-[500px] bg-muted rounded-panel overflow-hidden border">
        <span class="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">Map rendering simulation</span>
        <KozmosMapOverlay position="top-center">
          <KozmosSearchBar v-bind="args" v-model="query" />
        </KozmosMapOverlay>
      </div>`,
  }),
  args: {
    variant: "floating",
    placeholder: "Search maps natively in Vue...",
  },
};

export const Inline = {
  render: (args: any) => ({
    components: { KozmosSearchBar },
    setup() {
      return { args, query: ref("") };
    },
    template: `
      <div class="w-[400px] max-w-full">
        <KozmosSearchBar v-bind="args" v-model="query" />
      </div>`,
  }),
  args: {
    variant: "inline",
    placeholder: "Search POIs...",
  },
};
