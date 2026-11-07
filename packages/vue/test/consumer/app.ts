/**
 * A consumer of `@kozmos-ds/vue`, compiled by consumer-types.spec.ts against
 * the built declarations, through package.json's `exports`, with
 * skipLibCheck off: as an app that checks its libraries' types does.
 */
import { defineComponent, h, type Component } from "vue";
import * as Kozmos from "@kozmos-ds/vue";
import * as Bridge from "@kozmos-ds/vue/react-bridge";
import {
  KozmosAnchoredPopover,
  createVueWrapper,
  type ModelBinding,
  type ModelBindings,
  type WrapperOptions,
} from "@kozmos-ds/vue/react-bridge";

/** The names of a module's components: its `Kozmos…` exports. */
type Parts<M> = keyof M & `Kozmos${string}`;
/** The names of those that are not a component Vue takes. */
type NotComponents<M> = {
  [K in Parts<M>]: M[K] extends Component ? never : K;
}[Parts<M>];

export const everyPartIsAComponent: [
  NotComponents<typeof Kozmos>,
  NotComponents<typeof Bridge>,
] extends [never, never]
  ? true
  : false = true;

export const App = defineComponent({
  components: { KozmosAnchoredPopover, KozmosButton: Kozmos.KozmosButton },
  setup: () => () => [
    h(Kozmos.KozmosThemeProvider, null, () => h(Kozmos.KozmosButton)),
    h(KozmosAnchoredPopover),
    h(Bridge.KozmosTourStep),
  ],
});

/** A React part of the consumer's own, as its types describe it. */
interface FieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
}
declare const Field: (props: FieldProps) => null;

const model: ModelBinding<FieldProps> = {
  prop: "value",
  callback: "onValueChange",
  empty: "",
};
const options: WrapperOptions = { notTaken: ["onClick"] };

export const KozmosField = createVueWrapper(
  Field,
  { modelValue: model },
  options,
);
export const loose: ModelBindings = {
  modelValue: { prop: "value", callback: "onChange", empty: "" },
};
