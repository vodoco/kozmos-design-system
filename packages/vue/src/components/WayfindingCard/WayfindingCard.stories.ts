import {
  KozmosWayfindingCard,
  KozmosWayfindingInputRow,
  KozmosMapOverlay,
} from "../../react-bridge";
import { ref } from "vue";

export default {
  title: "Vue/WayfindingCard",
  component: KozmosWayfindingCard,
  tags: ["autodocs"],
};

export const WayfindingFlow = {
  render: (args: any) => ({
    components: { KozmosWayfindingCard, KozmosWayfindingInputRow },
    setup() {
      const originValue = ref("Entrance A");
      const destinationValue = ref("Apple Store");

      const handleSwap = () => {
        const temp = originValue.value;
        originValue.value = destinationValue.value;
        destinationValue.value = temp;
      };

      return { args, originValue, destinationValue, handleSwap };
    },
    template: `
            <KozmosWayfindingCard v-bind="args">
                <KozmosWayfindingInputRow 
                    v-model:originValue="originValue"
                    v-model:destinationValue="destinationValue"
                    @swap="handleSwap"
                />
            </KozmosWayfindingCard>
        `,
  }),
  args: {
    title: "Building Navigation",
  },
};

export const InsideMapOverlay = {
  render: (args: any) => ({
    components: {
      KozmosWayfindingCard,
      KozmosWayfindingInputRow,
      KozmosMapOverlay,
    },
    setup() {
      const originValue = ref("My Location");
      const destinationValue = ref("Terminal C");

      const handleSwap = () => {
        const temp = originValue.value;
        originValue.value = destinationValue.value;
        destinationValue.value = temp;
      };

      return { args, originValue, destinationValue, handleSwap };
    },
    template: `
            <div class="relative w-full min-w-[320px] md:min-w-[800px] h-[500px] bg-slate-100 rounded-xl overflow-hidden border">
                <span class="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">Simulated Wayfinding Environment</span>
                <KozmosMapOverlay position="top-left">
                    <KozmosWayfindingCard v-bind="args" class="w-full">
                        <KozmosWayfindingInputRow 
                            v-model:originValue="originValue"
                            v-model:destinationValue="destinationValue"
                            @swap="handleSwap"
                        />
                    </KozmosWayfindingCard>
                </KozmosMapOverlay>
            </div>
        `,
  }),
  args: {
    title: "Building Navigation",
  },
};
