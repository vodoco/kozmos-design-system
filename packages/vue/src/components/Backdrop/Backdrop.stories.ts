import { ref } from "vue";
import { KozmosButton } from "../../";
import { KozmosBackdrop } from "../../react-bridge";

export default {
  title: "Vue/Backdrop",
  component: KozmosBackdrop,
};

// GAP-189: a template ref on a Kozmos component lights its element. Kozmos's
// classes apply inside a theme provider only, as on the web: the Storybook's
// decorator gives every story one.
export const Target = {
  render: () => ({
    components: { KozmosBackdrop, KozmosButton },
    setup() {
      const update = ref(null);
      return { update };
    },
    template: `
      <div class="relative h-64 w-full">
        <div class="p-6">
          <KozmosButton ref="update">Update</KozmosButton>
        </div>
        <KozmosBackdrop placement="inline" :target="update" />
      </div>
    `,
  }),
};
