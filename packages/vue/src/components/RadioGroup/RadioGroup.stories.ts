import { ref } from "vue";
import { KozmosRadioGroup, KozmosRadioGroupItem } from "../../react-bridge";

export default {
  title: "Vue/RadioGroup",
  component: KozmosRadioGroup,
};

// GAP-230: a part made of parts through the bridge. Each KozmosRadioGroupItem
// is drawn in its KozmosRadioGroup's React tree, so it is the group's option,
// and v-model is the option chosen. Before, each item was a React root of its
// own and threw: it could not find its group.
export const Group = {
  render: () => ({
    components: { KozmosRadioGroup, KozmosRadioGroupItem },
    setup: () => ({ level: ref("1") }),
    template: `
      <div class="p-6">
        <KozmosRadioGroup v-model="level" label="Level">
          <KozmosRadioGroupItem value="1" label="Level 1" />
          <KozmosRadioGroupItem value="2" label="Level 2" />
          <KozmosRadioGroupItem value="3" label="Level 3" />
        </KozmosRadioGroup>
        <output>Level {{ level }}</output>
      </div>
    `,
  }),
};
