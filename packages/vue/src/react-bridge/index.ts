/**
 * `@kozmos-ds/vue/react-bridge`: the Kozmos parts that have no Vue port yet,
 * each mounting its React component in a React root of its own. It needs
 * `react`, `react-dom` and `@kozmos-ds/react`, which the main entry never
 * imports. A part leaves this file when its Vue port lands in the main entry
 * (`KozmosButton` and `KozmosThemeProvider` were the first, Vue 3 Phase 0),
 * so one name is never two components.
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
  Box,
  Stack,
  Grid,
  Text,
  Heading,
  Container,
  Icon,
  Counter as ReactCounter,
  Badge as ReactBadge,
  Label,
  Input as ReactInput,
  Textarea,
  Checkbox as ReactCheckbox,
  Switch,
  Card,
  Slider as ReactSlider,
  Search,
  SearchBar,
  Select,
  BottomNavigation,
  Navbar,
  Sidebar,
  Menu,
  Drawer,
  Toast,
  Breadcrumb,
  Pagination,
  Stepper,
  Alert as ReactAlert,
  AlertTitle,
  AlertDescription,
  Progress,
  Spinner,
  Skeleton,
  Backdrop,
  Avatar as ReactAvatar,
  AvatarImage,
  AvatarFallback,
  Tag as ReactTag,
  List,
  Table,
  Tree,
  Timeline,
  Tooltip,
  Popover,
  PopoverAnchor,
  PopoverContent,
  Accordion,
  Separator,
  MapView,
  LocationPin,
  WayfindingCard,
  WayfindingInputRow,
  DirectionStep,
  FloorSelector,
  POICard,
  BottomSheet,
  OTPInput as ReactOTPInput,
  Rating,
  FileUpload as ReactFileUpload,
  DatePicker,
  TimePicker,
  FloatingActionButton,
  SplitButton,
  ToggleButton,
  SegmentedControl,
  Link,
  IconButton,
  Tabs,
  Dialog,
  MapOverlay,
  AnalyticsProvider,
  Chip,
  DynamicIsland,
  EmptyState,
  FeedbackCard,
  FieldWrapper,
  MapControlsGroup,
  NavigationAnnouncer,
  RadioGroup as ReactRadioGroup,
  RadioGroupItem as ReactRadioGroupItem,
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
  Combobox,
  DateRangePicker,
  Listbox,
  MapControlButton,
  MultiSelect,
  NavigationItem,
  NumberInput,
  POIDetailPanel,
  POIMediaGallery,
  POIResultCard,
  POIResultList,
  PasswordInput,
  RouteOptionCard,
  RoutePreviewPanel,
  TourStep,
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
// Custom Adapters for Complex Multi-Part Components (Avatar, Alert, Inputs)
// ----------------------------------------------------------------------
const AvatarAdapter = ({
  src,
  alt,
  fallback,
  size,
  className,
  ...props
}: any) =>
  React.createElement(
    ReactAvatar,
    { className, size, ...props },
    src ? React.createElement(AvatarImage, { src, alt }) : null,
    React.createElement(AvatarFallback, null, fallback || "DK"),
  );

const AlertAdapter = ({
  variant,
  title,
  description,
  className,
  ...props
}: any) =>
  React.createElement(
    ReactAlert,
    { variant, className, ...props },
    title ? React.createElement(AlertTitle, null, title) : null,
    description
      ? React.createElement(AlertDescription, null, description)
      : null,
  );

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

// GAP-190: a popover the product opens beside an element or rect it does not
// own. One part, not a PopoverAnchor of its own: every wrapper mounts its own
// React root, and Radix's anchor must share its Popover's. `anchor` is an
// element, a Vue component (a template ref on KozmosButton: its element), or
// anything with a getBoundingClientRect(); the rest go to PopoverContent,
// v-model:open to `open` and `onOpenChange`. Focus is React's: a close that
// loses it gives it back to what had it, else to an element anchor.
type Rect = { getBoundingClientRect(): DOMRect };

/** The element or rect `anchor` names, or null while it has none yet. */
function resolveAnchor(anchor: unknown): Element | Rect | null {
  let node: unknown =
    anchor && typeof anchor === "object" && "$el" in anchor
      ? (anchor as { $el: unknown }).$el
      : anchor;
  // A wrapper's own box draws nothing (display: contents): its element is
  // the first one inside it, once React has drawn it.
  while (
    node instanceof Element &&
    node.ownerDocument.defaultView?.getComputedStyle(node).display ===
      "contents"
  ) {
    node = node.firstElementChild;
  }
  if (node instanceof Element) return node;
  return node && typeof (node as Rect).getBoundingClientRect === "function"
    ? (node as Rect)
    : null;
}

const AnchoredPopoverAdapter = ({
  anchor,
  open,
  defaultOpen,
  onOpenChange,
  modal,
  children,
  ...contentProps
}: any) => {
  const [, redraw] = React.useReducer((count: number) => count + 1, 0);
  const resolved = resolveAnchor(anchor);
  // A component's element arrives when its own React root draws it: watch
  // its box until then.
  const box =
    anchor && typeof anchor === "object" && "$el" in anchor
      ? (anchor as { $el: unknown }).$el
      : null;
  React.useEffect(() => {
    if (!(box instanceof Element)) return undefined;
    const observer = new MutationObserver(redraw);
    observer.observe(box, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [box]);
  const virtualRef = React.useMemo(() => ({ current: resolved }), [resolved]);
  return React.createElement(
    Popover,
    { open, defaultOpen, onOpenChange, modal },
    resolved ? React.createElement(PopoverAnchor, { virtualRef } as any) : null,
    React.createElement(PopoverContent, contentProps, children),
  );
};
AnchoredPopoverAdapter.displayName = "AnchoredPopover";

// What each adapter hands on, as React's types read the parts it hands it
// to (part-takes.ts).
describeParts([
  [AvatarAdapter, ADAPTER_TAKES.AvatarAdapter],
  [AlertAdapter, ADAPTER_TAKES.AlertAdapter],
  [BackdropAdapter, ADAPTER_TAKES.BackdropAdapter],
  [TourStepAdapter, ADAPTER_TAKES.TourStepAdapter],
  [AnchoredPopoverAdapter, ADAPTER_TAKES.AnchoredPopoverAdapter],
]);
describeBooleans([
  [AvatarAdapter, ADAPTER_BOOLEANS.AvatarAdapter],
  [AlertAdapter, ADAPTER_BOOLEANS.AlertAdapter],
  [BackdropAdapter, ADAPTER_BOOLEANS.BackdropAdapter],
  [TourStepAdapter, ADAPTER_BOOLEANS.TourStepAdapter],
  [AnchoredPopoverAdapter, ADAPTER_BOOLEANS.AnchoredPopoverAdapter],
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
export const KozmosBox = createVueWrapper(Box);
export const KozmosStack = createVueWrapper(Stack);
export const KozmosGrid = createVueWrapper(Grid);
export const KozmosText = createVueWrapper(Text);
export const KozmosHeading = createVueWrapper(Heading);
export const KozmosContainer = createVueWrapper(Container);
export const KozmosIcon = createVueWrapper(Icon);
export const KozmosCounter = createVueWrapper(ReactCounter);
export const KozmosBadge = createVueWrapper(ReactBadge);
export const KozmosLabel = createVueWrapper(Label);
export const KozmosCard = createVueWrapper(Card);
// Null is where the slider starts: its default, else its own fallback.
export const KozmosSlider = createVueWrapper(ReactSlider, {
  modelValue: {
    prop: "value",
    callback: "onValueChange",
    empty: ({ defaultValue, min = 0, max = 100, thumbCount = 1 }) =>
      defaultValue ??
      Array.from({ length: thumbCount }, (_, index) =>
        thumbCount === 1 ? min : min + ((max - min) * index) / (thumbCount - 1),
      ),
  },
});
export const KozmosSearch = createVueWrapper(Search, {
  modelValue: textField,
});
export const KozmosSearchBar = createVueWrapper(SearchBar, {
  modelValue: { prop: "value", callback: "onChange", empty: "" },
});
// Radix's Select shows its placeholder for "".
export const KozmosSelect = createVueWrapper(Select, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});
export const KozmosBottomNavigation = createVueWrapper(BottomNavigation);
export const KozmosNavbar = createVueWrapper(Navbar);
export const KozmosSidebar = createVueWrapper(Sidebar);
export const KozmosMenu = createVueWrapper(Menu);
export const KozmosDrawer = createVueWrapper(Drawer);
export const KozmosToast = createVueWrapper(Toast);
export const KozmosBreadcrumb = createVueWrapper(Breadcrumb);
export const KozmosPagination = createVueWrapper(Pagination);
export const KozmosStepper = createVueWrapper(Stepper);
// `positionLabel` may be a function: declared as a prop, it is handed to
// React and never written onto the wrapper's element as an attribute, as Vue
// writes every undeclared one (GAP-191).
Object.assign(KozmosStepper, { props: { positionLabel: null } });
export const KozmosAlert = createVueWrapper(AlertAdapter);
export const KozmosProgress = createVueWrapper(Progress);
export const KozmosSpinner = createVueWrapper(Spinner);
export const KozmosSkeleton = createVueWrapper(Skeleton);
export const KozmosBackdrop = createVueWrapper(BackdropAdapter);
// `target` is declared as a prop, so Vue never writes it onto the wrapper's
// element as an attribute: it does that with every undeclared attribute, and
// a component instance cannot be written as one ("Cannot convert object to
// primitive value"). The wrapper hands its props to React with its attrs.
Object.assign(KozmosBackdrop, { props: { target: null } });
export const KozmosAvatar = createVueWrapper(AvatarAdapter);
export const KozmosTag = createVueWrapper(ReactTag);
export const KozmosList = createVueWrapper(List);
export const KozmosTable = createVueWrapper(Table);
// Its selection is reported as the item; the model is the item's id.
export const KozmosTree = createVueWrapper(Tree, {
  expandedIds: { prop: "expandedIds", callback: "onExpandedChange", empty: [] },
  selectedId: {
    prop: "selectedId",
    callback: "onSelectionChange",
    read: (item) => item.id,
    empty: "",
  },
});
export const KozmosTimeline = createVueWrapper(Timeline);
export const KozmosTooltip = createVueWrapper(Tooltip);
export const KozmosPopover = createVueWrapper(Popover);
// Its attrs are React's alone, as every wrapper's are (createVueWrapper): a
// component given as `anchor` is never set as an attribute on the wrapper's
// own box. Not wrapped in an Object.assign() of its own: the declarations
// then spelt its whole type out, with Vue's GlobalComponents where Vue's
// own constraint refuses it, and an app that type-checks its libraries
// failed to compile (TS2344; test/consumer-types.spec.ts).
export const KozmosAnchoredPopover = createVueWrapper(AnchoredPopoverAdapter);
// Its attrs are React's alone, as KozmosAnchoredPopover's are: Vue would
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
export const KozmosSeparator = createVueWrapper(Separator);
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
export const KozmosBottomSheet = createVueWrapper(BottomSheet);
export const KozmosOTPInput = createVueWrapper(ReactOTPInput, {
  modelValue: { prop: "value", callback: "onChange", empty: "" },
});
// 0 is "Not rated".
export const KozmosRating = createVueWrapper(Rating, {
  modelValue: { prop: "value", callback: "onChange", empty: 0 },
});
export const KozmosFileUpload = createVueWrapper(ReactFileUpload, {
  modelValue: { prop: "value", callback: "onFilesChange", empty: [] },
});
export const KozmosDatePicker = createVueWrapper(DatePicker, {
  modelValue: textField,
});
export const KozmosTimePicker = createVueWrapper(TimePicker, {
  modelValue: textField,
});
export const KozmosFloatingActionButton =
  createVueWrapper(FloatingActionButton);
export const KozmosSplitButton = createVueWrapper(SplitButton);
export const KozmosToggleButton = createVueWrapper(ToggleButton, {
  pressed: { prop: "pressed", callback: "onPressedChange", empty: false },
});
// Nothing chosen is `null` to React: `undefined` hands the choice back to
// the control.
export const KozmosSegmentedControl = createVueWrapper(SegmentedControl, {
  modelValue: { prop: "value", callback: "onValueChange", empty: null },
});
export const KozmosLink = createVueWrapper(Link);
// `externalLabel` is declared so `external-label` reaches React by its name
// (GAP-202). `external`, a boolean, is read as every bridged part's boolean
// props are (react-adapter.ts): a bare `external` is true.
Object.assign(KozmosLink, {
  props: { externalLabel: { type: String, default: undefined } },
});
export const KozmosIconButton = createVueWrapper(IconButton);
// `counterLabel` is a function: declared as a prop, it is handed to React and
// never written onto the wrapper's element as an attribute (GAP-197).
Object.assign(KozmosIconButton, { props: { counterLabel: null } });
export const KozmosTabs = createVueWrapper(Tabs, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});
export const KozmosDialog = createVueWrapper(Dialog);
export const KozmosMapOverlay = createVueWrapper(MapOverlay);
export const KozmosAnalyticsProvider = createVueWrapper(AnalyticsProvider);
export const KozmosChip = createVueWrapper(Chip);
export const KozmosDynamicIsland = createVueWrapper(DynamicIsland);
export const KozmosEmptyState = createVueWrapper(EmptyState);
export const KozmosFeedbackCard = createVueWrapper(FeedbackCard);
export const KozmosFieldWrapper = createVueWrapper(FieldWrapper);
export const KozmosMapControlsGroup = createVueWrapper(MapControlsGroup, {
  stepFree: { prop: "stepFree", callback: "onStepFreeChange", empty: false },
});
export const KozmosNavigationAnnouncer = createVueWrapper(NavigationAnnouncer);
export const KozmosRadioGroup = createVueWrapper(ReactRadioGroup, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});
export const KozmosRadioGroupItem = createVueWrapper(ReactRadioGroupItem);
export const KozmosRouteSummary = createVueWrapper(RouteSummary);
export const KozmosRoutingInputGroup = createVueWrapper(RoutingInputGroup);
export const KozmosSaveLocationCard = createVueWrapper(SaveLocationCard);
export const KozmosScrollArea = createVueWrapper(ScrollArea);
export const KozmosUserLocationMarker = createVueWrapper(UserLocationMarker);

// Custom Input Binding Interfaces
// `v-model` is `checked`, as `v-model:checked` is (react-adapter.ts).
export const KozmosCheckbox = createVueWrapper(ReactCheckbox, {
  modelValue: { prop: "checked", callback: "onCheckedChange", empty: false },
});
export const KozmosInput = createVueWrapper(ReactInput, {
  modelValue: textField,
});
// `action` is an object holding functions and an icon: declared as a prop, it
// is handed to React, never written onto the wrapper's element (GAP-154).
// Beside its model's props, which it would replace.
Object.assign(KozmosInput, {
  props: {
    ...(KozmosInput as unknown as { props: object }).props,
    action: null,
  },
});
export const KozmosTextarea = createVueWrapper(Textarea, {
  modelValue: textField,
});
export const KozmosSwitch = createVueWrapper(Switch, {
  modelValue: { prop: "checked", callback: "onCheckedChange", empty: false },
});

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
export const KozmosCombobox = createVueWrapper(Combobox, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
  inputValue: { prop: "inputValue", callback: "onInputValueChange", empty: "" },
});
export const KozmosDateRangePicker = createVueWrapper(DateRangePicker, {
  modelValue: {
    prop: "value",
    callback: "onValueChange",
    empty: { start: "", end: "" },
  },
});
// One option is a string, several an array.
export const KozmosListbox = createVueWrapper(Listbox, {
  modelValue: {
    prop: "value",
    callback: "onValueChange",
    empty: ({ multiple }) => (multiple ? [] : ""),
  },
});
export const KozmosMultiSelect = createVueWrapper(MultiSelect, {
  modelValue: { prop: "value", callback: "onValueChange", empty: [] },
  searchValue: {
    prop: "searchValue",
    callback: "onSearchValueChange",
    empty: "",
  },
});
// A cleared field is `null` to Vue and "" to React's input.
export const KozmosNumberInput = createVueWrapper(NumberInput, {
  modelValue: { prop: "value", callback: "onValueChange", empty: "" },
});
export const KozmosPasswordInput = createVueWrapper(PasswordInput, {
  modelValue: textField,
  visible: { prop: "visible", callback: "onVisibleChange", empty: false },
});
