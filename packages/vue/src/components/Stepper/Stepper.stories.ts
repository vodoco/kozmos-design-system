import { KozmosStepper, KozmosThemeProvider } from "../../";

export default {
  title: "Vue/Stepper",
  component: KozmosStepper,
};

// GAP-191: a tour's dots, named "Step 2 of 5" in the product's words.
export const Dots = {
  render: () => ({
    components: { KozmosStepper, KozmosThemeProvider },
    setup() {
      const steps = [
        "Choose a floor",
        "Draw a room",
        "Name it",
        "Check the route",
        "Publish",
      ];
      const position = (step: number, count: number) =>
        `Step ${step} of ${count}`;
      return { steps, position };
    },
    template: `
      <KozmosThemeProvider>
        <div class="p-6">
          <KozmosStepper
            variant="dots"
            :steps="steps"
            :currentStep="1"
            :positionLabel="position"
          />
        </div>
      </KozmosThemeProvider>
    `,
  }),
};
