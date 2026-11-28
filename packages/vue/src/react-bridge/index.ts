/**
 * `@kozmos-ds/vue/react-bridge`: the Kozmos parts that have no Vue port yet,
 * each mounting its React component. A wrapper in no other wrapper's slot
 * is a React root; one in another's slot is drawn in that one's React tree,
 * so a part made of parts (`KozmosTabs` and its list, triggers and panels)
 * is one React tree, and the Vue
 * providers around it (KozmosThemeProvider, KozmosDensityScope,
 * KozmosAnalyticsProvider) reach every part it draws (GAP-230, decision
 * 172; react-adapter.ts). It needs `react`, `react-dom` and
 * `@kozmos-ds/react`, which the main entry never imports. A part leaves
 * this file when its Vue port lands in the main entry (`KozmosButton` and
 * `KozmosThemeProvider` were the first, Vue 3 Phase 0;
 * `KozmosAnalyticsProvider` left in 0.17.0), so one name is never two
 * components.
 */
import React from "react";
import {
  createVueWrapper,
  describeBooleans,
  describeParts,
  eventValue,
} from "./react-adapter";
import {
  ADAPTER_BOOLEANS,
  ADAPTER_TAKES,
  PART_BOOLEANS,
  PART_TAKES,
} from "./part-takes";
import {
  SearchBar,
  BottomNavigation,
  Navbar,
  Sidebar,
  Toast,
  Pagination,
  Stepper,
  Backdrop,
  SettingsRow,
  Table,
  Tree,
  Accordion,
  MapView,
  LocationPin,
  WayfindingCard,
  WayfindingInputRow,
  DirectionStep,
  FloorSelector,
  POICard,
  FileUpload as ReactFileUpload,
  ImageCropper,
  DatePicker,
  TimePicker,
  FloatingActionButton,
  ToggleButton,
  Tabs,
  MapOverlay,
  DynamicIsland,
  FeedbackCard,
  MapControlsGroup,
  NavigationAnnouncer,
  RouteSummary,
  RoutingInputGroup,
  SaveLocationCard,
  ScrollArea,
  UserLocationMarker,
  AdaptiveMapShell,
  DEFAULT_PANEL_DETENTS,
  orderPanelDetents,
  type PanelDetent,
  BrowseCategoriesPanel,
  CategoryTile,
  ColorPicker,
  DateRangePicker,
  MapControlButton,
  NavigationItem,
  POIDetailPanel,
  POIMediaGallery,
  POIResultCard,
  POIResultList,
  RouteOptionCard,
  RoutePreviewPanel,
  TourStep,
  // The parts of the parts made of parts (GAP-230): each is drawn in its
  // compound's React tree.
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  TabsList,
  TabsTrigger,
  TabsContent,
  Toaster,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "@kozmos-ds/react";

import { toReactTarget } from "./targets";

// Which `on…` props each React part takes, read from React's types
// (part-takes.ts): a listener whose prop the part takes is the part's, and
// any other a native listener on the wrapper's box (react-adapter.ts). And
// which of its props are booleans: a bare attribute of one is true.
describeParts(PART_TAKES);
describeBooleans(PART_BOOLEANS);

// What a consumer needs to wrap a React part of its own. The rest of
// react-adapter.ts is the bridge's.
export { createVueWrapper } from "./react-adapter";
export type {
  ModelBinding,
  ModelBindings,
  WrapperOptions,
} from "./react-adapter";

// ----------------------------------------------------------------------
// Custom Adapters for Complex Multi-Part Components (Inputs)
// ----------------------------------------------------------------------
// Backdrop's target may be a template ref on a component, or a ref() in a
// list: React is handed the element each names (GAP-189).
const BackdropAdapter = ({ target, ...props }: any) =>
  React.createElement(Backdrop, {
    ...props,
    target: target === undefined ? undefined : toReactTarget(target),
  });
BackdropAdapter.displayName = "Backdrop";

// TourStep's target is read as Backdrop's is: a template ref on a component
// is its element (GAP-188). One part, so the card, its Backdrop and its
// anchor share one React root. Named slots reach React as the props of
// their names (#title, #body, #instruction, #tourLabel), the default slot as
// the content after the instruction, and @back, @next, @secondary, @dismiss
// and @close as onBack, onNext, onSecondary, onDismiss and onClose: without
// one of them there is no such button.
const TourStepAdapter = ({ target, ...props }: any) =>
  React.createElement(TourStep, {
    ...props,
    target: target === undefined ? undefined : toReactTarget(target),
  });
TourStepAdapter.displayName = "TourStep";

// What each adapter hands on, as React's types read the parts it hands it
// to (part-takes.ts).
describeParts([
  [BackdropAdapter, ADAPTER_TAKES.BackdropAdapter],
  [TourStepAdapter, ADAPTER_TAKES.TourStepAdapter],
]);
describeBooleans([
  [BackdropAdapter, ADAPTER_BOOLEANS.BackdropAdapter],
  [TourStepAdapter, ADAPTER_BOOLEANS.TourStepAdapter],
]);

// ----------------------------------------------------------------------
// v-model, wrapper by wrapper (react-adapter.ts, VModel.spec.ts): React's
// prop for the value, the callback that reports a change, the value's own
// where the part has one (onValueChange), the DOM's onChange only where it
// has none, and what the part shows when the model is null (`empty`). Every
// controlled pair a part has is a model (VModel.spec.ts holds each part's
// pairs, read from its types, to this list): its `value` is `v-model`, any
// other `v-model:<prop>`, as the Vue ports name theirs (decision 160), and
// `open` and `checked` are every wrapper's (RADIX_MODELS).
// ----------------------------------------------------------------------

/** A text field's `v-model`: an `<input>`'s value and its DOM change event. */
const textField = {
  prop: "value",
  callback: "onChange",
  read: eventValue,
  empty: "",
} as const;

// ----------------------------------------------------------------------
// Universal Kozmos Vue 3 Component Exports (The Armada)
// ----------------------------------------------------------------------
export const KozmosSearchBar = createVueWrapper(SearchBar, {
  modelValue: { prop: "value", callback: "onChange", empty: "" },
});
export const KozmosBottomNavigation = createVueWrapper(BottomNavigation);
export const KozmosNavbar = createVueWrapper(Navbar);
export const KozmosSidebar = createVueWrapper(Sidebar);
export const KozmosToast = createVueWrapper(Toast);
export const KozmosPagination = createVueWrapper(Pagination);
export const KozmosStepper = createVueWrapper(Stepper);
// `positionLabel` may be a function: declared as a prop, it is handed to
// React and never written onto the wrapper's element as an attribute, as Vue
// writes every undeclared one (GAP-191).
Object.assign(KozmosStepper, { props: { positionLabel: null } });
export const KozmosBackdrop = createVueWrapper(BackdropAdapter);
// `target` is declared as a prop, so Vue never writes it onto the wrapper's
// element as an attribute: it does that with every undeclared attribute, and
// a component instance cannot be written as one ("Cannot convert object to
// primitive value"). The wrapper hands its props to React with its attrs.
Object.assign(KozmosBackdrop, { props: { target: null } });
// GAP-040: #control is the setting's control, @reset its Reset to default.
export const KozmosSettingsRow = createVueWrapper(SettingsRow);
// Its rows are React's, as `children` (GAP-016), so its selection reaches
// them: v-model:selectedIds is the selected rows' rowIds (GAP-171). Its row
// parts are not bridged: a <table> holds no box a Vue slot is drawn in.
export const KozmosTable = createVueWrapper(Table, {
  selectedIds: {
    prop: "selectedIds",
    callback: "onSelectedIdsChange",
    empty: [],
  },
});
// Its selection is reported as the item; the model is the item's id. A
// multiple tree's model is its selected ids (GAP-151).
export const KozmosTree = createVueWrapper(Tree, {
  expandedIds: { prop: "expandedIds", callback: "onExpandedChange", empty: [] },
  selectedId: {
    prop: "selectedId",
    callback: "onSelectionChange",
    read: (item) => item.id,
    empty: "",
  },
  selectedIds: {
    prop: "selectedIds",
    callback: "onSelectedIdsChange",
    empty: [],
  },
});
// Its name is its own `ariaLabel` prop, not an `aria-label` attribute:
// declared, `aria-label` reaches it by that name, as Vue gives a declared
// prop (GAP-238). Beside its models' props, which it would replace.
Object.assign(KozmosTree, {
  props: {
    ...(KozmosTree as unknown as { props: object }).props,
    ariaLabel: { type: String, default: undefined },
  },
});
// Its attrs are React's alone, as every wrapper's are: Vue would
// write each onto the wrapper's own box, where a component given as target
// or a function as positionLabel cannot be written, and title would be a
// native tooltip. The two are declared as props as well, as Backdrop's is.
export const KozmosTourStep = createVueWrapper(TourStepAdapter);
Object.assign(KozmosTourStep, {
  inheritAttrs: false,
  props: { target: null, positionLabel: null },
});
export const KozmosAccordion = createVueWrapper(Accordion, {
  modelValue: {
    prop: "value",
    callback: "onValueChange",
    empty: ({ type }) => (type === "multiple" ? [] : ""),
  },
});
export const KozmosMapView = createVueWrapper(MapView);
export const KozmosLocationPin = createVueWrapper(LocationPin);
export const KozmosWayfindingCard = createVueWrapper(WayfindingCard);
export const KozmosWayfindingInputRow = createVueWrapper(WayfindingInputRow, {
  originValue: { prop: "originValue", callback: "onOriginChange", empty: "" },
  destinationValue: {
    prop: "destinationValue",
    callback: "onDestinationChange",
    empty: "",
  },
});
export const KozmosDirectionStep = createVueWrapper(DirectionStep);
// FloorSelector has no floor of its own: given none, it marks none.
export const KozmosFloorSelector = createVueWrapper(FloorSelector, {
  modelValue: {
    prop: "selectedFloor",
    callback: "onFloorSelect",
    empty: undefined,
  },
});
export const KozmosPOICard = createVueWrapper(POICard);
export const KozmosFileUpload = createVueWrapper(ReactFileUpload, {
  modelValue: { prop: "value", callback: "onFilesChange", empty: [] },
});
// v-model is the frame, as fractions of the image (React's value and
// onCrop); null frames the middle at 100%.
export const KozmosImageCropper = createVueWrapper(ImageCropper, {
  modelValue: { prop: "value", callback: "onCrop", empty: null },
});
export const KozmosDatePicker = createVueWrapper(DatePicker, {
  modelValue: textField,
});
export const KozmosTimePicker = createVueWrapper(TimePicker, {
  modelValue: textField,
});
export const KozmosFloatingActionButton =
  createVueWrapper(FloatingActionButton);
export const KozmosToggleButton = createVueWrapper(ToggleButton, {
  pressed: { prop: "pressed", callback: "onPressedChange", empty: false },
});
export const KozmosTabs = createVueWrapper(Tabs, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});
export const KozmosMapOverlay = createVueWrapper(MapOverlay);
export const KozmosDynamicIsland = createVueWrapper(DynamicIsland);
export const KozmosFeedbackCard = createVueWrapper(FeedbackCard);
export const KozmosMapControlsGroup = createVueWrapper(MapControlsGroup, {
  stepFree: { prop: "stepFree", callback: "onStepFreeChange", empty: false },
});
export const KozmosNavigationAnnouncer = createVueWrapper(NavigationAnnouncer);
export const KozmosRouteSummary = createVueWrapper(RouteSummary);
export const KozmosRoutingInputGroup = createVueWrapper(RoutingInputGroup);
export const KozmosSaveLocationCard = createVueWrapper(SaveLocationCard);
export const KozmosScrollArea = createVueWrapper(ScrollArea);
export const KozmosUserLocationMarker = createVueWrapper(UserLocationMarker);

// ----------------------------------------------------------------------
// Components added after the original adapter list was written.
// ----------------------------------------------------------------------
// Null is where the shell rests a sheet it is not told about
// (AdaptiveMapShell.tsx, `activeDetent`): its default detent; else, of what
// it offers ordered by height with equal heights dropped, medium if it is
// there, else the middle one. A fraction that is not a finite number offers
// nothing, as the shell reads it. The order is the shell's own
// (`orderPanelDetents`), in a shell tall enough that its fixed sizes, such
// as collapsed's 112 px floor, rank as they do in any phone's. What the
// shell measures cannot be ranked here: content and an exact height, and
// collapsed beside a fraction, since a peek anchor or a tall header can
// raise it past one. A list with any of them is taken as given.
const RANKING_HEIGHT = 1_000_000;
const isFraction = (detent: PanelDetent) =>
  typeof detent === "object" && "fraction" in detent;
export const KozmosAdaptiveMapShell = createVueWrapper(AdaptiveMapShell, {
  panelDetent: {
    prop: "panelDetent",
    callback: "onPanelDetentChange",
    empty: ({
      defaultPanelDetent,
      panelDetents,
      panelFraction,
      panelSizing,
    }) => {
      if (defaultPanelDetent !== undefined) return defaultPanelDetent;
      const offered: readonly PanelDetent[] =
        panelDetents ??
        (panelSizing === "content"
          ? ["content"]
          : Number.isFinite(panelFraction)
            ? [{ fraction: panelFraction as number }]
            : DEFAULT_PANEL_DETENTS);
      const measured =
        offered.some(
          (detent) =>
            detent === "content" ||
            (typeof detent === "object" && "height" in detent),
        ) ||
        (offered.includes("collapsed") && offered.some(isFraction));
      const ordered = measured
        ? offered
        : orderPanelDetents(offered, RANKING_HEIGHT);
      return ordered.includes("medium")
        ? "medium"
        : (ordered[Math.floor(ordered.length / 2)] ?? "medium");
    },
  },
});
export const KozmosBrowseCategoriesPanel = createVueWrapper(
  BrowseCategoriesPanel,
);
export const KozmosCategoryTile = createVueWrapper(CategoryTile);
export const KozmosMapControlButton = createVueWrapper(MapControlButton);
export const KozmosNavigationItem = createVueWrapper(NavigationItem);
export const KozmosPOIDetailPanel = createVueWrapper(POIDetailPanel);
export const KozmosPOIMediaGallery = createVueWrapper(POIMediaGallery, {
  activeIndex: {
    prop: "activeIndex",
    callback: "onActiveIndexChange",
    empty: ({ defaultActiveIndex = 0 }) => defaultActiveIndex,
  },
});
export const KozmosPOIResultCard = createVueWrapper(POIResultCard);
export const KozmosPOIResultList = createVueWrapper(POIResultList);
export const KozmosRouteOptionCard = createVueWrapper(RouteOptionCard);
export const KozmosRoutePreviewPanel = createVueWrapper(RoutePreviewPanel);
// The value-level callbacks, never the DOM's onChange: Combobox's and
// MultiSelect's inputs hold the query, not the value, and NumberInput's
// onChange reports a string.
// Its opacity and format, with nothing chosen, are its defaults.
export const KozmosColorPicker = createVueWrapper(ColorPicker, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
  alpha: {
    prop: "alpha",
    callback: "onAlphaChange",
    empty: ({ defaultAlpha = 100 }) => defaultAlpha,
  },
  format: {
    prop: "format",
    callback: "onFormatChange",
    empty: ({ defaultFormat = "hsl" }) => defaultFormat,
  },
});
export const KozmosDateRangePicker = createVueWrapper(DateRangePicker, {
  modelValue: {
    prop: "value",
    callback: "onValueChange",
    empty: { start: "", end: "" },
  },
});
// ----------------------------------------------------------------------
// The parts of the parts made of parts (GAP-230, decision 172). Each is
// drawn in the React tree of the wrapper whose slot it is in, so it finds
// the context its compound gives it, as a React child does:
//
//   <KozmosTabs v-model="level">
//     <KozmosTabsList>
//       <KozmosTabsTrigger value="1">Level 1</KozmosTabsTrigger>
//     </KozmosTabsList>
//   </KozmosTabs>
//
// A trigger draws its own button: `as-child` cannot hand its behaviour to
// a Vue element (a slot is drawn in a box of its own), so open what it
// opens from a KozmosButton by its `v-model` instead.
// ----------------------------------------------------------------------
export const KozmosAccordionItem = createVueWrapper(AccordionItem);
export const KozmosAccordionTrigger = createVueWrapper(AccordionTrigger);
export const KozmosAccordionContent = createVueWrapper(AccordionContent);
export const KozmosTabsList = createVueWrapper(TabsList);
export const KozmosTabsTrigger = createVueWrapper(TabsTrigger);
export const KozmosTabsContent = createVueWrapper(TabsContent);
// Mount one KozmosToaster, inside a KozmosThemeProvider, and call `toast()`
// from anywhere: its toasts are drawn in the provider's theme, as React's.
// The parts below compose a toast by hand, as React's do.
export const KozmosToaster = createVueWrapper(Toaster);
export { toast } from "@kozmos-ds/react";
export const KozmosToastProvider = createVueWrapper(ToastProvider);
export const KozmosToastViewport = createVueWrapper(ToastViewport);
export const KozmosToastTitle = createVueWrapper(ToastTitle);
export const KozmosToastDescription = createVueWrapper(ToastDescription);
export const KozmosToastAction = createVueWrapper(ToastAction);
export const KozmosToastClose = createVueWrapper(ToastClose);
