"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent } from "react";
import {
  ThemeProvider,
  type ThemeProviderProps,
} from "../components/ThemeProvider/ThemeProvider";
import { ThemeProviderContext } from "../theme/theme-context";
import {
  DEFAULT_CONFIG,
  designConfigTokens,
  normalizeDesignConfig,
  normalizeRuntimeTokens,
} from "./design-config";
import type {
  DesignConfig,
  DesignConfigInput,
  GlassConfig,
} from "./design-config";
export type {
  DesignConfig,
  DesignConfigInput,
  GlassConfig,
} from "./design-config";

interface DesignConfigContextType {
  config: DesignConfig;
  updateConfig: (
    patch: DesignConfigInput | ((previous: DesignConfig) => DesignConfigInput),
  ) => void;
  updateGlassConfig: (patch: Partial<GlassConfig>) => void;
  resetConfig: () => void;
  /** @deprecated Prefer declarative tokens. Merges overrides; an empty value removes a key. */
  injectRuntimeTokens: (tokens: Record<string, string>) => void;
}
const DesignConfigContext = createContext<DesignConfigContextType | undefined>(
  undefined,
);

export function useDesignConfig() {
  const context = useContext(DesignConfigContext);
  if (!context)
    throw new Error(
      "useDesignConfig must be used within a DesignConfigProvider",
    );
  return context;
}

export interface DesignConfigProviderProps extends Omit<
  ThemeProviderProps,
  "tokens"
> {
  initialConfig?: DesignConfigInput;
  /** Controlled configuration. Unspecified fields use defaults, not previous props. */
  config?: DesignConfigInput;
  onConfigChange?: (config: DesignConfig) => void;
  /** Explicit, module-owned persistence key; controlled config ignores it. */
  persistKey?: string | null;
  tokens?: Record<string, string>;
}

/** Compatibility/configuration layer over the same theme and portal boundary. */
export function DesignConfigProvider({
  children,
  initialConfig,
  config: controlledConfig,
  onConfigChange,
  persistKey,
  tokens,
  theme,
  defaultTheme,
  defaultSystemTheme,
  onThemeChange,
  dir,
  storageKey,
}: DesignConfigProviderProps) {
  const parentTheme = useContext(ThemeProviderContext);
  const id = `kozmos-design-${useId()}`;
  const wrapper = useRef<HTMLDivElement>(null);
  const [seed] = useState(() => normalizeDesignConfig(initialConfig));
  const [state, setState] = useState(seed);
  // Event-time state supports multiple partial updates before React commits.
  // Unlike the old shallow merge, an update never replaces a nested object wholesale.
  const pendingState = useRef(state);
  const controlled = controlledConfig !== undefined;
  const config = useMemo(
    () => (controlled ? normalizeDesignConfig(controlledConfig) : state),
    [controlled, controlledConfig, state],
  );
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(
    undefined,
  );
  const [runtimeTokens, setRuntimeTokens] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (controlled || !persistKey) return;
    let restored = seed;
    try {
      const saved =
        wrapper.current?.ownerDocument.defaultView?.localStorage.getItem(
          persistKey,
        );
      if (saved) restored = normalizeDesignConfig(JSON.parse(saved), seed);
    } catch {
      // Corrupt JSON and denied storage both fall back to the initial configuration.
    }
    pendingState.current = restored;
    setState(restored);
    setLoadedKey(persistKey);
  }, [controlled, persistKey, seed]);

  useEffect(() => {
    if (controlled || !persistKey || loadedKey !== persistKey) return;
    try {
      wrapper.current?.ownerDocument.defaultView?.localStorage.setItem(
        persistKey,
        JSON.stringify(state),
      );
    } catch {
      // Persistence is optional; it must not disable runtime configuration.
    }
  }, [controlled, persistKey, loadedKey, state]);

  const commit = useCallback(
    (next: DesignConfig) => {
      if (!controlled) {
        pendingState.current = next;
        setState(next);
      }
      // Consumers cannot mutate the internal state through this callback.
      onConfigChange?.(normalizeDesignConfig(next));
    },
    [controlled, onConfigChange],
  );

  const updateConfig = useCallback<DesignConfigContextType["updateConfig"]>(
    (patch) => {
      const base = controlled ? config : pendingState.current;
      commit(
        normalizeDesignConfig(
          typeof patch === "function"
            ? patch(normalizeDesignConfig(base))
            : patch,
          base,
        ),
      );
    },
    [controlled, config, commit],
  );
  const updateGlassConfig = useCallback(
    (glass: Partial<GlassConfig>) => updateConfig({ glass }),
    [updateConfig],
  );
  const resetConfig = useCallback(
    () => commit(normalizeDesignConfig(DEFAULT_CONFIG)),
    [commit],
  );
  const injectRuntimeTokens = useCallback((patch: Record<string, string>) => {
    setRuntimeTokens((previous) => {
      const next = { ...previous };
      for (const [key, value] of Object.entries(patch)) {
        const normalizedKey = key.startsWith("--")
          ? key
          : `--primitives-${key}`;
        if (value === "") delete next[normalizedKey];
        else if (typeof value === "string") next[normalizedKey] = value;
      }
      return next;
    });
  }, []);
  const values = useMemo(
    () => ({
      ...designConfigTokens(config, id),
      ...runtimeTokens,
      ...normalizeRuntimeTokens(tokens),
      "--kozmos-design-id": id,
    }),
    [config, id, runtimeTokens, tokens],
  );
  const context = useMemo(
    () => ({
      config,
      updateConfig,
      updateGlassConfig,
      resetConfig,
      injectRuntimeTokens,
    }),
    [config, updateConfig, updateGlassConfig, resetConfig, injectRuntimeTokens],
  );

  function spotlightSurface(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as Element;
    const surface = target.closest?.<HTMLElement>(
      ".glass-spotlight, .glass-edge-spotlight",
    );
    if (!surface) return;
    const view = surface.ownerDocument.defaultView;
    // React events bubble through portals. Check the destination's inherited owner
    // so nested provider events never update the parent or an explicit foreign target.
    if (
      view
        ?.getComputedStyle(surface)
        .getPropertyValue("--kozmos-design-id")
        .trim() !== id
    )
      return;
    return surface;
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      !config.spotlight ||
      !config.glass.enabled ||
      config.accessibility.reduceTransparency ||
      config.accessibility.reduceMotion ||
      config.motion === "reduced"
    )
      return;
    const surface = spotlightSurface(event);
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    // Convert visual coordinates back to the CSS box when glass magnification applies.
    surface.style.setProperty(
      "--spotlight-x",
      `${(event.clientX - bounds.left) * (surface.offsetWidth / bounds.width || 1)}px`,
    );
    surface.style.setProperty(
      "--spotlight-y",
      `${(event.clientY - bounds.top) * (surface.offsetHeight / bounds.height || 1)}px`,
    );
  }
  function onPointerOut(event: PointerEvent<HTMLDivElement>) {
    const surface = spotlightSurface(event);
    if (
      !surface ||
      (event.relatedTarget instanceof Node &&
        surface.contains(event.relatedTarget))
    )
      return;
    surface.style.removeProperty("--spotlight-x");
    surface.style.removeProperty("--spotlight-y");
  }

  const inheritPreference =
    theme === undefined &&
    defaultTheme === undefined &&
    storageKey === undefined;
  return (
    <DesignConfigContext.Provider value={context}>
      <ThemeProvider
        theme={inheritPreference ? parentTheme?.theme : theme}
        defaultTheme={defaultTheme}
        defaultSystemTheme={defaultSystemTheme ?? parentTheme?.resolvedTheme}
        onThemeChange={
          inheritPreference && parentTheme
            ? (next) => {
                parentTheme.setTheme(next);
                onThemeChange?.(next);
              }
            : onThemeChange
        }
        dir={dir}
        storageKey={storageKey}
        tokens={values}
      >
        <div
          ref={wrapper}
          data-kozmos-design-scope={id}
          // The config's own reduced motion, for the rules that cannot read a
          // duration scale: an animation that loops has to be told to stop,
          // not run a thousand times faster (GAP-50).
          data-kozmos-motion={
            config.accessibility.reduceMotion || config.motion === "reduced"
              ? "reduced"
              : undefined
          }
          style={{ display: "contents" }}
          onPointerMove={onPointerMove}
          onPointerOut={onPointerOut}
        >
          {children}
          {config.glass.enabled && !config.accessibility.reduceTransparency && (
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                width: 0,
                height: 0,
                pointerEvents: "none",
                visibility: "hidden",
              }}
            >
              <defs>
                <filter
                  id={`${id}-surface`}
                  x="0%"
                  y="0%"
                  width="100%"
                  height="100%"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.5"
                    numOctaves="2"
                    result="noise"
                  />
                  <feColorMatrix
                    type="saturate"
                    values="0"
                    in="noise"
                    result="monoNoise"
                  />
                  <feComponentTransfer in="monoNoise" result="smoothNoise">
                    <feFuncA type="linear" slope="0.1" />
                  </feComponentTransfer>
                </filter>
              </defs>
            </svg>
          )}
        </div>
      </ThemeProvider>
    </DesignConfigContext.Provider>
  );
}
