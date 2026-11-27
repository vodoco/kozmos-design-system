import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, h, type PropType } from "vue";
import { Plus } from "@kozmos-ds/icons/vue";
import {
  KozmosButton,
  KozmosCombobox,
  KozmosDensityScope,
  KozmosIconButton,
  KozmosInput,
  KozmosMultiSelect,
  KozmosNumberInput,
  KozmosPasswordInput,
  KozmosSelect,
  KozmosSelectTrigger,
  KozmosSelectValue,
  KozmosStack,
  KozmosText,
  KozmosThemeProvider,
  useTheme,
} from "../../index";

/**
 * Vue's ThemeProvider: the stories React's has, with the same names, each
 * drawn as React's story draws it, from Kozmos parts only, inside the
 * KozmosThemeProvider the Storybook's decorator gives every story. Every
 * control the Density story shows is native.
 * test/parity/story-renders.parity.spec.ts holds each to React's.
 */
const meta: Meta<typeof KozmosThemeProvider> = {
  title: "Vue/Foundations/Theming/ThemeProvider",
  component: KozmosThemeProvider,
};

export default meta;
type Story = StoryObj<typeof KozmosThemeProvider>;

const Demo = defineComponent({
  name: "ThemeProviderDemo",
  setup() {
    const { setTheme } = useTheme();
    return () =>
      h("div", { class: "p-4 border rounded bg-background text-foreground" }, [
        h("p", { class: "mb-4" }, "Current Theme Demo"),
        h("div", { class: "flex gap-2" }, [
          h(KozmosButton, { onClick: () => setTheme("light") }, () => "Light"),
          h(KozmosButton, { onClick: () => setTheme("dark") }, () => "Dark"),
          h(
            KozmosButton,
            { onClick: () => setTheme("system") },
            () => "System",
          ),
        ]),
      ]);
  },
});

export const Default: Story = {
  render: () => ({
    setup: () => () => h(KozmosThemeProvider, null, () => h(Demo)),
  }),
};

const views = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
];

// A region at another density is a DensityScope, which keeps the theme and
// the design configuration around it. The columns wrap on a narrow screen.
const DensityColumn = defineComponent({
  name: "ThemeProviderDensityColumn",
  props: {
    density: {
      type: String as PropType<"touch" | "compact">,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(KozmosDensityScope, { density: props.density }, () =>
        h(
          KozmosStack,
          { gap: 3, style: { width: "300px", maxWidth: "100%" } },
          () => [
            h(KozmosText, { weight: "semibold" }, () =>
              props.density === "touch" ? "Touch (default)" : "Compact",
            ),
            h(
              KozmosStack,
              { direction: "row", gap: 2, align: "center", wrap: "wrap" },
              () => [
                h(KozmosButton, { size: "sm" }, () => "Small"),
                h(KozmosButton, null, () => "Default"),
                h(KozmosButton, { size: "lg" }, () => "Large"),
              ],
            ),
            h(
              KozmosStack,
              { direction: "row", gap: 2, align: "center" },
              () => [
                h(
                  KozmosIconButton,
                  { size: "sm", "aria-label": "Add, small" },
                  () => h(Plus),
                ),
                h(KozmosIconButton, { "aria-label": "Add" }, () => h(Plus)),
                h(
                  KozmosIconButton,
                  { size: "lg", "aria-label": "Add, large" },
                  () => h(Plus),
                ),
              ],
            ),
            h(KozmosInput, { "aria-label": "Name", placeholder: "Name" }),
            h(KozmosSelect, null, () =>
              h(KozmosSelectTrigger, { "aria-label": "Type" }, () =>
                h(KozmosSelectValue, null, { placeholder: () => "Type" }),
              ),
            ),
            h(KozmosCombobox, {
              label: "View",
              options: views,
              defaultValue: "overview",
              clearable: true,
            }),
            h(KozmosMultiSelect, { label: "Tools", options: views }),
            h(KozmosNumberInput, {
              label: "Capacity",
              defaultValue: 2,
              showSteppers: true,
            }),
            h(KozmosPasswordInput, { label: "Password" }),
          ],
        ),
      );
  },
});

/**
 * Decision 82: the same controls at both densities. Touch keeps today's
 * sizes, 44 for buttons, icon buttons and fields, as products and the SDK draw
 * them; compact is for pointer-first desktop tools such as Pointr Cloud.
 */
export const Density: Story = {
  render: () => ({
    setup: () => () =>
      h(
        KozmosStack,
        { direction: "row", gap: 8, align: "start", wrap: "wrap" },
        () => [
          h(DensityColumn, { density: "touch" }),
          h(DensityColumn, { density: "compact" }),
        ],
      ),
  }),
};
