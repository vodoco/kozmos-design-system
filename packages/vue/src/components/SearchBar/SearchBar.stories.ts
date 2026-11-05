import { KozmosSearchBar, KozmosMapOverlay } from "../../react-bridge";

export default {
  title: "Vue/SearchBar",
  component: KozmosSearchBar,
  tags: ["autodocs"],
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
      return { args };
    },
    template: `
            <div class="relative w-full min-w-[320px] md:min-w-[800px] h-[500px] bg-slate-100 rounded-xl overflow-hidden border">
                <span class="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">Map rendering simulation</span>
                <KozmosMapOverlay position="top-center">
                    <KozmosSearchBar v-bind="args" />
                </KozmosMapOverlay>
            </div>
        `,
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
      return { args };
    },
    template: '<KozmosSearchBar v-bind="args" />',
  }),
  args: {
    variant: "inline",
    placeholder: "Search POIs...",
  },
};
