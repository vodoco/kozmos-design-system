import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  Teleport,
  watch,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import { ConfigProvider, injectConfigProviderContext } from "reka-ui";
import {
  DensityKey,
  MotionKey,
  ThemeKey,
  type KozmosDensity,
  type KozmosResolvedTheme,
  type KozmosTheme,
  type KozmosThemeState,
  type KozmosThemeTokens,
  type KozmosThemeTokenSets,
} from "../../theme/injection";

function isTokenSets(
  tokens: KozmosThemeTokens | KozmosThemeTokenSets,
): tokens is KozmosThemeTokenSets {
  return Object.keys(tokens).every((key) => key === "light" || key === "dark");
}

function isTheme(value: unknown): value is KozmosTheme {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * A module boundary, never a document-global theme switch: Vue's counterpart
 * of React's ThemeProvider, drawing the same element. Its scope is a
 * `display: contents` box marked `data-kozmos-root`, `data-theme`,
 * `data-kozmos-density` and `dir`, with the resolved theme's token overrides
 * on it; once mounted, a portal of the same marks in the document's body takes
 * what its parts draw outside the flow. Direction reaches Reka through its
 * ConfigProvider, as React's reaches Radix through DirectionProvider.
 *
 * `v-model:theme` controls the preference; without it the provider keeps its
 * own, persisted under `storageKey` when given. `themeChange` (`@theme-change`
 * in a template) reports every request, as React's `onThemeChange`.
 *
 * An outer Reka ConfigProvider's locale, scroll lock, nonce, teleport target
 * and id source carry on inside: only the direction is this provider's. Like
 * React's ThemeProvider, it takes no `class`, `id` or other attribute; its
 * scope is `display: contents`, so style what it holds.
 */
export const KozmosThemeProvider = defineComponent({
  name: "KozmosThemeProvider",
  inheritAttrs: false,
  props: {
    defaultTheme: { type: String as PropType<KozmosTheme>, default: "system" },
    /** Controlled preference. In this mode the caller owns persistence. */
    theme: { type: String as PropType<KozmosTheme>, default: undefined },
    /** Persistence is opt-in. Use a key owned by your product/module. */
    storageKey: { type: String, default: undefined },
    /** Deterministic system fallback for SSR and the first hydration render. */
    defaultSystemTheme: {
      type: String as PropType<KozmosResolvedTheme>,
      default: "light",
    },
    dir: { type: String as PropType<"ltr" | "rtl">, default: undefined },
    /** The control sizes inside this provider and its portal; inherited when unset. */
    density: { type: String as PropType<KozmosDensity>, default: undefined },
    /** One set for both themes, or `{ light, dark }`, inherited by nested providers. */
    tokens: {
      type: Object as PropType<KozmosThemeTokens | KozmosThemeTokenSets>,
      default: undefined,
    },
  },
  emits: {
    "update:theme": (theme: KozmosTheme) => isTheme(theme),
    themeChange: (theme: KozmosTheme) => isTheme(theme),
  },
  /** What it scopes, as React's required `children`. */
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { emit, slots }) {
    const parent = inject(ThemeKey, undefined);
    const inheritedDensity = inject(DensityKey, undefined);
    const motion = inject(MotionKey, undefined);
    // The outer Reka config, or null: a ConfigProvider given only `dir` would
    // set every other field back to Reka's default for the parts inside.
    const outerConfig = injectConfigProviderContext(null);
    const root = ref<HTMLElement | null>(null);
    const portalContainer = ref<HTMLElement | null>(null);
    const mounted = ref(false);
    const preference = ref<KozmosTheme>(props.defaultTheme);
    const systemTheme = ref<KozmosResolvedTheme>(props.defaultSystemTheme);

    const theme = computed<KozmosTheme>(() => props.theme ?? preference.value);
    const resolvedTheme = computed<KozmosResolvedTheme>(() =>
      theme.value === "system" ? systemTheme.value : theme.value,
    );
    const dir = computed<"ltr" | "rtl">(
      () => props.dir ?? parent?.dir.value ?? "ltr",
    );
    const density = computed<KozmosDensity>(
      () => props.density ?? inheritedDensity?.value ?? "touch",
    );
    // Both themes' sets are inherited, so a nested provider that resolves to
    // the other theme applies that theme's set, not this one's.
    const tokenSets = computed(() => {
      const own: KozmosThemeTokenSets = !props.tokens
        ? {}
        : isTokenSets(props.tokens)
          ? props.tokens
          : { light: props.tokens, dark: props.tokens };
      return {
        light: { ...parent?.tokenSets.value.light, ...own.light },
        dark: { ...parent?.tokenSets.value.dark, ...own.dark },
      };
    });
    const tokens = computed(() => tokenSets.value[resolvedTheme.value]);

    const setTheme = (next: KozmosTheme) => {
      if (!isTheme(next)) return;
      if (props.theme === undefined) {
        preference.value = next;
        if (props.storageKey) {
          try {
            root.value?.ownerDocument.defaultView?.localStorage.setItem(
              props.storageKey,
              next,
            );
          } catch {
            // An unavailable persistence layer must not disable the UI.
          }
        }
      }
      emit("update:theme", next);
      emit("themeChange", next);
    };

    const state: KozmosThemeState = {
      theme,
      resolvedTheme,
      dir,
      tokens,
      tokenSets,
      portalContainer,
      setTheme,
    };
    provide(ThemeKey, state);
    provide(DensityKey, density);

    let stopSystem: (() => void) | undefined;
    const followSystem = () => {
      stopSystem?.();
      stopSystem = undefined;
      if (theme.value !== "system") return;
      const view = root.value?.ownerDocument.defaultView;
      if (!view?.matchMedia) return;
      const query = view.matchMedia("(prefers-color-scheme: dark)");
      const update = () => {
        systemTheme.value = query.matches ? "dark" : "light";
      };
      update();
      query.addEventListener("change", update);
      stopSystem = () => query.removeEventListener("change", update);
    };

    // As React's effect on [theme, storageKey]: the stored preference is read
    // once mounted, and again whenever the key changes or the theme stops
    // being controlled.
    const readStored = () => {
      if (props.theme !== undefined || !props.storageKey) return;
      try {
        const stored =
          root.value?.ownerDocument.defaultView?.localStorage.getItem(
            props.storageKey,
          );
        if (isTheme(stored)) preference.value = stored;
      } catch {
        // Storage can be unavailable in sandboxed or privacy-restricted hosts.
      }
    };

    onMounted(() => {
      mounted.value = true;
      readStored();
      followSystem();
    });
    watch([() => props.theme, () => props.storageKey], () => {
      if (mounted.value) readStored();
    });
    watch(theme, followSystem);
    onBeforeUnmount(() => stopSystem?.());

    const attributes = () => ({
      "data-kozmos-root": "",
      "data-theme": resolvedTheme.value,
      "data-kozmos-density": density.value,
      dir: dir.value,
      style: { ...tokens.value, display: "contents" },
    });

    return () =>
      h(
        ConfigProvider,
        {
          dir: dir.value,
          locale: outerConfig?.locale?.value,
          scrollBody: outerConfig?.scrollBody?.value,
          nonce: outerConfig?.nonce?.value,
          teleportTo: outerConfig?.teleportTo?.value,
          useId: outerConfig?.useId,
        },
        {
          default: () => [
            h("div", { ref: root, ...attributes() }, slots.default?.()),
            // The portal exists only once mounted, as React's does: a server
            // render has no body to draw it in.
            mounted.value
              ? h(Teleport, { to: root.value?.ownerDocument.body ?? "body" }, [
                  h("div", {
                    ref: portalContainer,
                    "data-kozmos-portal": "",
                    // The config's reduced motion, marked on the portal as
                    // React's MotionContext marks it: the portal is outside
                    // the scope that carries it.
                    "data-kozmos-motion": motion?.value,
                    ...attributes(),
                  }),
                ])
              : null,
          ],
        },
      );
  },
});
