/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const plugin = require("tailwindcss/plugin");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withTokenAlpha } = require("./postcss/token-alpha.cjs");

module.exports = {
  // Keep utility overrides available during migration, including utilities
  // now consumed by @apply recipes instead of JSX class strings.
  content: ["./src/**/*.{js,ts,jsx,tsx,css}"],
  darkMode: [
    "variant",
    '@scope (:scope[data-theme="dark"]) to ([data-kozmos-root]) { & }',
  ],
  theme: {
    extend: {
      colors: withTokenAlpha({
        // Primitive / Brand Colors
        brand: {
          500: "var(--primitives-colors-theme-500)",
          600: "var(--primitives-colors-theme-600)",
          700: "var(--primitives-colors-theme-700)",
        },
        surface: {
          0: "var(--semantics-surface-0)",
          100: "var(--semantics-surface-100)",
          200: "var(--semantics-surface-200)",
          300: "var(--semantics-surface-300)",
        },
        data: {
          blue: "var(--semantics-data-blue)",
          purple: "var(--semantics-data-purple)",
          teal: "var(--semantics-data-teal)",
          orange: "var(--semantics-data-orange)",
          red: "var(--semantics-data-red)",
          yellow: "var(--semantics-data-yellow)",
        },
        overlay: {
          scrim: "var(--semantics-overlay-scrim)",
          dim: "var(--semantics-overlay-dim)",
        },
        // Semantic: Base
        background: "var(--primitives-colors-background-0)",
        foreground: "var(--primitives-colors-foreground-0)",

        // Semantic: UI Elements
        card: {
          DEFAULT: "var(--primitives-colors-background-0)",
          foreground: "var(--primitives-colors-foreground-0)",
        },
        popover: {
          DEFAULT: "var(--primitives-colors-background-0)",
          foreground: "var(--primitives-colors-foreground-0)",
        },
        primary: {
          DEFAULT: "var(--primitives-colors-theme-600)",
          foreground: "var(--primitives-colors-foreground-1000)",
        },
        secondary: {
          DEFAULT: "var(--primitives-colors-background-200)",
          foreground: "var(--primitives-colors-foreground-0)",
        },
        muted: {
          DEFAULT: "var(--primitives-colors-background-100)",
          foreground: "var(--primitives-colors-foreground-400)",
        },
        accent: {
          DEFAULT: "var(--primitives-colors-theme-600)",
          foreground: "var(--primitives-colors-foreground-1000)",
        },
        destructive: {
          DEFAULT: "var(--primitives-colors-emotional-danger-600)",
          foreground: "var(--primitives-colors-foreground-1000)",
          // The emotion as text or a glyph on a page, card or sheet: DEFAULT is the
          // fill, one step lighter, and fails 4.5:1 as text on the greys.
          text: "var(--semantics-emotion-danger-text)",
        },
        success: {
          DEFAULT: "var(--primitives-colors-emotional-success-800)",
          foreground: "var(--primitives-colors-foreground-1000)",
          // The emotion as text or a glyph on a page, card or sheet: DEFAULT is the
          // fill, one step lighter, and fails 4.5:1 as text on the greys.
          text: "var(--semantics-emotion-success-text)",
        },
        warning: {
          DEFAULT: "var(--primitives-colors-emotional-alert-800)",
          foreground: "var(--primitives-colors-foreground-1000)",
          // The emotion as text or a glyph on a page, card or sheet: DEFAULT is the
          // fill, one step lighter, and fails 4.5:1 as text on the greys.
          text: "var(--semantics-emotion-alert-text)",
        },
        info: {
          DEFAULT: "var(--primitives-colors-emotional-info-700)",
          foreground: "var(--primitives-colors-foreground-1000)",
          // The emotion as text or a glyph on a page, card or sheet: DEFAULT is the
          // fill, one step lighter, and fails 4.5:1 as text on the greys.
          text: "var(--semantics-emotion-informative-text)",
        },
        // Border roles. `border` is the container edge, `border-input` the
        // boundary of a control; both live in Semantics.Border in
        // packages/tokens/src/tokens-*.json, and scripts/check-border-parity.mjs
        // holds Figma, native and this file to the same two aliases.
        border: "var(--semantics-border-subtle)",
        input: "var(--semantics-border-input)",
        ring: "var(--primitives-colors-theme-600)",
      }),
      // A bare `border` is the container edge, as `border` above says: the
      // role. Until 2026-09-22 it was Tailwind's own gray-200 (#e5e7eb), in
      // the dark as in the light, on every border the package left bare —
      // Dialog, Popover, Toast, Menu, the listbox, the tables.
      borderColor: {
        DEFAULT: "var(--semantics-border-subtle)",
      },
      borderRadius: {
        sm: "var(--primitives-radius-sm)",
        md: "var(--primitives-radius-md)", // Alias for Base in new system, or strictly md
        lg: "var(--primitives-radius-lg)",
        xl: "var(--primitives-radius-xl)",
        "2xl": "var(--primitives-radius-2xl)",
        full: "var(--primitives-radius-full)",
        // Semantic Aliases
        card: "var(--primitives-radius-card)",
        input: "var(--primitives-radius-input)",
        button: "var(--primitives-radius-button)",

        // Semantic radius roles. This is the vocabulary to reach for: name the
        // job, not the size. Changing how round the product feels is then one
        // alias edit in packages/tokens/src/tokens-*.json under
        // Semantics.Radius, not a sweep through class names.
        //
        // The variables are unitless numbers on purpose — they resolve to the
        // same numeric scale iOS and Android read, so the three platforms
        // cannot drift the way rounded-md (16px) and radius100 (8px) did.
        // Hence the calc.
        none: "calc(var(--semantics-radius-none) * 1px)",
        marker: "calc(var(--semantics-radius-marker) * 1px)",
        control: "calc(var(--semantics-radius-control) * 1px)",
        container: "calc(var(--semantics-radius-container) * 1px)",
        panel: "calc(var(--semantics-radius-panel) * 1px)",
        pill: "calc(var(--semantics-radius-pill) * 1px)",
      },
      opacity: {
        0: "var(--primitives-opacity-0)",
        5: "var(--primitives-opacity-5)",
        10: "var(--primitives-opacity-10)",
        25: "var(--primitives-opacity-25)",
        50: "var(--primitives-opacity-50)",
        75: "var(--primitives-opacity-75)",
        100: "var(--primitives-opacity-100)",
      },
      zIndex: {
        0: "var(--primitives-layer-0)",
        10: "var(--primitives-layer-10)",
        20: "var(--primitives-layer-20)",
        30: "var(--primitives-layer-30)",
        40: "var(--primitives-layer-40)",
        50: "var(--primitives-layer-50)",
        auto: "var(--primitives-layer-auto)",
        toast: "100", // Standardize toast layer
      },
      borderWidth: {
        DEFAULT: "1px",
        0: "var(--primitives-border-width-none)",
        sm: "var(--primitives-border-width-sm)",
        md: "var(--primitives-border-width-md)",
        lg: "var(--primitives-border-width-lg)",
      },
      fontFamily: {
        // `sans` used to be ["var(--primitives-typography-font-family-primary)",
        // "sans-serif"], i.e. `"Readex Pro", sans-serif` — and Readex Pro has
        // never been loaded anywhere: no @font-face, no webfont link, no file in
        // the repo. Every page has quietly been rendering the generic
        // sans-serif, which on macOS is Helvetica, while iOS rendered SF Pro and
        // Android rendered Roboto. The system role makes that deliberate instead
        // of accidental, and puts the whole stack in the token rather than here.
        sans: "var(--semantics-typography-family-system)",
        mono: "var(--semantics-typography-family-mono)",
        // Opt-in, and it falls back to the system stack rather than to a generic
        // family, so an unloaded brand font degrades to the same thing everything
        // else uses instead of to Helvetica.
        brand:
          "var(--semantics-typography-family-brand), var(--semantics-typography-family-system)",
      },
      screens: {
        mobile: "375px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1440px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",

        // Elevation roles. Name the job, not the depth: a card is raised, map
        // chrome floats, a menu overlays. These live in Semantics.Elevation in
        // packages/tokens/src/tokens-*.json, and scripts/check-elevation-parity.mjs
        // holds Figma, native and this file to the same three aliases.
        raised: "var(--semantics-elevation-raised)",
        floating: "var(--semantics-elevation-floating)",
        overlay: "var(--semantics-elevation-overlay)",
      },
      transitionDuration: {
        DEFAULT: "calc(150ms * var(--semantics-motion-duration-scale, 1))", // Updated to semantics
        75: "calc(75ms * var(--semantics-motion-duration-scale, 1))",
        100: "calc(100ms * var(--semantics-motion-duration-scale, 1))",
        150: "calc(150ms * var(--semantics-motion-duration-scale, 1))",
        200: "calc(200ms * var(--semantics-motion-duration-scale, 1))",
        300: "calc(300ms * var(--semantics-motion-duration-scale, 1))",
        500: "calc(500ms * var(--semantics-motion-duration-scale, 1))",
        700: "calc(700ms * var(--semantics-motion-duration-scale, 1))",
        1000: "calc(1000ms * var(--semantics-motion-duration-scale, 1))",
      },
      width: {
        "touch-min": "var(--primitives-touch-min)",
        "touch-comfortable": "var(--primitives-touch-comfortable)",
        mobile: "375px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1440px",
      },
      height: {
        "touch-min": "var(--primitives-touch-min)",
        "touch-comfortable": "var(--primitives-touch-comfortable)",
        "grid-gutter": "var(--primitives-grid-gutter)", // 24px
        mobile: "375px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1440px",
      },
      minWidth: {
        "touch-min": "var(--primitives-touch-min)",
        "touch-comfortable": "var(--primitives-touch-comfortable)",
      },
      minHeight: {
        "touch-min": "var(--primitives-touch-min)",
        "touch-comfortable": "var(--primitives-touch-comfortable)",
      },
    },
  },
  plugins: [
    // Dialog, Drawer, FeedbackCard, Menu, Popover, Select, Toast and Tooltip have
    // referenced animate-in / animate-out / fade-in-0 / zoom-in-95 / slide-in-from-*
    // since they were written, and nothing generated them: the built stylesheet
    // carried only Tailwind own ping, pulse and spin, so every overlay appeared
    // instantly. The classes are strings, so types and tests pass either way, and
    // Chromatic — the one gate that would have shown it — has been on its snapshot
    // limit since early September. Measured 2026-09-12; see docs/ds-scope-2026-09-12.md.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("tailwindcss-animate"),
    plugin(function ({ addUtilities, theme }) {
      addUtilities({
        ".glass": {
          position: "relative", // Ensure pseudo-elements align
          "backdrop-filter": "var(--glass-filter)",
          "-webkit-backdrop-filter": "var(--glass-filter)",
          "background-color":
            "rgba(var(--kozmos-glass-rgb), var(--glass-opacity))",
          "background-image": "var(--glass-noise-image, none)",
          border: "1px solid rgba(255, 255, 255, var(--glass-bevel-opacity))",
          "will-change": "backdrop-filter, transform",
          overflow: "hidden", // Contain the surface texture
          // THICK GLASS ENHANCEMENTS:
          "box-shadow": "var(--glass-inner-shadow)",
          transform: "scale(var(--glass-scale, 1))",
          transition:
            "transform calc(300ms * var(--semantics-motion-duration-scale, 1)) cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow calc(300ms * var(--semantics-motion-duration-scale, 1)) ease",
        },
        ".glass::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          "pointer-events": "none",
          "z-index": "1", // On top of background color
          opacity: "var(--glass-surface-opacity)",
          filter: "var(--glass-surface-filter)",
          "mix-blend-mode": "overlay",
        },
        ".glass > *": {
          position: "relative",
          "z-index": "2", // Ensure content is above surface texture
        },
        ".glass-spotlight": {
          position: "relative",
          overflow: "hidden",
        },
        ".glass-spotlight::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          background:
            "radial-gradient(800px circle at var(--spotlight-x) var(--spotlight-y), rgba(255, 255, 255, 0.06), transparent 40%)",
          "z-index": "10",
          "pointer-events": "none",
          opacity: "var(--glass-spotlight-opacity, 0)",
        },
        ".glass-bevel": {
          // Bevel with optional Dispersion (Chromatic Aberration) simulation
          // Mixes standard bevel shadows with Red/Blue color shifts based on dispersion opacity
          "box-shadow": "var(--glass-composite-shadow)",
        },
        ".glass-edge-spotlight": {
          position: "relative",
        },
        ".glass-edge-spotlight::after": {
          content: '""',
          position: "absolute",
          inset: "-1px", // Hug the border
          "z-index": "10", // Topmost
          "pointer-events": "none",
          "border-radius": "inherit",
          background: "transparent",
          border: "1.5px solid rgba(255, 255, 255, 0.4)",
          "mask-image":
            "radial-gradient(200px circle at var(--spotlight-x) var(--spotlight-y), black, transparent)",
          "-webkit-mask-image":
            "radial-gradient(200px circle at var(--spotlight-x) var(--spotlight-y), black, transparent)",
          opacity: "var(--glass-spotlight-opacity, 0)",
        },
      });
    }),
  ],
};
