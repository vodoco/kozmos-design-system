import { ref } from "vue";
import { KozmosBackdrop, KozmosButton, KozmosThemeProvider } from "../../";

export default {
  title: "Vue/Backdrop",
  component: KozmosBackdrop,
};

// GAP-189: a template ref on a Kozmos component lights its element. Kozmos's
// classes apply inside a theme provider only, as on the web.
export const Target = {
  render: () => ({
    components: { KozmosBackdrop, KozmosButton, KozmosThemeProvider },
    setup() {
      const update = ref(null);
      return { update };
    },
    template: `
      <KozmosThemeProvider>
        <div class="relative h-64 w-full">
          <div class="p-6">
            <KozmosButton ref="update">Update</KozmosButton>
          </div>
          <KozmosBackdrop class="absolute" :target="update" />
        </div>
      </KozmosThemeProvider>
    `,
  }),
};
