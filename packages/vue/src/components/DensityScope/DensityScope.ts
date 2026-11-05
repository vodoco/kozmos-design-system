import {
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  provide,
  Text,
  type PropType,
  type VNode,
} from "vue";
import { Slot } from "reka-ui";
import { DensityKey, type KozmosDensity } from "../../theme/injection";

/** The one element a slot gives, or null when it gives anything else. */
function onlyElement(nodes: VNode[] | undefined): VNode | null {
  const drawn = (nodes ?? []).filter(
    (node) =>
      isVNode(node) &&
      node.type !== Comment &&
      !(node.type === Text && String(node.children).trim() === ""),
  );
  if (drawn.length !== 1) return null;
  const [node] = drawn;
  return node.type === Fragment || node.type === Text ? null : node;
}

/**
 * One region at another density inside a provider (decision 82), such as a
 * compact editor's toolbar on a touch page: Vue's counterpart of React's
 * DensityScope. Its controls, the providers nested in it and the popovers it
 * opens take `density`; the theme and its tokens carry on unchanged.
 *
 * `as-child` marks the one child element instead of adding an element, through
 * Reka's Slot; anything but one element, a fragment included, gets an element
 * of its own, as without it.
 */
export const KozmosDensityScope = defineComponent({
  name: "KozmosDensityScope",
  props: {
    /** The control sizes inside the scope, its nested providers and its popovers. */
    density: { type: String as PropType<KozmosDensity>, required: true },
    asChild: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    provide(
      DensityKey,
      computed(() => props.density),
    );
    return () => {
      const children = slots.default?.();
      if (props.asChild && onlyElement(children))
        return h(
          Slot,
          { "data-kozmos-density": props.density },
          () => children,
        );
      return h(
        "div",
        {
          "data-kozmos-density": props.density,
          style: { display: "contents" },
        },
        children,
      );
    };
  },
});
