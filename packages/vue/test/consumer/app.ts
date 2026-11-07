/**
 * A consumer of `@kozmos-ds/vue`, compiled by consumer-types.spec.ts against
 * the built declarations, through package.json's `exports`, with
 * skipLibCheck off: as an app that checks its libraries' types does.
 */
import { defineComponent, h, type Component } from "vue";
import type * as React from "react";
import { Button } from "@kozmos-ds/react";
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

// A part's boolean props, named for a part of the consumer's own: only its
// own, each of its kind. `flags` are typed `boolean`; `unions` are boolean
// in a union with others; a slot (any ReactNode) is neither, and an index
// signature names no prop.
interface PickerProps {
  disabled?: boolean;
  multiple?: true;
  error?: boolean | string;
  label?: string;
  icon?: React.ReactNode;
  onPick?: (value: string) => void;
}
declare const Picker: (props: PickerProps) => null;

export const KozmosPicker = createVueWrapper(
  Picker,
  {},
  { booleans: { flags: ["disabled", "multiple"], unions: ["error"] } },
);
export const refused = [
  // @ts-expect-error -- error is boolean | string: a union, not a flag
  createVueWrapper(Picker, {}, { booleans: { flags: ["error"] } }),
  // @ts-expect-error -- disabled is a flag, not a union
  createVueWrapper(Picker, {}, { booleans: { unions: ["disabled"] } }),
  // @ts-expect-error -- label is a string
  createVueWrapper(Picker, {}, { booleans: { flags: ["label"] } }),
  // @ts-expect-error -- icon takes any ReactNode: a slot
  createVueWrapper(Picker, {}, { booleans: { unions: ["icon"] } }),
  // @ts-expect-error -- Picker has no prop of that name
  createVueWrapper(Picker, {}, { booleans: { flags: ["hidden"] } }),
];

interface LooseProps {
  [name: string]: unknown;
  loading?: boolean;
}
declare const Loose: (props: LooseProps) => null;
export const KozmosLoose = createVueWrapper(
  Loose,
  {},
  { booleans: { flags: ["loading"] } },
);
export const leaked = [
  // @ts-expect-error -- a string index signature names no prop
  createVueWrapper(Loose, {}, { booleans: { flags: ["anything"] } }),
];

// A forwardRef part of Kozmos's own, wrapped again by a consumer: its
// HTML attributes' booleans are its own too.
export const KozmosMyButton = createVueWrapper(
  Button,
  {},
  {
    booleans: {
      flags: ["disabled", "isLoading", "hidden"],
      unions: ["aria-pressed"],
    },
  },
);
export const notButtons = [
  // @ts-expect-error -- variant is a string
  createVueWrapper(Button, {}, { booleans: { flags: ["variant"] } }),
];
