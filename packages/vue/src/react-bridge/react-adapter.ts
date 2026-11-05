import {
  h,
  defineComponent,
  onMounted,
  onBeforeUnmount,
  ref,
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
 * Creates a native Vue 3 wrapper component for a Kozmos React component.
 * This directly mounts the React VDOM inside a Vue node, completely bypassing Web Component serialization constraints.
 *
 * @param ReactComponent The Kozmos React component to wrap
 * @param emits Optional array of Vue event names to map (e.g., ['update:modelValue'])
 */
export function createVueWrapper<P extends object>(
  ReactComponent: React.ElementType<P>,
  emits: string[] = [],
) {
  return defineComponent({
    name:
      (ReactComponent as any).displayName ||
      (ReactComponent as any).name ||
      "KozmosReactWrapper",
    props: {
      // Vue 3 accepts any fallthrough attributes via `attrs`, making strict prop mapping unnecessary for basic wrapper engines
    },
    emits,
    setup(props, { attrs, emit, slots }) {
      const containerRef = ref<HTMLElement | null>(null);
      const slotRefs: Record<string, { value: HTMLElement | null }> = {};
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

        // Bridge Vue 'v-model' (modelValue) natively to React 'value' & 'onChange'
        if (reactProps.modelValue !== undefined) {
          reactProps.value = reactProps.modelValue;
          delete reactProps.modelValue;
        }

        if (reactProps["onUpdate:modelValue"]) {
          const originalHandler = reactProps["onUpdate:modelValue"];

          // Re-route Standard HTML Inputs
          reactProps.onChange = (e: any) => {
            if (e && e.target !== undefined && e.target.value !== undefined) {
              originalHandler(e.target.value);
            } else {
              originalHandler(e);
            }
          };

          // Fallback for Radix UI Select Menus & Radios natively bound to standard v-model
          reactProps.onValueChange = (val: string | number) => {
            originalHandler(val);
          };

          delete reactProps["onUpdate:modelValue"];
        }

        // Bridge Radix UI 'v-model:checked' strictly to 'checked' & 'onCheckedChange'
        if (reactProps["onUpdate:checked"]) {
          const originalHandler = reactProps["onUpdate:checked"];
          reactProps.onCheckedChange = (val: boolean) => {
            originalHandler(val);
          };
          delete reactProps["onUpdate:checked"];
        }

        // Bridge Radix UI 'v-model:open' strictly to 'open' & 'onOpenChange' (Dialog, Drawer)
        if (reactProps["onUpdate:open"]) {
          const originalHandler = reactProps["onUpdate:open"];
          reactProps.onOpenChange = (val: boolean) => {
            originalHandler(val);
          };
          delete reactProps["onUpdate:open"];
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

      onMounted(() => {
        renderReact();
      });

      // Synchronize Vue reactivity into the React Engine silently
      watch(
        () => ({ ...props, ...attrs }),
        () => {
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
