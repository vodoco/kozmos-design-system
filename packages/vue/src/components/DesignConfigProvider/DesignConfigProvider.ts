import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  useId,
  watch,
  type InjectionKey,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  DEFAULT_CONFIG,
  SPOTLIGHT_SURFACES,
  designConfigDrawsFilters,
  designConfigFollowsPointer,
  designConfigMotion,
  designConfigTokenConfig,
  designConfigTokens,
  mergeRuntimeTokens,
  normalizeDesignConfig,
  normalizeRuntimeTokens,
  spotlightPosition,
} from "#kozmos-recipes";
import { KozmosThemeProvider } from "../ThemeProvider/ThemeProvider";
import {
  MotionKey,
  ThemeKey,
  type KozmosDensity,
  type KozmosResolvedTheme,
  type KozmosTheme,
  type KozmosThemeTokens,
} from "../../theme/injection";
import type {
  KozmosDesignConfig,
  KozmosDesignConfigInput,
  KozmosDesignConfigState,
  KozmosGlassConfig,
} from "./types";

const DesignConfigKey: InjectionKey<KozmosDesignConfigState> =
  Symbol("KozmosDesignConfig");

/** The nearest KozmosDesignConfigProvider's config, as React's `useDesignConfig`. */
export function useDesignConfig(): KozmosDesignConfigState {
  const state = inject(DesignConfigKey, undefined);
  if (!state)
    throw new Error(
      "useDesignConfig must be used within a KozmosDesignConfigProvider",
    );
  return state;
}

function isTheme(value: unknown): value is KozmosTheme {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * The scope inside the provider's ThemeProvider: React's
 * `data-kozmos-design-scope` box, marked with the config's reduced motion,
 * drawing what the provider holds and the glass SVG filters.
 */
const DesignScope = defineComponent({
  name: "KozmosDesignScope",
  props: {
    id: { type: String, required: true },
    motion: {
      type: String as PropType<"reduced" | undefined>,
      default: undefined,
    },
    config: { type: Object as PropType<KozmosDesignConfig>, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          "data-kozmos-design-scope": props.id,
          "data-kozmos-motion": props.motion,
          style: { display: "contents" },
        },
        [
          slots.default?.(),
          designConfigDrawsFilters(props.config)
            ? h(
                "svg",
                {
                  "aria-hidden": "true",
                  style: {
                    position: "absolute",
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                    visibility: "hidden",
                  },
                },
                [
                  h("defs", [
                    h(
                      "filter",
                      {
                        id: `${props.id}-surface`,
                        x: "0%",
                        y: "0%",
                        width: "100%",
                        height: "100%",
                      },
                      [
                        h("feTurbulence", {
                          type: "fractalNoise",
                          baseFrequency: "0.5",
                          numOctaves: "2",
                          result: "noise",
                        }),
                        h("feColorMatrix", {
                          type: "saturate",
                          values: "0",
                          in: "noise",
                          result: "monoNoise",
                        }),
                        h(
                          "feComponentTransfer",
                          { in: "monoNoise", result: "smoothNoise" },
                          [h("feFuncA", { type: "linear", slope: "0.1" })],
                        ),
                      ],
                    ),
                  ]),
                ],
              )
            : null,
        ],
      );
  },
});

/**
 * Vue's counterpart of React's DesignConfigProvider: a configuration layer
 * over the same theme and portal boundary. It draws a KozmosThemeProvider
 * given the config's custom properties (the glass surface, dispersion,
 * noise and spotlight, the shadow ramp and the motion scale, from the shared
 * recipe), and inside it a `display: contents` scope that follows the
 * pointer for the glass spotlight (`--spotlight-x`, `--spotlight-y`), marks
 * reduced motion (`data-kozmos-motion`) and draws the glass SVG filters. It
 * provides reduced motion (`MotionKey`, React's MotionContext) to every
 * ThemeProvider inside it, and `useDesignConfig()` to its parts.
 *
 * `v-model:config` controls the config (unspecified fields use defaults, not
 * the previous value); without it the provider keeps its own, from
 * `initialConfig`, persisted under `persistKey` when given. `update:config`
 * reports every change, controlled or not, as React's `onConfigChange`.
 * Given no `theme`, `defaultTheme` or `storageKey`, it follows the enclosing
 * ThemeProvider's preference and sets it.
 */
export const KozmosDesignConfigProvider = defineComponent({
  name: "KozmosDesignConfigProvider",
  inheritAttrs: false,
  props: {
    initialConfig: {
      type: Object as PropType<KozmosDesignConfigInput>,
      default: undefined,
    },
    /** Controlled configuration. Unspecified fields use defaults, not previous props. */
    config: {
      type: Object as PropType<KozmosDesignConfigInput>,
      default: undefined,
    },
    /** Explicit, module-owned persistence key; controlled config ignores it. */
    persistKey: {
      type: String as PropType<string | null>,
      default: undefined,
    },
    tokens: {
      type: Object as PropType<Record<string, string>>,
      default: undefined,
    },
    dir: { type: String as PropType<"ltr" | "rtl">, default: undefined },
    density: { type: String as PropType<KozmosDensity>, default: undefined },
    defaultTheme: { type: String as PropType<KozmosTheme>, default: undefined },
    /** Controlled preference. In this mode the caller owns persistence. */
    theme: { type: String as PropType<KozmosTheme>, default: undefined },
    /** Persistence is opt-in. Use a key owned by your product/module. */
    storageKey: { type: String, default: undefined },
    /** Deterministic system fallback for SSR and the first hydration render. */
    defaultSystemTheme: {
      type: String as PropType<KozmosResolvedTheme>,
      default: undefined,
    },
  },
  emits: {
    "update:config": (config: KozmosDesignConfig) =>
      typeof config === "object" && config !== null,
    "update:theme": (theme: KozmosTheme) => isTheme(theme),
  },
  /** What it configures, as React's required `children`. */
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const parentTheme = inject(ThemeKey, undefined);
    const inheritedMotion = inject(MotionKey, undefined);
    const id = `kozmos-design-${useId()}`;
    const seed = normalizeDesignConfig(props.initialConfig);
    const state = shallowRef<KozmosDesignConfig>(seed);
    const controlled = computed(() => props.config !== undefined);
    const config = computed<KozmosDesignConfig>(() =>
      props.config !== undefined
        ? normalizeDesignConfig(props.config)
        : state.value,
    );
    const loadedKey = ref<string | null | undefined>(undefined);
    const runtimeTokens = shallowRef<Record<string, string>>({});
    const mounted = ref(false);
    const view = () => (typeof window === "undefined" ? undefined : window);

    // As React's effect on [controlled, persistKey]: the stored config is
    // read once mounted, never while rendering on the server.
    const restore = () => {
      if (controlled.value || !props.persistKey) return;
      let restored = seed;
      try {
        const saved = view()?.localStorage.getItem(props.persistKey);
        if (saved) restored = normalizeDesignConfig(JSON.parse(saved), seed);
      } catch {
        // Corrupt JSON and denied storage both fall back to the initial configuration.
      }
      state.value = restored;
      loadedKey.value = props.persistKey;
    };
    const persist = () => {
      if (
        !mounted.value ||
        controlled.value ||
        !props.persistKey ||
        loadedKey.value !== props.persistKey
      )
        return;
      try {
        view()?.localStorage.setItem(
          props.persistKey,
          JSON.stringify(state.value),
        );
      } catch {
        // Persistence is optional; it must not disable runtime configuration.
      }
    };
    onMounted(() => {
      mounted.value = true;
      restore();
      persist();
    });
    watch([controlled, () => props.persistKey], () => {
      if (mounted.value) restore();
    });
    watch([state, loadedKey, controlled, () => props.persistKey], persist);

    const commit = (next: KozmosDesignConfig) => {
      if (!controlled.value) state.value = next;
      // Consumers cannot mutate the internal state through the event.
      emit("update:config", normalizeDesignConfig(next));
    };
    const updateConfig: KozmosDesignConfigState["updateConfig"] = (patch) => {
      const base = controlled.value ? config.value : state.value;
      commit(
        normalizeDesignConfig(
          typeof patch === "function"
            ? patch(normalizeDesignConfig(base))
            : patch,
          base,
        ),
      );
    };
    const updateGlassConfig = (glass: Partial<KozmosGlassConfig>) =>
      updateConfig({ glass });
    const resetConfig = () => commit(normalizeDesignConfig(DEFAULT_CONFIG));
    const injectRuntimeTokens = (patch: Record<string, string>) => {
      runtimeTokens.value = mergeRuntimeTokens(runtimeTokens.value, patch);
    };

    // Reduced motion: this config's, or an enclosing provider's. It carries
    // downward, so a provider inside a reduced one cannot turn motion back
    // on, and its tokens follow it, while useDesignConfig() still reads its
    // own config (React's MotionContext, GAP-50).
    const motion = computed(() =>
      designConfigMotion(config.value, inheritedMotion?.value),
    );
    const values = computed(
      () =>
        ({
          ...designConfigTokens(
            designConfigTokenConfig(config.value, motion.value),
            id,
          ),
          ...runtimeTokens.value,
          ...normalizeRuntimeTokens(props.tokens),
          "--kozmos-design-id": id,
        }) as KozmosThemeTokens,
    );

    // The glass spotlight follows the pointer over this provider's surfaces:
    // those its custom properties reach, in its scope and in the portals of
    // the ThemeProviders inside it. React's pointer events bubble through
    // portals to its scope; the DOM's do not, so the document is listened
    // to, and a surface is this provider's by its `--kozmos-design-id`.
    const spotlightSurface = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const surface = target?.closest?.<HTMLElement>(SPOTLIGHT_SURFACES);
      if (!surface) return;
      const view = surface.ownerDocument.defaultView;
      // Only this provider's surfaces: a nested provider's, or a target the
      // caller drew under another provider, keeps its own spotlight.
      if (
        view
          ?.getComputedStyle(surface)
          .getPropertyValue("--kozmos-design-id")
          .trim() !== id
      )
        return;
      return surface;
    };
    const onPointermove = (event: PointerEvent) => {
      if (!designConfigFollowsPointer(config.value, motion.value)) return;
      const surface = spotlightSurface(event);
      if (!surface) return;
      const position = spotlightPosition(surface, event.clientX, event.clientY);
      if (!position) return;
      surface.style.setProperty("--spotlight-x", position.x);
      surface.style.setProperty("--spotlight-y", position.y);
    };
    const onPointerout = (event: PointerEvent) => {
      const surface = spotlightSurface(event);
      if (
        !surface ||
        (event.relatedTarget instanceof Node &&
          surface.contains(event.relatedTarget))
      )
        return;
      surface.style.removeProperty("--spotlight-x");
      surface.style.removeProperty("--spotlight-y");
    };
    let listened: Document | undefined;
    onMounted(() => {
      listened = window.document;
      listened.addEventListener("pointermove", onPointermove, {
        passive: true,
      });
      listened.addEventListener("pointerout", onPointerout, { passive: true });
    });
    onBeforeUnmount(() => {
      listened?.removeEventListener("pointermove", onPointermove);
      listened?.removeEventListener("pointerout", onPointerout);
    });

    provide(DesignConfigKey, {
      config,
      updateConfig,
      updateGlassConfig,
      resetConfig,
      injectRuntimeTokens,
    });
    provide(MotionKey, motion);

    return () => {
      const inheritPreference =
        props.theme === undefined &&
        props.defaultTheme === undefined &&
        props.storageKey === undefined;
      return h(
        KozmosThemeProvider,
        {
          theme: inheritPreference ? parentTheme?.theme.value : props.theme,
          defaultTheme: props.defaultTheme,
          defaultSystemTheme:
            props.defaultSystemTheme ?? parentTheme?.resolvedTheme.value,
          "onUpdate:theme": (next: KozmosTheme) => {
            if (inheritPreference && parentTheme) parentTheme.setTheme(next);
            emit("update:theme", next);
          },
          dir: props.dir,
          density: props.density,
          storageKey: props.storageKey,
          tokens: values.value,
        },
        {
          default: () =>
            h(
              DesignScope,
              { id, motion: motion.value, config: config.value },
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
