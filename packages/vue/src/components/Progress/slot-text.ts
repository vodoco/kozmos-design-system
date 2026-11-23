import { Comment, isVNode, Text, type VNode } from "vue";

/**
 * A slot's text when it draws text alone, as React's node is a string; ""
 * for a slot that draws nothing but comments, undefined for anything else.
 */
export function slotText(nodes: VNode[] | undefined): string | undefined {
  if (!nodes) return undefined;
  let text = "";
  for (const node of nodes) {
    if (!isVNode(node)) return undefined;
    if (node.type === Comment) continue;
    if (node.type !== Text || typeof node.children !== "string")
      return undefined;
    text += node.children;
  }
  return text;
}
