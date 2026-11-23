import { Comment, isVNode, type VNode } from "vue";

/**
 * A slot's nodes, or undefined when it draws nothing but comments: where
 * React tests a node prop for truth (`actions ? … : children`), a Vue part
 * tests the slot for something drawn, as `v-if` leaves a comment behind.
 */
export function drawn(nodes: VNode[] | undefined): VNode[] | undefined {
  return nodes?.some((node) => !isVNode(node) || node.type !== Comment)
    ? nodes
    : undefined;
}
