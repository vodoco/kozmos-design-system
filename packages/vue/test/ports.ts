import path from "node:path";
import type { StoryArgs } from "./parity/story-args";

/**
 * Every part `@kozmos-ds/vue` ports natively (Vue 3 Phase 0, P0.4), with the
 * React export it answers to. The API contract (`contract/`) holds each Vue
 * part's props, events and slots to its React part's; the DOM parity check
 * (`parity/stories.parity.spec.ts`) draws each React story's args in both,
 * and draws each part with attributes added to see they land as React's.
 * `coverage.spec.ts` fails when the main entry exports a part that is not
 * here, or when this file leaves a story, an event or a part undrawn, so a
 * new port cannot skip any of it.
 *
 * Specs named here are relative to `test/`; each must import the Vue part
 * and use it (`coverage.spec.ts`).
 */
export interface Port {
  /** The Vue export (`KozmosButton`). */
  vue: string;
  /** The React export it answers to (`Button`). */
  react: string;
  /**
   * React's stories file for the part, relative to `packages/react/src`, or
   * null when React has none of its own. Every story drawn from its args is
   * drawn in both, unless it is named in `elsewhere`.
   */
  stories: string | null;
  /**
   * The stories `stories.parity.spec.ts` cannot draw from their args, each
   * with the spec that draws in both what it shows: a story with its own
   * `render`, or one with args the reader cannot read (JSX, identifiers).
   */
  elsewhere?: Record<string, string>;
  /** Where a part without args stories is drawn in both. */
  drawnIn?: string;
  /**
   * The args a part without args stories is drawn with to see where
   * attributes land; a part with args stories is drawn with its first.
   */
  sample?: StoryArgs;
  /**
   * Each event the Vue part emits, and the spec that makes it fire beside
   * React's callback. Declaring an event is not emitting it.
   */
  events?: Record<string, string>;
  /**
   * The part of a compound this one draws only inside, by its React export
   * (`Avatar` for `AvatarFallback`): Radix's parts throw outside their
   * root, so the attributes and listeners checks draw it there, in both,
   * with that port's sample. The part it names may itself be drawn
   * inside another (Select's item inside its content, inside its root):
   * each is drawn inside the next, out to one drawn on its own.
   */
  within?: string;
  /**
   * Why the part draws no element in a test's document, so an app's
   * attributes and listeners land nowhere in either framework (an image
   * that has not loaded), with the spec that draws it where it does.
   */
  unmarked?: { why: string; drawnIn: string };
}

export const PORTS: Port[] = [
  {
    vue: "KozmosThemeProvider",
    react: "ThemeProvider",
    stories: "components/ThemeProvider/ThemeProvider.stories.tsx",
    elsewhere: {
      // A provider whose buttons call useTheme().setTheme.
      Default: "parity/mounted.parity.spec.ts",
      // DensityScope at both densities, its controls all native:
      // story-renders.parity.spec.ts draws the story itself in both.
      Density: "parity/provider-and-scope.parity.spec.ts",
    },
    drawnIn: "parity/button.parity.spec.ts",
    sample: { children: "Themed" },
    events: {
      "update:theme": "parity/mounted.parity.spec.ts",
    },
  },
  {
    vue: "KozmosDensityScope",
    react: "DensityScope",
    stories: null,
    drawnIn: "parity/provider-and-scope.parity.spec.ts",
    sample: { density: "compact", children: "Scoped" },
  },
  {
    vue: "KozmosDesignConfigProvider",
    react: "DesignConfigProvider",
    stories: null,
    drawnIn: "parity/design-config.parity.spec.ts",
    sample: { children: "Configured" },
    events: {
      "update:config": "parity/design-config.parity.spec.ts",
      "update:theme": "parity/design-config.parity.spec.ts",
    },
  },
  {
    vue: "KozmosButton",
    react: "Button",
    stories: "components/Button/Button.stories.tsx",
    elsewhere: {
      Emotions: "parity/button.parity.spec.ts",
      Subtle: "parity/button.parity.spec.ts",
      SubtleEmotions: "parity/button.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAnalyticsProvider",
    react: "AnalyticsProvider",
    stories: null,
    drawnIn: "parity/analytics.parity.spec.ts",
    sample: { children: "Reported" },
    events: {
      dispatch: "parity/analytics.parity.spec.ts",
    },
  },
  {
    vue: "KozmosBadge",
    react: "Badge",
    stories: "components/Badge/Badge.stories.tsx",
    elsewhere: {
      Icon: "parity/badge.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSeparator",
    react: "Separator",
    stories: "components/Separator/Separator.stories.tsx",
    elsewhere: {
      Default: "parity/separator.parity.spec.ts",
    },
    drawnIn: "parity/separator.parity.spec.ts",
    sample: { orientation: "vertical", decorative: false },
  },
  {
    vue: "KozmosText",
    react: "Text",
    stories: "components/Text/Text.stories.tsx",
  },
  {
    vue: "KozmosHeading",
    react: "Heading",
    stories: "components/Heading/Heading.stories.tsx",
    elsewhere: {
      AllLevels: "parity/heading.parity.spec.ts",
    },
  },
  {
    vue: "KozmosLabel",
    react: "Label",
    stories: "components/Label/Label.stories.tsx",
    elsewhere: {
      WithInput: "parity/label.parity.spec.ts",
    },
  },
  {
    vue: "KozmosIcon",
    react: "Icon",
    stories: "components/Icon/Icon.stories.tsx",
    elsewhere: {
      Sizes: "parity/icon.parity.spec.ts",
      Colors: "parity/icon.parity.spec.ts",
      Registry: "parity/icon.parity.spec.ts",
    },
  },
  {
    vue: "KozmosKbd",
    react: "Kbd",
    stories: "components/Kbd/Kbd.stories.tsx",
    elsewhere: {
      InAHint: "parity/kbd.parity.spec.ts",
    },
  },
  {
    vue: "KozmosCodeBlock",
    react: "CodeBlock",
    stories: "components/CodeBlock/CodeBlock.stories.tsx",
    elsewhere: {
      Default: "parity/code-block.parity.spec.ts",
      Scroll: "parity/code-block.parity.spec.ts",
    },
    drawnIn: "parity/code-block.parity.spec.ts",
    sample: { label: "JSON", code: "{}", copyable: true },
    events: {
      copy: "parity/code-block.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSpriteIcon",
    react: "SpriteIcon",
    stories: "components/SpriteIcon/SpriteIcon.stories.tsx",
    elsewhere: {
      Default: "parity/sprite-icon.parity.spec.ts",
    },
    drawnIn: "parity/sprite-icon.parity.spec.ts",
    sample: { sprite: "./sprite-fixture/sprite", name: "atm", label: "ATM" },
  },
  {
    vue: "KozmosBox",
    react: "Box",
    stories: "components/Box/Box.stories.tsx",
    elsewhere: {
      AsChild: "parity/box.parity.spec.ts",
    },
  },
  {
    vue: "KozmosStack",
    react: "Stack",
    stories: "components/Stack/Stack.stories.tsx",
    elsewhere: {
      Default: "parity/stack.parity.spec.ts",
      Horizontal: "parity/stack.parity.spec.ts",
    },
    drawnIn: "parity/stack.parity.spec.ts",
    sample: { direction: "row", gap: 4, children: "Stacked" },
  },
  {
    vue: "KozmosGrid",
    react: "Grid",
    stories: "components/Grid/Grid.stories.tsx",
    elsewhere: {
      Default: "parity/grid.parity.spec.ts",
      // Its renderItem is a function, Vue's render-item slot.
      Virtualized: "parity/grid.parity.spec.ts",
    },
    drawnIn: "parity/grid.parity.spec.ts",
    sample: { cols: 3, gap: 4, children: "Cells" },
    events: {
      rangeChange: "parity/grid.parity.spec.ts",
    },
  },
  {
    vue: "KozmosContainer",
    react: "Container",
    stories: "components/Container/Container.stories.tsx",
    elsewhere: {
      InAPanel: "parity/container.parity.spec.ts",
      BlockInset: "parity/container.parity.spec.ts",
      Default: "parity/container.parity.spec.ts",
      Fluid: "parity/container.parity.spec.ts",
    },
    drawnIn: "parity/container.parity.spec.ts",
    sample: { inset: "panel", block: "sm", children: "Region" },
  },
  {
    vue: "KozmosSurface",
    react: "Surface",
    stories: "components/Surface/Surface.stories.tsx",
    elsewhere: {
      // Drawn in React's frame, its meta's render.
      Solid: "parity/surface.parity.spec.ts",
      Glass: "parity/surface.parity.spec.ts",
      GlassPanel: "parity/surface.parity.spec.ts",
    },
    drawnIn: "parity/surface.parity.spec.ts",
    sample: { variant: "glass", children: "On glass" },
  },
  {
    vue: "KozmosTag",
    react: "Tag",
    stories: "components/Tag/Tag.stories.tsx",
    elsewhere: {
      Default: "parity/tag.parity.spec.ts",
      Removable: "parity/tag.parity.spec.ts",
      Emotions: "parity/tag.parity.spec.ts",
    },
    drawnIn: "parity/tag.parity.spec.ts",
    sample: { children: "Tag", emotion: "success" },
    events: {
      remove: "parity/tag.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAvatar",
    react: "Avatar",
    stories: "components/Avatar/Avatar.stories.tsx",
    elsewhere: {
      Default: "parity/avatar.parity.spec.ts",
      Fallback: "parity/avatar.parity.spec.ts",
    },
    drawnIn: "parity/avatar.parity.spec.ts",
    sample: { size: "sm" },
  },
  {
    vue: "KozmosAvatarImage",
    react: "AvatarImage",
    stories: null,
    drawnIn: "parity/avatar.parity.spec.ts",
    within: "Avatar",
    sample: { src: "https://example.com/a.png", alt: "Ada Lovelace" },
    // Radix's image draws nothing until it has loaded, which no image does
    // in a test's document; the Avatar spec loads one in both.
    unmarked: {
      why: "an image draws nothing until it has loaded, and none loads in jsdom",
      drawnIn: "parity/avatar.parity.spec.ts",
    },
    events: {
      loadingStatusChange: "parity/avatar.parity.spec.ts",
    },
  },
  {
    vue: "KozmosAvatarFallback",
    react: "AvatarFallback",
    stories: null,
    drawnIn: "parity/avatar.parity.spec.ts",
    within: "Avatar",
    sample: { children: "CN" },
  },
  {
    vue: "KozmosSpinner",
    react: "Spinner",
    stories: "components/Spinner/Spinner.stories.tsx",
    elsewhere: {
      Default: "parity/spinner.parity.spec.ts",
      Small: "parity/spinner.parity.spec.ts",
      Large: "parity/spinner.parity.spec.ts",
      EverySize: "parity/spinner.parity.spec.ts",
      InAButton: "parity/spinner.parity.spec.ts",
    },
    drawnIn: "parity/spinner.parity.spec.ts",
    sample: { size: "lg", label: "Loading places" },
  },
  {
    vue: "KozmosSkeleton",
    react: "Skeleton",
    stories: "components/Skeleton/Skeleton.stories.tsx",
    elsewhere: {
      Default: "parity/skeleton.parity.spec.ts",
    },
    drawnIn: "parity/skeleton.parity.spec.ts",
    sample: { shape: "circle", width: 48 },
  },
  {
    vue: "KozmosProgress",
    react: "Progress",
    stories: "components/Progress/Progress.stories.tsx",
    elsewhere: {
      TopOfPage: "parity/progress.parity.spec.ts",
      CircularSizes: "parity/progress.parity.spec.ts",
      CircularComplete: "parity/progress.parity.spec.ts",
      LevelsAdded: "parity/progress.parity.spec.ts",
      Tones: "parity/progress.parity.spec.ts",
      SelectedSection: "parity/progress.parity.spec.ts",
      LivePosition: "parity/progress.parity.spec.ts",
      AnimatedUpdate: "parity/progress.parity.spec.ts",
    },
  },
  {
    vue: "KozmosProgressTrack",
    react: "ProgressTrack",
    stories: null,
    drawnIn: "parity/progress.parity.spec.ts",
    sample: { value: 0.3 },
  },
  {
    vue: "KozmosPersonaMark",
    react: "PersonaMark",
    stories: "components/PersonaMark/PersonaMark.stories.tsx",
    elsewhere: {
      Group: "parity/persona-mark.parity.spec.ts",
      InAPersonaList: "parity/persona-mark.parity.spec.ts",
    },
  },
  {
    vue: "KozmosPersonaMarkGroup",
    react: "PersonaMarkGroup",
    stories: null,
    drawnIn: "parity/persona-mark.parity.spec.ts",
    sample: {
      personas: [
        { name: "Customer", color: "#FF9800" },
        { name: "Visitor", color: "#2196F3" },
      ],
    },
  },
  {
    vue: "KozmosCard",
    react: "Card",
    stories: "components/Card/Card.stories.tsx",
    // Every story draws the card's parts by hand.
    elsewhere: {
      Default: "parity/card.parity.spec.ts",
      TitleLevel: "parity/card.parity.spec.ts",
      Padding: "parity/card.parity.spec.ts",
      WithoutHeader: "parity/card.parity.spec.ts",
      HeaderActions: "parity/card.parity.spec.ts",
      SubtleHeader: "parity/card.parity.spec.ts",
      TitleSize: "parity/card.parity.spec.ts",
    },
    drawnIn: "parity/card.parity.spec.ts",
    sample: { padding: "compact", children: "Pointr" },
  },
  {
    vue: "KozmosCardHeader",
    react: "CardHeader",
    stories: null,
    drawnIn: "parity/card.parity.spec.ts",
    sample: { tone: "subtle", children: "Add beacon" },
  },
  {
    vue: "KozmosCardTitle",
    react: "CardTitle",
    stories: null,
    drawnIn: "parity/card.parity.spec.ts",
    sample: { as: "h2", size: "md", children: "Client details" },
  },
  {
    vue: "KozmosCardDescription",
    react: "CardDescription",
    stories: null,
    drawnIn: "parity/card.parity.spec.ts",
    sample: { children: "The client this site belongs to." },
  },
  {
    vue: "KozmosCardContent",
    react: "CardContent",
    stories: null,
    drawnIn: "parity/card.parity.spec.ts",
    sample: { children: "Pointr" },
  },
  {
    vue: "KozmosCardFooter",
    react: "CardFooter",
    stories: null,
    drawnIn: "parity/card.parity.spec.ts",
    sample: { children: "Save" },
  },
  {
    vue: "KozmosPageHeader",
    react: "PageHeader",
    stories: "components/PageHeader/PageHeader.stories.tsx",
    // Every story's breadcrumb and actions are JSX.
    elsewhere: {
      Plain: "parity/page-header.parity.spec.ts",
      Default: "parity/page-header.parity.spec.ts",
      Landing: "parity/page-header.parity.spec.ts",
      WithInfo: "parity/page-header.parity.spec.ts",
    },
    drawnIn: "parity/page-header.parity.spec.ts",
    sample: { title: "Settings", description: "Manage the site's map." },
  },
  {
    vue: "KozmosBreadcrumb",
    react: "Breadcrumb",
    stories: "components/Breadcrumb/Breadcrumb.stories.tsx",
    elsewhere: {
      Default: "parity/breadcrumb.parity.spec.ts",
    },
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: { children: "Trail" },
  },
  {
    vue: "KozmosBreadcrumbList",
    react: "BreadcrumbList",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: { children: "Places" },
  },
  {
    vue: "KozmosBreadcrumbItem",
    react: "BreadcrumbItem",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: { children: "Home" },
  },
  {
    vue: "KozmosBreadcrumbLink",
    react: "BreadcrumbLink",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: { href: "/components", children: "Components" },
  },
  {
    vue: "KozmosBreadcrumbPage",
    react: "BreadcrumbPage",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: { children: "Breadcrumb" },
  },
  {
    vue: "KozmosBreadcrumbSeparator",
    react: "BreadcrumbSeparator",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: {},
  },
  {
    vue: "KozmosBreadcrumbEllipsis",
    react: "BreadcrumbEllipsis",
    stories: null,
    drawnIn: "parity/breadcrumb.parity.spec.ts",
    sample: {},
  },
  {
    vue: "KozmosLink",
    react: "Link",
    stories: "components/Link/Link.stories.tsx",
    elsewhere: {
      ExternalInText: "parity/link.parity.spec.ts",
      ExternalRightToLeft: "parity/link.parity.spec.ts",
    },
  },
  {
    vue: "KozmosEmptyState",
    react: "EmptyState",
    stories: "components/EmptyState/EmptyState.stories.tsx",
    // Every story's icon and action are JSX, or it draws its own render.
    elsewhere: {
      Default: "parity/empty-state.parity.spec.ts",
      Compact: "parity/empty-state.parity.spec.ts",
      DownloadProgress: "parity/empty-state.parity.spec.ts",
      WithList: "parity/empty-state.parity.spec.ts",
    },
    drawnIn: "parity/empty-state.parity.spec.ts",
    sample: {
      title: "No results found",
      description: "Nothing at this airport serves Korean food.",
      size: "compact",
      tone: "alert",
    },
  },
  {
    vue: "KozmosList",
    react: "List",
    stories: "components/List/List.stories.tsx",
    elsewhere: {
      // Each draws its rows with its own render; the checklist's and the
      // persona list's rows hold Kozmos parts (Tag, Button, Checkbox).
      Default: "parity/list.parity.spec.ts",
      Compact: "parity/list.parity.spec.ts",
      Checklist: "parity/list.parity.spec.ts",
      PersonaVisibility: "parity/list.parity.spec.ts",
    },
    drawnIn: "parity/list.parity.spec.ts",
    sample: { density: "compact", children: "First item" },
  },
  {
    vue: "KozmosListItem",
    react: "ListItem",
    stories: null,
    drawnIn: "parity/list.parity.spec.ts",
    sample: { selected: true, children: "First item" },
  },
  {
    vue: "KozmosListItemStatus",
    react: "ListItemStatus",
    stories: null,
    drawnIn: "parity/list.parity.spec.ts",
    sample: { status: "inProgress" },
  },
  {
    vue: "KozmosDescriptionList",
    react: "DescriptionList",
    stories: "components/DescriptionList/DescriptionList.stories.tsx",
    elsewhere: {
      // Its items, with Badges and a yes and a no, drawn by its own render.
      Default: "parity/description-list.parity.spec.ts",
    },
    drawnIn: "parity/description-list.parity.spec.ts",
    sample: { layout: "row", children: "Unit" },
  },
  {
    vue: "KozmosDescriptionListItem",
    react: "DescriptionListItem",
    stories: null,
    drawnIn: "parity/description-list.parity.spec.ts",
    sample: { label: "Name", value: "Gate A12" },
  },
  {
    vue: "KozmosMetaStrip",
    react: "MetaStrip",
    stories: "components/MetaStrip/MetaStrip.stories.tsx",
    elsewhere: {
      // Each draws its tiles with its own render.
      Default: "parity/meta-strip.parity.spec.ts",
      WithVisibleLabels: "parity/meta-strip.parity.spec.ts",
      Overflowing: "parity/meta-strip.parity.spec.ts",
    },
    drawnIn: "parity/meta-strip.parity.spec.ts",
    sample: { "aria-label": "About this place", children: "12 min" },
  },
  {
    vue: "KozmosMetaStripItem",
    react: "MetaStripItem",
    stories: null,
    drawnIn: "parity/meta-strip.parity.spec.ts",
    sample: { label: "Distance", showLabel: true, children: "210 m" },
  },
  {
    vue: "KozmosTimeline",
    react: "Timeline",
    stories: "components/Timeline/Timeline.stories.tsx",
    elsewhere: {
      // Each draws its events with its own render.
      Detailed: "parity/timeline.parity.spec.ts",
      Basic: "parity/timeline.parity.spec.ts",
      Compact: "parity/timeline.parity.spec.ts",
      Default: "parity/timeline.parity.spec.ts",
    },
    drawnIn: "parity/timeline.parity.spec.ts",
    sample: { density: "compact", children: "Events" },
  },
  {
    vue: "KozmosTimelineItem",
    react: "TimelineItem",
    stories: null,
    drawnIn: "parity/timeline.parity.spec.ts",
    sample: { children: "Created" },
  },
  {
    vue: "KozmosTimelineTime",
    react: "TimelineTime",
    stories: null,
    drawnIn: "parity/timeline.parity.spec.ts",
    sample: { children: "09:00" },
  },
  {
    vue: "KozmosTimelineTitle",
    react: "TimelineTitle",
    stories: null,
    drawnIn: "parity/timeline.parity.spec.ts",
    sample: { children: "Created" },
  },
  {
    vue: "KozmosTimelineDescription",
    react: "TimelineDescription",
    stories: null,
    drawnIn: "parity/timeline.parity.spec.ts",
    sample: { children: "Initial event captured." },
  },
  {
    vue: "KozmosAlert",
    react: "Alert",
    stories: "components/Alert/Alert.stories.tsx",
    elsewhere: {
      // Each draws an icon, an AlertTitle and an AlertDescription with its
      // own render.
      Default: "parity/alert.parity.spec.ts",
      Destructive: "parity/alert.parity.spec.ts",
      Success: "parity/alert.parity.spec.ts",
      Warning: "parity/alert.parity.spec.ts",
      Info: "parity/alert.parity.spec.ts",
      WithoutTitle: "parity/alert.parity.spec.ts",
      LivenessAndTitle: "parity/alert.parity.spec.ts",
    },
    drawnIn: "parity/alert.parity.spec.ts",
    sample: { variant: "info", live: "polite", children: "Saved" },
  },
  {
    vue: "KozmosAlertTitle",
    react: "AlertTitle",
    stories: null,
    drawnIn: "parity/alert.parity.spec.ts",
    sample: { level: 3, children: "Heads up!" },
  },
  {
    vue: "KozmosAlertDescription",
    react: "AlertDescription",
    stories: null,
    drawnIn: "parity/alert.parity.spec.ts",
    sample: { children: "The venue closes at 18:00 today." },
  },
  {
    vue: "KozmosNotice",
    react: "Notice",
    stories: "components/Notice/Notice.stories.tsx",
    elsewhere: {
      // Its own render: three notices, one with a Button as its action.
      SuccessProgressAndDone: "parity/notice.parity.spec.ts",
      // A Button as its action, and as part of its summary.
      Emergency: "parity/notice.parity.spec.ts",
      SearchWithAi: "parity/notice.parity.spec.ts",
    },
    events: {
      "update:expanded": "parity/notice.parity.spec.ts",
    },
  },
  {
    vue: "KozmosCounter",
    react: "Counter",
    stories: "components/Counter/Counter.stories.tsx",
    elsewhere: {
      // Its own render: the six emotions in a row.
      Emotions: "parity/counter.parity.spec.ts",
    },
  },
  {
    vue: "KozmosIconButton",
    react: "IconButton",
    stories: "components/IconButton/IconButton.stories.tsx",
    elsewhere: {
      // An Icon in its args, and the rest their own renders.
      Default: "parity/icon-button.parity.spec.ts",
      Variants: "parity/icon-button.parity.spec.ts",
      Sizes: "parity/icon-button.parity.spec.ts",
      Counter: "parity/icon-button.parity.spec.ts",
    },
    drawnIn: "parity/icon-button.parity.spec.ts",
    sample: { "aria-label": "Search", children: "Go", counter: 3 },
  },
  {
    vue: "KozmosCheckbox",
    react: "Checkbox",
    stories: "components/Checkbox/Checkbox.stories.tsx",
    events: {
      "update:checked": "parity/checkbox.parity.spec.ts",
    },
  },
  {
    vue: "KozmosRating",
    react: "Rating",
    stories: "components/Rating/Rating.stories.tsx",
    elsewhere: {
      // Their own renders: a held thumbs scale, and read-only rows.
      Thumbs: "parity/rating.parity.spec.ts",
      ReadOnly: "parity/rating.parity.spec.ts",
      ReadOnlyHalves: "parity/rating.parity.spec.ts",
    },
    events: {
      "update:modelValue": "parity/rating.parity.spec.ts",
    },
  },
  {
    vue: "KozmosFieldWrapper",
    react: "FieldWrapper",
    stories: "components/FieldWrapper/FieldWrapper.stories.tsx",
    elsewhere: {
      Default: "parity/field-wrapper.parity.spec.ts",
      ValidationStates: "parity/field-wrapper.parity.spec.ts",
    },
    drawnIn: "parity/field-wrapper.parity.spec.ts",
    sample: { label: "Name", helperText: "Helper text", children: "Field" },
    events: {
      resetMixed: "parity/field-wrapper.parity.spec.ts",
    },
  },
  {
    vue: "KozmosInput",
    react: "Input",
    stories: "components/Input/Input.stories.tsx",
    elsewhere: {
      Default: "parity/input.parity.spec.ts",
      WithHelperText: "parity/input.parity.spec.ts",
      WithError: "parity/input.parity.spec.ts",
      ValidationStates: "parity/input.parity.spec.ts",
      Actions: "parity/input.parity.spec.ts",
      EditAction: "parity/input.parity.spec.ts",
      MixedValue: "parity/input.parity.spec.ts",
    },
    drawnIn: "parity/input.parity.spec.ts",
    sample: { label: "Name", placeholder: "Your name" },
    events: {
      "update:modelValue": "parity/input.parity.spec.ts",
      resetMixed: "parity/input.parity.spec.ts",
    },
  },
  {
    vue: "KozmosTextarea",
    react: "Textarea",
    stories: "components/Textarea/Textarea.stories.tsx",
    elsewhere: {
      Default: "parity/textarea.parity.spec.ts",
      WithError: "parity/textarea.parity.spec.ts",
      CharacterCount: "parity/textarea.parity.spec.ts",
    },
    drawnIn: "parity/textarea.parity.spec.ts",
    sample: { label: "Note", placeholder: "Tell us" },
    events: {
      "update:modelValue": "parity/textarea.parity.spec.ts",
    },
  },
  {
    vue: "KozmosPasswordInput",
    react: "PasswordInput",
    stories: "components/PasswordInput/PasswordInput.stories.tsx",
    elsewhere: {
      RightToLeft: "parity/password-input.parity.spec.ts",
    },
    events: {
      "update:visible": "parity/password-input.parity.spec.ts",
      "update:modelValue": "parity/password-input.parity.spec.ts",
    },
  },
  {
    vue: "KozmosNumberInput",
    react: "NumberInput",
    stories: "components/NumberInput/NumberInput.stories.tsx",
    elsewhere: {
      Default: "parity/number-input.parity.spec.ts",
      WithHelperText: "parity/number-input.parity.spec.ts",
      ValidationStates: "parity/number-input.parity.spec.ts",
      WithoutSteppers: "parity/number-input.parity.spec.ts",
      WithUnit: "parity/number-input.parity.spec.ts",
      WithUnitRightToLeft: "parity/number-input.parity.spec.ts",
      RightToLeft: "parity/number-input.parity.spec.ts",
      MixedValue: "parity/number-input.parity.spec.ts",
    },
    events: {
      "update:modelValue": "parity/number-input.parity.spec.ts",
      resetMixed: "parity/number-input.parity.spec.ts",
    },
  },
  {
    vue: "KozmosOTPInput",
    react: "OTPInput",
    stories: "components/OTPInput/OTPInput.stories.tsx",
    elsewhere: {
      Default: "parity/otpinput.parity.spec.ts",
      WithError: "parity/otpinput.parity.spec.ts",
      WithDefaultValue: "parity/otpinput.parity.spec.ts",
      ValidationStates: "parity/otpinput.parity.spec.ts",
    },
    drawnIn: "parity/otpinput.parity.spec.ts",
    sample: { label: "Code", length: 4 },
    events: {
      "update:modelValue": "parity/otpinput.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSwitch",
    react: "Switch",
    stories: "components/Switch/Switch.stories.tsx",
    elsewhere: {
      // Each its own render, of one switch.
      Default: "parity/switch.parity.spec.ts",
      Checked: "parity/switch.parity.spec.ts",
      Disabled: "parity/switch.parity.spec.ts",
      Error: "parity/switch.parity.spec.ts",
      WithDescription: "parity/switch.parity.spec.ts",
      StateLabel: "parity/switch.parity.spec.ts",
    },
    drawnIn: "parity/switch.parity.spec.ts",
    sample: { label: "Airplane Mode" },
    events: {
      "update:checked": "parity/switch.parity.spec.ts",
      resetMixed: "parity/switch.parity.spec.ts",
    },
  },
  {
    vue: "KozmosRadioGroup",
    react: "RadioGroup",
    // React's RadioGroup and RadioGroupItem are one module, Radio.
    stories: "components/Radio/Radio.stories.tsx",
    elsewhere: {
      // Each its own render, of a group and its items.
      Default: "parity/radio.parity.spec.ts",
      Disabled: "parity/radio.parity.spec.ts",
      Error: "parity/radio.parity.spec.ts",
      WithDescription: "parity/radio.parity.spec.ts",
      Cards: "parity/radio.parity.spec.ts",
      Tiles: "parity/radio.parity.spec.ts",
    },
    drawnIn: "parity/radio.parity.spec.ts",
    sample: { "aria-label": "Level", defaultValue: "1" },
    events: {
      "update:modelValue": "parity/radio.parity.spec.ts",
      resetMixed: "parity/radio.parity.spec.ts",
    },
  },
  {
    vue: "KozmosRadioGroupItem",
    react: "RadioGroupItem",
    stories: null,
    drawnIn: "parity/radio.parity.spec.ts",
    within: "RadioGroup",
    sample: { value: "1", label: "Level 1" },
  },
  {
    vue: "KozmosSegmentedControl",
    react: "SegmentedControl",
    stories: "components/SegmentedControl/SegmentedControl.stories.tsx",
    elsewhere: {
      // The meta's `items` is a module constant the reader cannot read.
      Default: "parity/segmented-control.parity.spec.ts",
      FullWidth: "parity/segmented-control.parity.spec.ts",
      Error: "parity/segmented-control.parity.spec.ts",
      Disabled: "parity/segmented-control.parity.spec.ts",
    },
    drawnIn: "parity/segmented-control.parity.spec.ts",
    sample: {
      label: "Mode",
      defaultValue: "walk",
      items: [
        { value: "walk", label: "Walk" },
        { value: "drive", label: "Drive" },
      ],
    },
    events: {
      "update:modelValue": "parity/segmented-control.parity.spec.ts",
      resetMixed: "parity/segmented-control.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSlider",
    react: "Slider",
    stories: "components/Slider/Slider.stories.tsx",
    elsewhere: {
      // Each its own render; WithReadout's formatValue is a function.
      Default: "parity/slider.parity.spec.ts",
      Range: "parity/slider.parity.spec.ts",
      WithReadout: "parity/slider.parity.spec.ts",
    },
    drawnIn: "parity/slider.parity.spec.ts",
    sample: { label: "Volume", defaultValue: [50] },
    events: {
      "update:modelValue": "parity/slider.parity.spec.ts",
      valueCommit: "parity/slider.parity.spec.ts",
    },
  },
  {
    vue: "KozmosListbox",
    react: "Listbox",
    stories: "components/Listbox/Listbox.stories.tsx",
    elsewhere: {
      Single: "parity/listbox.parity.spec.ts",
      Multiple: "parity/listbox.parity.spec.ts",
      Grouped: "parity/listbox.parity.spec.ts",
    },
    events: {
      "update:activeValue": "parity/listbox.parity.spec.ts",
      "update:modelValue": "parity/listbox.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSelect",
    react: "Select",
    stories: "components/Select/Select.stories.tsx",
    // Every story draws the parts by hand: select.parity.spec.ts draws each
    // in both, closed in a server render and open, mounted.
    elsewhere: {
      Default: "parity/select.parity.spec.ts",
      WithScroll: "parity/select.parity.spec.ts",
      Disabled: "parity/select.parity.spec.ts",
      WithError: "parity/select.parity.spec.ts",
      OptionCounts: "parity/select.parity.spec.ts",
      OptionCountsOpen: "parity/select.parity.spec.ts",
      MixedValue: "parity/select.parity.spec.ts",
    },
    drawnIn: "parity/select.parity.spec.ts",
    // Open, so its list and items are drawn in the document, in the theme's
    // portal, where the attributes and listeners checks look for theirs.
    sample: { defaultOpen: true },
    events: {
      "update:open": "parity/select.parity.spec.ts",
      "update:modelValue": "parity/select.parity.spec.ts",
      resetMixed: "parity/select.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSelectTrigger",
    react: "SelectTrigger",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "Select",
    sample: { "aria-label": "Fruit" },
  },
  {
    vue: "KozmosSelectValue",
    react: "SelectValue",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "Select",
    sample: {},
  },
  {
    vue: "KozmosSelectContent",
    react: "SelectContent",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "Select",
    sample: {},
    events: {
      closeAutoFocus: "parity/select.parity.spec.ts",
      escapeKeyDown: "parity/select.parity.spec.ts",
      pointerDownOutside: "parity/select.parity.spec.ts",
    },
  },
  {
    vue: "KozmosSelectGroup",
    react: "SelectGroup",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "SelectContent",
    sample: {},
  },
  {
    vue: "KozmosSelectLabel",
    react: "SelectLabel",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    // Radix's label names its group: drawn only inside one.
    within: "SelectGroup",
    sample: { children: "Fruits" },
  },
  {
    vue: "KozmosSelectItem",
    react: "SelectItem",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "SelectContent",
    sample: { value: "apple", children: "Apple" },
  },
  {
    vue: "KozmosSelectSeparator",
    react: "SelectSeparator",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "SelectContent",
    sample: {},
  },
  {
    vue: "KozmosSelectScrollUpButton",
    react: "SelectScrollUpButton",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "SelectContent",
    // Drawn only while the list can scroll up, which a jsdom list cannot.
    unmarked: {
      why: "Radix and Reka draw the arrow only while the list can scroll, and nothing scrolls in jsdom",
      drawnIn: "parity/select.parity.spec.ts",
    },
    sample: {},
  },
  {
    vue: "KozmosSelectScrollDownButton",
    react: "SelectScrollDownButton",
    stories: null,
    drawnIn: "parity/select.parity.spec.ts",
    within: "SelectContent",
    unmarked: {
      why: "Radix and Reka draw the arrow only while the list can scroll, and nothing scrolls in jsdom",
      drawnIn: "parity/select.parity.spec.ts",
    },
    sample: {},
  },
  {
    vue: "KozmosCombobox",
    react: "Combobox",
    stories: "components/Combobox/Combobox.stories.tsx",
    elsewhere: {
      Default: "parity/combobox.parity.spec.ts",
      WithValidation: "parity/combobox.parity.spec.ts",
      Grouped: "parity/combobox.parity.spec.ts",
      MixedValue: "parity/combobox.parity.spec.ts",
    },
    drawnIn: "parity/combobox.parity.spec.ts",
    sample: {
      label: "View",
      options: [
        { value: "overview", label: "Overview" },
        { value: "details", label: "Details" },
      ],
    },
    events: {
      "update:inputValue": "parity/combobox.parity.spec.ts",
      "update:modelValue": "parity/combobox.parity.spec.ts",
      resetMixed: "parity/combobox.parity.spec.ts",
    },
  },
  {
    vue: "KozmosChip",
    react: "Chip",
    stories: "components/Chip/Chip.stories.tsx",
    elsewhere: {
      Default: "parity/chip.parity.spec.ts",
      Sizes: "parity/chip.parity.spec.ts",
      Variants: "parity/chip.parity.spec.ts",
      OneChoice: "parity/chip.parity.spec.ts",
    },
    drawnIn: "parity/chip.parity.spec.ts",
    sample: { children: "Coffee" },
    events: {
      remove: "parity/chip.parity.spec.ts",
    },
  },
  {
    vue: "KozmosChipGroup",
    react: "ChipGroup",
    // React's Chip and ChipGroup are one module, Chip, and share its stories.
    stories: null,
    drawnIn: "parity/chip.parity.spec.ts",
    sample: {},
    events: {
      "update:modelValue": "parity/chip.parity.spec.ts",
    },
  },
  {
    vue: "KozmosMultiSelect",
    react: "MultiSelect",
    stories: "components/MultiSelect/MultiSelect.stories.tsx",
    elsewhere: {
      Default: "parity/multi-select.parity.spec.ts",
      WithSelectedValues: "parity/multi-select.parity.spec.ts",
      Grouped: "parity/multi-select.parity.spec.ts",
    },
    drawnIn: "parity/multi-select.parity.spec.ts",
    sample: {
      label: "Tools",
      options: [
        { value: "filters", label: "Filters" },
        { value: "layers", label: "Layers" },
      ],
      defaultValue: ["filters"],
    },
    events: {
      "update:searchValue": "parity/multi-select.parity.spec.ts",
      "update:modelValue": "parity/multi-select.parity.spec.ts",
      resetMixed: "parity/multi-select.parity.spec.ts",
    },
  },
  {
    vue: "KozmosChipInput",
    react: "ChipInput",
    stories: "components/ChipInput/ChipInput.stories.tsx",
    elsewhere: {
      Default: "parity/chip-input.parity.spec.ts",
    },
    drawnIn: "parity/chip-input.parity.spec.ts",
    sample: { label: "Keywords", defaultValue: ["coffee"] },
    events: {
      "update:modelValue": "parity/chip-input.parity.spec.ts",
      "update:inputValue": "parity/chip-input.parity.spec.ts",
    },
  },
  {
    vue: "KozmosDialog",
    react: "Dialog",
    stories: "components/Dialog/Dialog.stories.tsx",
    // Its story draws the parts by hand: dialog.parity.spec.ts draws it in
    // both, closed in a server render and open, mounted.
    elsewhere: { Default: "parity/dialog.parity.spec.ts" },
    drawnIn: "parity/dialog.parity.spec.ts",
    // Open, so its content is drawn in the document, in the theme's portal,
    // where the attributes and listeners checks look for its parts'.
    sample: { defaultOpen: true },
    events: { "update:open": "parity/dialog.parity.spec.ts" },
  },
  {
    vue: "KozmosDialogTrigger",
    react: "DialogTrigger",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    within: "Dialog",
    sample: { children: "Edit Profile" },
  },
  {
    vue: "KozmosDialogContent",
    react: "DialogContent",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    within: "Dialog",
    sample: {},
    events: {
      openAutoFocus: "parity/dialog.parity.spec.ts",
      closeAutoFocus: "parity/dialog.parity.spec.ts",
      escapeKeyDown: "parity/dialog.parity.spec.ts",
      pointerDownOutside: "parity/dialog.parity.spec.ts",
      focusOutside: "parity/dialog.parity.spec.ts",
      interactOutside: "parity/dialog.parity.spec.ts",
    },
  },
  {
    vue: "KozmosDialogHeader",
    react: "DialogHeader",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    sample: { children: "Edit profile" },
  },
  {
    vue: "KozmosDialogFooter",
    react: "DialogFooter",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    sample: { children: "Save" },
  },
  {
    vue: "KozmosDialogTitle",
    react: "DialogTitle",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    within: "DialogContent",
    sample: { children: "Edit profile" },
  },
  {
    vue: "KozmosDialogDescription",
    react: "DialogDescription",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    within: "DialogContent",
    sample: { children: "Make changes." },
  },
  {
    vue: "KozmosDialogClose",
    react: "DialogClose",
    stories: null,
    drawnIn: "parity/dialog.parity.spec.ts",
    within: "DialogContent",
    sample: { children: "Cancel" },
  },
  {
    vue: "KozmosDrawer",
    react: "Drawer",
    stories: "components/Drawer/Drawer.stories.tsx",
    // Its stories draw the parts by hand: drawer.parity.spec.ts draws each
    // in both, closed in a server render and open, mounted.
    elsewhere: {
      Default: "parity/drawer.parity.spec.ts",
      Inline: "parity/drawer.parity.spec.ts",
    },
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { defaultOpen: true },
    events: { "update:open": "parity/drawer.parity.spec.ts" },
  },
  {
    vue: "KozmosDrawerTrigger",
    react: "DrawerTrigger",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "Drawer",
    sample: { children: "Open drawer" },
  },
  {
    vue: "KozmosDrawerContent",
    react: "DrawerContent",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "Drawer",
    sample: {},
    events: {
      openAutoFocus: "parity/drawer.parity.spec.ts",
      closeAutoFocus: "parity/drawer.parity.spec.ts",
      escapeKeyDown: "parity/drawer.parity.spec.ts",
      pointerDownOutside: "parity/drawer.parity.spec.ts",
      focusOutside: "parity/drawer.parity.spec.ts",
      interactOutside: "parity/drawer.parity.spec.ts",
    },
  },
  {
    vue: "KozmosDrawerHeader",
    react: "DrawerHeader",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { children: "Manage" },
  },
  {
    vue: "KozmosDrawerFooter",
    react: "DrawerFooter",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { children: "Save" },
  },
  {
    vue: "KozmosDrawerTitle",
    react: "DrawerTitle",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "DrawerContent",
    sample: { children: "Manage" },
  },
  {
    vue: "KozmosDrawerDescription",
    react: "DrawerDescription",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "DrawerContent",
    sample: { children: "Review." },
  },
  {
    vue: "KozmosDrawerClose",
    react: "DrawerClose",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "DrawerContent",
    sample: { children: "Cancel" },
  },
  {
    vue: "KozmosBottomSheet",
    react: "BottomSheet",
    stories: "components/BottomSheet/BottomSheet.stories.tsx",
    // Its story draws the parts by hand: drawer.parity.spec.ts draws it in
    // both, closed in a server render and open, mounted.
    elsewhere: { Default: "parity/drawer.parity.spec.ts" },
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { defaultOpen: true },
    events: { "update:open": "parity/drawer.parity.spec.ts" },
  },
  {
    vue: "KozmosBottomSheetTrigger",
    react: "BottomSheetTrigger",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "BottomSheet",
    sample: { children: "Open" },
  },
  {
    vue: "KozmosBottomSheetContent",
    react: "BottomSheetContent",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "BottomSheet",
    sample: {},
    events: {
      openAutoFocus: "parity/drawer.parity.spec.ts",
      closeAutoFocus: "parity/drawer.parity.spec.ts",
      escapeKeyDown: "parity/drawer.parity.spec.ts",
      pointerDownOutside: "parity/drawer.parity.spec.ts",
      focusOutside: "parity/drawer.parity.spec.ts",
      interactOutside: "parity/drawer.parity.spec.ts",
    },
  },
  {
    vue: "KozmosBottomSheetHeader",
    react: "BottomSheetHeader",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { children: "Edit" },
  },
  {
    vue: "KozmosBottomSheetFooter",
    react: "BottomSheetFooter",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    sample: { children: "Save" },
  },
  {
    vue: "KozmosBottomSheetTitle",
    react: "BottomSheetTitle",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "BottomSheetContent",
    sample: { children: "Edit" },
  },
  {
    vue: "KozmosBottomSheetDescription",
    react: "BottomSheetDescription",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "BottomSheetContent",
    sample: { children: "Make changes." },
  },
  {
    vue: "KozmosBottomSheetClose",
    react: "BottomSheetClose",
    stories: null,
    drawnIn: "parity/drawer.parity.spec.ts",
    within: "BottomSheetContent",
    sample: { children: "Cancel" },
  },
  {
    vue: "KozmosPopover",
    react: "Popover",
    stories: "components/Popover/Popover.stories.tsx",
    // Its stories draw the parts by hand: popover.parity.spec.ts draws them
    // in both, closed in a server render and open, mounted.
    elsewhere: {
      Default: "parity/popover.parity.spec.ts",
      AnchoredToAControl: "parity/popover.parity.spec.ts",
      AnchoredToARect: "parity/popover.parity.spec.ts",
    },
    drawnIn: "parity/popover.parity.spec.ts",
    sample: { defaultOpen: true },
    events: { "update:open": "parity/popover.parity.spec.ts" },
  },
  {
    vue: "KozmosPopoverTrigger",
    react: "PopoverTrigger",
    stories: null,
    drawnIn: "parity/popover.parity.spec.ts",
    within: "Popover",
    sample: { children: "Open popover" },
  },
  {
    vue: "KozmosPopoverAnchor",
    react: "PopoverAnchor",
    stories: null,
    drawnIn: "parity/popover.parity.spec.ts",
    within: "Popover",
    sample: { children: "Add desk" },
  },
  {
    vue: "KozmosPopoverContent",
    react: "PopoverContent",
    stories: null,
    drawnIn: "parity/popover.parity.spec.ts",
    within: "Popover",
    sample: {},
    events: {
      openAutoFocus: "parity/popover.parity.spec.ts",
      closeAutoFocus: "parity/popover.parity.spec.ts",
      escapeKeyDown: "parity/popover.parity.spec.ts",
      pointerDownOutside: "parity/popover.parity.spec.ts",
      focusOutside: "parity/popover.parity.spec.ts",
      interactOutside: "parity/popover.parity.spec.ts",
    },
  },
  {
    vue: "KozmosPopoverArrow",
    react: "PopoverArrow",
    stories: null,
    drawnIn: "parity/popover.parity.spec.ts",
    within: "PopoverContent",
    sample: {},
  },
  {
    vue: "KozmosAnchoredPopover",
    // Vue's own (GAP-190): React's Popover, a PopoverAnchor on `anchor` and
    // a PopoverContent in one part, as the bridge's was. It takes what the
    // content takes, and the root's open state and `anchor` beside it
    // (contract/exceptions.ts); the attribute checks draw React's content in
    // an open Popover beside it.
    react: "PopoverContent",
    stories: null,
    drawnIn: "parity/popover.parity.spec.ts",
    within: "Popover",
    sample: { open: true },
    events: {
      "update:open": "parity/popover.parity.spec.ts",
      openAutoFocus: "parity/popover.parity.spec.ts",
      closeAutoFocus: "parity/popover.parity.spec.ts",
      escapeKeyDown: "parity/popover.parity.spec.ts",
      pointerDownOutside: "parity/popover.parity.spec.ts",
      focusOutside: "parity/popover.parity.spec.ts",
      interactOutside: "parity/popover.parity.spec.ts",
    },
  },
  {
    vue: "KozmosTooltip",
    react: "Tooltip",
    stories: "components/Tooltip/Tooltip.stories.tsx",
    // Its story draws the parts by hand: tooltip.parity.spec.ts draws it in
    // both, closed in a server render and open, mounted.
    elsewhere: { Default: "parity/tooltip.parity.spec.ts" },
    drawnIn: "parity/tooltip.parity.spec.ts",
    within: "TooltipProvider",
    sample: { open: true },
    events: { "update:open": "parity/tooltip.parity.spec.ts" },
  },
  {
    vue: "KozmosTooltipProvider",
    react: "TooltipProvider",
    stories: null,
    drawnIn: "parity/tooltip.parity.spec.ts",
    sample: {},
  },
  {
    vue: "KozmosTooltipTrigger",
    react: "TooltipTrigger",
    stories: null,
    drawnIn: "parity/tooltip.parity.spec.ts",
    within: "Tooltip",
    sample: { children: "Hover me" },
  },
  {
    vue: "KozmosTooltipContent",
    react: "TooltipContent",
    stories: null,
    drawnIn: "parity/tooltip.parity.spec.ts",
    within: "Tooltip",
    sample: { children: "Add to library" },
    events: {
      escapeKeyDown: "parity/tooltip.parity.spec.ts",
      pointerDownOutside: "parity/tooltip.parity.spec.ts",
    },
  },
];

/**
 * Native parts the bridge still exports, by their Vue name, with why: one
 * name is one component, so each leaves `src/react-bridge/index.ts` when its
 * port lands (PORTING.md, step 9). `coverage.spec.ts` fails on a native
 * part the bridge exports that is not here, and on a name here that is not
 * both native and bridged.
 */
export const LEAVING_BRIDGE: Record<string, string> = {};

/**
 * The wave a part reaches Vue in: V3 overlays, feedback and menus; V4
 * navigation and data; V5 pickers; the SDK track after the core parts
 * (decision of 22 Nov); or never, with why.
 */
export type Wave = "V3" | "V4" | "V5" | "SDK" | "never";

const MENU_PARTS =
  "a part of Menu, which the bridge mounts only as a whole: a Vue app cannot compose Menu's content, items, groups or submenus until Menu and its parts are ported";
const CONTEXT_MENU_PARTS =
  "a part of ContextMenu, which the bridge mounts only as a whole: a Vue app cannot compose its trigger, content or items until ContextMenu and its parts are ported";
const PAGINATION_PARTS =
  "a part of Pagination, which the bridge mounts only as a whole: a Vue app cannot compose its own pager from these until Pagination and its parts are ported";
const TABLE_PARTS =
  "a part of Table, which the bridge mounts only as a whole: a Vue app cannot compose rows, cells or selection until Table and its parts are ported";
const TREE_PARTS =
  "a row of Tree, which the bridge mounts only as a whole: a Vue app cannot compose Tree's rows until Tree and its rows are ported";
const SDK_PART =
  "an SDK part with no Vue port and no bridge entry; the SDK parts come after every core part";
const NOT_EXPORTED_OVERLAY =
  "not exported from Vue, by decision (27 Nov): React's content part always draws its own portal and overlay (DialogContent, DrawerContent), and Vue's native one draws Reka's, with portalContainer for the target, as React's does. The separate part is useful only beside a content built from Radix itself, which no story, example or app in this repository does";

/**
 * React parts a Vue app can reach neither from the main entry nor from the
 * bridge, by their React export, each with why and the wave that brings it
 * (`Wave`). `coverage.spec.ts` fails on a React part that is neither
 * reachable nor here, and on a name here that is not a React part or that
 * Vue now reaches, so the list only shrinks as the waves land.
 */
export const NOT_IN_VUE: Record<string, { wave: Wave; why: string }> = {
  KozmosTheme: {
    wave: "never",
    why: "React's alias for DesignConfigProvider; Vue exports KozmosDesignConfigProvider, and in Vue KozmosTheme is the theme type (GAP-291)",
  },
  DialogPortal: { wave: "never", why: NOT_EXPORTED_OVERLAY },
  DialogOverlay: { wave: "never", why: NOT_EXPORTED_OVERLAY },
  DrawerPortal: { wave: "never", why: NOT_EXPORTED_OVERLAY },
  DrawerOverlay: { wave: "never", why: NOT_EXPORTED_OVERLAY },
  ...Object.fromEntries(
    [
      "MenuCheckboxItem",
      "MenuContent",
      "MenuGroup",
      "MenuItem",
      "MenuLabel",
      "MenuPortal",
      "MenuRadioGroup",
      "MenuRadioItem",
      "MenuSeparator",
      "MenuShortcut",
      "MenuSub",
      "MenuSubContent",
      "MenuSubTrigger",
      "MenuTrigger",
    ].map((name) => [name, { wave: "V3", why: MENU_PARTS }]),
  ),
  ...Object.fromEntries(
    [
      "ContextMenuCheckboxItem",
      "ContextMenuContent",
      "ContextMenuGroup",
      "ContextMenuItem",
      "ContextMenuLabel",
      "ContextMenuPortal",
      "ContextMenuRadioGroup",
      "ContextMenuRadioItem",
      "ContextMenuSeparator",
      "ContextMenuShortcut",
      "ContextMenuSub",
      "ContextMenuSubContent",
      "ContextMenuSubTrigger",
      "ContextMenuTrigger",
    ].map((name) => [name, { wave: "V3", why: CONTEXT_MENU_PARTS }]),
  ),
  ...Object.fromEntries(
    [
      "PaginationContent",
      "PaginationEllipsis",
      "PaginationItem",
      "PaginationLink",
      "PaginationNext",
      "PaginationPrevious",
    ].map((name) => [name, { wave: "V4", why: PAGINATION_PARTS }]),
  ),
  ...Object.fromEntries(
    [
      "TableBody",
      "TableCaption",
      "TableCell",
      "TableFooter",
      "TableHead",
      "TableHeader",
      "TableRow",
      "TableRowSelect",
      "TableSelectAll",
    ].map((name) => [name, { wave: "V4", why: TABLE_PARTS }]),
  ),
  ...Object.fromEntries(
    [
      "TreeChildItemRow",
      "TreeItemRow",
      "TreeParentItemRow",
      "TreeSectionRow",
    ].map((name) => [name, { wave: "V4", why: TREE_PARTS }]),
  ),
  ActionCard: {
    wave: "V4",
    why: "a core part (rich content in an assistant's turn) with no Vue port and no bridge entry",
  },
  UserMessage: {
    wave: "V4",
    why: "a core part (the visitor's turn in a conversation) with no Vue port and no bridge entry",
  },
  Calendar: {
    wave: "V5",
    why: "a core picker with no bridge entry of its own: DatePicker and DateRangePicker are bridged, the month grid they draw is not",
  },
  ...Object.fromEntries(
    [
      "AICompanionPanel",
      "AIInputBar",
      "AIMessage",
      "AIMessageList",
      "AISearchButton",
      "ArrivalPanel",
      "CategoryField",
      "ClientAppBanner",
      "DirectionIcon",
      "Itinerary",
      "LanguageSwitcher",
      "ManoeuvreCard",
      "MapAttribution",
      "MapInfo",
      "MapInfoPanel",
      "MapStatusPill",
      "POIResultGroup",
      "RouteLocationField",
      "RouteProgressRail",
      "RouteSetupPanel",
    ].map((name) => [name, { wave: "SDK", why: SDK_PART }]),
  ),
};

/**
 * Composables the main entry exports, with the React hook each answers to.
 * The contract holds what each returns to React's: the same keys, a ref in
 * Vue for each value in React, the same functions.
 */
export const COMPOSABLES: { vue: string; react: string }[] = [
  { vue: "useTheme", react: "useTheme" },
  { vue: "useKozmosAnalytics", react: "useKozmosAnalytics" },
  { vue: "useDesignConfig", react: "useDesignConfig" },
];

export const REPOSITORY = path.resolve(__dirname, "../../..");
export const REACT_SOURCE = path.join(REPOSITORY, "packages/react/src");
export const VUE_DIST = path.resolve(__dirname, "../dist");
