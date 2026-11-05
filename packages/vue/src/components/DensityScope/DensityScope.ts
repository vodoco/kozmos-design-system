import {
  cloneVNode,
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  provide,
  Text,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
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
 * `as-child` marks the one child element instead of adding an element, as
 * React's `cloneElement` does: the scope's density wins over one the child
 * already carries. Anything but one element, a fragment included, gets an
 * element of its own, as without it. It takes no other attribute: an outer
 * as-child scope's mark is not this scope's, so it never reaches the element
 * this one draws.
 */
export const KozmosDensityScope = defineComponent({
  name: "KozmosDensityScope",
  inheritAttrs: false,
  props: {
    /** The control sizes inside the scope, its nested providers and its popovers. */
    density: { type: String as PropType<KozmosDensity>, required: true },
    asChild: { type: Boolean, default: false },
  },
  /** What it scopes, as React's required `children`. */
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { slots }) {
    provide(
      DensityKey,
      computed(() => props.density),
    );
    return () => {
      const children = slots.default?.();
      const child = props.asChild ? onlyElement(children) : null;
      if (child)
        return cloneVNode(child, { "data-kozmos-density": props.density });
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
