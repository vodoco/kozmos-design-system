import {
  defineComponent,
  h,
  normalizeClass,
  type PropType,
  type SlotsType,
} from "vue";
import {
  cn,
  PERSONA_MARK_CLASSES,
  PERSONA_MARK_DIAMOND,
  PERSONA_MARK_VIEWBOX,
  personaMarkGroupLabel,
  personaMarkVariables,
} from "#kozmos-recipes";
import { styleAttribute } from "../style";
import type { KozmosPersonaMarkPersona } from "./types";

/**
 * Vue's counterpart of React's PersonaMark (GAP-106, decision 132): a small
 * diamond in the persona's colour, drawn as the `<span>` React's draws from
 * the same recipe. `color` is the persona's own, any CSS colour, drawn as
 * given in both themes; in forced colours it is drawn in CanvasText. With a
 * `name` the mark stands alone, an image named by it; without one it sits
 * beside the name and is hidden from assistive technology, so the name is
 * not read twice.
 */
export const KozmosPersonaMark = defineComponent({
  name: "KozmosPersonaMark",
  inheritAttrs: false,
  props: {
    color: { type: String, required: true },
    name: { type: String, default: undefined },
  },
  // React's part takes no node.
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs }) {
    return () => {
      const { class: className, style, ...rest } = attrs;
      return h(
        "span",
        {
          class: cn(PERSONA_MARK_CLASSES.mark, normalizeClass(className)),
          ...styleAttribute(personaMarkVariables(props.color), style),
          ...(props.name
            ? { role: "img", "aria-label": props.name }
            : { "aria-hidden": "true" }),
          ...rest,
        },
        [
          h(
            "svg",
            {
              "aria-hidden": "true",
              class: PERSONA_MARK_CLASSES.shape,
              focusable: "false",
              viewBox: PERSONA_MARK_VIEWBOX,
            },
            [h("path", { d: PERSONA_MARK_DIAMOND })],
          ),
        ],
      );
    };
  },
});

/**
 * The personas something is visible to, as a row of marks 2 apart: a tree
 * row's "Assigned personas". One image to assistive technology, named by
 * `label` and every persona's name, "Assigned personas: Customer, Visitor".
 * With no persona it draws nothing.
 */
export const KozmosPersonaMarkGroup = defineComponent({
  name: "KozmosPersonaMarkGroup",
  inheritAttrs: false,
  props: {
    personas: {
      type: Array as PropType<readonly KozmosPersonaMarkPersona[]>,
      required: true,
    },
    label: { type: String, default: "Assigned personas" },
  },
  // React's part takes no node.
  slots: Object as SlotsType<Record<never, never>>,
  setup(props, { attrs }) {
    return () => {
      if (props.personas.length === 0) return null;
      const { class: className, ...rest } = attrs;
      return h(
        "span",
        {
          "aria-label": personaMarkGroupLabel(props.label, props.personas),
          class: cn(PERSONA_MARK_CLASSES.group, normalizeClass(className)),
          role: "img",
          ...rest,
        },
        props.personas.map((persona, index) =>
          h(KozmosPersonaMark, {
            key: `${index}-${persona.name}`,
            color: persona.color,
          }),
        ),
      );
    };
  },
});
