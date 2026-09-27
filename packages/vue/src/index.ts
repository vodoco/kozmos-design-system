import React from "react";
import { createVueWrapper } from "./react-adapter";
import {
  Box,
  Stack,
  Grid,
  Text,
  Heading,
  Container,
  Icon,
  Button as ReactButton,
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
  ThemeProvider,
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
} from "@kozmos-ds/react";

// Core Translation Engine
export * from "./react-adapter";

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

const CheckboxAdapter = ({
  modelValue,
  "onUpdate:modelValue": onUpdateModelValue,
  checked,
  onCheckedChange,
  ...props
}: any) =>
  React.createElement(ReactCheckbox, {
    ...props,
    checked: modelValue !== undefined ? modelValue : checked,
    onCheckedChange: (c: boolean) => {
      if (onUpdateModelValue) onUpdateModelValue(c);
      if (onCheckedChange) onCheckedChange(c);
    },
  });

const SwitchAdapter = ({
  modelValue,
  "onUpdate:modelValue": onUpdateModelValue,
  checked,
  onCheckedChange,
  ...props
}: any) =>
  React.createElement(Switch, {
    ...props,
    checked: modelValue !== undefined ? modelValue : checked,
    onCheckedChange: (c: boolean) => {
      if (onUpdateModelValue) onUpdateModelValue(c);
      if (onCheckedChange) onCheckedChange(c);
    },
  });

const WayfindingInputRowAdapter = ({
  originValue,
  "onUpdate:originValue": onUpdateOriginValue,
  onOriginChange,
  destinationValue,
  "onUpdate:destinationValue": onUpdateDestinationValue,
  onDestinationChange,
  ...props
}: any) =>
  React.createElement(WayfindingInputRow, {
    ...props,
    originValue,
    destinationValue,
    onOriginChange: (val: string) => {
      if (onUpdateOriginValue) onUpdateOriginValue(val);
      if (onOriginChange) onOriginChange(val);
    },
    onDestinationChange: (val: string) => {
      if (onUpdateDestinationValue) onUpdateDestinationValue(val);
      if (onDestinationChange) onDestinationChange(val);
    },
  });

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
export const KozmosButton = createVueWrapper(ReactButton);
export const KozmosCounter = createVueWrapper(ReactCounter);
export const KozmosBadge = createVueWrapper(ReactBadge);
export const KozmosLabel = createVueWrapper(Label);
export const KozmosCard = createVueWrapper(Card);
export const KozmosSlider = createVueWrapper(ReactSlider, [
  "update:modelValue",
]);
export const KozmosSearch = createVueWrapper(Search, ["update:modelValue"]);
export const KozmosSearchBar = createVueWrapper(SearchBar, [
  "update:modelValue",
]);
export const KozmosSelect = createVueWrapper(Select);
export const KozmosBottomNavigation = createVueWrapper(BottomNavigation);
export const KozmosNavbar = createVueWrapper(Navbar);
export const KozmosSidebar = createVueWrapper(Sidebar);
export const KozmosMenu = createVueWrapper(Menu);
export const KozmosDrawer = createVueWrapper(Drawer);
export const KozmosToast = createVueWrapper(Toast);
export const KozmosBreadcrumb = createVueWrapper(Breadcrumb);
export const KozmosPagination = createVueWrapper(Pagination);
export const KozmosStepper = createVueWrapper(Stepper);
export const KozmosAlert = createVueWrapper(AlertAdapter);
export const KozmosProgress = createVueWrapper(Progress);
export const KozmosSpinner = createVueWrapper(Spinner);
export const KozmosSkeleton = createVueWrapper(Skeleton);
export const KozmosBackdrop = createVueWrapper(Backdrop);
export const KozmosAvatar = createVueWrapper(AvatarAdapter);
export const KozmosTag = createVueWrapper(ReactTag);
export const KozmosList = createVueWrapper(List);
export const KozmosTable = createVueWrapper(Table);
export const KozmosTree = createVueWrapper(Tree);
export const KozmosTimeline = createVueWrapper(Timeline);
export const KozmosTooltip = createVueWrapper(Tooltip);
export const KozmosPopover = createVueWrapper(Popover);
export const KozmosAccordion = createVueWrapper(Accordion);
export const KozmosSeparator = createVueWrapper(Separator);
export const KozmosMapView = createVueWrapper(MapView);
export const KozmosLocationPin = createVueWrapper(LocationPin);
export const KozmosWayfindingCard = createVueWrapper(WayfindingCard);
export const KozmosWayfindingInputRow = createVueWrapper(
  WayfindingInputRowAdapter,
  ["update:originValue", "update:destinationValue"],
);
export const KozmosDirectionStep = createVueWrapper(DirectionStep);
export const KozmosFloorSelector = createVueWrapper(FloorSelector, [
  "update:modelValue",
]);
export const KozmosPOICard = createVueWrapper(POICard);
export const KozmosBottomSheet = createVueWrapper(BottomSheet);
export const KozmosOTPInput = createVueWrapper(ReactOTPInput, [
  "update:modelValue",
]);
export const KozmosRating = createVueWrapper(Rating, ["update:modelValue"]);
export const KozmosFileUpload = createVueWrapper(ReactFileUpload, [
  "update:modelValue",
]);
export const KozmosDatePicker = createVueWrapper(DatePicker, [
  "update:modelValue",
]);
export const KozmosTimePicker = createVueWrapper(TimePicker, [
  "update:modelValue",
]);
export const KozmosFloatingActionButton =
  createVueWrapper(FloatingActionButton);
export const KozmosSplitButton = createVueWrapper(SplitButton);
export const KozmosToggleButton = createVueWrapper(ToggleButton);
export const KozmosSegmentedControl = createVueWrapper(SegmentedControl);
export const KozmosLink = createVueWrapper(Link);
export const KozmosIconButton = createVueWrapper(IconButton);
export const KozmosTabs = createVueWrapper(Tabs);
export const KozmosDialog = createVueWrapper(Dialog);
export const KozmosThemeProvider = createVueWrapper(ThemeProvider);
export const KozmosMapOverlay = createVueWrapper(MapOverlay);
export const KozmosAnalyticsProvider = createVueWrapper(AnalyticsProvider);
export const KozmosChip = createVueWrapper(Chip);
export const KozmosDynamicIsland = createVueWrapper(DynamicIsland);
export const KozmosEmptyState = createVueWrapper(EmptyState);
export const KozmosFeedbackCard = createVueWrapper(FeedbackCard);
export const KozmosFieldWrapper = createVueWrapper(FieldWrapper);
export const KozmosMapControlsGroup = createVueWrapper(MapControlsGroup);
export const KozmosNavigationAnnouncer = createVueWrapper(NavigationAnnouncer);
export const KozmosRadioGroup = createVueWrapper(ReactRadioGroup, [
  "update:modelValue",
]);
export const KozmosRadioGroupItem = createVueWrapper(ReactRadioGroupItem);
export const KozmosRouteSummary = createVueWrapper(RouteSummary);
export const KozmosRoutingInputGroup = createVueWrapper(RoutingInputGroup);
export const KozmosSaveLocationCard = createVueWrapper(SaveLocationCard);
export const KozmosScrollArea = createVueWrapper(ScrollArea);
export const KozmosUserLocationMarker = createVueWrapper(UserLocationMarker);

// Custom Input Binding Interfaces
export const KozmosCheckbox = createVueWrapper(CheckboxAdapter, [
  "update:modelValue",
]);
export const KozmosInput = createVueWrapper(ReactInput, ["update:modelValue"]);
export const KozmosTextarea = createVueWrapper(Textarea, ["update:modelValue"]);
export const KozmosSwitch = createVueWrapper(SwitchAdapter, [
  "update:modelValue",
]);

// ----------------------------------------------------------------------
// Components added after the original adapter list was written.
// ----------------------------------------------------------------------
export const KozmosAdaptiveMapShell = createVueWrapper(AdaptiveMapShell);
export const KozmosBrowseCategoriesPanel = createVueWrapper(
  BrowseCategoriesPanel,
);
export const KozmosCategoryTile = createVueWrapper(CategoryTile);
export const KozmosMapControlButton = createVueWrapper(MapControlButton);
export const KozmosNavigationItem = createVueWrapper(NavigationItem);
export const KozmosPOIDetailPanel = createVueWrapper(POIDetailPanel);
export const KozmosPOIMediaGallery = createVueWrapper(POIMediaGallery);
export const KozmosPOIResultCard = createVueWrapper(POIResultCard);
export const KozmosPOIResultList = createVueWrapper(POIResultList);
export const KozmosRouteOptionCard = createVueWrapper(RouteOptionCard);
export const KozmosRoutePreviewPanel = createVueWrapper(RoutePreviewPanel);
export const KozmosColorPicker = createVueWrapper(ColorPicker, [
  "update:modelValue",
]);
export const KozmosCombobox = createVueWrapper(Combobox, ["update:modelValue"]);
export const KozmosDateRangePicker = createVueWrapper(DateRangePicker, [
  "update:modelValue",
]);
export const KozmosListbox = createVueWrapper(Listbox, ["update:modelValue"]);
export const KozmosMultiSelect = createVueWrapper(MultiSelect, [
  "update:modelValue",
]);
export const KozmosNumberInput = createVueWrapper(NumberInput, [
  "update:modelValue",
]);
export const KozmosPasswordInput = createVueWrapper(PasswordInput, [
  "update:modelValue",
]);
