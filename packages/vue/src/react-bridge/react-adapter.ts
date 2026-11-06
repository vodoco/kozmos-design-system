import {
  h,
  camelize,
  defineComponent,
  getCurrentInstance,
  nextTick,
  normalizeStyle,
  onMounted,
  onBeforeUnmount,
  ref,
  toHandlerKey,
  watch,
} from "vue";
import { createRoot, type Root } from "react-dom/client";
import React, { useLayoutEffect, useRef } from "react";

// Internal React Bridge Component physically transplanting Vue DOM nodes dynamically into the React VDOM
const VueSlotBridge = ({ slotWrapper }: { slotWrapper: HTMLElement }) => {
  const bridgeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (bridgeRef.current && slotWrapper) {
      bridgeRef.current.appendChild(slotWrapper);
    }
  }, [slotWrapper]);
  return React.createElement("div", {
    ref: bridgeRef,
    style: { display: "contents" },
  });
};

/**
 * How one `v-model` of a wrapper reaches its React part. The wrapper declares
 * `update:<model>`, hands React the model's value as `prop`, and, only while
 * the parent listens, a `callback` that emits what `read` takes from the
 * callback's arguments.
 */
export interface ModelBinding<P = Record<string, unknown>> {
  /** The React prop that carries the value: `value`, `checked`, `selectedFloor`. */
  prop: keyof P & string;
  /** The React callback that reports a change: `onValueChange`, `onCheckedChange`, `onChange`. */
  callback: keyof P & string;
  /** The new value, read from the callback's arguments. Unset, the first argument. */
  read?: (...args: any[]) => unknown;
  /**
   * What React is given while the parent listens and the model is null or
   * undefined, so a controlled field stays controlled: `""` for a text
   * field. Unset, React is given nothing, and the part keeps its own value
   * until the model has one.
   */
  empty?: unknown;
}

/**
 * A wrapper's models, by Vue's name for each: `modelValue` is `v-model`,
 * `originValue` is `v-model:originValue`.
 */
export type ModelBindings<P = Record<string, unknown>> = Record<
  string,
  ModelBinding<P>
>;

/** A DOM change event's value: what an `<input>`'s `onChange` reports. */
export const eventValue = (event: { target: { value: string } }) =>
  event.target.value;

/**
 * `v-model:open` and `v-model:checked` on any wrapper, as Radix's controlled
 * pairs, by the callback that reports each. No wrapper declares them, so
 * their listeners arrive in `attrs`, and the value passes through under its
 * own name.
 */
const RADIX_MODELS: Record<string, string> = {
  open: "onOpenChange",
  checked: "onCheckedChange",
};

/**
 * A handler that calls `own` (the component's or the user's, if any) and then
 * `model`, with the same arguments: neither replaces the other.
 */
function both(
  own: unknown,
  model: (...args: unknown[]) => void,
): (...args: unknown[]) => void {
  if (typeof own !== "function") return model;
  return (...args) => {
    own(...args);
    model(...args);
  };
}

/**
 * Whether the parent listens for `event`, an `update:` event. A declared
 * event's listener stays on the component's vnode, never in `attrs`; it is
 * looked for under each name Vue's `emit` calls one by: as written,
 * camelCase, and kebab-case (`onUpdate:model-value`).
 */
function listensFor(
  vnodeProps: Record<string, unknown> | null,
  event: string,
): boolean {
  if (!vnodeProps) return false;
  const kebab = event.replace(/\B([A-Z])/g, "-$1").toLowerCase();
  return [event, camelize(event), kebab].some(
    (name) => vnodeProps[toHandlerKey(name)] != null,
  );
}

/**
 * Vue's `style`, a string, an object or an array of both, as React takes it:
 * one object, its names camelCase but for custom properties (`--gap`).
 */
function toReactStyle(style: unknown): Record<string, unknown> {
  const merged = normalizeStyle([style]) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(merged ?? {}).map(([name, value]) => [
      name.startsWith("--") ? name : camelize(name),
      value,
    ]),
  );
}

/**
 * Creates a native Vue 3 wrapper component for a Kozmos React component.
 * This directly mounts the React VDOM inside a Vue node, completely bypassing Web Component serialization constraints.
 *
 * @param ReactComponent The Kozmos React component to wrap
 * @param models Each `v-model` the wrapper takes, and how it reaches React
 *   (`{ modelValue: { prop: "value", callback: "onValueChange" } }`)
 */
export function createVueWrapper<P extends object>(
  ReactComponent: React.ElementType<P>,
  models: ModelBindings<NoInfer<P>> = {},
) {
  return defineComponent({
    name:
      (ReactComponent as any).displayName ||
      (ReactComponent as any).name ||
      "KozmosReactWrapper",
    props: {
      // Vue 3 accepts any fallthrough attributes via `attrs`, making strict prop mapping unnecessary for basic wrapper engines
    },
    // The attrs are React's alone. Vue would also write each onto the
    // wrapper's own box: an id twice in the page, an aria-label on a box
    // that draws nothing, and a listener (`@click`) on that box as well as on
    // React's element, so it ran twice for one click.
    inheritAttrs: false,
    emits: Object.keys(models).map((name) => `update:${name}`),
    setup(props, { attrs, emit, slots }) {
      const instance = getCurrentInstance()!;
      const containerRef = ref<HTMLElement | null>(null);
      const slotRefs: Record<string, { value: HTMLElement | null }> = {};
      // The value a change has just emitted, by model, until Vue renders.
      const emitted: Record<string, unknown> = {};
      let root: Root | null = null;

      const renderReact = () => {
        if (!containerRef.value) return;

        // Initialize the React root once
        if (!root) {
          root = createRoot(containerRef.value);
        }

        // Coalesce Vue props & generic HTML attributes
        const reactProps = { ...attrs, ...props } as any;

        // Force Vue's native HTML 'class' payload into React's JSX 'className' expectation
        if (reactProps.class !== undefined) {
          reactProps.className = reactProps.className
            ? `${reactProps.className} ${reactProps.class}`
            : reactProps.class;
          delete reactProps.class;
        }
        if (reactProps.style != null)
          reactProps.style = toReactStyle(reactProps.style);

        // Each model: its value as React's `prop`, and, while the parent
        // listens, React's `callback` emitting the new value, beside any
        // handler of that name the user gave. Without a listener React is
        // given no callback, and a part with state of its own keeps it.
        for (const [name, binding] of Object.entries(models)) {
          const event = `update:${name}`;
          const listening = listensFor(instance.vnode.props, event);
          const value = name in emitted ? emitted[name] : reactProps[name];
          delete reactProps[name];
          if (value != null) reactProps[binding.prop] = value;
          else if (listening && "empty" in binding)
            reactProps[binding.prop] = binding.empty;
          if (!listening) continue;
          const read = binding.read ?? ((first: unknown) => first);
          reactProps[binding.callback] = both(
            reactProps[binding.callback],
            (...args) => {
              const next = read(...args);
              emitted[name] = next;
              emit(event, next);
              // Drawn now, inside React's event: when it ends, React puts a
              // controlled field back to the value it was last given, and
              // Vue's render comes a tick later, so the field showed its old
              // value for a moment and lost its caret. After Vue's render,
              // React is given what Vue holds, whether the parent took the
              // value or not.
              renderReact();
              void nextTick(settle);
            },
          );
        }

        // `v-model:open` and `v-model:checked`, undeclared: their listeners
        // are in attrs, and are called beside any handler the user gave.
        for (const [name, callback] of Object.entries(RADIX_MODELS)) {
          const key = `onUpdate:${name}`;
          const listener = reactProps[key];
          if (name in models || !listener) continue;
          delete reactProps[key];
          reactProps[callback] = both(reactProps[callback], (value) => {
            for (const call of [listener].flat()) call(value);
          });
        }

        // Bridge ALL named Vue slots explicitly into their respective React Node props (e.g. #actions -> reactProps.actions)
        for (const slotName of Object.keys(slots)) {
          if (slotRefs[slotName]?.value) {
            const reactPropName =
              slotName === "default" ? "children" : slotName;
            reactProps[reactPropName] = React.createElement(VueSlotBridge, {
              slotWrapper: slotRefs[slotName].value as HTMLElement,
            });
          }
        }

        // Mount the React tree
        root.render(React.createElement(ReactComponent, reactProps));
      };

      /** Hands React the models Vue holds, in place of what was emitted. */
      const settle = () => {
        const names = Object.keys(emitted);
        if (!names.length) return;
        for (const name of names) delete emitted[name];
        renderReact();
      };

      onMounted(() => {
        renderReact();
      });

      // Synchronize Vue reactivity into the React Engine silently
      watch(
        () => ({ ...props, ...attrs }),
        () => {
          // Vue's render has the parent's models now.
          for (const name of Object.keys(emitted)) delete emitted[name];
          renderReact();
        },
        { deep: true },
      );

      // Cleanly unmount the React Virtual DOM when the Vue Component is destroyed
      onBeforeUnmount(() => {
        if (root) {
          root.unmount();
        }
      });

      // Render a style-neutral transport container ensuring flex/grid cascades natively.
      // Construct unique Virtual DOM containers for every configured slot dynamically natively bridging arrays.
      return () => {
        const slotVNodes = Object.entries(slots).map(([name, slotFn]) => {
          if (!slotRefs[name]) slotRefs[name] = { value: null };
          return h(
            "div",
            {
              ref: (el: any) => {
                if (el) slotRefs[name].value = el as HTMLElement;
              },
              style: { display: "contents" },
              key: name,
            },
            slotFn ? slotFn() : [],
          );
        });

        return h("div", { style: { display: "contents" } }, [
          h("div", { ref: containerRef, style: { display: "contents" } }),
          ...slotVNodes,
        ]);
      };
    },
  });
}
