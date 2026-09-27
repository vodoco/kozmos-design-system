import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contractPath = path.join(
  root,
  "packages/tokens/src/component-contracts.json",
);
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function getJsonPath(value, segments) {
  return segments.reduce((current, segment) => current?.[segment], value);
}

function fail(message) {
  throw new Error(message);
}

/**
 * Quote style is formatting, not contract.
 *
 * These assertions are literal source snippets, and prettier rewrites `\'` to
 * `"` in the files they check. Every string assertion written before that ran
 * would otherwise fail the moment the pre-commit hook touched a component —
 * which is exactly how "React Text 4xl size" broke. Compare with both sides
 * normalised so the check tracks the code, not its formatting.
 */
function normalizeQuotes(value) {
  return String(value).replace(/'/g, '"');
}

function containsLiteral(content, pattern) {
  if (content.includes(pattern)) return true;
  return normalizeQuotes(content).includes(normalizeQuotes(pattern));
}

function assertContains(filePath, content, pattern, label) {
  const ok =
    pattern instanceof RegExp
      ? pattern.test(content)
      : containsLiteral(content, pattern);
  if (!ok) {
    fail(`${filePath}: missing ${label}`);
  }
}

function assertNotContains(filePath, content, pattern, label) {
  const ok =
    pattern instanceof RegExp
      ? !pattern.test(content)
      : !containsLiteral(content, pattern);
  if (!ok) {
    fail(`${filePath}: unexpected ${label}`);
  }
}

function assertOccurrenceCount(filePath, content, pattern, expected, label) {
  const matches = content.match(pattern) || [];
  if (matches.length !== expected) {
    fail(
      `${filePath}: expected ${label} to appear ${expected} time(s), received ${matches.length}`,
    );
  }
}

function assertMissing(filePath, label) {
  if (fs.existsSync(path.join(root, filePath))) {
    fail(`${filePath}: unexpected ${label}`);
  }
}

function listFilesRecursive(relativeDir, predicate) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const childRelativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      return listFilesRecursive(childRelativePath, predicate);
    }
    return predicate(childRelativePath) ? [childRelativePath] : [];
  });
}

function assertJsonPathEquals(filePath, value, segments, expected, label) {
  const actual = getJsonPath(value, segments);
  if (actual !== expected) {
    fail(
      `${filePath}: expected ${label} to be ${expected}, received ${String(actual)}`,
    );
  }
}

function assertFigmaPayloadDarkValue(
  filePath,
  payload,
  canonicalName,
  expected,
) {
  const variable = payload.variables.find(
    (entry) => entry.canonicalName === canonicalName,
  );
  if (!variable) {
    fail(`${filePath}: missing variable ${canonicalName}`);
  }

  const actual = variable.values?.dark?.value;
  if (actual !== expected) {
    fail(
      `${filePath}: expected ${canonicalName} dark value to be ${expected}, received ${String(actual)}`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenValuePattern(name, value) {
  return new RegExp(
    `name:\\s*"${escapeRegExp(name)}",\\s*value:\\s*${escapeRegExp(String(value))}\\b`,
    "s",
  );
}

function tokenAliasPattern(name, alias) {
  return new RegExp(
    `name:\\s*"${escapeRegExp(name)}"(?:(?!name:\\s*").)*alias:\\s*"${escapeRegExp(alias)}"`,
    "s",
  );
}

function assertOrder(filePath, content, before, after, label) {
  const beforeIndex = content.indexOf(before);
  const afterIndex = content.indexOf(after);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex > afterIndex) {
    fail(`${filePath}: invalid order for ${label}`);
  }
}

function assertAllVariants(filePath, content, variants, mapper, label) {
  for (const variant of variants) {
    assertContains(
      filePath,
      content,
      mapper(variant),
      `${label} variant "${variant}"`,
    );
  }
}

const files = {
  figma: "figma/foundations-importer/code.js",
  figmaUi: "figma/foundations-importer/ui.html",
  figmaReadme: "figma/foundations-importer/README.md",
  figmaLinked: "figma.linked.config.json",
  reactText: "packages/react/src/components/Text/Text.tsx",
  reactHeading: "packages/react/src/components/Heading/Heading.tsx",
  reactLink: "packages/react/src/components/Link/Link.tsx",
  reactLinkFigma: "packages/react/src/components/Link/Link.figma.tsx",
  reactLabel: "packages/react/src/components/Label/Label.tsx",
  reactSeparator: "packages/react/src/components/Separator/Separator.tsx",
  reactSeparatorFigma:
    "packages/react/src/components/Separator/Separator.figma.tsx",
  reactSkeleton: "packages/react/src/components/Skeleton/Skeleton.tsx",
  reactSkeletonFigma:
    "packages/react/src/components/Skeleton/Skeleton.figma.tsx",
  reactBox: "packages/react/src/components/Box/Box.tsx",
  reactBoxFigma: "packages/react/src/components/Box/Box.figma.tsx",
  reactStack: "packages/react/src/components/Stack/Stack.tsx",
  reactStackFigma: "packages/react/src/components/Stack/Stack.figma.tsx",
  reactGrid: "packages/react/src/components/Grid/Grid.tsx",
  reactGridFigma: "packages/react/src/components/Grid/Grid.figma.tsx",
  reactContainer: "packages/react/src/components/Container/Container.tsx",
  reactContainerFigma:
    "packages/react/src/components/Container/Container.figma.tsx",
  reactBreadcrumb: "packages/react/src/components/Breadcrumb/Breadcrumb.tsx",
  reactBreadcrumbFigma:
    "packages/react/src/components/Breadcrumb/Breadcrumb.figma.tsx",
  reactPagination: "packages/react/src/components/Pagination/Pagination.tsx",
  reactPaginationFigma:
    "packages/react/src/components/Pagination/Pagination.figma.tsx",
  reactAccordion: "packages/react/src/components/Accordion/Accordion.tsx",
  reactAccordionFigma:
    "packages/react/src/components/Accordion/Accordion.figma.tsx",
  reactButton: "packages/react/src/components/Button/Button.tsx",
  reactIconFigma: "packages/react/src/components/Icon/Icon.figma.tsx",
  reactIconButton: "packages/react/src/components/IconButton/IconButton.tsx",
  reactCounter: "packages/react/src/components/Counter/Counter.tsx",
  reactCounterFigma: "packages/react/src/components/Counter/Counter.figma.tsx",
  reactBadge: "packages/react/src/components/Badge/Badge.tsx",
  reactCategoryTile:
    "packages/react/src/components/CategoryTile/CategoryTile.tsx",
  reactCategoryField:
    "packages/react/src/components/CategoryField/CategoryField.tsx",
  reactLocationPin: "packages/react/src/components/LocationPin/LocationPin.tsx",
  reactPOIDetailCss: "packages/react/src/styles/owned-poi-detail.css",
  reactBadgeFigma: "packages/react/src/components/Badge/Badge.figma.tsx",
  reactCardFigma: "packages/react/src/components/Card/Card.figma.tsx",
  reactList: "packages/react/src/components/List/List.tsx",
  reactListFigma: "packages/react/src/components/List/List.figma.tsx",
  reactTable: "packages/react/src/components/Table/Table.tsx",
  reactTableFigma: "packages/react/src/components/Table/Table.figma.tsx",
  reactTimeline: "packages/react/src/components/Timeline/Timeline.tsx",
  reactTimelineFigma:
    "packages/react/src/components/Timeline/Timeline.figma.tsx",
  reactTreeMdx: "packages/react/src/components/Tree/Tree.mdx",
  reactTimelineMdx: "packages/react/src/components/Timeline/Timeline.mdx",
  reactTabsFigma: "packages/react/src/components/Tabs/Tabs.figma.tsx",
  reactStepperFigma: "packages/react/src/components/Stepper/Stepper.figma.tsx",
  reactCheckbox: "packages/react/src/components/Checkbox/Checkbox.tsx",
  reactRadio: "packages/react/src/components/Radio/Radio.tsx",
  reactSwitch: "packages/react/src/components/Switch/Switch.tsx",
  reactInput: "packages/react/src/components/Input/Input.tsx",
  reactInputFigma: "packages/react/src/components/Input/Input.figma.tsx",
  reactCombobox: "packages/react/src/components/Combobox/Combobox.tsx",
  reactComboboxFigma:
    "packages/react/src/components/Combobox/Combobox.figma.tsx",
  reactMultiSelect: "packages/react/src/components/MultiSelect/MultiSelect.tsx",
  reactMultiSelectFigma:
    "packages/react/src/components/MultiSelect/MultiSelect.figma.tsx",
  reactListbox: "packages/react/src/components/Listbox/Listbox.tsx",
  reactMenu: "packages/react/src/components/Menu/Menu.tsx",
  reactMapControlButton:
    "packages/react/src/components/MapControlButton/MapControlButton.tsx",
  reactMapControlButtonFigma:
    "packages/react/src/components/MapControlButton/MapControlButton.figma.tsx",
  reactFileUpload: "packages/react/src/components/FileUpload/FileUpload.tsx",
  reactListboxFigma: "packages/react/src/components/Listbox/Listbox.figma.tsx",
  reactPasswordInput:
    "packages/react/src/components/PasswordInput/PasswordInput.tsx",
  reactPasswordInputFigma:
    "packages/react/src/components/PasswordInput/PasswordInput.figma.tsx",
  reactNumberInput: "packages/react/src/components/NumberInput/NumberInput.tsx",
  reactNumberInputFigma:
    "packages/react/src/components/NumberInput/NumberInput.figma.tsx",
  reactOTPInput: "packages/react/src/components/OTPInput/OTPInput.tsx",
  reactOTPInputFigma:
    "packages/react/src/components/OTPInput/OTPInput.figma.tsx",
  reactFieldWrapperFigma:
    "packages/react/src/components/FieldWrapper/FormField.figma.tsx",
  reactColorPicker: "packages/react/src/components/ColorPicker/ColorPicker.tsx",
  reactColorPickerFigma:
    "packages/react/src/components/ColorPicker/ColorPicker.figma.tsx",
  reactDatePickerFigma:
    "packages/react/src/components/DatePicker/DatePicker.figma.tsx",
  reactDateRangePickerFigma:
    "packages/react/src/components/DateRangePicker/DateRangePicker.figma.tsx",
  reactTimePickerFigma:
    "packages/react/src/components/TimePicker/TimePicker.figma.tsx",
  reactFileUploadFigma:
    "packages/react/src/components/FileUpload/FileUpload.figma.tsx",
  reactFloatingActionButtonFigma:
    "packages/react/src/components/FloatingActionButton/FloatingActionButton.figma.tsx",
  reactSplitButtonFigma:
    "packages/react/src/components/SplitButton/SplitButton.figma.tsx",
  reactToggleButtonFigma:
    "packages/react/src/components/ToggleButton/ToggleButton.figma.tsx",
  reactSelect: "packages/react/src/components/Select/Select.tsx",
  reactSlider: "packages/react/src/components/Slider/Slider.tsx",
  reactTextareaFigma:
    "packages/react/src/components/Textarea/Textarea.figma.tsx",
  reactSearchFigma: "packages/react/src/components/Search/Search.figma.tsx",
  reactSelectFigma: "packages/react/src/components/Select/Select.figma.tsx",
  reactSliderFigma: "packages/react/src/components/Slider/Slider.figma.tsx",
  reactRatingFigma: "packages/react/src/components/Rating/Rating.figma.tsx",
  reactProgressFigma:
    "packages/react/src/components/Progress/Progress.figma.tsx",
  reactSpinnerFigma: "packages/react/src/components/Spinner/Spinner.figma.tsx",
  reactAvatarFigma: "packages/react/src/components/Avatar/Avatar.figma.tsx",
  reactAlertFigma: "packages/react/src/components/Alert/Alert.figma.tsx",
  reactNavigationItem:
    "packages/react/src/components/NavigationItem/NavigationItem.tsx",
  reactNavigationItemMdx:
    "packages/react/src/components/NavigationItem/NavigationItem.mdx",
  reactNavigationItemFigma:
    "packages/react/src/components/NavigationItem/NavigationItem.figma.tsx",
  reactNavbar: "packages/react/src/components/Navbar/Navbar.tsx",
  reactNavbarMdx: "packages/react/src/components/Navbar/Navbar.mdx",
  reactNavbarFigma: "packages/react/src/components/Navbar/Navbar.figma.tsx",
  reactSidebar: "packages/react/src/components/Sidebar/Sidebar.tsx",
  reactSidebarMdx: "packages/react/src/components/Sidebar/Sidebar.mdx",
  reactSidebarFigma: "packages/react/src/components/Sidebar/Sidebar.figma.tsx",
  reactEmptyState: "packages/react/src/components/EmptyState/EmptyState.tsx",
  reactEmptyStateFigma:
    "packages/react/src/components/EmptyState/EmptyState.figma.tsx",
  reactTailwindConfig: "packages/react/tailwind.config.js",
  reactTooltip: "packages/react/src/components/Tooltip/Tooltip.tsx",
  reactTooltipFigma: "packages/react/src/components/Tooltip/Tooltip.figma.tsx",
  reactDrawer: "packages/react/src/components/Drawer/Drawer.tsx",
  reactDrawerFigma: "packages/react/src/components/Drawer/Drawer.figma.tsx",
  reactSegmentedControl:
    "packages/react/src/components/SegmentedControl/SegmentedControl.tsx",
  reactIndex: "packages/react/src/index.ts",
  vueIndex: "packages/vue/src/index.ts",
  figmaManifest: "docs/figma-library-manifest.json",
  figmaManifestScript: "scripts/figma-build-manifest.mjs",
  figmaNativeConnectScript: "scripts/figma-connect-native.mjs",
  nativeStubGenerator: "scripts/skills/generate-native-stubs.js",
  iosFigmaLinked: "packages/ios/figma.linked.config.json",
  iosButton: "packages/ios/Sources/Components/Button/Button.swift",
  iosIcon: "packages/ios/Sources/Components/Icon/Icon.swift",
  iosIconFigma: "packages/ios/Sources/Components/Icon/Icon.figma.swift",
  iosIconButton: "packages/ios/Sources/Components/IconButton/IconButton.swift",
  iosCategoryTile:
    "packages/ios/Sources/Components/CategoryTile/CategoryTile.swift",
  iosCategoryField:
    "packages/ios/Sources/Components/CategoryField/CategoryField.swift",
  iosLocationPin:
    "packages/ios/Sources/Components/LocationPin/LocationPin.swift",
  iosPOIDetailPanel:
    "packages/ios/Sources/Components/POIDetailPanel/POIDetailPanel.swift",
  iosCounter: "packages/ios/Sources/Components/Counter/Counter.swift",
  iosCounterFigma:
    "packages/ios/Sources/Components/Counter/Counter.figma.swift",
  iosBadge: "packages/ios/Sources/Components/Badge/Badge.swift",
  iosBadgeFigma: "packages/ios/Sources/Components/Badge/Badge.figma.swift",
  iosCheckbox: "packages/ios/Sources/Components/Checkbox/Checkbox.swift",
  iosRadio: "packages/ios/Sources/Components/Radio/Radio.swift",
  iosSwitch: "packages/ios/Sources/Components/Switch/Switch.swift",
  iosInput: "packages/ios/Sources/Components/Input/Input.swift",
  iosCombobox: "packages/ios/Sources/Components/Combobox/Combobox.swift",
  iosComboboxFigma:
    "packages/ios/Sources/Components/Combobox/Combobox.figma.swift",
  iosMultiSelect:
    "packages/ios/Sources/Components/MultiSelect/MultiSelect.swift",
  iosMultiSelectFigma:
    "packages/ios/Sources/Components/MultiSelect/MultiSelect.figma.swift",
  iosListbox: "packages/ios/Sources/Components/Listbox/Listbox.swift",
  iosListboxFigma:
    "packages/ios/Sources/Components/Listbox/Listbox.figma.swift",
  iosPasswordInput:
    "packages/ios/Sources/Components/PasswordInput/PasswordInput.swift",
  iosPasswordInputFigma:
    "packages/ios/Sources/Components/PasswordInput/PasswordInput.figma.swift",
  iosNumberInput:
    "packages/ios/Sources/Components/NumberInput/NumberInput.swift",
  iosNumberInputFigma:
    "packages/ios/Sources/Components/NumberInput/NumberInput.figma.swift",
  iosOTPInput: "packages/ios/Sources/Components/OTPInput/OTPInput.swift",
  iosOTPInputFigma:
    "packages/ios/Sources/Components/OTPInput/OTPInput.figma.swift",
  iosFieldWrapperFigma:
    "packages/ios/Sources/Components/FieldWrapper/FieldWrapper.figma.swift",
  iosDatePickerFigma:
    "packages/ios/Sources/Components/DatePicker/DatePicker.figma.swift",
  iosDateRangePicker:
    "packages/ios/Sources/Components/DateRangePicker/DateRangePicker.swift",
  iosDateRangePickerFigma:
    "packages/ios/Sources/Components/DateRangePicker/DateRangePicker.figma.swift",
  iosTimePickerFigma:
    "packages/ios/Sources/Components/TimePicker/TimePicker.figma.swift",
  iosFileUploadFigma:
    "packages/ios/Sources/Components/FileUpload/FileUpload.figma.swift",
  iosColorPicker:
    "packages/ios/Sources/Components/ColorPicker/ColorPicker.swift",
  iosColorPickerFigma:
    "packages/ios/Sources/Components/ColorPicker/ColorPicker.figma.swift",
  iosFloatingActionButtonFigma:
    "packages/ios/Sources/Components/FloatingActionButton/FloatingActionButton.figma.swift",
  iosSplitButtonFigma:
    "packages/ios/Sources/Components/SplitButton/SplitButton.figma.swift",
  iosToggleButtonFigma:
    "packages/ios/Sources/Components/ToggleButton/ToggleButton.figma.swift",
  iosAlert: "packages/ios/Sources/Components/Alert/Alert.swift",
  iosAlertFigma: "packages/ios/Sources/Components/Alert/Alert.figma.swift",
  iosEmptyState: "packages/ios/Sources/Components/EmptyState/EmptyState.swift",
  iosEmptyStateFigma:
    "packages/ios/Sources/Components/EmptyState/EmptyState.figma.swift",
  iosSegmentedControl:
    "packages/ios/Sources/Components/SegmentedControl/SegmentedControl.swift",
  iosTooltip: "packages/ios/Sources/Components/Tooltip/Tooltip.swift",
  iosDrawer: "packages/ios/Sources/Components/Drawer/Drawer.swift",
  iosListFigma: "packages/ios/Sources/Components/List/List.figma.swift",
  iosTableFigma: "packages/ios/Sources/Components/Table/Table.figma.swift",
  iosTimeline: "packages/ios/Sources/Components/Timeline/Timeline.swift",
  iosTimelineFigma:
    "packages/ios/Sources/Components/Timeline/Timeline.figma.swift",
  iosTree: "packages/ios/Sources/Components/Tree/Tree.swift",
  iosTreeFigma: "packages/ios/Sources/Components/Tree/Tree.figma.swift",
  iosPaginationFigma:
    "packages/ios/Sources/Components/Pagination/Pagination.figma.swift",
  iosNavigationItem:
    "packages/ios/Sources/Components/NavigationItem/NavigationItem.swift",
  iosNavigationItemFigma:
    "packages/ios/Sources/Components/NavigationItem/NavigationItem.figma.swift",
  iosNavbar: "packages/ios/Sources/Components/Navbar/Navbar.swift",
  iosNavbarFigma: "packages/ios/Sources/Components/Navbar/Navbar.figma.swift",
  iosSidebar: "packages/ios/Sources/Components/Sidebar/Sidebar.swift",
  iosSidebarFigma:
    "packages/ios/Sources/Components/Sidebar/Sidebar.figma.swift",
  iosGridFigma: "packages/ios/Sources/Components/Grid/Grid.figma.swift",
  iosRatingFigma: "packages/ios/Sources/Components/Rating/Rating.figma.swift",
  iosStepperFigma:
    "packages/ios/Sources/Components/Stepper/Stepper.figma.swift",
  androidButton:
    "packages/android/src/main/java/com/kozmos/components/Button/Button.kt",
  androidFigmaLinked: "packages/android/figma.linked.config.json",
  androidIcon:
    "packages/android/src/main/java/com/kozmos/components/Icon/Icon.kt",
  androidIconFigma:
    "packages/android/src/main/java/com/kozmos/components/Icon/Icon.figma.kt",
  androidIconButton:
    "packages/android/src/main/java/com/kozmos/components/IconButton/IconButton.kt",
  androidCounter:
    "packages/android/src/main/java/com/kozmos/components/Counter/Counter.kt",
  androidCategoryTile:
    "packages/android/src/main/java/com/kozmos/components/CategoryTile/CategoryTile.kt",
  androidCategoryField:
    "packages/android/src/main/java/com/kozmos/components/CategoryField/CategoryField.kt",
  androidLocationPin:
    "packages/android/src/main/java/com/kozmos/components/LocationPin/LocationPin.kt",
  androidPOIDetailPanel:
    "packages/android/src/main/java/com/kozmos/components/POIDetailPanel/POIDetailPanel.kt",
  androidCounterFigma:
    "packages/android/src/main/java/com/kozmos/components/Counter/Counter.figma.kt",
  androidNavigationItem:
    "packages/android/src/main/java/com/kozmos/components/NavigationItem/NavigationItem.kt",
  androidNavigationItemFigma:
    "packages/android/src/main/java/com/kozmos/components/NavigationItem/NavigationItem.figma.kt",
  androidNavbar:
    "packages/android/src/main/java/com/kozmos/components/Navbar/Navbar.kt",
  androidNavbarFigma:
    "packages/android/src/main/java/com/kozmos/components/Navbar/Navbar.figma.kt",
  androidSidebar:
    "packages/android/src/main/java/com/kozmos/components/Sidebar/Sidebar.kt",
  androidSidebarFigma:
    "packages/android/src/main/java/com/kozmos/components/Sidebar/Sidebar.figma.kt",
  androidBadge:
    "packages/android/src/main/java/com/kozmos/components/Badge/Badge.kt",
  androidBadgeFigma:
    "packages/android/src/main/java/com/kozmos/components/Badge/Badge.figma.kt",
  androidCheckbox:
    "packages/android/src/main/java/com/kozmos/components/Checkbox/Checkbox.kt",
  androidRadio:
    "packages/android/src/main/java/com/kozmos/components/Radio/Radio.kt",
  androidSwitch:
    "packages/android/src/main/java/com/kozmos/components/Switch/Switch.kt",
  androidInput:
    "packages/android/src/main/java/com/kozmos/components/Input/Input.kt",
  androidCombobox:
    "packages/android/src/main/java/com/kozmos/components/Combobox/Combobox.kt",
  androidComboboxFigma:
    "packages/android/src/main/java/com/kozmos/components/Combobox/Combobox.figma.kt",
  androidMultiSelect:
    "packages/android/src/main/java/com/kozmos/components/MultiSelect/MultiSelect.kt",
  androidMultiSelectFigma:
    "packages/android/src/main/java/com/kozmos/components/MultiSelect/MultiSelect.figma.kt",
  androidListbox:
    "packages/android/src/main/java/com/kozmos/components/Listbox/Listbox.kt",
  androidListboxFigma:
    "packages/android/src/main/java/com/kozmos/components/Listbox/Listbox.figma.kt",
  androidPasswordInput:
    "packages/android/src/main/java/com/kozmos/components/PasswordInput/PasswordInput.kt",
  androidPasswordInputFigma:
    "packages/android/src/main/java/com/kozmos/components/PasswordInput/PasswordInput.figma.kt",
  androidNumberInput:
    "packages/android/src/main/java/com/kozmos/components/NumberInput/NumberInput.kt",
  androidNumberInputFigma:
    "packages/android/src/main/java/com/kozmos/components/NumberInput/NumberInput.figma.kt",
  androidOTPInput:
    "packages/android/src/main/java/com/kozmos/components/OTPInput/OTPInput.kt",
  androidOTPInputFigma:
    "packages/android/src/main/java/com/kozmos/components/OTPInput/OTPInput.figma.kt",
  androidFieldWrapperFigma:
    "packages/android/src/main/java/com/kozmos/components/FieldWrapper/FieldWrapper.figma.kt",
  androidDatePickerFigma:
    "packages/android/src/main/java/com/kozmos/components/DatePicker/DatePicker.figma.kt",
  androidDateRangePicker:
    "packages/android/src/main/java/com/kozmos/components/DateRangePicker/DateRangePicker.kt",
  androidDateRangePickerFigma:
    "packages/android/src/main/java/com/kozmos/components/DateRangePicker/DateRangePicker.figma.kt",
  androidTimePickerFigma:
    "packages/android/src/main/java/com/kozmos/components/TimePicker/TimePicker.figma.kt",
  androidFileUploadFigma:
    "packages/android/src/main/java/com/kozmos/components/FileUpload/FileUpload.figma.kt",
  androidColorPicker:
    "packages/android/src/main/java/com/kozmos/components/ColorPicker/ColorPicker.kt",
  androidColorPickerFigma:
    "packages/android/src/main/java/com/kozmos/components/ColorPicker/ColorPicker.figma.kt",
  androidFloatingActionButtonFigma:
    "packages/android/src/main/java/com/kozmos/components/FloatingActionButton/FloatingActionButton.figma.kt",
  androidSplitButtonFigma:
    "packages/android/src/main/java/com/kozmos/components/SplitButton/SplitButton.figma.kt",
  androidToggleButtonFigma:
    "packages/android/src/main/java/com/kozmos/components/ToggleButton/ToggleButton.figma.kt",
  androidAlert:
    "packages/android/src/main/java/com/kozmos/components/Alert/Alert.kt",
  androidAlertFigma:
    "packages/android/src/main/java/com/kozmos/components/Alert/Alert.figma.kt",
  androidEmptyState:
    "packages/android/src/main/java/com/kozmos/components/EmptyState/EmptyState.kt",
  androidEmptyStateFigma:
    "packages/android/src/main/java/com/kozmos/components/EmptyState/EmptyState.figma.kt",
  androidSegmentedControl:
    "packages/android/src/main/java/com/kozmos/components/SegmentedControl/SegmentedControl.kt",
  androidTooltip:
    "packages/android/src/main/java/com/kozmos/components/Tooltip/Tooltip.kt",
  androidDrawer:
    "packages/android/src/main/java/com/kozmos/components/Drawer/Drawer.kt",
  androidListFigma:
    "packages/android/src/main/java/com/kozmos/components/List/List.figma.kt",
  androidTableFigma:
    "packages/android/src/main/java/com/kozmos/components/Table/Table.figma.kt",
  androidTimeline:
    "packages/android/src/main/java/com/kozmos/components/Timeline/Timeline.kt",
  androidTimelineFigma:
    "packages/android/src/main/java/com/kozmos/components/Timeline/Timeline.figma.kt",
  androidTree:
    "packages/android/src/main/java/com/kozmos/components/Tree/Tree.kt",
  androidTreeFigma:
    "packages/android/src/main/java/com/kozmos/components/Tree/Tree.figma.kt",
  androidPaginationFigma:
    "packages/android/src/main/java/com/kozmos/components/Pagination/Pagination.figma.kt",
  androidGridFigma:
    "packages/android/src/main/java/com/kozmos/components/Grid/Grid.figma.kt",
  androidRatingFigma:
    "packages/android/src/main/java/com/kozmos/components/Rating/Rating.figma.kt",
  androidStepperFigma:
    "packages/android/src/main/java/com/kozmos/components/Stepper/Stepper.figma.kt",
  androidThemeTokens:
    "packages/android/src/main/java/com/kozmos/tokens/KozmosThemeTokens.kt",
  androidThemeProvider:
    "packages/android/src/main/java/com/kozmos/components/ThemeProvider/ThemeProvider.kt",
  tokensDark: "packages/tokens/src/tokens-dark.json",
  figmaFoundationsPayload: "docs/figma-foundations-payload.json",
  iosColors: "packages/ios/Sources/KozmosColors.swift",
  androidColorsDark:
    "packages/android/src/main/java/com/kozmos/tokens/KozmosColorsDark.kt",
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => [key, read(filePath)]),
);
const tokensDark = JSON.parse(source.tokensDark);
const figmaFoundationsPayload = JSON.parse(source.figmaFoundationsPayload);

const {
  button,
  iconButton,
  categoryTile,
  categoryField,
  locationPin,
  poiDetailPanel,
  counter,
  badge,
  checkbox,
  radio,
  switch: switchContract,
  input,
} = contract.components;
const target = button.sizes.default.height;

if (target !== 44)
  fail("component contract must keep the current v1 target at 44px");

// React and Vue parity.
assertNotContains(
  files.reactIndex,
  source.reactIndex,
  "GlassSettingsPanel",
  "dev-only GlassSettingsPanel public React export",
);
assertNotContains(
  files.vueIndex,
  source.vueIndex,
  "KozmosGlassSettingsPanel",
  "dev-only GlassSettingsPanel public Vue wrapper",
);
assertNotContains(
  files.figmaManifest,
  source.figmaManifest,
  "GlassSettingsPanel",
  "dev-only GlassSettingsPanel Figma manifest entry",
);
assertContains(
  files.reactIndex,
  source.reactIndex,
  'export * from "./components/PasswordInput/PasswordInput";',
  "React public export includes PasswordInput",
);
assertContains(
  files.figmaManifestScript,
  source.figmaManifestScript,
  "INTERNAL_COMPONENT_NAMES",
  "internal component manifest exclusion list",
);
assertContains(
  files.figmaManifestScript,
  source.figmaManifestScript,
  "GlassSettingsPanel",
  "GlassSettingsPanel manifest exclusion",
);
assertContains(
  files.figmaManifestScript,
  source.figmaManifestScript,
  'localName === "BoxProps"',
  "manifest inherited BoxProps prop detection",
);
assertContains(
  files.figmaNativeConnectScript,
  source.figmaNativeConnectScript,
  "findPlaceholderFiles",
  "native Code Connect placeholder guard",
);
assertContains(
  files.figmaNativeConnectScript,
  source.figmaNativeConnectScript,
  "Code Connect publish blocked: placeholder Figma node IDs remain.",
  "native Code Connect placeholder failure message",
);
assertNotContains(
  files.nativeStubGenerator,
  source.nativeStubGenerator,
  "GlassSettingsPanel",
  "dev-only GlassSettingsPanel native stub generation",
);
assertMissing(
  "packages/react/src/components/GlassSettingsPanel/GlassSettingsPanel.tsx",
  "dev-only GlassSettingsPanel React source",
);
assertMissing(
  "packages/ios/Sources/Components/GlassSettingsPanel/KozmosGlassSettingsPanel.swift",
  "dev-only GlassSettingsPanel iOS public stub",
);
assertMissing(
  "packages/android/src/main/java/com/kozmos/components/GlassSettingsPanel/GlassSettingsPanel.kt",
  "dev-only GlassSettingsPanel Android public stub",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="fontFamily"',
  "importer font family config field",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="fontRegularStyle"',
  "importer regular font style config field",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="fontMediumStyle"',
  "importer medium font style config field",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="fontBoldStyle"',
  "importer bold font style config field",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "function withFontConfig(message)",
  "importer message font config wrapper",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'parent.postMessage({ pluginMessage: withFontConfig(message) }, "*");',
  "importer posts all actions through font config wrapper",
);
assertNotContains(
  files.figmaUi,
  source.figmaUi,
  "parent.postMessage({ pluginMessage: { type:",
  "raw importer plugin messages that skip font config",
);
assertContains(
  files.figma,
  source.figma,
  "const DEFAULT_FONT_CONFIG = Object.freeze",
  "Figma importer default font config",
);
assertContains(
  files.figma,
  source.figma,
  "configureFontConfig(message && message.fontConfig);",
  "Figma importer applies message font config",
);
assertContains(
  files.figma,
  source.figma,
  "function fontCandidatesForRole(role, fallbackFont)",
  "Figma importer role-based font fallback resolver",
);
assertContains(
  files.figma,
  source.figma,
  "resetTextStyleCache();",
  "Figma importer resets cached text styles after font config changes",
);
assertContains(
  files.figma,
  source.figma,
  "stats.fontConfig = {",
  "Figma importer reports resolved generated font config",
);
assertContains(
  files.figma,
  source.figma,
  "async function resolveConfiguredFonts(stats)",
  "Figma importer resolves configured fonts without mutating text styles",
);
assertContains(
  files.figma,
  source.figma,
  "const typography = await auditConfiguredTypography();",
  "Figma importer audits active typography config",
);
assertContains(
  files.figma,
  source.figma,
  "audit.typography = typography;",
  "Figma importer includes typography audit details",
);
assertContains(
  files.figma,
  source.figma,
  "auditGeneratedComponentTextFonts(fonts)",
  "Figma importer audits generated component text fonts",
);
assertContains(
  files.figma,
  source.figma,
  "formatTypographyIssueDetails(typography)",
  "Figma importer summarizes stale typography details",
);
assertContains(
  files.figma,
  source.figma,
  "fonts = await loadButtonFonts(stats);",
  "Figma documentation uses generated font resolver",
);
assertContains(
  files.figma,
  source.figma,
  "title.fontName = fonts.bold;",
  "Figma documentation title uses configured bold font",
);
assertContains(
  files.figma,
  source.figma,
  "summary.fontName = fonts.regular;",
  "Figma documentation summary uses configured regular font",
);
assertNotContains(
  files.figma,
  source.figma,
  "const FONT_REGULAR",
  "hardcoded documentation regular font constant",
);
assertNotContains(
  files.figma,
  source.figma,
  "const FONT_BOLD",
  "hardcoded documentation bold font constant",
);
assertContains(
  files.reactButton,
  source.reactButton,
  /default:\s*["']kozmos-button-size-default["']/,
  "owned default Button recipe",
);
assertContains(
  files.reactButton,
  source.reactButton,
  /sm:\s*["']kozmos-button-size-sm["']/,
  "owned small Button recipe",
);
assertContains(
  files.reactButton,
  source.reactButton,
  /icon:\s*["']kozmos-button-size-icon["']/,
  "owned icon Button recipe",
);
const ownedCssPath = "packages/react/src/styles/owned-components.css";
const ownedCss = read(ownedCssPath);
for (const [size, classes] of [
  ["default", "h-11 px-4 py-2"],
  ["sm", "h-11 rounded-control px-3"],
  ["icon", "h-11 w-11"],
]) {
  assertContains(
    ownedCssPath,
    ownedCss,
    new RegExp(`\\.kozmos-button-size-${size}\\s*\\{\\s*@apply ${classes};`),
    `44px ${size} Button recipe`,
  );
}
assertContains(
  files.reactIconButton,
  source.reactIconButton,
  "h-11 w-11 px-0",
  "44px IconButton root class",
);
assertContains(
  files.reactIconButton,
  source.reactIconButton,
  'if (size === "lg") return "h-12 w-12 px-0',
  "48px IconButton large size",
);
assertContains(
  files.androidIconButton,
  source.androidIconButton,
  "modifier.size(if (size == KozmosIconButtonSize.Lg) 48.dp else 44.dp)",
  "Android IconButton 44dp, 48dp for the large size",
);
assertContains(
  files.reactCounter,
  source.reactCounter,
  "h-5 min-w-5 px-1.5 text-xs",
  "React Counter default size class",
);
assertContains(
  files.reactCounter,
  source.reactCounter,
  "h-[18px] min-w-[18px] px-[5px] text-[11px]",
  "React Counter small size class",
);
assertContains(
  files.reactCounter,
  source.reactCounter,
  "formatCounterValue",
  "React Counter normalizes legacy wrapped values",
);
assertContains(
  files.reactCounterFigma,
  source.reactCounterFigma,
  'figma.enum("Tone"',
  "Counter Code Connect tone mapping",
);
assertContains(
  files.reactCounterFigma,
  source.reactCounterFigma,
  'figma.enum("Size"',
  "Counter Code Connect size mapping",
);
assertContains(
  files.reactCounterFigma,
  source.reactCounterFigma,
  'figma.string("Counter Text")',
  "Counter Code Connect text mapping",
);
assertContains(
  files.reactCounterFigma,
  source.reactCounterFigma,
  "node-id=149-13430",
  "Counter Code Connect node ID",
);
assertContains(
  files.reactBadge,
  source.reactBadge,
  /default:\s*["']h-11 px-4 py-2["']/,
  "44px default Badge class",
);
assertContains(
  files.reactBadge,
  source.reactBadge,
  /sm:\s*["']h-11 rounded-control px-3["']/,
  "44px small Badge class",
);
assertContains(
  files.reactBadge,
  source.reactBadge,
  /icon:\s*["']h-11 w-11["']/,
  "44px icon Badge class",
);
assertContains(
  files.reactBadge,
  source.reactBadge,
  "Counter",
  "React Badge composes Counter",
);
assertContains(
  files.reactBadge,
  source.reactBadge,
  "gap-1 rounded-control",
  "React Badge uses 4px content gap",
);
assertContains(
  files.reactCheckbox,
  source.reactCheckbox,
  "min-h-11",
  "React Checkbox 44px row target",
);
assertContains(
  files.reactCheckbox,
  source.reactCheckbox,
  "h-5 w-5",
  "React Checkbox 20px visual control",
);
assertContains(
  files.reactCheckbox,
  source.reactCheckbox,
  "border-input",
  "React Checkbox neutral unchecked border",
);
assertContains(
  files.reactRadio,
  source.reactRadio,
  "min-h-11",
  "React Radio 44px row target",
);
assertContains(
  files.reactRadio,
  source.reactRadio,
  "h-5 w-5",
  "React Radio 20px visual control",
);
assertContains(
  files.reactRadio,
  source.reactRadio,
  "border-input",
  "React Radio neutral unchecked border",
);
assertContains(
  files.reactRadio,
  source.reactRadio,
  "error?: boolean",
  "React Radio item error API",
);
assertContains(
  files.reactSwitch,
  source.reactSwitch,
  "min-h-11",
  "React Switch 44px row target",
);
assertContains(
  files.reactSwitch,
  source.reactSwitch,
  "h-6 w-11",
  "React Switch 44x24 visual track",
);
assertContains(
  files.reactSwitch,
  source.reactSwitch,
  "h-5 w-5",
  "React Switch 20px visual thumb",
);
assertContains(
  files.reactSwitch,
  source.reactSwitch,
  "border-muted-foreground bg-muted-foreground",
  "React Switch neutral unchecked track",
);
assertContains(
  files.reactInput,
  source.reactInput,
  "kozmos-reset kozmos-input",
  "React Input owned recipe",
);
const ownedInput = ownedCss.match(/\.kozmos-input\s*\{([^}]*)\}/)?.[1] ?? "";
assertContains(
  ownedCssPath,
  ownedInput,
  "h-11",
  "React Input 44px field height",
);
assertContains(
  ownedCssPath,
  ownedInput,
  "rounded-control",
  "React Input radius class uses the Control role",
);
// The control boundary's role, which aliases foreground/500; the field read
// the primitive itself until 2026-09-22 (scripts/check-border-parity.mjs).
assertContains(
  ownedCssPath,
  ownedInput,
  "border border-input",
  "React Input neutral border token",
);
assertContains(
  files.reactInput,
  source.reactInput,
  "label?: string",
  "React Input label API",
);
assertContains(
  files.reactInput,
  source.reactInput,
  "helperText?: string",
  "React Input helper text API",
);
assertContains(
  files.reactInput,
  source.reactInput,
  "status?: InputStatus",
  "React Input validation status API",
);
assertContains(
  files.reactSelect,
  source.reactSelect,
  "flex h-11 w-full",
  "React SelectTrigger 44px field height",
);
assertContains(
  files.reactSlider,
  source.reactSlider,
  "border border-input bg-secondary",
  "React Slider inactive track boundary",
);
assertContains(
  files.reactInputFigma,
  source.reactInputFigma,
  'helperText: figma.boolean("Show Helper Text"',
  "Input Code Connect helper visibility mapping",
);
assertContains(
  files.reactInputFigma,
  source.reactInputFigma,
  'true: figma.string("Helper Text")',
  "Input Code Connect helper text mapping",
);
assertContains(
  files.reactInputFigma,
  source.reactInputFigma,
  "false: undefined",
  "Input Code Connect hides helper text by default",
);
assertContains(
  files.reactBadgeFigma,
  source.reactBadgeFigma,
  'counterProps: figma.boolean("Show Counter"',
  "Badge Code Connect counter visibility mapping",
);
assertContains(
  files.reactBadgeFigma,
  source.reactBadgeFigma,
  'figma.nestedProps("Counter"',
  "Badge Code Connect nested Counter mapping",
);
assertContains(
  files.reactTextareaFigma,
  source.reactTextareaFigma,
  'figma.enum("State"',
  "Textarea Code Connect state mapping",
);
assertContains(
  files.reactTextareaFigma,
  source.reactTextareaFigma,
  "node-id=80-328",
  "Textarea Code Connect node ID",
);
assertContains(
  files.reactTextareaFigma,
  source.reactTextareaFigma,
  'label: figma.string("Label Text")',
  "Textarea Code Connect label mapping",
);
assertContains(
  files.reactTextareaFigma,
  source.reactTextareaFigma,
  'placeholder: figma.string("Placeholder Text")',
  "Textarea Code Connect placeholder mapping",
);
assertContains(
  files.reactSearchFigma,
  source.reactSearchFigma,
  'figma.enum("State"',
  "Search Code Connect state mapping",
);
assertContains(
  files.reactSearchFigma,
  source.reactSearchFigma,
  "node-id=80-391",
  "Search Code Connect node ID",
);
assertContains(
  files.reactSearchFigma,
  source.reactSearchFigma,
  'label: figma.string("Label Text")',
  "Search Code Connect label mapping",
);
assertContains(
  files.reactSearchFigma,
  source.reactSearchFigma,
  'placeholder: figma.string("Placeholder Text")',
  "Search Code Connect placeholder mapping",
);
assertContains(
  files.reactSelectFigma,
  source.reactSelectFigma,
  'disabled: figma.enum("State"',
  "Select Code Connect disabled state mapping",
);
assertContains(
  files.reactSelectFigma,
  source.reactSelectFigma,
  "node-id=80-432",
  "Select Code Connect node ID",
);
assertContains(
  files.reactSelectFigma,
  source.reactSelectFigma,
  'autoFocus: figma.enum("State"',
  "Select Code Connect focus state mapping",
);
assertContains(
  files.reactSelectFigma,
  source.reactSelectFigma,
  'placeholder: figma.string("Placeholder Text")',
  "Select Code Connect placeholder mapping",
);
assertContains(
  files.reactSliderFigma,
  source.reactSliderFigma,
  'disabled: figma.enum("State"',
  "Slider Code Connect disabled state mapping",
);
assertContains(
  files.reactSliderFigma,
  source.reactSliderFigma,
  "node-id=80-473",
  "Slider Code Connect node ID",
);
assertContains(
  files.reactSliderFigma,
  source.reactSliderFigma,
  'label: figma.string("Label Text")',
  "Slider Code Connect label mapping",
);
assertContains(
  files.reactSliderFigma,
  source.reactSliderFigma,
  'defaultValue: figma.enum("Type"',
  "Slider Code Connect type-to-value mapping",
);
assertContains(
  files.reactSliderFigma,
  source.reactSliderFigma,
  'thumbCount: figma.enum("Type"',
  "Slider Code Connect type-to-thumb-count mapping",
);
assertContains(
  files.reactSlider,
  source.reactSlider,
  "thumbCount ??",
  "Slider range thumb count inference",
);
assertContains(
  files.reactSlider,
  source.reactSlider,
  "Array.isArray(props.defaultValue)",
  "Slider range defaultValue inference",
);
assertContains(
  files.reactProgressFigma,
  source.reactProgressFigma,
  'value: figma.enum("Value"',
  "Progress Code Connect value enum mapping",
);
assertContains(
  files.reactProgressFigma,
  source.reactProgressFigma,
  "node-id=83-252",
  "Progress Code Connect node ID",
);
assertContains(
  files.reactProgressFigma,
  source.reactProgressFigma,
  '"100": 100',
  "Progress Code Connect numeric value mapping",
);
assertContains(
  files.reactSpinnerFigma,
  source.reactSpinnerFigma,
  'size: figma.enum("Size"',
  "Spinner Code Connect size mapping",
);
assertContains(
  files.reactSpinnerFigma,
  source.reactSpinnerFigma,
  "node-id=83-261",
  "Spinner Code Connect node ID",
);
assertContains(
  files.reactAvatarFigma,
  source.reactAvatarFigma,
  'src: figma.string("Image URL")',
  "Avatar Code Connect image URL mapping",
);
assertContains(
  files.reactAvatarFigma,
  source.reactAvatarFigma,
  "node-id=83-272",
  "Avatar Code Connect node ID",
);
assertContains(
  files.reactAvatarFigma,
  source.reactAvatarFigma,
  'alt: figma.string("Alt Text")',
  "Avatar Code Connect alt text mapping",
);
assertContains(
  files.reactAvatarFigma,
  source.reactAvatarFigma,
  'fallback: figma.string("Fallback")',
  "Avatar Code Connect fallback mapping",
);
assertContains(
  files.reactAlertFigma,
  source.reactAlertFigma,
  "import { Alert, AlertDescription, AlertTitle }",
  "Alert Code Connect composed subcomponent import",
);
assertContains(
  files.reactAlertFigma,
  source.reactAlertFigma,
  "node-id=83-308",
  "Alert Code Connect node ID",
);
assertContains(
  files.reactAlertFigma,
  source.reactAlertFigma,
  'description: figma.string("Description")',
  "Alert Code Connect description mapping",
);
assertContains(
  files.reactAlertFigma,
  source.reactAlertFigma,
  "<AlertTitle>{title}</AlertTitle>",
  "Alert Code Connect title composition",
);
assertContains(
  files.reactAlertFigma,
  source.reactAlertFigma,
  "<AlertDescription>{description}</AlertDescription>",
  "Alert Code Connect description composition",
);
assertContains(
  files.iosAlert,
  source.iosAlert,
  "case `default`, info, success, warning, destructive",
  "iOS Alert keeps Default and Info as distinct tones",
);
assertContains(
  files.iosAlertFigma,
  source.iosAlertFigma,
  '"Info": KozmosAlert<AnyView>.KozmosAlertVariant.info',
  "iOS Alert Code Connect maps Info to the native info tone",
);
assertContains(
  files.iosAlertFigma,
  source.iosAlertFigma,
  "KozmosAlertTitle(self.title, color: self.alertVariant.foregroundColor)",
  "iOS Alert Code Connect applies variant title color",
);
assertContains(
  files.androidAlert,
  source.androidAlert,
  "Default, Info, Success, Warning, Error",
  "Android Alert keeps Default and Info as distinct tones",
);
assertContains(
  files.androidAlert,
  source.androidAlert,
  "status: AlertStatus = AlertStatus.Default",
  "Android Alert default status is neutral",
);
assertContains(
  files.androidAlertFigma,
  source.androidAlertFigma,
  '"Default" to AlertStatus.Default',
  "Android Alert Code Connect maps Default to the neutral tone",
);
assertContains(
  files.androidAlertFigma,
  source.androidAlertFigma,
  '"Info" to AlertStatus.Info',
  "Android Alert Code Connect maps Info to the info tone",
);
assertContains(
  files.reactLinkFigma,
  source.reactLinkFigma,
  "node-id=170-1385",
  "Link Code Connect node ID",
);
assertContains(
  files.reactLinkFigma,
  source.reactLinkFigma,
  'variant: figma.enum("Variant"',
  "Link Code Connect variant mapping",
);
assertContains(
  files.reactLinkFigma,
  source.reactLinkFigma,
  'children: figma.string("Link Text")',
  "Link Code Connect text mapping",
);
assertContains(
  files.reactLinkFigma,
  source.reactLinkFigma,
  '<Link href="#" variant={variant}>',
  "Link Code Connect href composition",
);
assertContains(
  files.reactSeparatorFigma,
  source.reactSeparatorFigma,
  "node-id=170-1393",
  "Separator Code Connect node ID",
);
assertContains(
  files.reactSeparatorFigma,
  source.reactSeparatorFigma,
  'orientation: figma.enum("Orientation"',
  "Separator Code Connect orientation mapping",
);
assertContains(
  files.reactSkeletonFigma,
  source.reactSkeletonFigma,
  "node-id=170-1062",
  "Skeleton Code Connect node ID",
);
assertContains(
  files.reactSkeletonFigma,
  source.reactSkeletonFigma,
  'className: figma.enum("Shape"',
  "Skeleton Code Connect shape mapping",
);
assertContains(
  files.reactSkeletonFigma,
  source.reactSkeletonFigma,
  'Circle: "h-10 w-10 rounded-pill"',
  "Skeleton Code Connect circle composition",
);
assertContains(
  files.reactBoxFigma,
  source.reactBoxFigma,
  "node-id=170-1002",
  "Box Code Connect node ID",
);
assertContains(
  files.reactBoxFigma,
  source.reactBoxFigma,
  'className: figma.enum("Surface"',
  "Box Code Connect surface mapping",
);
assertContains(
  files.reactBoxFigma,
  source.reactBoxFigma,
  'children: figma.slot("Content Slot") ?? figma.children(["Content Slot"])',
  "Box Code Connect content slot mapping",
);
assertContains(
  files.reactContainerFigma,
  source.reactContainerFigma,
  "node-id=170-1034",
  "Container Code Connect node ID",
);
assertContains(
  files.reactContainerFigma,
  source.reactContainerFigma,
  'centered: figma.enum("Centered"',
  "Container Code Connect centered mapping",
);
assertContains(
  files.reactContainerFigma,
  source.reactContainerFigma,
  'children: figma.slot("Content Slot") ?? figma.children(["Content Slot"])',
  "Container Code Connect content slot mapping",
);
assertContains(
  files.reactBreadcrumbFigma,
  source.reactBreadcrumbFigma,
  "node-id=170-1048",
  "Breadcrumb Code Connect node ID",
);
assertContains(
  files.reactBreadcrumbFigma,
  source.reactBreadcrumbFigma,
  'variant: { Content: "Basic" }',
  "Breadcrumb Code Connect Basic variant filter",
);
assertContains(
  files.reactBreadcrumbFigma,
  source.reactBreadcrumbFigma,
  'variant: { Content: "Ellipsis" }',
  "Breadcrumb Code Connect Ellipsis variant filter",
);
assertContains(
  files.reactBreadcrumbFigma,
  source.reactBreadcrumbFigma,
  "<BreadcrumbEllipsis />",
  "Breadcrumb Code Connect ellipsis composition",
);
assertContains(
  files.reactPaginationFigma,
  source.reactPaginationFigma,
  'variant: { Content: "Basic" }',
  "Pagination Code Connect Basic variant filter",
);
assertContains(
  files.reactPaginationFigma,
  source.reactPaginationFigma,
  'variant: { Content: "Ellipsis" }',
  "Pagination Code Connect Ellipsis variant filter",
);
assertContains(
  files.reactPaginationFigma,
  source.reactPaginationFigma,
  'variant: { Content: "Compact" }',
  "Pagination Code Connect Compact variant filter",
);
assertContains(
  files.reactPaginationFigma,
  source.reactPaginationFigma,
  'size: figma.enum("Size"',
  "Pagination Code Connect size mapping",
);
assertContains(
  files.reactPaginationFigma,
  source.reactPaginationFigma,
  "<PaginationEllipsis />",
  "Pagination Code Connect ellipsis composition",
);
assertContains(
  files.reactPagination,
  source.reactPagination,
  "aria-current={isActive ? 'page' : undefined}",
  "React Pagination current page semantics",
);
assertContains(
  files.reactAccordionFigma,
  source.reactAccordionFigma,
  "node-id=170-977",
  "Accordion Code Connect node ID",
);
assertContains(
  files.reactAccordionFigma,
  source.reactAccordionFigma,
  'variant: { State: "Closed" }',
  "Accordion Code Connect Closed variant filter",
);
assertContains(
  files.reactAccordionFigma,
  source.reactAccordionFigma,
  'variant: { State: "Open" }',
  "Accordion Code Connect Open variant filter",
);
assertContains(
  files.reactAccordionFigma,
  source.reactAccordionFigma,
  'defaultValue="item-1"',
  "Accordion Code Connect open default value",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'variant: { Content: "Basic" }',
  "Card Code Connect Basic variant filter",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'variant: { Content: "Header" }',
  "Card Code Connect Header variant filter",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'variant: { Content: "Full" }',
  "Card Code Connect Full variant filter",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  "node-id=87-2536",
  "Card Code Connect node ID",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'title: figma.string("Title Text")',
  "Card Code Connect title mapping",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'description: figma.string("Description Text")',
  "Card Code Connect description mapping",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  'body: figma.string("Body Text")',
  "Card Code Connect body mapping",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  "<CardHeader>",
  "Card Code Connect header composition",
);
assertContains(
  files.reactCardFigma,
  source.reactCardFigma,
  "<CardFooter",
  "Card Code Connect footer composition",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  "node-id=90-3387",
  "Tabs Code Connect node ID",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  'defaultValue: figma.enum("Active"',
  "Tabs Code Connect active mapping",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  'disabled: figma.enum("State"',
  "Tabs Code Connect disabled mapping",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  'tab1Text: figma.string("Tab 1 Text")',
  "Tabs Code Connect first tab label mapping",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  "<TabsList>",
  "Tabs Code Connect list composition",
);
assertContains(
  files.reactTabsFigma,
  source.reactTabsFigma,
  "<TabsTrigger",
  "Tabs Code Connect trigger composition",
);
assertContains(
  files.reactTooltipFigma,
  source.reactTooltipFigma,
  'side: figma.enum("Side"',
  "Tooltip Code Connect side mapping",
);
assertContains(
  files.reactTooltipFigma,
  source.reactTooltipFigma,
  "node-id=91-4672",
  "Tooltip Code Connect node ID",
);
assertContains(
  files.reactTooltipFigma,
  source.reactTooltipFigma,
  'children: figma.string("Content Text")',
  "Tooltip Code Connect content text mapping",
);
assertContains(
  files.reactTooltipFigma,
  source.reactTooltipFigma,
  "<TooltipContent side={side}>{children}</TooltipContent>",
  "Tooltip Code Connect content composition",
);
assertContains(
  files.reactTooltip,
  source.reactTooltip,
  "TooltipPrimitive.Arrow",
  "React Tooltip arrow rendering",
);
assertContains(
  files.reactTooltip,
  source.reactTooltip,
  "overflow-visible",
  "React Tooltip content lets the arrow protrude",
);
assertContains(
  files.reactDrawerFigma,
  source.reactDrawerFigma,
  'side: figma.enum("Side"',
  "Drawer Code Connect side mapping",
);
assertContains(
  files.reactDrawerFigma,
  source.reactDrawerFigma,
  'title: figma.string("Title Text")',
  "Drawer Code Connect title mapping",
);
assertContains(
  files.reactDrawerFigma,
  source.reactDrawerFigma,
  'content: figma.slot("Content Slot") ?? figma.children(["Content Slot"])',
  "Drawer Code Connect content slot mapping",
);
assertContains(
  files.reactDrawerFigma,
  source.reactDrawerFigma,
  'actions: figma.children(["Secondary Action", "Primary Action"])',
  "Drawer Code Connect footer action mapping",
);
assertContains(
  files.reactDrawer,
  source.reactDrawer,
  'export type DrawerSide = "left" | "right" | "top" | "bottom"',
  "React Drawer side API",
);
assertContains(
  files.reactDrawer,
  source.reactDrawer,
  "data-side={side}",
  "React Drawer side data attribute",
);
assertContains(
  files.reactList,
  source.reactList,
  "export type ListDensity =",
  "React List density API",
);
assertContains(
  files.reactListFigma,
  source.reactListFigma,
  'density: figma.enum("Density"',
  "List Code Connect density mapping",
);
assertContains(
  files.reactListFigma,
  source.reactListFigma,
  "<ListItem>{item1}</ListItem>",
  "List Code Connect item composition",
);
assertContains(
  files.reactTableFigma,
  source.reactTableFigma,
  'density: figma.enum("Density"',
  "Table Code Connect density mapping",
);
assertContains(
  files.reactTableFigma,
  source.reactTableFigma,
  "<TableHeader>",
  "Table Code Connect header composition",
);
assertContains(
  files.reactTableFigma,
  source.reactTableFigma,
  'row3Cell3: figma.string("Row 3 Cell 3 Text")',
  "Table Code Connect cell text mapping",
);
assertContains(
  files.iosDrawer,
  source.iosDrawer,
  "public enum KozmosDrawerSide",
  "iOS Drawer side API",
);
assertContains(
  files.iosDrawer,
  source.iosDrawer,
  "@ViewBuilder content: @escaping () -> Content",
  "iOS Drawer body content slot API",
);
assertContains(
  files.iosListFigma,
  source.iosListFigma,
  "KozmosList<AnyView>.self",
  "iOS List Code Connect scaffold",
);
assertContains(
  files.iosTableFigma,
  source.iosTableFigma,
  "KozmosTable<[KozmosTableConnectRow], AnyView>.self",
  "iOS Table Code Connect scaffold",
);
assertContains(
  files.iosPaginationFigma,
  source.iosPaginationFigma,
  "KozmosPagination<AnyView>.self",
  "iOS Pagination Code Connect scaffold",
);
assertContains(
  files.iosPaginationFigma,
  source.iosPaginationFigma,
  'variant = ["Content": "Compact"]',
  "iOS Pagination compact variant scaffold",
);
assertContains(
  files.androidDrawer,
  source.androidDrawer,
  "enum class KozmosDrawerSide",
  "Android Drawer side API",
);
assertContains(
  files.androidListFigma,
  source.androidListFigma,
  "class KozmosListConnect",
  "Android List Code Connect scaffold",
);
assertContains(
  files.androidTableFigma,
  source.androidTableFigma,
  "class KozmosTableConnect",
  "Android Table Code Connect scaffold",
);
assertContains(
  files.androidPaginationFigma,
  source.androidPaginationFigma,
  "class KozmosPaginationBasicConnect",
  "Android Pagination Code Connect scaffold",
);
assertContains(
  files.androidPaginationFigma,
  source.androidPaginationFigma,
  '@FigmaVariant("Content", "Ellipsis")',
  "Android Pagination ellipsis variant scaffold",
);
assertContains(
  files.iosTooltip,
  source.iosTooltip,
  "public enum KozmosTooltipSide",
  "iOS Tooltip side API",
);
assertContains(
  files.iosTooltip,
  source.iosTooltip,
  "KozmosTooltipTip",
  "iOS Tooltip triangular tip",
);
assertContains(
  files.iosTooltip,
  source.iosTooltip,
  "Path { path in",
  "iOS Tooltip custom tip path",
);
assertContains(
  files.androidTooltip,
  source.androidTooltip,
  "enum class KozmosTooltipSide",
  "Android Tooltip side API",
);
assertContains(
  files.androidTooltip,
  source.androidTooltip,
  "TooltipTip",
  "Android Tooltip triangular tip",
);
assertContains(
  files.androidTooltip,
  source.androidTooltip,
  "Canvas",
  "Android Tooltip custom tip path",
);
assertContains(
  files.androidTooltip,
  source.androidTooltip,
  "PopupPositionProvider",
  "Android Tooltip measured popup positioning",
);
// Every Code Connect file pinned to a node must be listed in its platform's
// linked config. The configs are explicit file lists, not globs: a file left
// off is never validated by the dry runs and never sent by publish, and nothing
// says so. Backdrop on all three platforms and React's Icon sat outside them
// from the start, found only when the 2026-09-21 publish did not name them.
{
  const unlisted = [];
  for (const { config, sourceRoot, packageRoot, extension } of [
    {
      config: files.figmaLinked,
      sourceRoot: "packages/react/src",
      packageRoot: "packages/react",
      extension: ".figma.tsx",
    },
    {
      config: files.iosFigmaLinked,
      sourceRoot: "packages/ios/Sources",
      packageRoot: "packages/ios",
      extension: ".figma.swift",
    },
    {
      config: files.androidFigmaLinked,
      sourceRoot: "packages/android/src",
      packageRoot: "packages/android",
      extension: ".figma.kt",
    },
  ]) {
    const listed = new Set();
    for (const includePath of JSON.parse(read(config)).codeConnect.include) {
      const candidates = [
        path.join(path.dirname(config), includePath),
        includePath,
        path.join(packageRoot, includePath),
      ].map((candidate) => path.normalize(candidate));
      const found = candidates.find((candidate) =>
        fs.existsSync(path.join(root, candidate)),
      );
      if (!found)
        unlisted.push(`${config} lists ${includePath}, which does not exist`);
      else listed.add(found);
    }
    for (const filePath of listFilesRecursive(sourceRoot, (candidate) =>
      candidate.endsWith(extension),
    )) {
      const placeholder =
        /node-id=TBD|nodeId\s*=\s*["']TBD["']|node-id%3DTBD/i.test(
          read(filePath),
        );
      if (!placeholder && !listed.has(path.normalize(filePath))) {
        unlisted.push(`${config} does not list ${filePath}`);
      }
    }
  }
  if (unlisted.length > 0) {
    fail(
      `The linked Code Connect configs and the files disagree (an unlisted file is never validated or published):\n  ${unlisted.join("\n  ")}`,
    );
  }
}
// Dev Mode shows each snippet's import line. Without importPaths the React
// parser prints the mapping file's own relative import ("./CategoryField"),
// which no consumer can use, and SwiftUI snippets print no import at all.
{
  const reactPackage = JSON.parse(read("packages/react/package.json")).name;
  for (const config of [
    files.figmaLinked,
    "packages/react/figma.config.json",
  ]) {
    const mapped = JSON.parse(read(config)).codeConnect.importPaths?.[
      "src/components/*"
    ];
    if (mapped !== reactPackage) {
      fail(
        `${config}: React snippets must import from ${reactPackage} (importPaths "src/components/*"), not ${mapped ?? "their relative path"}`,
      );
    }
  }
  const swiftLibrary = read("packages/ios/Package.swift").match(
    /\.library\(\s*name:\s*"([^"]+)"/,
  )?.[1];
  const swiftImport = JSON.parse(read(files.iosFigmaLinked)).codeConnect
    .importPaths?.["Sources/Components/"];
  if (!swiftLibrary || swiftImport !== `import ${swiftLibrary}`) {
    fail(
      `${files.iosFigmaLinked}: SwiftUI snippets must carry "import ${swiftLibrary}" (importPaths "Sources/Components/"), not ${swiftImport ?? "none"}`,
    );
  }
}
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Counter/Counter.figma.tsx",
  "Linked Code Connect includes Counter template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Counter/Counter.tsx",
  "Linked Code Connect includes Counter source",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Card/Card.figma.tsx",
  "Linked Code Connect includes Card template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Card/Card.tsx",
  "Linked Code Connect includes Card source",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Pagination/Pagination.figma.tsx",
  "Linked Code Connect includes Pagination template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Pagination/Pagination.tsx",
  "Linked Code Connect includes Pagination source",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Tabs/Tabs.figma.tsx",
  "Linked Code Connect includes Tabs template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Tabs/Tabs.tsx",
  "Linked Code Connect includes Tabs source",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Tooltip/Tooltip.figma.tsx",
  "Linked Code Connect includes Tooltip template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Tooltip/Tooltip.tsx",
  "Linked Code Connect includes Tooltip source",
);
for (const [templatePath, sourcePath, label] of [
  [
    "src/components/Link/Link.figma.tsx",
    "src/components/Link/Link.tsx",
    "Link",
  ],
  [
    "src/components/Separator/Separator.figma.tsx",
    "src/components/Separator/Separator.tsx",
    "Separator",
  ],
  [
    "src/components/Skeleton/Skeleton.figma.tsx",
    "src/components/Skeleton/Skeleton.tsx",
    "Skeleton",
  ],
  ["src/components/Box/Box.figma.tsx", "src/components/Box/Box.tsx", "Box"],
  [
    "src/components/Container/Container.figma.tsx",
    "src/components/Container/Container.tsx",
    "Container",
  ],
  [
    "src/components/Breadcrumb/Breadcrumb.figma.tsx",
    "src/components/Breadcrumb/Breadcrumb.tsx",
    "Breadcrumb",
  ],
  [
    "src/components/Accordion/Accordion.figma.tsx",
    "src/components/Accordion/Accordion.tsx",
    "Accordion",
  ],
]) {
  assertContains(
    files.figmaLinked,
    source.figmaLinked,
    templatePath,
    `Linked Code Connect includes ${label} template`,
  );
  assertContains(
    files.figmaLinked,
    source.figmaLinked,
    sourcePath,
    `Linked Code Connect includes ${label} source`,
  );
}
assertContains(
  files.vueIndex,
  source.vueIndex,
  "KozmosButton = createVueWrapper(ReactButton)",
  "Vue Button wraps React Button",
);
assertContains(
  files.vueIndex,
  source.vueIndex,
  "KozmosCounter = createVueWrapper(ReactCounter)",
  "Vue Counter wraps React Counter",
);
assertContains(
  files.vueIndex,
  source.vueIndex,
  "KozmosBadge = createVueWrapper(ReactBadge)",
  "Vue Badge wraps React Badge",
);
assertContains(
  files.vueIndex,
  source.vueIndex,
  "KozmosIconButton = createVueWrapper(IconButton)",
  "Vue IconButton wraps React IconButton",
);

// CategoryField: the search field's form once a category is chosen — the
// contract's numbers on every platform and in the importer.
{
  const field = categoryField.content;
  const twips = (px) => px / 4;
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `flex h-${twips(field.height)} min-w-0 items-center`,
    `React CategoryField ${field.height} tall`,
  );
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `flex h-${twips(field.iconSize)} w-${twips(field.iconSize)} shrink-0`,
    `React CategoryField icon at ${field.iconSize}`,
  );
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `text-[${field.labelFontSize}px] font-${field.labelWeight}`,
    `React CategoryField label ${field.labelFontSize} ${field.labelWeight}`,
  );
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `h-[${field.pillHeight}px] min-w-[${field.pillHeight}px]`,
    `React CategoryField pill ${field.pillHeight}`,
  );
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `flex h-${twips(field.clearSize)} w-${twips(field.clearSize)} shrink-0`,
    `React CategoryField clear ${field.clearSize}`,
  );
  assertContains(
    files.reactCategoryField,
    source.reactCategoryField,
    `${Math.round(field.washOpacity * 100)}%, transparent`,
    `React CategoryField wash at ${field.washOpacity}`,
  );
  for (const [name, value] of [
    ["height", field.height],
    ["iconSize", field.iconSize],
    ["pillHeight", field.pillHeight],
    ["clearSize", field.clearSize],
  ]) {
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      `static var ${name}: CGFloat { ${value} }`,
      `iOS CategoryField ${name} ${value}`,
    );
  }
  assertContains(
    files.iosCategoryField,
    source.iosCategoryField,
    `.font(.system(size: ${field.labelFontSize}, weight: .${field.labelWeight}))`,
    `iOS CategoryField label ${field.labelFontSize} ${field.labelWeight}`,
  );
  assertContains(
    files.iosCategoryField,
    source.iosCategoryField,
    `.background(tint.accent.opacity(${field.washOpacity}))`,
    `iOS CategoryField wash at ${field.washOpacity}`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    `.height(${field.height}.dp)`,
    `Android CategoryField ${field.height} tall`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    `Modifier.size(${field.iconSize}.dp)`,
    `Android CategoryField icon at ${field.iconSize}`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    new RegExp(
      `fontSize = ${field.labelFontSize}\\.sp,\\s*fontWeight = FontWeight\\.SemiBold`,
    ),
    `Android CategoryField label ${field.labelFontSize} semibold`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    `minWidth = ${field.pillHeight}.dp, minHeight = ${field.pillHeight}.dp`,
    `Android CategoryField pill ${field.pillHeight}`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    `.size(${field.clearSize}.dp)`,
    `Android CategoryField clear ${field.clearSize}`,
  );
  assertContains(
    files.androidCategoryField,
    source.androidCategoryField,
    `alpha = ${field.washOpacity}f`,
    `Android CategoryField wash at ${field.washOpacity}`,
  );
  for (const [name, value] of [
    ["HEIGHT", field.height],
    ["ICON_SIZE", field.iconSize],
    ["PILL_HEIGHT", field.pillHeight],
    ["CLEAR_SIZE", field.clearSize],
    ["LABEL_FONT_SIZE", field.labelFontSize],
    ["LABEL_LINE_HEIGHT", field.labelLineHeight],
  ]) {
    assertContains(
      files.figma,
      source.figma,
      `const CATEGORY_FIELD_${name} = ${value};`,
      `Figma CategoryField ${name} ${value}`,
    );
  }
  // A bound paint's own opacity is not relied on (the live file lost three
  // of four on 2026-09-21), so the wash is a layer of its own at the
  // contract's opacity.
  assertContains(
    files.figma,
    source.figma,
    `const CATEGORY_FIELD_WASH_OPACITY = ${field.washOpacity};`,
    `Figma CategoryField wash at ${field.washOpacity}`,
  );
  assertContains(
    files.figma,
    source.figma,
    /name: "Tint Wash",\s*token: tint\.accent,\s*opacity: CATEGORY_FIELD_WASH_OPACITY,/,
    "Figma CategoryField wash is a layer at that opacity",
  );

  // Ruled 2026-09-21: the label and the clear's cross in foreground/0; the
  // icon decorative, hidden from assistive technology.
  if (
    field.labelColor === "foreground/0" &&
    field.clearColor === "foreground/0"
  ) {
    assertContains(
      files.reactCategoryField,
      source.reactCategoryField,
      "rounded-control border pl-3 pr-0.5 text-foreground",
      "React CategoryField label and clear in the foreground",
    );
    assertNotContains(
      files.reactCategoryField,
      source.reactCategoryField,
      /color: "var\(--kozmos-category-tint\)",\s*borderColor/,
      "React CategoryField's text inheriting the category colour",
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      `.font(.system(size: ${field.labelFontSize}, weight: .${field.labelWeight}))\n                .foregroundColor(KozmosColors.primitivesColorsForeground0)`,
      "iOS CategoryField label in foreground/0",
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      /Image\(systemName: "xmark"\)\s*\.font\([^)]*\)\)\s*\.foregroundColor\(KozmosColors\.primitivesColorsForeground0\)/,
      "iOS CategoryField clear in foreground/0",
    );
    assertContains(
      files.androidCategoryField,
      source.androidCategoryField,
      "color = KozmosThemeTokens.primitivesColorsForeground0,",
      "Android CategoryField label in foreground/0, themed",
    );
    assertContains(
      files.androidCategoryField,
      source.androidCategoryField,
      "tint = KozmosThemeTokens.primitivesColorsForeground0",
      "Android CategoryField clear in foreground/0, themed",
    );
    assertContains(
      files.figma,
      source.figma,
      'const CATEGORY_FIELD_INK = { name: "Colors/foreground/0", fallback: "#000000" };',
      "Figma CategoryField ink is foreground/0",
    );
    assertContains(
      files.figma,
      source.figma,
      /colorToken: CATEGORY_FIELD_INK\.name,[\s\S]{0,4000}?iconName: "x-close",\s*token: CATEGORY_FIELD_INK,/,
      "Figma CategoryField label and cross take that ink",
    );
  }
  // Ruled 2026-09-21: the clear's circle to see in a 44 target to hit, as
  // the search bar's; the trailing padding gives back the 6 the target adds
  // on each side, so the circle stays 8 from the edge.
  if (field.clearHitArea) {
    const hit = field.clearHitArea;
    const inset = (field.clearHitArea - field.clearSize) / 2;
    assertContains(
      files.reactCategoryField,
      source.reactCategoryField,
      `group flex h-${twips(hit)} w-${twips(hit)} shrink-0`,
      `React CategoryField clear target ${hit}`,
    );
    assertContains(
      files.reactCategoryField,
      source.reactCategoryField,
      `pl-3 pr-${twips(8 - inset)} `,
      `React CategoryField trailing padding ${8 - inset}`,
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      `static var clearHitArea: CGFloat { ${hit} }`,
      `iOS CategoryField clearHitArea ${hit}`,
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      /\.frame\(width: Self\.clearSize, height: Self\.clearSize\)\s*\.frame\(width: Self\.clearHitArea, height: Self\.clearHitArea\)\s*\.contentShape\(Rectangle\(\)\)/,
      "iOS CategoryField clear circle inside its target",
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      ".padding(.trailing, KozmosDimensions.primitivesLayoutSpacing25)",
      `iOS CategoryField trailing padding ${8 - inset}`,
    );
    assertContains(
      files.androidCategoryField,
      source.androidCategoryField,
      new RegExp(`\\.size\\(${hit}\\.dp\\)\\s*\\.clickable\\(`),
      `Android CategoryField clear target ${hit}`,
    );
    assertContains(
      files.androidCategoryField,
      source.androidCategoryField,
      "end = KozmosDimensions.primitivesLayoutSpacing25",
      `Android CategoryField trailing padding ${8 - inset}`,
    );
    assertNotContains(
      files.androidCategoryField,
      source.androidCategoryField,
      "Spacer(modifier = Modifier.weight(1f))",
      "Android CategoryField spacer weighted against the name, which floated the clear inward",
    );
  }

  if (field.iconDecorative) {
    assertContains(
      files.reactCategoryField,
      source.reactCategoryField,
      /<span\s+aria-hidden="true"\s+className="flex h-7 w-7/,
      "React CategoryField icon hidden",
    );
    assertContains(
      files.iosCategoryField,
      source.iosCategoryField,
      /\.foregroundColor\(tint\.accent\)\s*\.accessibilityHidden\(true\)/,
      "iOS CategoryField icon hidden",
    );
    assertContains(
      files.androidCategoryField,
      source.androidCategoryField,
      "Modifier.size(28.dp).clearAndSetSemantics {}",
      "Android CategoryField icon hidden",
    );
  }
}

// CategoryTile's icon is decorative on every platform and in Figma.
if (categoryTile.content.iconDecorative) {
  assertContains(
    files.reactCategoryTile,
    source.reactCategoryTile,
    /<span\s+aria-hidden="true"\s+className=\{cn\(\s*"relative flex h-16 w-16/,
    "React CategoryTile square hidden",
  );
  assertContains(
    files.iosCategoryTile,
    source.iosCategoryTile,
    /\.offset\(x: 4, y: -4\)\s*\}\s*\}\s*\.accessibilityHidden\(true\)/,
    "iOS CategoryTile square hidden",
  );
  assertContains(
    files.androidCategoryTile,
    source.androidCategoryTile,
    "primitivesLayoutSizing300).clearAndSetSemantics {}",
    "Android CategoryTile icon hidden",
  );
  assertOccurrenceCount(
    files.figma,
    source.figma,
    /^ {4}markDecorativeIcon\(icon\);$/gm,
    2,
    "Figma marks the tile's and the field's icon decorative",
  );
}

// The curated icons: the registry, the plugin's definitions and the catalog
// agree, name for name and key for key, so a painter never asks the Icons
// page for a symbol Curated Icons cannot import.
{
  const registry = read("packages/icons/src/registry.ts");
  const namesBlock = registry.slice(
    registry.indexOf("export const kozmosIconNames = ["),
    registry.indexOf("] as const"),
  );
  const names = [...namesBlock.matchAll(/^\s+"([a-z0-9-]+)",$/gm)].map(
    (m) => m[1],
  );
  const start = source.figma.indexOf("const KOSMOS_ICON_DEFINITIONS = [");
  const block = source.figma.slice(start, source.figma.indexOf("\n];", start));
  // Entry by entry: a taxonomy symbol has no component key, and a pattern
  // spanning entries would pair its name with the next entry's key.
  const definitions = new Map(
    block
      .split(/\n {2}\{\n/)
      .slice(1)
      .map((entry) => {
        const field = (key, pattern) =>
          (entry.match(new RegExp(`^ {4}${key}: "(${pattern})",$`, "m")) ||
            [])[1];
        return [
          field("name", "[a-z0-9-]+"),
          {
            componentKey: field("componentKey", "[0-9a-f]+"),
            source: field("source", "[a-z]+"),
          },
        ];
      }),
  );
  const catalog = JSON.parse(read("docs/figma-pointr-icon-catalog.json"));
  const items = Array.isArray(catalog)
    ? catalog
    : catalog.icons || Object.values(catalog);
  const keyByName = new Map(
    items.map((item) => [item.name, item.componentKey]),
  );
  // The taxonomy's symbols: the art the plugin draws them from, and the
  // registry's own record that they are the taxonomy's.
  const svgStart = source.figma.indexOf("const TAXONOMY_ICON_SVGS = {");
  const drawn = new Set(
    [
      ...source.figma
        .slice(svgStart, source.figma.indexOf("\n};", svgStart))
        .matchAll(/^ {2}"([a-z0-9-]+)":(?:$| ')/gm),
    ].map((m) => m[1]),
  );
  const taxonomyInRegistry = new Set(
    [
      ...registry.matchAll(
        /name: "([a-z0-9-]+)",\s+figmaName: "[^"]+",\s+source: "taxonomy",/g,
      ),
    ].map((m) => m[1]),
  );
  for (const name of names) {
    const definition = definitions.get(name);
    if (!definition) {
      fail(
        `figma/foundations-importer/code.js: curated icon "${name}" is in the registry but has no KOSMOS_ICON_DEFINITIONS entry`,
      );
    } else if (definition.source === "taxonomy") {
      if (definition.componentKey || !drawn.has(name)) {
        fail(
          `figma/foundations-importer/code.js: taxonomy symbol "${name}" needs its SVG in TAXONOMY_ICON_SVGS and no component key`,
        );
      }
      if (!taxonomyInRegistry.has(name)) {
        fail(
          `packages/icons/src/registry.ts: "${name}" is a taxonomy symbol in the plugin, and its definition does not say source: "taxonomy"`,
        );
      }
    } else if (definition.componentKey !== keyByName.get(name)) {
      fail(
        `figma/foundations-importer/code.js: "${name}" carries a component key the catalog does not`,
      );
    }
  }
  for (const name of drawn) {
    if (!definitions.has(name) || definitions.get(name).source !== "taxonomy") {
      fail(
        `figma/foundations-importer/code.js: TAXONOMY_ICON_SVGS draws "${name}", which no taxonomy definition names`,
      );
    }
  }
  for (const name of definitions.keys()) {
    if (!names.includes(name)) {
      fail(
        `figma/foundations-importer/code.js: "${name}" is defined but packages/icons/src/registry.ts does not name it`,
      );
    }
  }
}

// Figma generator parity.
for (const tokenName of [
  "Button/height/small",
  "Button/height/default",
  "Button/height/large",
  "Button/height/icon",
  "IconButton/size/small",
  "IconButton/size/default",
  "IconButton/size/large",
  "Badge/height/small",
  "Badge/height/default",
  "Badge/height/large",
  "Badge/height/icon",
  "Checkbox/height/default",
  "Radio/height/default",
  "Switch/height/default",
  "Input/field/height",
  "Search/field/height",
  "Select/trigger/height",
  "Slider/height/default",
]) {
  // The large icon button is the one size above the touch target: 48, the
  // prototype's Filters and AI search beside a 44 field (2026-09-21).
  const expected =
    tokenName === "IconButton/size/large"
      ? contract.components.iconButton.sizes.large.width
      : target;
  assertContains(
    files.figma,
    source.figma,
    tokenValuePattern(tokenName, expected),
    `${tokenName} token at ${expected}px`,
  );
}
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Button/width/icon", target),
  "Button icon width token at 44px",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/width/icon", target),
  "Badge icon width token at 44px",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/gap", badge.content.gap),
  "Badge gap token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/icon/size", badge.content.iconSize),
  "Badge icon size token",
);
assertContains(
  files.figma,
  source.figma,
  "Counter",
  "Counter component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "Link",
  "Link component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "Separator",
  "Separator component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "Skeleton",
  "Skeleton component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "Box",
  "Box component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "Stack",
  "Stack component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "const STACK_DIRECTIONS =",
  "Stack direction axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const STACK_GAPS =",
  "Stack gap axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildStackComponent()",
  "Stack build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateStackComponent()",
  "Stack update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Stack"',
  "Stack documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Stack/gap/4"`,
  "Stack gap component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="stack">Stack</option>',
  "Stack UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-stack"',
  "Stack UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Stack**",
  "Stack importer documentation",
);
assertContains(
  files.reactStack,
  source.reactStack,
  "direction: {",
  "React Stack direction variants",
);
assertContains(
  files.reactStack,
  source.reactStack,
  "gap: {",
  "React Stack gap variants",
);
assertContains(
  files.reactStackFigma,
  source.reactStackFigma,
  "node-id=170-1027",
  "Stack Code Connect node id",
);
assertContains(
  files.reactStackFigma,
  source.reactStackFigma,
  'children: figma.slot("Content Slot") ?? figma.children("*")',
  "Stack Code Connect content slot mapping",
);
assertContains(
  files.reactStackFigma,
  source.reactStackFigma,
  'Row: "row"',
  "Stack Code Connect row direction mapping",
);
assertContains(
  files.reactStackFigma,
  source.reactStackFigma,
  '"2": 2',
  "Stack Code Connect gap mapping",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Stack/Stack.figma.tsx",
  "Stack Code Connect parser include",
);
assertNotContains(
  files.reactStackFigma,
  source.reactStackFigma,
  "node-id=TBD",
  "placeholder Stack Code Connect node id",
);
assertContains(
  files.figma,
  source.figma,
  "const GRID_COLUMNS =",
  "Grid columns axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const GRID_GAPS =",
  "Grid gap axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildGridComponent()",
  "Grid build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateGridComponent()",
  "Grid update handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function rebuildGridComponent()",
  "Grid rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Grid"',
  "Grid documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Grid/gap/4"`,
  "Grid gap component token",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Grid/cell/height/default"`,
  "Grid cell slot height token",
);
assertContains(
  files.figma,
  source.figma,
  "configureGridProperties(componentSet, stats)",
  "Grid property configuration hook",
);
assertContains(
  files.figma,
  source.figma,
  "configureSharedSlotProperties(",
  "Layout component slots are consolidated into shared slot properties",
);
assertContains(
  files.figma,
  source.figma,
  "function bindSlotProperty(",
  "Slot nodes are rebound to canonical component-set slot properties",
);
assertContains(
  files.figma,
  source.figma,
  "auditComponentPropertyConflicts(propertyDefinitions)",
  "Audit catches conflicting exposed component property names",
);
assertContains(
  files.figma,
  source.figma,
  "gridCellSlotNames(columnCount, GRID_PREVIEW_ROWS)",
  "Grid creates row-major cell slots",
);
assertContains(
  files.figma,
  source.figma,
  "function createGridRowFrame",
  "Grid uses auto-layout row wrappers for responsive cells",
);
assertContains(
  files.figma,
  source.figma,
  "setHorizontalStackFillChildSizing(cellSlot)",
  "Grid cell slots fill available row space",
);
assertOccurrenceCount(
  files.figma,
  source.figma,
  /function setHorizontalStackFillChildSizing\(/g,
  1,
  "horizontal fill sizing helper",
);
assertContains(
  files.figma,
  source.figma,
  "Cell 1 Slot",
  "Grid exposes named cell slots",
);
assertContains(
  files.figma,
  source.figma,
  "parseGridVariantName(component.name) ||",
  "Grid contrast audit recognizes variant state",
);
assertContains(
  files.figma,
  source.figma,
  "Grid cell slots are missing; Grid should expose replaceable Cell slots",
  "Grid cell slot audit",
);
assertContains(
  files.figma,
  source.figma,
  "function gridCellSlotIntegrityIssues(componentSet)",
  "Grid audits each variant's cell-slot matrix",
);
assertContains(
  files.figma,
  source.figma,
  "stale Content Slot remains; Grid should use per-cell slots",
  "Grid audit rejects stale single-slot variants",
);
assertContains(
  files.figma,
  source.figma,
  'ownerName: "Grid"',
  "Grid uses the shared content-slot creation path",
);
assertContains(
  files.reactGridFigma,
  source.reactGridFigma,
  'figma.children(cellSlots) ?? figma.children("*")',
  "Grid Code Connect maps row-major cell slots to children",
);
assertContains(
  files.figma,
  source.figma,
  "resizeNodeWithoutConstraints(\n    componentSet,\n    (maxColumnsIndex + 1) * maxWidth + maxColumnsIndex * columnGap",
  "Grid component set frame contains its laid-out variants",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="grid">Grid</option>',
  "Grid UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-grid"',
  "Grid UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Grid**",
  "Grid importer documentation",
);
assertContains(
  files.reactGrid,
  source.reactGrid,
  "cols: {",
  "React Grid columns variants",
);
assertContains(
  files.reactGrid,
  source.reactGrid,
  "gap: {",
  "React Grid gap variants",
);
assertContains(
  files.reactGridFigma,
  source.reactGridFigma,
  "node-id=359-1574",
  "Grid Code Connect node ID",
);
assertNotContains(
  files.reactGridFigma,
  source.reactGridFigma,
  "node-id=TBD",
  "placeholder Grid Code Connect node id",
);
assertContains(
  files.reactGridFigma,
  source.reactGridFigma,
  'cols: figma.enum("Columns"',
  "Grid Code Connect columns mapping",
);
assertContains(
  files.reactGridFigma,
  source.reactGridFigma,
  '"4": 4',
  "Grid Code Connect four-column mapping",
);
assertContains(
  files.reactGridFigma,
  source.reactGridFigma,
  'gap: figma.enum("Gap"',
  "Grid Code Connect gap mapping",
);
assertContains(
  files.iosGridFigma,
  source.iosGridFigma,
  "node-id=359-1574",
  "iOS Grid Code Connect node ID",
);
assertNotContains(
  files.iosGridFigma,
  source.iosGridFigma,
  "node-id=TBD",
  "placeholder iOS Grid Code Connect node id",
);
assertContains(
  files.iosGridFigma,
  source.iosGridFigma,
  '@FigmaEnum(\n        "Columns"',
  "iOS Grid Code Connect columns axis",
);
assertContains(
  files.androidGridFigma,
  source.androidGridFigma,
  "node-id=359-1574",
  "Android Grid Code Connect node ID",
);
assertNotContains(
  files.androidGridFigma,
  source.androidGridFigma,
  "node-id=TBD",
  "placeholder Android Grid Code Connect node id",
);
assertContains(
  files.androidGridFigma,
  source.androidGridFigma,
  '@FigmaProperty(FigmaType.Enum, "Gap")',
  "Android Grid Code Connect gap axis",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Grid/Grid.figma.tsx",
  "Grid React linked parser include",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Grid/Grid.tsx",
  "Grid React source parser include",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Grid/Grid.figma.swift",
  "Grid iOS linked parser include",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Grid/Grid.swift",
  "Grid iOS source parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Grid/Grid.figma.kt",
  "Grid Android linked parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Grid/Grid.kt",
  "Grid Android source parser include",
);
assertContains(
  files.figma,
  source.figma,
  "Container",
  "Container component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "const CONTAINER_CENTERED =",
  "Container centered axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildContainerComponent()",
  "Container build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateContainerComponent()",
  "Container update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Container"',
  "Container documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Container/padding/x"`,
  "Container padding component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="container">Container</option>',
  "Container UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-container"',
  "Container UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Container**",
  "Container importer documentation",
);
assertContains(
  files.reactContainer,
  source.reactContainer,
  "centered = true",
  "React Container centered default",
);
assertContains(
  files.reactContainer,
  source.reactContainer,
  "max-w-7xl",
  "React Container max width",
);
assertContains(
  files.figma,
  source.figma,
  "Breadcrumb",
  "Breadcrumb component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "const BREADCRUMB_CONTENT =",
  "Breadcrumb content axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildBreadcrumbComponent()",
  "Breadcrumb build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateBreadcrumbComponent()",
  "Breadcrumb update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Breadcrumb"',
  "Breadcrumb documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Breadcrumb/gap"`,
  "Breadcrumb gap component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="breadcrumb">Breadcrumb</option>',
  "Breadcrumb UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-breadcrumb"',
  "Breadcrumb UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Breadcrumb**",
  "Breadcrumb importer documentation",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Pagination**",
  "Pagination importer documentation",
);
assertContains(
  files.reactBreadcrumb,
  source.reactBreadcrumb,
  'aria-current="page"',
  "React Breadcrumb current page semantics",
);
assertContains(
  files.reactBreadcrumb,
  source.reactBreadcrumb,
  "BreadcrumbEllipsis",
  "React Breadcrumb ellipsis primitive",
);
assertContains(
  files.reactBreadcrumb,
  source.reactBreadcrumb,
  "MoreHorizontal",
  "React Breadcrumb visible ellipsis icon",
);
assertContains(
  files.reactBreadcrumb,
  source.reactBreadcrumb,
  "@radix-ui/react-slot",
  "React Breadcrumb asChild slot primitive",
);
assertContains(
  files.figma,
  source.figma,
  "async function appendBreadcrumbSeparator",
  "Breadcrumb icon separator generator",
);
assertContains(
  files.figma,
  source.figma,
  '"chevron-right"',
  "Breadcrumb separator icon",
);
assertContains(
  files.figma,
  source.figma,
  "figma.createEllipse()",
  "Breadcrumb vector ellipsis dots",
);
assertNotContains(
  files.figma,
  source.figma,
  'characters: ">"',
  "text breadcrumb separator",
);
assertNotContains(
  files.figma,
  source.figma,
  'characters: ". . ."',
  "text breadcrumb ellipsis",
);
assertContains(
  files.figma,
  source.figma,
  "const PAGINATION_CONTENT =",
  "Pagination content axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const PAGINATION_SIZES =",
  "Pagination size axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildPaginationComponent()",
  "Pagination build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updatePaginationComponent()",
  "Pagination update handler",
);
assertContains(
  files.figma,
  source.figma,
  "configurePaginationProperties(componentSet, stats)",
  "Pagination text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "bindPaginationGeometryVariables",
  "Pagination token geometry bindings",
);
assertContains(
  files.figma,
  source.figma,
  "auditPaginationAutoLayoutIntegrity",
  "Pagination component geometry audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditPaginationControlGeometry",
  "Pagination inline control geometry audit",
);
assertContains(
  files.figma,
  source.figma,
  'name: "Pagination/width/basic/default"',
  "Pagination default width component token",
);
assertContains(
  files.figma,
  source.figma,
  'metrics.size === "Small" ? "paginationLabelSmall" : "paginationLabel"',
  "Pagination async text style binding",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="pagination">Pagination</option>',
  "Pagination UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-pagination"',
  "Pagination UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="stageExamplesCard"',
  "Examples workflow stage card",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="examplesPanel"',
  "Examples workflow panel",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '"build-example-dashboard"',
  "Dashboard example UI action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '"build-all-examples"',
  "Build all examples UI action",
);
assertContains(
  files.figma,
  source.figma,
  'const EXAMPLES_PAGE_NAME = "Examples"',
  "Examples page registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildDashboardExamplePage()",
  "Dashboard example build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildSettingsExamplePage()",
  "Settings example build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildMobileDrawerExamplePage()",
  "Mobile drawer example build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildAllExamplePages()",
  "Build all examples handler",
);
assertContains(
  files.figma,
  source.figma,
  "setHorizontalStackFillChildSizing",
  "Examples use explicit horizontal fill sizing",
);
assertContains(
  files.figma,
  source.figma,
  "const contentWidth = config.width - 64",
  "Desktop examples use explicit content widths",
);
assertContains(
  files.figma,
  source.figma,
  "const drawerContentWidth = contentWidth - 40",
  "Mobile drawer example uses explicit padded content width",
);
assertContains(
  files.figma,
  source.figma,
  /async function buildKioskHandoffExampleTemplate\([\s\S]*?componentSetName: "SegmentedControl"[\s\S]*?Size: "Small"[\s\S]*?name: "Kiosk View Tabs"/,
  "Kiosk handoff example uses compact tabs instead of oversized segmented controls",
);
assertContains(
  files.figma,
  source.figma,
  /name: "Kiosk Suggested Destinations"[\s\S]*?textProperties: \{[\s\S]*?"Label Text": "Destination"[\s\S]*?"Placeholder Text": "Search stations"[\s\S]*?"Option 1 Text": "Metro station"/,
  "Kiosk handoff example binds contextual Combobox copy",
);
assertContains(
  files.figma,
  source.figma,
  /name: "Kiosk Handoff Alert"[\s\S]*?textProperties: \{[\s\S]*?Title: "Route ready"[\s\S]*?Description: "Scan after preview to continue on your phone\."/,
  "Kiosk handoff example binds Alert Title and Description properties",
);
assertContains(
  files.figma,
  source.figma,
  'characters: "Route preview placeholder"',
  "Kiosk handoff example uses concise SDK placeholder copy",
);
assertContains(
  files.figma,
  source.figma,
  /name: "Routing Warning Alert"[\s\S]*?textProperties: \{[\s\S]*?Title: "Routing sync delayed"[\s\S]*?Description: "Three venues are waiting for map package review\."/,
  "Operations console example binds Alert Title and Description properties",
);
assertNotContains(
  files.figma,
  source.figma,
  /name: "Kiosk Handoff Alert"[\s\S]*?"Title Text": "Send route to phone"/,
  "Kiosk handoff Alert must not use stale Title Text properties",
);
assertNotContains(
  files.figma,
  source.figma,
  /name: "Routing Warning Alert"[\s\S]*?"Title Text": "Routing sync delayed"/,
  "Operations console Alert must not use stale Title Text properties",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Open **Examples**",
  "Examples importer documentation",
);
assertContains(
  files.figma,
  source.figma,
  "Accordion",
  "Accordion component set generation",
);
assertContains(
  files.figma,
  source.figma,
  "const ACCORDION_STATES =",
  "Accordion state axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildAccordionComponent()",
  "Accordion build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateAccordionComponent()",
  "Accordion update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Accordion"',
  "Accordion documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Accordion/trigger/height"`,
  "Accordion trigger height component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="accordion">Accordion</option>',
  "Accordion UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-accordion"',
  "Accordion UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Accordion**",
  "Accordion importer documentation",
);
assertContains(
  files.reactAccordion,
  source.reactAccordion,
  "@radix-ui/react-accordion",
  "React Accordion Radix primitive",
);
assertContains(
  files.reactAccordion,
  source.reactAccordion,
  "AccordionTrigger",
  "React Accordion trigger primitive",
);
assertContains(
  files.figma,
  source.figma,
  "async function appendAccordionChevron",
  "Accordion icon chevron generator",
);
assertContains(
  files.figma,
  source.figma,
  "auditAccordionAutoLayoutIntegrity",
  "Accordion fill-width layout audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditHorizontalFillSizing",
  "Accordion accepts modern fill or legacy stretch layout sizing",
);
assertContains(
  files.figma,
  source.figma,
  "await applyTextStyleToNodeAsync(",
  "Component generators use async text style binding for dynamic-page files",
);
assertContains(
  files.figma,
  source.figma,
  /function applyTextStyleToNodeAsync\([\s\S]*?activeTextStyleSpecByKey\[key\][\s\S]*?text\.fontName = spec\.fontName[\s\S]*?setTextStyleIdAsync/,
  "Figma text-style repair applies canonical typography fields before binding styles",
);
assertContains(
  files.figma,
  source.figma,
  /function inferTextStyleKeyForComponentText\([\s\S]*?setName === "BottomNavigation"[\s\S]*?setName === "NavigationItem"[\s\S]*?textStyleKeyForNavigationItemText[\s\S]*?setName === "Navbar"[\s\S]*?textStyleKeyForNavbarText[\s\S]*?setName === "Sidebar"[\s\S]*?textStyleKeyForSidebarText/,
  "Figma text-style audit and repair cover navigation shell component text",
);
assertContains(
  files.figma,
  source.figma,
  "accordion-legacy-divider-node",
  "Accordion divider is an internal bottom stroke",
);
assertContains(
  files.figma,
  source.figma,
  "setVerticalFixedFillChildSizing(trigger)",
  "Accordion trigger fills resized parent",
);
assertContains(
  files.figma,
  source.figma,
  'clearBoundVariable(component, "height", stats)',
  "Accordion root height hugs live content instead of staying token-fixed",
);
assertContains(
  files.figma,
  source.figma,
  'setLayoutSizingHorizontal(component, "FIXED")',
  "Accordion root keeps a bounded inserted width",
);
assertContains(
  files.figma,
  source.figma,
  "setVerticalStackChildSizing(content)",
  "Accordion open content hugs edited text height",
);
assertContains(
  files.figma,
  source.figma,
  'name === "Trigger Text" ? "CENTER" : "TOP"',
  "Accordion trigger text centers vertically while content stays top aligned",
);
assertContains(
  files.figma,
  source.figma,
  'node.layoutAlign = "STRETCH"',
  "Accordion rows also set legacy stretch sizing",
);
assertContains(
  files.figma,
  source.figma,
  "fillHorizontal: true",
  "Accordion text fills available row width",
);
assertContains(
  files.figma,
  source.figma,
  "isTopLevelGeneratedAnatomyArtifact",
  "Generated anatomy orphan cleanup",
);
assertContains(
  files.figma,
  source.figma,
  '"Drawer Body"',
  "Drawer orphan body cleanup",
);
assertNotContains(
  files.figma,
  source.figma,
  'characters: isOpen ? "^" : "v"',
  "text accordion chevron",
);
assertContains(
  files.figma,
  source.figma,
  "const BOX_SURFACES =",
  "Box surface axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildBoxComponent()",
  "Box build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateBoxComponent()",
  "Box update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Box"',
  "Box documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Box/padding/default"`,
  "Box padding component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="box">Box</option>',
  "Box UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-box"',
  "Box UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Box**",
  "Box importer documentation",
);
assertContains(
  files.reactBox,
  source.reactBox,
  "asChild?: boolean",
  "React Box asChild support",
);
assertContains(
  files.reactBox,
  source.reactBox,
  "Slot",
  "React Box Slot composition",
);
assertContains(
  files.figma,
  source.figma,
  "const SKELETON_SHAPES =",
  "Skeleton shape axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildSkeletonComponent()",
  "Skeleton build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateSkeletonComponent()",
  "Skeleton update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Skeleton"',
  "Skeleton documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Skeleton/height/block"`,
  "Skeleton block height component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="skeleton">Skeleton</option>',
  "Skeleton UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-skeleton"',
  "Skeleton UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Skeleton**",
  "Skeleton importer documentation",
);
assertContains(
  files.reactSkeleton,
  source.reactSkeleton,
  "animate-pulse",
  "React Skeleton loading animation",
);
assertContains(
  files.reactSkeleton,
  source.reactSkeleton,
  "bg-muted",
  "React Skeleton muted surface",
);
assertContains(
  files.figma,
  source.figma,
  "const SEPARATOR_ORIENTATIONS =",
  "Separator orientation axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildSeparatorComponent()",
  "Separator build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateSeparatorComponent()",
  "Separator update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Separator"',
  "Separator documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Separator/thickness"`,
  "Separator thickness component token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="separator">Separator</option>',
  "Separator UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-separator"',
  "Separator UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Separator**",
  "Separator importer documentation",
);
assertContains(
  files.reactSeparator,
  source.reactSeparator,
  "@radix-ui/react-separator",
  "React Separator Radix primitive",
);
assertContains(
  files.reactSeparator,
  source.reactSeparator,
  "orientation = 'horizontal'",
  "React Separator horizontal default",
);
assertNotContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="label">Label</option>',
  "Label component picker option after typography demotion",
);
assertContains(
  files.reactLabel,
  source.reactLabel,
  "@radix-ui/react-label",
  "React Label Radix primitive",
);
assertContains(
  files.reactLabel,
  source.reactLabel,
  "kozmos-reset kozmos-label",
  "React Label owned recipe",
);
assertContains(
  ownedCssPath,
  ownedCss.match(/\.kozmos-label\s*\{([^}]*)\}/)?.[1] ?? "",
  "text-sm font-medium",
  "React Label typography",
);
assertContains(
  files.figma,
  source.figma,
  "const LINK_VARIANTS =",
  "Link variant axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const LINK_STATES =",
  "Link state axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildLinkComponent()",
  "Link build handler",
);
assertContains(
  files.figma,
  source.figma,
  "async function updateLinkComponent()",
  "Link update handler",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Link"',
  "Link documentation metadata",
);
assertContains(
  files.figma,
  source.figma,
  `function configureLinkProperties(componentSet, stats) {
  configureNamedTextProperty(
    componentSet,
    "Link Text",
    "Link Text",
    "Open link",
    stats,
  );
  configureFocusVisibleProperty(componentSet, stats);
}`,
  "Link Focus Visible component property binding",
);
assertContains(
  files.figma,
  source.figma,
  `name: "Link/height/default"`,
  "Link height component token",
);
assertContains(
  files.figma,
  source.figma,
  'foreground: "Colors/theme/600"',
  "Link default uses accessible brand foreground",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="link">Link</option>',
  "Link UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-link"',
  "Link UI build action",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Select **Link**",
  "Link importer documentation",
);
assertContains(
  files.reactLink,
  source.reactLink,
  "variant?: 'default' | 'subtle'",
  "React Link variant prop",
);
assertContains(
  files.reactLink,
  source.reactLink,
  "variant === 'subtle'",
  "React Link subtle variant",
);
assertContains(
  files.figma,
  source.figma,
  "const HEADING_LEVELS =",
  "Heading style scale registry",
);
assertNotContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="heading">Heading</option>',
  "Heading component picker option after typography demotion",
);
assertContains(
  files.reactHeading,
  source.reactHeading,
  'size={level === null ? "base" : sizes[level]}',
  "React Heading level scale selection",
);
assertContains(
  files.reactHeading,
  source.reactHeading,
  'weight="bold"',
  "React Heading uses owned bold typography",
);
assertContains(
  files.reactHeading,
  source.reactHeading,
  "1: '4xl'",
  "React Heading H1 maps to 4xl",
);
for (const [level, size] of [
  [2, "3xl"],
  [3, "2xl"],
  [4, "xl"],
  [5, "lg"],
  [6, "base"],
]) {
  assertContains(
    files.reactHeading,
    source.reactHeading,
    `${level}: "${size}"`,
    `React Heading H${level} maps to ${size}`,
  );
}
for (const tokenName of [
  "Text/font-size/xs",
  "Text/line-height/xs",
  "Text/font-size/base",
  "Text/line-height/base",
  "Text/font-size/4xl",
  "Text/line-height/4xl",
]) {
  assertContains(
    files.figma,
    source.figma,
    `name: "${tokenName}"`,
    `${tokenName} component typography token`,
  );
}
assertContains(
  files.figma,
  source.figma,
  "const TEXT_SIZES = [",
  "Text size axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const TEXT_WEIGHTS =",
  "Text weight axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "const TEXT_TONES =",
  "Text tone axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "TEXT_STYLE_GROUP_TEXT",
  "Text style group registry",
);
assertNotContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="text">Text</option>',
  "Text component picker option after typography demotion",
);
assertContains(
  files.reactText,
  source.reactText,
  "'4xl': 'kozmos-text-4xl'",
  "React Text 4xl size",
);
assertContains(
  files.reactText,
  source.reactText,
  "destructive: 'kozmos-text-destructive'",
  "React Text destructive tone",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/height/small", counter.sizes.small.height),
  "Counter small height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/height/default", counter.sizes.default.height),
  "Counter default height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/min-width/small", counter.sizes.small.minWidth),
  "Counter small min-width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Counter/min-width/default",
    counter.sizes.default.minWidth,
  ),
  "Counter default min-width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/padding/x/small", counter.sizes.small.paddingX),
  "Counter small horizontal padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Counter/padding/x/default",
    counter.sizes.default.paddingX,
  ),
  "Counter default horizontal padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/radius", counter.content.radius),
  "Counter radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Counter/font-size/small", counter.content.fontSizeSmall),
  "Counter small font size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Counter/font-size/default",
    counter.content.fontSizeDefault,
  ),
  "Counter default font size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Counter/line-height/small",
    counter.content.lineHeightSmall,
  ),
  "Counter small line height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Counter/line-height/default",
    counter.content.lineHeightDefault,
  ),
  "Counter default line height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/counter/height", badge.content.counterHeight),
  "Badge counter height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/counter/padding/x", badge.content.counterPaddingX),
  "Badge counter horizontal padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/counter/radius", badge.content.counterRadius),
  "Badge counter radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Badge/counter/font-size", badge.content.counterFontSize),
  "Badge counter font size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern(
    "Badge/counter/line-height",
    badge.content.counterLineHeight,
  ),
  "Badge counter line height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Checkbox/control/size", checkbox.size.controlSize),
  "Checkbox visual control token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Radio/control/size", radio.size.controlSize),
  "Radio visual control token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Radio/dot/size", radio.size.dotSize),
  "Radio checked dot token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Switch/track/width", switchContract.size.trackWidth),
  "Switch visual track width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Switch/track/height", switchContract.size.trackHeight),
  "Switch visual track height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Switch/thumb/size", switchContract.size.thumbSize),
  "Switch visual thumb token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Input/width/default", input.size.width),
  "Input default width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Input/field/padding/x", input.size.paddingX),
  "Input horizontal padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Input/gap", input.size.gap),
  "Input label-field gap token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Input/field/radius", input.content.radius),
  "Input field radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Textarea/field/height", 80),
  "Textarea default field height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Slider/thumb/size", radio.size.controlSize),
  "Slider thumb visual size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Progress/width/default", input.size.width),
  "Progress default width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Progress/height/default", 8),
  "Progress track height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Spinner/size/medium", 24),
  "Spinner medium size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Avatar/size/default", 40),
  "Avatar default size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Alert/width/default", 360),
  "Alert default width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Alert/padding", 16),
  "Alert padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Card/width/default", 360),
  "Card default width token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Card/padding", 24),
  "Card padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Card/radius", 16),
  "Card radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tabs/list/height", 44),
  "Tabs list height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tabs/list/radius", 16),
  "Tabs outer radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tabs/trigger/height", 36),
  "Tabs trigger height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tabs/trigger/radius", 12),
  "Tabs trigger radius is outer radius minus inset",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tabs/trigger/font-size", 14),
  "Tabs trigger font-size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/padding/x", 12),
  "Tooltip horizontal padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/padding/y", 6),
  "Tooltip vertical padding token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/radius", 16),
  "Tooltip radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/tip/size", 8),
  "Tooltip tip size token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/tip/height", 4),
  "Tooltip tip height token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/side-offset", 4),
  "Tooltip side offset token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Tooltip/content/font-size", 14),
  "Tooltip content font-size token",
);
assertContains(
  files.figma,
  source.figma,
  'SURFACE_QA_PAGE_NAME = "QA / Transparent Surfaces"',
  "Surface QA page constant",
);
assertContains(
  files.figma,
  source.figma,
  "async function buildSurfaceQaPage()",
  "Surface QA page builder",
);
assertContains(
  files.figma,
  source.figma,
  "async function reorganizeComponentsPage()",
  "Components page reorganize action",
);
assertContains(
  files.figma,
  source.figma,
  "removeUnexpectedTopLevelGeneratedInstances(page, stats);",
  "Components page reorganize action clears stray generated top-level instances",
);
assertContains(
  files.figma,
  source.figma,
  "unexpectedTopLevelInstancesRemoved",
  "Components page reorganize action reports stray generated instance cleanup",
);
assertContains(
  files.figma,
  source.figma,
  'COMPONENT_SET_LEGACY_SUFFIX = " / v1"',
  "Components keep legacy / v1 lookup compatibility",
);
assertContains(
  files.figma,
  source.figma,
  "canonicalComponentSetName",
  "Components normalize legacy names to canonical names",
);
assertContains(
  files.figma,
  source.figma,
  "findComponentSetOnPage",
  "Components lookup accepts canonical and legacy names",
);
assertContains(
  files.figma,
  source.figma,
  "normalizeComponentSetNodeName",
  "Components rename legacy sets in place",
);
assertContains(
  files.figma,
  source.figma,
  "COMPONENT_PAGE_LAYOUT_ORDER",
  "Components page measured layout order",
);
assertContains(
  files.figma,
  source.figma,
  "COMPONENT_PAGE_LAYOUT_SECTIONS",
  "Components page sectioned layout groups",
);
assertContains(
  files.figma,
  source.figma,
  "figma.createSection",
  "Components page reorganize uses native Figma sections when available",
);
assertContains(
  files.figma,
  source.figma,
  "component-section",
  "Components page native sections are generated and audit-safe",
);
assertContains(
  files.figma,
  source.figma,
  "auditCompositeRowGeometry",
  "List and Table composite audits validate geometry instead of fragile sizing metadata",
);
assertContains(
  files.figma,
  source.figma,
  "measureComponentSetLayoutBounds",
  "Components page layout measures visible child bounds",
);
assertContains(
  files.figma,
  source.figma,
  "COMPONENT_PAGE_LAYOUT_MIN_HEIGHTS",
  "Components page layout uses safety footprints",
);
assertContains(
  files.figma,
  source.figma,
  "setExplicitVariableModeForCollection",
  "Surface QA applies explicit Light/Dark variable modes",
);
assertContains(
  files.figma,
  source.figma,
  "Map Layer / fill-extrusion",
  "Surface QA product map fill-extrusion layer",
);
assertContains(
  files.figma,
  source.figma,
  "Map Layer / symbol_label",
  "Surface QA product map symbol_label layer",
);
assertContains(
  files.figma,
  source.figma,
  "surfaceQa = await auditSurfaceQaPage",
  "Surface QA audit summary",
);
assertContains(
  files.figma,
  source.figma,
  "auditSurfaceQaPanelContrast",
  "Surface QA audits live-instance contrast on host surfaces",
);
assertContains(
  files.figma,
  source.figma,
  'kind: "surface-contrast"',
  "Surface QA reports contrast failures as audit issues",
);
assertContains(
  files.figma,
  source.figma,
  'Glass: {\n      background: "Colors/transparent/inverted/10",\n      foreground: "Colors/foreground/0"',
  "Glass Button foreground follows mode-aware text-foreground token",
);
assertContains(
  files.figma,
  source.figma,
  'background: "Colors/theme/600"',
  "Figma filled brand surfaces use accessible brand token",
);
assertContains(
  files.figma,
  source.figma,
  'rangeFill: "Colors/theme/600"',
  "Figma range fills use accessible brand token",
);
assertContains(
  files.figma,
  source.figma,
  'foreground: "Colors/theme/600"',
  "Figma text-only brand content uses accessible brand token",
);
assertContains(
  files.reactTailwindConfig,
  source.reactTailwindConfig,
  /DEFAULT:\s*["']var\(--primitives-colors-theme-600\)["']/,
  "React primary color uses accessible brand token",
);
assertContains(
  files.reactTailwindConfig,
  source.reactTailwindConfig,
  /foreground:\s*["']var\(--primitives-colors-foreground-1000\)["']/,
  "React filled tone foregrounds are mode-aware",
);
assertContains(
  files.reactTailwindConfig,
  source.reactTailwindConfig,
  /ring:\s*["']var\(--primitives-colors-theme-600\)["']/,
  "React focus ring uses accessible brand token",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "Build Surface QA",
  "Surface QA plugin action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-surface-qa",
  "Surface QA UI posts plugin message",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "Reorganize Components",
  "Components page reorganize plugin action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "reorganize-components",
  "Components page reorganize UI posts plugin message",
);
assertContains(
  files.figmaReadme,
  source.figmaReadme,
  "Build Surface QA",
  "Surface QA plugin documentation",
);
assertContains(
  files.figma,
  source.figma,
  'trackStroke: "Border/Input"',
  "Slider inactive track reads the Border/Input role, whose 3:1 is held by tokens:border:check",
);
assertContains(
  files.figma,
  source.figma,
  'trackStroke: "Border/Input"',
  "Progress inactive track reads the Border/Input role, whose 3:1 is held by tokens:border:check",
);
assertContains(
  files.figma,
  source.figma,
  'const INPUT_STATES = ["Default", "Focus", "Disabled", "Readonly"]',
  "Input interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const INPUT_STATUSES = ["Default", "Error", "Warning", "Success"]',
  "Input validation status axis",
);
assertContains(
  files.figma,
  source.figma,
  'const PASSWORD_INPUT_VISIBILITY = ["Hidden", "Visible"]',
  "PasswordInput visibility axis",
);
assertContains(
  files.figma,
  source.figma,
  'const NUMBER_INPUT_STEPPERS = ["True", "False"]',
  "NumberInput stepper visibility axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TEXTAREA_STATES = ["Default", "Focus", "Disabled", "Readonly"]',
  "Textarea interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const SEARCH_STATES = ["Default", "Focus", "Disabled", "Readonly"]',
  "Search interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const SELECT_STATES = ["Default", "Focus", "Disabled"]',
  "Select interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const SLIDER_STATES = ["Default", "Focus", "Disabled"]',
  "Slider interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const SLIDER_TYPES = ["Single", "Range"]',
  "Slider type axis",
);
assertContains(
  files.figma,
  source.figma,
  'const PROGRESS_VALUES = ["0", "25", "50", "75", "100"]',
  "Progress value axis",
);
assertContains(
  files.figma,
  source.figma,
  'const SPINNER_SIZES = ["Small", "Medium", "Large", "XLarge"]',
  "Spinner size axis",
);
assertContains(
  files.figma,
  source.figma,
  'const AVATAR_CONTENT = ["Fallback", "Image"]',
  "Avatar content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const ALERT_VARIANTS = ["Default", "Destructive", "Success", "Warning", "Info"]',
  "Alert variant axis",
);
assertContains(
  files.figma,
  source.figma,
  'const COUNTER_TONES = ["Neutral", "Brand", "Destructive", "Inverse"]',
  "Counter tone axis",
);
assertContains(
  files.figma,
  source.figma,
  'const COUNTER_SIZES = ["Small", "Default"]',
  "Counter size axis",
);
assertContains(
  files.figma,
  source.figma,
  'const CARD_CONTENT = ["Basic", "Header", "Full"]',
  "Card content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const LIST_DENSITIES = ["Default", "Compact"]',
  "List density axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TABLE_DENSITIES = ["Default", "Compact"]',
  "Table density axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TABS_COUNTS = ["Two", "Three", "Four"]',
  "Tabs count axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TABS_ACTIVE = ["One", "Two", "Three", "Four"]',
  "Tabs active axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TABS_STATES = ["Default", "Focus", "Disabled"]',
  "Tabs interaction state axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TOOLTIP_SIDES = ["Top", "Right", "Bottom", "Left"]',
  "Tooltip side axis",
);
assertContains(
  files.figma,
  source.figma,
  'const DIALOG_CONTENT = ["Basic", "Form", "Footer"]',
  "Dialog content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const DRAWER_SIDES = ["Right", "Left", "Top", "Bottom"]',
  "Drawer side axis",
);
assertContains(
  files.figma,
  source.figma,
  'const POPOVER_SIDES = ["Top", "Right", "Bottom", "Left"]',
  "Popover side axis",
);
assertContains(
  files.figma,
  source.figma,
  'const MENU_CONTENT = ["Basic", "Checkbox", "Radio", "Submenu"]',
  "Menu content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const TOAST_CONTENT = ["Basic", "Action"]',
  "Toast content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const FOCUS_VISIBLE_PROPERTY_NAME = "Focus Visible"',
  "shared Focus Visible component property name",
);
assertContains(
  files.figma,
  source.figma,
  'setLayoutSizingHorizontal(field, "FILL")',
  "Input field fills resizable instance width",
);
assertContains(
  files.figma,
  source.figma,
  'setTextAutoResize(placeholder, "TRUNCATE")',
  "Input placeholder truncates instead of hugging content",
);
assertContains(
  files.figma,
  source.figma,
  'helper.visible = status !== "Default"',
  "Input helper text hidden by default",
);
assertContains(
  files.figma,
  source.figma,
  "helper.characters = helperTextForInputStatus(status)",
  "Input helper text keeps non-zero default content",
);
assertContains(
  files.figma,
  source.figma,
  "if (node && node.visible === false) return",
  "Contrast audit ignores hidden component-property content",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(component",
  "Button and IconButton focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(control",
  "Checkbox and Radio focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(track",
  "Switch focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(field",
  "Input focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(thumb",
  "Slider thumb focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  'const isRange = type === "Range"',
  "Figma Slider range type rendering",
);
assertContains(
  files.figma,
  source.figma,
  '"Slider Thumb Start"',
  "Figma Slider range start thumb",
);
assertContains(
  files.figma,
  source.figma,
  '"Slider Thumb End"',
  "Figma Slider range end thumb",
);
assertContains(
  files.figma,
  source.figma,
  /minimumTouchTargetPass:\s*minimumInteractiveSize >= 44/,
  "44px audit threshold",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Button", stats)',
  "Button Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Badge", stats)',
  "Badge Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  /configureNamedTextProperty\(\s*componentSet,\s*"Counter Text"/,
  "Counter Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  /createNestedComponentInstance\(\{\s*componentSetName:\s*"Counter"/,
  "Badge composes nested Counter instance",
);
assertContains(
  files.figma,
  source.figma,
  "configureBadgeCounterVisibilityProperty",
  "Badge Show Counter component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureBadgeIconSlot",
  "Badge Icon instance-swap binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Checkbox", stats)',
  "Checkbox Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Radio", stats)',
  "Radio Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Switch", stats)',
  "Switch Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Input", stats)',
  "Input Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configurePlaceholderTextProperty(componentSet, "Placeholder", stats)',
  "Input Placeholder Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureHelperTextProperty(componentSet, "Helper text", stats)',
  "Input Helper Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureHelperVisibilityProperty(componentSet, stats)",
  "Input helper visibility component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Textarea", stats)',
  "Textarea Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Search", stats)',
  "Search Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureLabelTextProperty(componentSet, "Slider", stats)',
  "Slider Label Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "Type maps to Slider.defaultValue and thumbCount in Code Connect.",
  "Slider type documentation",
);
assertContains(
  files.figma,
  source.figma,
  "configureTabsProperties(componentSet, stats)",
  "Tabs text and focus component property binding",
);
assertContains(
  files.figma,
  source.figma,
  /configureNamedTextProperty\(\s*componentSet,\s*label,\s*label,/s,
  "Tabs numbered tab label property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureTooltipProperties(componentSet, stats)",
  "Tooltip component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureNamedTextProperty(\n    componentSet,\n    "Content Text"',
  "Tooltip Content Text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureDialogProperties(componentSet, stats)",
  "Dialog text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'await applyTextStyleToNodeAsync(text, "dialogTitle", stats)',
  "Dialog title async text style binding",
);
assertContains(
  files.figma,
  source.figma,
  'await applyTextStyleToNodeAsync(text, "dialogDescription", stats)',
  "Dialog description async text style binding",
);
assertContains(
  files.figma,
  source.figma,
  'await applyTextStyleToNodeAsync(text, "dialogBody", stats)',
  "Dialog body async text style binding",
);
assertContains(
  files.figma,
  source.figma,
  'markNestedComponentInstance(input, "Input")',
  "Dialog Input instance provenance stamping",
);
assertContains(
  files.figma,
  source.figma,
  /function auditHorizontalFillSizing\(options\)[\s\S]*?layoutSizing === "FILL" \|\| layoutAlign === "STRETCH"/,
  "Composite form input audit requires explicit fill or stretch child sizing",
);
assertContains(
  files.figma,
  source.figma,
  /function setCompositeFormInputChildSizing\(input, stats\)[\s\S]*?setCompositeFormInputParentSizingContext\(input\.parent\)/,
  "Composite form input sizing normalizes the parent sizing context",
);
assertContains(
  files.figma,
  source.figma,
  /function setCompositeFormInputChildSizing\(input, stats\)[\s\S]*?clearCompositeFormInputRootSizeBindings\(input, stats\)[\s\S]*?resizeCompositeFormInputToParent\(input\)[\s\S]*?setLayoutSizingHorizontal\(input, "FILL"\)/,
  "Composite form input sizing clears inherited size bindings before applying parent fill",
);
assertContains(
  files.figma,
  source.figma,
  /nested Input instance could not be resized to fill its auto-layout parent \(\$\{compositeFormInputSizingDiagnostic\(replacement\)\}\)/,
  "Composite form input repair reports retained sizing diagnostics",
);
assertContains(
  files.figma,
  source.figma,
  /async function runGeneratedComponentPostLayoutMaintenance[\s\S]*?runGeneratedComponentPostUpdateMaintenance\(\s*componentSet,\s*componentName,\s*stats,\s*\)/,
  "Dialog and BottomSheet composite sizing is rechecked after component page layout",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="fixAuditIssues"',
  "Figma importer known audit issue repair button",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "Next: run Fix Audit Issues, then audit again to confirm Navbar contrast.",
  "Figma importer recommends the batch repair for known Navbar audit warnings",
);
assertContains(
  files.figma,
  source.figma,
  /async function fixCurrentAuditIssues\(\)[\s\S]*?updateNavigationItemComponent[\s\S]*?updateNavbarComponent[\s\S]*?updateDialogComponent[\s\S]*?updateBottomSheetComponent/,
  "Figma importer known audit issue repair updates NavigationItem, Navbar, Dialog, and BottomSheet",
);
assertContains(
  files.figma,
  source.figma,
  /async function repairCompositeComponentAfterUpdate[\s\S]*?(?:(?!rebuildGeneratedComponentSet)[\s\S])*?pushCompositeRepairFailureWarning/,
  "Composite form input update preserves Code Connect node IDs instead of auto-rebuilding",
);
assertContains(
  files.figma,
  source.figma,
  /async function syncBottomSheetVariantChildren[\s\S]*?body\.name = "BottomSheet Body"[\s\S]*?body\.counterAxisAlignItems = "MIN"/,
  "BottomSheet body uses a valid cross-axis alignment while child inputs stretch explicitly",
);
assertContains(
  files.figma,
  source.figma,
  /async function syncBottomSheetVariantChildren[\s\S]*?contentSlot\.visible = content !== "Form"[\s\S]*?resizeVerticalAutoLayoutFrameToVisibleChildren\(body, contentWidth\)/,
  "BottomSheet footer variants keep a visible body Content Slot instead of collapsing to 1px",
);
assertNotContains(
  files.figma,
  source.figma,
  'counterAxisAlignItems = "STRETCH"',
  "invalid Figma counterAxisAlignItems stretch value",
);
assertContains(
  files.figma,
  source.figma,
  `markNestedComponentInstance(
      action,
      "Button",
      primary ? "primary" : "secondary",
    )`,
  "Dialog Button instance provenance stamping",
);
assertContains(
  files.figma,
  source.figma,
  "configureDrawerProperties(componentSet, stats)",
  "Drawer text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "buildDrawerComponent",
  "Figma Drawer build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildDrawerComponent",
  "Figma Drawer rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "bindDrawerGeometryVariables",
  "Drawer token geometry bindings",
);
assertContains(
  files.figma,
  source.figma,
  "syncDrawerFooterAction",
  "Drawer footer composes live Button instances",
);
assertContains(
  files.figma,
  source.figma,
  "component.createSlot",
  "Drawer native Figma content slot creation",
);
assertContains(
  files.figma,
  source.figma,
  "extractDescendantNamed(",
  "Drawer updater preserves existing content slot nodes",
);
assertContains(
  files.figma,
  source.figma,
  "isVariantInsideComponentSet(component)",
  "Drawer updater does not delete variant slot properties during side updates",
);
assertNotContains(
  files.figma,
  source.figma,
  "constrainWidth: true",
  "Drawer content slot should fill the padded Drawer Body instead of carrying a hard width lock",
);
assertContains(
  files.figma,
  source.figma,
  '{ name: "Drawer/width/default", value: 408',
  "Drawer side width token leaves a 360px content lane after padding",
);
assertContains(
  files.figma,
  source.figma,
  "width: horizontal ? 408 : 520",
  "Drawer side width matches the bound Drawer width token",
);
assertNotContains(
  files.figma,
  source.figma,
  '{ name: "Drawer/width/default", value: 384',
  "Drawer side width token must not shrink the 360px content lane",
);
assertNotContains(
  files.figma,
  source.figma,
  "references.mainComponent = propertyName",
  "invalid SLOT-to-mainComponent property binding",
);
assertContains(
  files.figma,
  source.figma,
  '"frame-fallback"',
  "Drawer content slot fallback",
);
assertContains(
  files.figma,
  source.figma,
  "auditDrawerAutoLayoutIntegrity",
  "Drawer body slot layout audit",
);
assertContains(
  files.figma,
  source.figma,
  "drawer-content-slot-overflow",
  "Drawer content slot overflow audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditContentSlotOverflowIntegrity",
  "Composition content slot overflow audit",
);
assertContains(
  files.figma,
  source.figma,
  "content-slot-overflow",
  "Composition content slot overflow issue kind",
);
assertContains(
  files.figma,
  source.figma,
  "componentSetHasSlotPropertyOrNode",
  "Composition primitives expose Figma content slots",
);
assertContains(
  files.figma,
  source.figma,
  'componentSet.name === "Drawer"',
  "Drawer composition integrity audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditComponentsPageLayout",
  "Components page overlap audit",
);
assertContains(
  files.figma,
  source.figma,
  "buildListComponent",
  "Figma List build action",
);
assertContains(
  files.figma,
  source.figma,
  "configureListProperties(componentSet, stats)",
  "List text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "bindListGeometryVariables",
  "List token geometry bindings",
);
assertContains(
  files.figma,
  source.figma,
  "buildTableComponent",
  "Figma Table build action",
);
assertContains(
  files.figma,
  source.figma,
  "configureTableProperties(componentSet, stats)",
  "Table text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "bindTableGeometryVariables",
  "Table token geometry bindings",
);
assertContains(
  files.figma,
  source.figma,
  "configurePopoverProperties(componentSet, stats)",
  "Popover text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureMenuProperties(componentSet, stats)",
  "Menu text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureToastProperties(componentSet, stats)",
  "Toast text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "syncTooltipTip",
  "Tooltip side-aware tip generation",
);
assertContains(
  files.figma,
  source.figma,
  "figma.createFrame()",
  "Tooltip tip uses a stable absolute wrapper",
);
assertContains(
  files.figma,
  source.figma,
  "figma.createVector()",
  "Tooltip tip uses an explicit vector triangle",
);
assertContains(
  files.figma,
  source.figma,
  "setVectorNetworkAsync",
  "Tooltip tip uses dynamic-page vector network API",
);
assertContains(
  files.figma,
  source.figma,
  '"Tip Fill"',
  "Tooltip tip vector fill child",
);
assertContains(
  files.figma,
  source.figma,
  "tooltipTipVectorNetwork",
  "Tooltip tip vector network",
);
assertContains(
  files.figma,
  source.figma,
  "regions: [",
  "Tooltip tip vector has a filled region",
);
assertContains(
  files.figma,
  source.figma,
  "tooltipTipIntegrity",
  "Tooltip tip audit",
);
assertContains(
  files.figma,
  source.figma,
  'configureNamedTextProperty(componentSet, "Fallback", "Fallback"',
  "Avatar Fallback component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'componentSet,\n    "Image URL"',
  "Avatar Image URL component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'configureNamedTextProperty(componentSet, "Title", "Title"',
  "Alert Title component property binding",
);
assertContains(
  files.figma,
  source.figma,
  'componentSet,\n    "Description"',
  "Alert Description component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureFocusVisibleProperty(componentSet, stats)",
  "Focus Visible component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "node.componentPropertyReferences.visible === result.propertyName",
  "Focus Visible property audit",
);
assertContains(
  files.figma,
  source.figma,
  'ring.layoutPositioning = "ABSOLUTE"',
  "Focus ring uses absolute positioning",
);
assertContains(
  files.figma,
  source.figma,
  'horizontal: "STRETCH"',
  "Focus ring stretches with resized controls",
);
assertContains(
  files.figma,
  source.figma,
  "focusVisibleProperty.geometryIssueCount > 0",
  "Focus ring geometry audit warning",
);
assertOrder(
  files.figma,
  source.figma,
  "target.appendChild(ring);",
  'ring.layoutPositioning = "ABSOLUTE"',
  "Focus ring appended before absolute positioning",
);
assertContains(
  files.figma,
  source.figma,
  'findKozmosIconSourceComponent("check")',
  "Checkbox generated mark uses curated check icon",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedCheckboxControl",
  "Checkbox non-text contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedCheckboxMark",
  "Checkbox mark contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedRadioControl",
  "Radio non-text contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedRadioDot",
  "Radio checked-dot contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedSwitchTrack",
  "Switch non-text contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedSwitchThumb",
  "Switch thumb contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedInputField",
  "Input field contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedSliderTrack",
  "Slider track contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedSliderThumb",
  "Slider thumb contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedProgressTrack",
  "Progress track contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedCardAction",
  "Card footer action local-background contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditSliderTrackPaints",
  "Slider track contrast boundary audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditSliderThumbPaints",
  "Slider thumb contrast boundary audit",
);
assertContains(
  files.figma,
  source.figma,
  "auditCardActionPaints",
  "Card action text contrast audit",
);
assertContains(
  files.figma,
  source.figma,
  "Colors/foreground/400",
  "Card description uses accessible muted foreground",
);
assertContains(
  files.figma,
  source.figma,
  '"nested-component-instance"',
  "Nested component composition audit marker",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedNestedComponentInstance(node)",
  "Composite audit treats nested component instances as ownership boundaries",
);
assertContains(
  files.figma,
  source.figma,
  "auditCompositionIntegrity",
  "Composite component clone-frame audit",
);
assertContains(
  files.figma,
  source.figma,
  "createNestedComponentInstance",
  "Composite component nested instance creation",
);
assertContains(
  files.figma,
  source.figma,
  "applyTabsTriggerTypography",
  "Tabs trigger typography bindings",
);
assertContains(
  files.figma,
  source.figma,
  'setSharedPluginData(RUN_NAMESPACE, "kind", "tabs-trigger")',
  "Tabs trigger audit marker",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(trigger",
  "Tabs active trigger focus ring generation",
);
assertContains(
  files.figma,
  source.figma,
  "references.characters = propertyName",
  "Figma Label Text characters property reference",
);
assertContains(
  files.figma,
  source.figma,
  "variantProperties: variantProperties.properties",
  "Figma variant property audit output",
);
assertContains(
  files.figma,
  source.figma,
  "normalizeComponentSetVariantProperties",
  "Figma stale variant property cleanup",
);
assertContains(
  files.figma,
  source.figma,
  "safeComponentPropertyDefinitions",
  "Figma component property definition error recovery",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildButtonComponent",
  "Figma Button rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildChipComponent",
  "Figma Chip build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildChipComponent",
  "Figma Chip rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSegmentedControlComponent",
  "Figma SegmentedControl build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSegmentedControlComponent",
  "Figma SegmentedControl rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "applySegmentedControlLabelTypography",
  "SegmentedControl async text style bindings",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("SegmentedControl/height/small", 52),
  "SegmentedControl small outer height keeps a 44px segment plus padding",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("SegmentedControl/item-height/small", 44),
  "SegmentedControl small segment item target",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("SegmentedControl/height/large", 56),
  "SegmentedControl large outer height keeps a 48px segment plus padding",
);
assertContains(
  files.figma,
  source.figma,
  'name: "SegmentedControl/radius",\n    value: 16,\n    scopes: ["CORNER_RADIUS"]',
  "SegmentedControl base radius",
);
assertContains(
  files.figma,
  source.figma,
  'name: "SegmentedControl/item-radius",\n    value: 12,\n    scopes: ["CORNER_RADIUS"]',
  "SegmentedControl selected item radius",
);
assertContains(
  files.figma,
  source.figma,
  "SegmentedControl: 820",
  "Components page reserves enough section height for SegmentedControl grid",
);
assertNotContains(
  files.figma,
  source.figma,
  'name: "SegmentedControl/width/default"',
  "SegmentedControl should not expose fixed outer width tokens",
);
assertNotContains(
  files.figma,
  source.figma,
  'name: "SegmentedControl/item-width/default"',
  "SegmentedControl should not expose fixed segment width tokens",
);
assertContains(
  files.figma,
  source.figma,
  'component.primaryAxisSizingMode = "AUTO"',
  "SegmentedControl Figma variants hug longer labels horizontally",
);
assertContains(
  files.figma,
  source.figma,
  'setNodePropertyIfSupported(component, "minWidth", metrics.width)',
  "SegmentedControl outer frame keeps its base minimum width while hugging longer labels",
);
assertContains(
  files.figma,
  source.figma,
  'item.primaryAxisSizingMode = "AUTO"',
  "SegmentedControl Figma segments hug label content horizontally",
);
assertContains(
  files.figma,
  source.figma,
  'setNodePropertyIfSupported(item, "minWidth", metrics.itemWidth)',
  "SegmentedControl items keep their base minimum width instead of collapsing to text",
);
assertContains(
  files.figma,
  source.figma,
  "const itemWidths = []",
  "SegmentedControl measures label-driven item widths",
);
assertContains(
  files.figma,
  source.figma,
  "itemWidths.reduce((total, width) => total + width, 0)",
  "SegmentedControl outer width grows from measured item widths",
);
assertContains(
  files.figma,
  source.figma,
  "collectDescendantTextCharactersByName(",
  "SegmentedControl update preserves edited text before rebuilding children",
);
assertContains(
  files.figma,
  source.figma,
  'clearBoundVariable(component, "width", stats)',
  "SegmentedControl update clears stale fixed outer width bindings",
);
assertContains(
  files.figma,
  source.figma,
  'clearBoundVariable(item, "width", stats)',
  "SegmentedControl update clears stale fixed segment width bindings",
);
assertContains(
  files.figma,
  source.figma,
  "const columnGap = 48",
  "SegmentedControl grid uses non-overlapping column spacing",
);
assertContains(
  files.figma,
  source.figma,
  "resizeNodeWithoutConstraints(\n    componentSet,\n    columns * maxWidth + (columns - 1) * columnGap",
  "SegmentedControl component set frame contains its laid-out variants",
);
assertNotContains(
  files.figma,
  source.figma,
  'alias: "Chip/height/small"',
  "SegmentedControl height alias to compact Chip height",
);
assertContains(
  files.figma,
  source.figma,
  "parseSegmentedControlVariantName(component.name) ||",
  "SegmentedControl contrast audit recognizes variant state",
);
assertContains(
  files.figma,
  source.figma,
  '"segmented-control-segment"',
  "SegmentedControl contrast audit tracks selected segment backgrounds",
);
assertContains(
  files.figma,
  source.figma,
  "syncFocusRing(item,",
  "SegmentedControl focus ring is scoped to the active segment",
);
assertContains(
  files.figma,
  source.figma,
  'enabled: state !== "Disabled" && selected',
  "SegmentedControl Focus Visible property remains available on focusable states",
);
assertContains(
  files.figma,
  source.figma,
  "variableName: focusRingVariableForState(state)",
  "SegmentedControl focus ring color follows state",
);
assertContains(
  files.figma,
  source.figma,
  // Was `radius >= 9999 ? 9999 : radius + offset`. The pill branch wrote the
  // sentinel onto the ring, which stores a number false about the shape and
  // makes the ring unarithmetical — a nested-radius audit asked for a 10003px
  // corner off the back of it. Both branches are capped now.
  "radius >= 9999 ? ringCap : Math.min(radius + offset, ringCap)",
  "SegmentedControl focus ring radius is the selected radius plus offset, capped",
);
assertContains(
  files.figma,
  source.figma,
  /function syncFocusRing[\s\S]*?target\.clipsContent = false;/,
  "Figma focus ring targets allow overflow beyond component bounds",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateToggleButtonVariant[\s\S]*?component\.clipsContent = false;[\s\S]*?syncFocusRing\(component,/,
  "ToggleButton root does not clip its focus ring",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateToggleButtonVariant[\s\S]*?component\.cornerRadius = 12;[\s\S]*?syncFocusRing\(component,[\s\S]*?radius: 12,/,
  "ToggleButton radius and focus ring radius use the same 12px base",
);
assertContains(
  files.figma,
  source.figma,
  /name: "ToggleButton\/radius",[\s\S]*?value: 12,[\s\S]*?scopes: \["CORNER_RADIUS"\]/,
  "ToggleButton radius token resolves to a real 12px value",
);
assertNotContains(
  files.figma,
  source.figma,
  /name: "ToggleButton\/radius",\s*\n\s*value: 12,\s*\n\s*alias:/,
  "ToggleButton radius token alias",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateSplitButtonVariant[\s\S]*?component\.clipsContent = false;[\s\S]*?syncFocusRing\(component,/,
  "SplitButton root does not clip its focus ring",
);
assertContains(
  files.figma,
  source.figma,
  /name: "SplitButton\/radius",[\s\S]*?value: 16,[\s\S]*?alias: "Button\/radius"/,
  "SplitButton radius token follows the core Button radius",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateSplitButtonVariant[\s\S]*?component\.cornerRadius = KOZMOS_RADIUS\.control;[\s\S]*?syncFocusRing\(component,[\s\S]*?radius: KOZMOS_RADIUS\.control,/,
  "SplitButton radius and focus ring follow the core Button control role",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateFloatingActionButtonVariant[\s\S]*?component\.clipsContent = false;[\s\S]*?syncFocusRing\(component,/,
  "FloatingActionButton root does not clip its focus ring",
);
assertContains(
  files.figma,
  source.figma,
  /function layoutToggleButtonVariants[\s\S]*?resizeComponentSetToContainChildren\(componentSet\);[\s\S]*?function layoutSplitButtonVariants/,
  "ToggleButton component set resizes to contain its variants",
);
assertContains(
  files.figma,
  source.figma,
  /function layoutSplitButtonVariants[\s\S]*?resizeComponentSetToContainChildren\(componentSet\);[\s\S]*?function layoutFloatingActionButtonVariants/,
  "SplitButton component set resizes to contain its variants",
);
assertContains(
  files.figma,
  source.figma,
  /function layoutFloatingActionButtonVariants[\s\S]*?resizeComponentSetToContainChildren\(componentSet\);[\s\S]*?function configureProgressProperties/,
  "FloatingActionButton component set resizes to contain its variants",
);
assertContains(
  files.figma,
  source.figma,
  /async function createButtonVariant[\s\S]*?component\.cornerRadius = KOZMOS_RADIUS\.control;[\s\S]*?async function updateButtonVariant[\s\S]*?component\.cornerRadius = KOZMOS_RADIUS\.control;/,
  "Button create and update paths share the same Control radius",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/SegmentedControl/SegmentedControl.figma.tsx",
  "Linked React Code Connect includes SegmentedControl template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/SegmentedControl/SegmentedControl.tsx",
  "Linked React Code Connect includes SegmentedControl source",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/SegmentedControl/SegmentedControl.figma.swift",
  "Linked iOS Code Connect includes SegmentedControl template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/SegmentedControl/SegmentedControl.swift",
  "Linked iOS Code Connect includes SegmentedControl source",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/SegmentedControl/SegmentedControl.figma.kt",
  "Linked Android Code Connect includes SegmentedControl template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/SegmentedControl/SegmentedControl.kt",
  "Linked Android Code Connect includes SegmentedControl source",
);
assertNotContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  "focus-within:ring-2",
  "React SegmentedControl should not draw a whole-track focus ring",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  "rounded-[12px] font-medium",
  "React SegmentedControl selected item radius",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  "rounded-[16px] border",
  "React SegmentedControl base radius",
);
assertNotContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  "var(--primitives-radius-md)",
  "React SegmentedControl radius must not inherit the 16px primitive md radius",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  'sm: "min-h-[52px]"',
  "React SegmentedControl small outer height",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  'default: "min-h-[52px]"',
  "React SegmentedControl default outer height",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  'lg: "min-h-[56px]"',
  "React SegmentedControl large outer height",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  'sm: "min-h-11 px-3 text-xs"',
  "React SegmentedControl small item target",
);
assertContains(
  files.reactSegmentedControl,
  source.reactSegmentedControl,
  'className: "min-w-[117px]"',
  "React SegmentedControl default segment minimum width",
);
assertContains(
  files.iosSegmentedControl,
  source.iosSegmentedControl,
  "RoundedRectangle(cornerRadius: 12",
  "iOS SegmentedControl selected item radius",
);
assertContains(
  files.iosSegmentedControl,
  source.iosSegmentedControl,
  "RoundedRectangle(cornerRadius: 16",
  "iOS SegmentedControl base radius",
);
assertContains(
  files.iosSegmentedControl,
  source.iosSegmentedControl,
  "itemMinWidth: 97,\n                itemHeight: 44",
  "iOS SegmentedControl small/default touch target metrics",
);
assertContains(
  files.iosSegmentedControl,
  source.iosSegmentedControl,
  "itemMinWidth: 117",
  "iOS SegmentedControl default segment minimum width",
);
assertContains(
  files.androidSegmentedControl,
  source.androidSegmentedControl,
  "RoundedCornerShape(12.dp)",
  "Android SegmentedControl selected item radius",
);
assertContains(
  files.androidSegmentedControl,
  source.androidSegmentedControl,
  "RoundedCornerShape(16.dp)",
  "Android SegmentedControl base radius",
);
assertContains(
  files.androidSegmentedControl,
  source.androidSegmentedControl,
  "containerHeight = 52.dp,\n            itemMinWidth = 97.dp,\n            itemHeight = 44.dp",
  "Android SegmentedControl small/default touch target metrics",
);
assertContains(
  files.androidSegmentedControl,
  source.androidSegmentedControl,
  "itemMinWidth = 117.dp",
  "Android SegmentedControl default segment minimum width",
);
assertContains(
  files.figma,
  source.figma,
  "buildNumberInputComponent",
  "Figma NumberInput build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildNumberInputComponent",
  "Figma NumberInput rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "NumberInput/stepper/size",
  "NumberInput stepper size token",
);
assertContains(
  files.figma,
  source.figma,
  "function normalizeNumberInputSizing(component, field, valueSlot, stepperNodes)",
  "Figma NumberInput normalizes root and value-slot sizing",
);
assertContains(
  files.figma,
  source.figma,
  "normalizeNumberInputSizing(component, field, valueSlot, stepperNodes);",
  "Figma NumberInput applies explicit sizing normalization",
);
assertContains(
  files.figma,
  source.figma,
  "setFixedChildSizing(stepper);",
  "Figma NumberInput steppers remain fixed while value slot grows",
);
assertContains(
  files.figma,
  source.figma,
  "parseNumberInputVariantName(component.name) ||",
  "NumberInput contrast audit recognizes variant state",
);
assertContains(
  files.figma,
  source.figma,
  /componentSetNameMatches\(\s*nodeSourceComponentSet\(child\),\s*componentSetName,\s*\)/,
  "generated rebuild cleanup removes stale top-level instances by source component set",
);
assertContains(
  files.figma,
  source.figma,
  /async function buildButtonComponent\(\)[\s\S]*?removeStaleGeneratedComponentArtifacts\(page,\s*"Button",\s*stats\);/,
  "Button build removes stale generated top-level instances",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateButtonComponent\(\)[\s\S]*?removeStaleGeneratedComponentArtifacts\(page,\s*"Button",\s*stats\);/,
  "Button update removes stale generated top-level instances",
);
assertContains(
  files.figma,
  source.figma,
  /async function buildIconButtonComponent\(\)[\s\S]*?removeStaleGeneratedComponentArtifacts\(page,\s*"IconButton",\s*stats\);/,
  "IconButton build removes stale generated top-level instances",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateIconButtonComponent\(\)[\s\S]*?removeStaleGeneratedComponentArtifacts\(page,\s*"IconButton",\s*stats\);/,
  "IconButton update removes stale generated top-level instances",
);
assertContains(
  files.figma,
  source.figma,
  /const NAVIGATION_ITEM_PLACEMENTS = \["Top", "Side", "Rail"\]/,
  "Figma NavigationItem placement axis",
);
assertContains(
  files.figma,
  source.figma,
  /const NAVIGATION_ITEM_VARIANT_LAYOUT = \{[\s\S]*?stateColumnStep: 340[\s\S]*?placementGroupGap: 200[\s\S]*?outerPadding: 80/,
  "Figma NavigationItem variant matrix uses readable section spacing",
);
assertContains(
  files.figma,
  source.figma,
  /function layoutNavigationItemVariants[\s\S]*?child\.x = stateIndex \* NAVIGATION_ITEM_VARIANT_LAYOUT\.stateColumnStep[\s\S]*?navigationItemPlacementStartY\(props\.placement\)[\s\S]*?resizeComponentSetToContainChildren\(\s*componentSet,\s*NAVIGATION_ITEM_VARIANT_LAYOUT\.outerPadding/,
  "Figma NavigationItem variants are grouped by placement with padded component-set bounds",
);
assertNotContains(
  files.figma,
  source.figma,
  "placementIndex * 1240 + stateIndex * 220",
  "Figma NavigationItem variants must not use the old cramped horizontal placement formula",
);
assertContains(
  files.figma,
  source.figma,
  /function navigationItemComponentConfig\(\)[\s\S]*?componentName: "NavigationItem"[\s\S]*?configureProperties: configureNavigationItemProperties/,
  "Figma NavigationItem generated component config",
);
assertContains(
  files.figma,
  source.figma,
  /function configureNavigationItemProperties[\s\S]*?configureFocusVisibleProperty\(componentSet, stats\)/,
  "Figma NavigationItem binds Focus Visible property",
);
assertContains(
  files.figma,
  source.figma,
  /async function configureNavigationItemProperties[\s\S]*?configureNavigationItemIconSlots\(componentSet, variableByName, stats\)/,
  "Figma NavigationItem exposes leading icon instance-swap defaults",
);
assertContains(
  files.figma,
  source.figma,
  /async function configureNavigationItemIconSlots[\s\S]*?ensureInstanceSwapProperty\([\s\S]*?"Leading Icon"[\s\S]*?bindInstanceSwapProperty/,
  "Figma NavigationItem binds inner leading icon as a swappable subcomponent",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateNavigationItemVariant[\s\S]*?syncFocusRing\(component,[\s\S]*?enabled: !disabled/,
  "Figma NavigationItem creates focus rings for non-disabled variants",
);
assertContains(
  files.figma,
  source.figma,
  /async function createNavigationItemNestedInstance[\s\S]*?setInstanceSwapProperty\([\s\S]*?"Leading Icon"/,
  "Nested NavigationItem instances can set contextual leading icon defaults",
);
assertContains(
  files.figma,
  source.figma,
  /function createNavbarNavigationItem[\s\S]*?createNavigationItemNestedInstance\([\s\S]*?placement: "Top"/,
  "Navbar navigation slot composes live NavigationItem instances",
);
assertContains(
  files.figma,
  source.figma,
  /async function createSidebarNavigationRow[\s\S]*?createNavigationItemNestedInstance\([\s\S]*?iconName: row\.icon[\s\S]*?placement: "Side"/,
  "Sidebar navigation slot composes live NavigationItem instances with contextual icon defaults",
);
assertContains(
  files.figma,
  source.figma,
  /async function createSidebarRailNavigationRow[\s\S]*?createNavigationItemNestedInstance\([\s\S]*?iconName: row\.icon[\s\S]*?placement: "Rail"/,
  "Sidebar rail slot composes live NavigationItem instances with contextual icon defaults",
);
assertContains(
  files.figma,
  source.figma,
  /const NAVBAR_SLOT_NAMES = \[[\s\S]*?"Logo Slot"[\s\S]*?"Context Slot"[\s\S]*?"Navigation Slot"[\s\S]*?"Primary Action Slot"[\s\S]*?"Actions Slot"[\s\S]*?"Utility Slot"[\s\S]*?"Account Slot"[\s\S]*?\]/,
  "Figma Navbar shared slot registry",
);
assertContains(
  files.figma,
  source.figma,
  "const NAVBAR_DEFAULT_WIDTH = 880",
  "Figma Navbar default width is large enough for contextual desktop shell examples",
);
assertContains(
  files.figma,
  source.figma,
  "value: NAVBAR_DEFAULT_WIDTH",
  "Figma Navbar width token follows the generated desktop shell width",
);
assertContains(
  files.figma,
  source.figma,
  /const SIDEBAR_SLOT_NAMES = \[[\s\S]*?"Header Slot"[\s\S]*?"Navigation Slot"[\s\S]*?"Tools Slot"[\s\S]*?"Footer Slot"[\s\S]*?\]/,
  "Figma Sidebar shared slot registry",
);
assertContains(
  files.figma,
  source.figma,
  "const SIDEBAR_DEFAULT_WIDTH = 280",
  "Figma Sidebar default width is a named shell dimension",
);
assertContains(
  files.figma,
  source.figma,
  "value: SIDEBAR_DEFAULT_WIDTH",
  "Figma Sidebar width token follows the generated shell dimension",
);
assertContains(
  files.figma,
  source.figma,
  /function configureNavbarProperties\(componentSet, stats\)[\s\S]*?configureSharedSlotProperties\(componentSet, NAVBAR_SLOT_NAMES, stats\)/,
  "Figma Navbar exposes all agreed shell slots through shared SLOT properties",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateNavbarVariant\([\s\S]*?extractReusableSlotsByName\([\s\S]*?requiredNavbarSlotNamesForContent\(props\.content\)[\s\S]*?removeDirectChildrenExceptMany\(component, Object\.values\(reusableSlots\)\)/,
  "Figma Navbar updater preserves and migrates existing shell slot nodes",
);
assertContains(
  files.figma,
  source.figma,
  /component\.resizeWithoutConstraints\(\s*NAVBAR_DEFAULT_WIDTH,\s*NAVBAR_DEFAULT_HEIGHT,\s*\)/,
  "Figma Navbar generated frame uses the shared desktop shell dimensions",
);
assertContains(
  files.figma,
  source.figma,
  /component\.appendChild\(contextSlot\);\s*setFixedChildSizing\(contextSlot\);/,
  "Figma Navbar contextual slot keeps a real fixed width instead of hug-collapsing",
);
assertContains(
  files.figma,
  source.figma,
  /function auditNavbarAutoLayoutIntegrity\(componentSet, issues\)[\s\S]*?navbar-context-slot-width[\s\S]*?navbar-context-text-width/,
  "Figma audit catches collapsed contextual Navbar slot geometry",
);
assertContains(
  files.figma,
  source.figma,
  /function auditSidebarAutoLayoutIntegrity\(componentSet, issues\)[\s\S]*?sidebar-component-width[\s\S]*?auditSidebarSlotGeometry[\s\S]*?Navigation Slot[\s\S]*?expectedVerticalSizing: "FILL"/,
  "Figma audit catches collapsed Sidebar shell slot geometry",
);
assertContains(
  files.figma,
  source.figma,
  /function auditSidebarSlotGeometry\([\s\S]*?expectedHorizontalSizing === "FILL"[\s\S]*?auditHorizontalFillSizing\([\s\S]*?kind: `sidebar-\$\{slug\}-horizontal-sizing`/,
  "Figma Sidebar slot audit accepts native stretch/fill sizing for bound SLOT frames",
);
assertContains(
  files.figma,
  source.figma,
  /function auditVisualOverflow\([\s\S]*?options = \{\}[\s\S]*?checkHorizontal[\s\S]*?expectedMaxRight/,
  "Figma visual overflow audit can catch horizontal slot overflow",
);
assertContains(
  files.figma,
  source.figma,
  /function auditComponentSet\([\s\S]*?const geometryIntegrity = timeAuditStep\([\s\S]*?"geometry integrity"[\s\S]*?auditGeneratedGeometryIntegrity\(componentSet\)/,
  "Figma component audit checks for collapsed generated geometry",
);
assertContains(
  files.figma,
  source.figma,
  /function auditLibrary\([\s\S]*?const exampleGeometryIntegrity = auditGeneratedExampleGeometry\(page\)[\s\S]*?collapsed generated example node/,
  "Figma library audit checks generated examples for collapsed geometry",
);
assertContains(
  files.figma,
  source.figma,
  /function auditGeneratedGeometryIntegrity\(root, options = \{\}\)[\s\S]*?collapsed-generated-geometry[\s\S]*?nodeIdForUrl\(node\.id\)/,
  "Figma collapsed geometry audit reports precise node ids",
);
assertContains(
  files.figma,
  source.figma,
  /function setInstanceTextProperty\([\s\S]*?componentPropertyLookupByBaseName\([\s\S]*?"TEXT"[\s\S]*?recordMissingInstanceProperty\(componentSet, baseName, "TEXT", stats\)[\s\S]*?return false/,
  "Figma example text overrides report missing component properties",
);
assertContains(
  files.figma,
  source.figma,
  /function setInstanceBooleanProperty\([\s\S]*?componentPropertyLookupByBaseName\([\s\S]*?"BOOLEAN"[\s\S]*?recordMissingInstanceProperty\(componentSet, baseName, "BOOLEAN", stats\)[\s\S]*?return false/,
  "Figma example boolean overrides report missing component properties",
);
assertContains(
  files.figma,
  source.figma,
  /function setInstanceSwapProperty\([\s\S]*?componentPropertyLookupByBaseName\([\s\S]*?"INSTANCE_SWAP"[\s\S]*?recordMissingInstanceProperty\([\s\S]*?"INSTANCE_SWAP"[\s\S]*?return false/,
  "Figma instance-swap overrides report missing component properties",
);
assertContains(
  files.figma,
  source.figma,
  /function recordMissingInstanceProperty\(componentSet, baseName, type, stats\)[\s\S]*?missingInstanceProperties[\s\S]*?missing \$\{type\} component property/,
  "Figma missing instance property warnings are counted and de-duplicated",
);
assertContains(
  files.figma,
  source.figma,
  /async function createNavbarLogoSlot\([\s\S]*?createOrReuseShellSlot\([\s\S]*?slotName: "Logo Slot"[\s\S]*?async function createNavbarContextSlot/,
  "Figma Navbar logo shell uses native/reusable slot creation",
);
assertNotContains(
  files.figma,
  source.figma,
  /async function createNavbarLogoSlot\([\s\S]*?= createSampleSlotFrame\([\s\S]*?async function createSidebarVariant/,
  "Figma Navbar shell slots regressed to unbound sample frames",
);
assertContains(
  files.figma,
  source.figma,
  /function configureNavbarProperties\(componentSet, stats\)[\s\S]*?deleteComponentPropertiesByBaseName\([\s\S]*?"Site Slot"[\s\S]*?"Logo Text"[\s\S]*?"Context Text"[\s\S]*?"Primary Action Text"[\s\S]*?\["SLOT", "TEXT"\]/,
  "Figma Navbar deletes legacy product-copy properties from slot shell instances",
);
assertNotContains(
  files.figma,
  source.figma,
  /function configureNavbarProperties\(componentSet, stats\)[\s\S]*?configureNamedTextProperty[\s\S]*?function configureSidebarProperties/,
  "Navbar re-exposing fallback copy text properties instead of slots",
);
assertContains(
  files.figma,
  source.figma,
  /function configureSidebarProperties\(componentSet, stats\)[\s\S]*?configureSharedSlotProperties\(componentSet, SIDEBAR_SLOT_NAMES, stats\)/,
  "Figma Sidebar exposes all agreed shell slots through shared SLOT properties",
);
assertContains(
  files.figma,
  source.figma,
  /async function updateSidebarVariant\([\s\S]*?extractReusableSlotsByName\([\s\S]*?requiredSidebarSlotNamesForContent\(props\.content\)[\s\S]*?removeDirectChildrenExceptMany\(component, Object\.values\(reusableSlots\)\)/,
  "Figma Sidebar updater preserves and migrates existing shell slot nodes",
);
assertContains(
  files.figma,
  source.figma,
  /async function createSidebarHeaderSlot\([\s\S]*?createOrReuseShellSlot\([\s\S]*?slotName: "Header Slot"[\s\S]*?async function createSidebarNavigationSlot/,
  "Figma Sidebar header shell uses native/reusable slot creation",
);
assertNotContains(
  files.figma,
  source.figma,
  /async function createSidebarHeaderSlot\([\s\S]*?= createSampleSlotFrame\([\s\S]*?function createSampleSlotFrame/,
  "Figma Sidebar shell slots regressed to unbound sample frames",
);
assertContains(
  files.figma,
  source.figma,
  /function configureSidebarProperties\(componentSet, stats\)[\s\S]*?deleteComponentPropertiesByBaseName\([\s\S]*?"Content Slot"[\s\S]*?\["SLOT"\][\s\S]*?deleteComponentPropertiesByBaseName\([\s\S]*?"Title Text"[\s\S]*?"Section Text"[\s\S]*?"Footer Text"[\s\S]*?\["TEXT"\]/,
  "Figma Sidebar deletes fallback-copy properties from slot shell instances",
);
assertNotContains(
  files.figma,
  source.figma,
  /function configureSidebarProperties\(componentSet, stats\)[\s\S]*?configureNamedTextProperty[\s\S]*?function configureTreeProperties/,
  "Sidebar re-exposing fallback copy text properties instead of slots",
);
assertContains(
  files.figma,
  source.figma,
  /function auditComponentSlotContract\(componentSet, propertyDefinitions\)[\s\S]*?requiredSlotPropertyNamesForComponent\(componentName\)[\s\S]*?requiredSlotNamesForVariant\(/,
  "Figma audit verifies Navbar and Sidebar slot properties per variant",
);
assertContains(
  files.figma,
  source.figma,
  /function nodeReferencesComponentProperty\(node, propertyName\)[\s\S]*?componentPropertyReferences/,
  "Figma slot audit verifies generated slot frames are bound to component properties",
);
assertContains(
  files.figma,
  source.figma,
  /function createOrReuseShellSlot\([\s\S]*?reusableSlot && reusableSlot\.type === "SLOT"[\s\S]*?createComponentContentSlot\([\s\S]*?moveDirectChildrenIntoSlot\(/,
  "Figma shell slot helper migrates reusable frames to native slot nodes",
);
assertContains(
  files.figma,
  source.figma,
  /function createOrReuseShellSlot\([\s\S]*?shouldRefreshGeneratedShellSlotDefaults\([\s\S]*?removeDirectChildren\(reusableSlot\)[\s\S]*?generatedShellSlotDefaultsRefreshed/,
  "Figma shell slot helper refreshes generated default navigation content",
);
assertContains(
  files.figma,
  source.figma,
  /slotContract\.issueCount > 0[\s\S]*?slot contract issue\(s\) found/,
  "Figma audit reports shell slot contract failures",
);
assertContains(
  files.figma,
  source.figma,
  /function stalePropertyNamesForComponent\(componentName\)[\s\S]*?"Logo Text"[\s\S]*?"Primary Action Text"[\s\S]*?"Title Text"[\s\S]*?"Footer Text"/,
  "Figma slot audit rejects stale shell fallback text properties",
);
assertContains(
  files.figma,
  source.figma,
  /issue\.kind === "stale-property"[\s\S]*?still exposes stale/,
  "Figma slot audit reports stale instance-panel properties",
);
assertContains(
  files.figma,
  source.figma,
  /function componentPropertyDefinitionNameByBaseName\(\s*propertyDefinitions,\s*baseName,?\s*\)/,
  "Figma slot audit uses a dedicated property-definition lookup helper",
);
assertOccurrenceCount(
  files.figma,
  source.figma,
  /function componentPropertyNameByBaseName\(/g,
  1,
  "component-set property lookup helper",
);
assertContains(
  files.reactNavbar,
  source.reactNavbar,
  /export interface NavbarProps[\s\S]*?logo\?[\s\S]*?context\?[\s\S]*?navigation\?[\s\S]*?primaryAction\?[\s\S]*?actions\?[\s\S]*?utilities\?[\s\S]*?account\?/,
  "React Navbar exposes named shell slot props",
);
assertContains(
  files.reactSidebar,
  source.reactSidebar,
  /export interface SidebarProps[\s\S]*?header\?[\s\S]*?navigation\?[\s\S]*?content\?[\s\S]*?tools\?[\s\S]*?footer\?/,
  "React Sidebar exposes named shell slot props",
);
assertContains(
  files.iosNavbar,
  source.iosNavbar,
  /@ViewBuilder logo[\s\S]*?@ViewBuilder context[\s\S]*?@ViewBuilder navigation[\s\S]*?@ViewBuilder primaryAction[\s\S]*?@ViewBuilder actions[\s\S]*?@ViewBuilder utilities[\s\S]*?@ViewBuilder account/,
  "iOS Navbar exposes named shell slot builders",
);
assertContains(
  files.iosSidebar,
  source.iosSidebar,
  /public enum KozmosSidebarVariant[\s\S]*?case expanded[\s\S]*?case rail[\s\S]*?@ViewBuilder header[\s\S]*?@ViewBuilder navigation[\s\S]*?@ViewBuilder tools[\s\S]*?@ViewBuilder footer/,
  "iOS Sidebar exposes named shell slot builders and rail variant",
);
assertContains(
  files.androidNavbar,
  source.androidNavbar,
  /logo: @Composable RowScope\.\(\) -> Unit[\s\S]*?context: @Composable RowScope\.\(\) -> Unit[\s\S]*?navigation: @Composable RowScope\.\(\) -> Unit[\s\S]*?primaryAction: @Composable RowScope\.\(\) -> Unit[\s\S]*?actions: @Composable RowScope\.\(\) -> Unit[\s\S]*?utilities: @Composable RowScope\.\(\) -> Unit[\s\S]*?account: @Composable RowScope\.\(\) -> Unit/,
  "Android Navbar exposes named shell slot builders",
);
assertContains(
  files.androidSidebar,
  source.androidSidebar,
  /enum class KozmosSidebarVariant[\s\S]*?Expanded[\s\S]*?Rail[\s\S]*?header: @Composable ColumnScope\.\(\) -> Unit[\s\S]*?navigation: @Composable ColumnScope\.\(\) -> Unit[\s\S]*?tools: @Composable ColumnScope\.\(\) -> Unit[\s\S]*?footer: @Composable ColumnScope\.\(\) -> Unit/,
  "Android Sidebar exposes named shell slot builders and rail variant",
);
assertContains(
  files.reactNavbarFigma,
  source.reactNavbarFigma,
  /figma\.slot\("Actions Slot"\)[\s\S]*?figma\.slot\("Account Slot"\)[\s\S]*?figma\.slot\("Context Slot"\)[\s\S]*?figma\.slot\("Logo Slot"\)[\s\S]*?figma\.slot\("Navigation Slot"\)[\s\S]*?figma\.slot\("Primary Action Slot"\)[\s\S]*?figma\.slot\("Utility Slot"\)/,
  "React Navbar Code Connect maps Figma slots to shell props",
);
assertContains(
  files.reactNavbarMdx,
  source.reactNavbarMdx,
  /named slots[\s\S]*?`logo`[\s\S]*?`context`[\s\S]*?`primaryAction`[\s\S]*?`actions`[\s\S]*?`utilities`[\s\S]*?`account`/,
  "React Navbar docs explain named shell slots",
);
assertContains(
  files.reactNavbarMdx,
  source.reactNavbarMdx,
  /KozmosNavbar\([\s\S]*?logo:[\s\S]*?context:[\s\S]*?navigation:[\s\S]*?KozmosNavigationItem\(label: "[^"]+"[\s\S]*?primaryAction:[\s\S]*?actions:[\s\S]*?utilities:[\s\S]*?account:/,
  "Navbar Swift docs show native named shell slot composition",
);
assertContains(
  files.reactNavbarMdx,
  source.reactNavbarMdx,
  /KozmosNavbar\([\s\S]*?logo =[\s\S]*?context =[\s\S]*?navigation =[\s\S]*?KozmosNavigationItem\([\s\S]*?label = "[^"]+"[\s\S]*?primaryAction =[\s\S]*?actions =[\s\S]*?utilities =[\s\S]*?account =/,
  "Navbar Kotlin docs show native named shell slot composition",
);
assertNotContains(
  files.reactNavbarMdx,
  source.reactNavbarMdx,
  /Dashboard|Maps|Reports|\/maps/,
  "Navbar docs product-specific navigation sample copy",
);
assertNotContains(
  files.reactNavbarMdx,
  source.reactNavbarMdx,
  "Navbar Content placeholder",
  "Navbar docs stale native placeholder snippet",
);
assertContains(
  files.reactSidebarFigma,
  source.reactSidebarFigma,
  /figma\.slot\("Footer Slot"\)[\s\S]*?figma\.slot\("Header Slot"\)[\s\S]*?figma\.slot\("Navigation Slot"\)[\s\S]*?figma\.slot\("Tools Slot"\)/,
  "React Sidebar Code Connect maps Figma slots to shell props",
);
assertContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  /named `header`, `tools`, and `footer` slots/,
  "React Sidebar docs explain named shell slots",
);
assertNotContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  /navigation=\{\s*<nav\b/,
  "Sidebar docs nesting a nav landmark inside the navigation slot",
);
assertContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  /KozmosSidebar\([\s\S]*?variant: \.expanded[\s\S]*?header:[\s\S]*?navigation:[\s\S]*?KozmosNavigationItem\(label: "[^"]+"[\s\S]*?tools:[\s\S]*?footer:/,
  "Sidebar Swift docs show native named shell slot composition",
);
assertContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  /KozmosSidebar\([\s\S]*?variant = KozmosSidebarVariant\.Expanded[\s\S]*?header =[\s\S]*?navigation =[\s\S]*?KozmosNavigationItem\(label = "[^"]+"[\s\S]*?tools =[\s\S]*?footer =/,
  "Sidebar Kotlin docs show native named shell slot composition",
);
assertNotContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  /Dashboard|Maps|Reports|Map Content|\/maps/,
  "Sidebar docs product-specific navigation sample copy",
);
assertNotContains(
  files.reactSidebarMdx,
  source.reactSidebarMdx,
  "Sidebar Content placeholder",
  "Sidebar docs stale native placeholder snippet",
);
assertContains(
  files.iosNavbarFigma,
  source.iosNavbarFigma,
  /var variant = \["Content": "Basic"\][\s\S]*?var variant = \["Content": "Actions"\][\s\S]*?var variant = \["Content": "Contextual"\]/,
  "iOS Navbar Code Connect maps static content variants",
);
assertContains(
  files.iosNavbarFigma,
  source.iosNavbarFigma,
  /KozmosNavbar\([\s\S]*?logo:[\s\S]*?context:[\s\S]*?navigation:[\s\S]*?primaryAction:[\s\S]*?actions:[\s\S]*?utilities:[\s\S]*?account:/,
  "iOS Navbar Code Connect uses the named shell slot API",
);
assertNotContains(
  files.iosNavbarFigma,
  source.iosNavbarFigma,
  /@FigmaEnum\("Content"|self\.content|content ==/,
  "iOS Navbar Code Connect dynamic variant control flow",
);
assertNotContains(
  files.iosNavbarFigma,
  source.iosNavbarFigma,
  /@FigmaString\("(Logo Text|Site Label Text|Site Text|Primary Action Text|Action Text)"\)|"Product": "product"/,
  "iOS Navbar stale product-copy Code Connect properties",
);
assertNotContains(
  files.iosSidebarFigma,
  source.iosSidebarFigma,
  /@FigmaString\("(Title Text|Section Text|Item 1 Text|Item 2 Text|Item 3 Text|Tool Text|Footer Text)"\)/,
  "iOS Sidebar stale product-copy Code Connect properties",
);
assertContains(
  files.iosSidebarFigma,
  source.iosSidebarFigma,
  /KozmosSidebar\([\s\S]*?variant:[\s\S]*?header:[\s\S]*?navigation:[\s\S]*?tools:[\s\S]*?footer:/,
  "iOS Sidebar Code Connect uses the named shell slot API",
);
assertContains(
  files.iosSidebarFigma,
  source.iosSidebarFigma,
  /var variant = \["Content": "Basic"\][\s\S]*?var variant = \["Content": "Sections"\][\s\S]*?var variant = \["Content": "Tools"\][\s\S]*?var variant = \["Content": "Rail"\]/,
  "iOS Sidebar Code Connect maps static content variants",
);
assertNotContains(
  files.iosSidebarFigma,
  source.iosSidebarFigma,
  /@FigmaEnum\("Content"|self\.content|content ==/,
  "iOS Sidebar Code Connect dynamic variant control flow",
);
assertContains(
  files.androidNavbarFigma,
  source.androidNavbarFigma,
  '"Contextual" to "contextual"',
  "Android Navbar Code Connect maps the Contextual content variant",
);
assertContains(
  files.androidNavbarFigma,
  source.androidNavbarFigma,
  /KozmosNavbar\([\s\S]*?logo =[\s\S]*?context =[\s\S]*?navigation =[\s\S]*?primaryAction =[\s\S]*?actions =[\s\S]*?utilities =[\s\S]*?account =/,
  "Android Navbar Code Connect uses the named shell slot API",
);
assertNotContains(
  files.androidNavbarFigma,
  source.androidNavbarFigma,
  /@FigmaProperty\(FigmaType\.Text, "(Logo Text|Site Label Text|Site Text|Primary Action Text|Action Text)"\)|"Product" to "product"/,
  "Android Navbar stale product-copy Code Connect properties",
);
assertNotContains(
  files.androidSidebarFigma,
  source.androidSidebarFigma,
  /@FigmaProperty\(FigmaType\.Text, "(Title Text|Section Text|Item 1 Text|Item 2 Text|Item 3 Text|Tool Text|Footer Text)"\)/,
  "Android Sidebar stale product-copy Code Connect properties",
);
assertContains(
  files.androidSidebarFigma,
  source.androidSidebarFigma,
  /KozmosSidebar\([\s\S]*?variant =[\s\S]*?header =[\s\S]*?navigation =[\s\S]*?tools =[\s\S]*?footer =/,
  "Android Sidebar Code Connect uses the named shell slot API",
);
assertContains(
  files.figma,
  source.figma,
  /Navbar:\s*\[[\s\S]*?"Site Slot"[\s\S]*?"Site Selector"[\s\S]*?"Context Slot"[\s\S]*?"Context Selector"[\s\S]*?\]/,
  "Figma Navbar stale anatomy cleanup recognizes legacy and context selector artifacts",
);
assertContains(
  files.figma,
  source.figma,
  /contextText\.fills\s*=\s*\[\s*paintFromVariable\(\s*"Colors\/foreground\/0"/,
  "Navbar context selector text uses semantic foreground contrast token",
);
assertContains(
  files.figma,
  source.figma,
  /async function createNavbarActionsSlot[\s\S]*?label\.name = "Action Text"[\s\S]*?paintFromVariable\(\s*"Colors\/foreground\/0"/,
  "Navbar secondary action text uses semantic foreground contrast token",
);
assertContains(
  files.reactNavigationItem,
  source.reactNavigationItem,
  /export interface NavigationItemProps[\s\S]*?placement[\s\S]*?selected[\s\S]*?trailing/,
  "React NavigationItem exposes shared navigation row props",
);
assertContains(
  files.reactNavigationItemFigma,
  source.reactNavigationItemFigma,
  // The leading region is an instance-swap, not a slot: a component property
  // cannot drive a node inside its own component's slot, and Sidebar's rows set
  // their icons through this one. Badge and Trailing are the real slots.
  /figma\.connect\(NavigationItem[\s\S]*?figma\.boolean\("Focus Visible"\)[\s\S]*?figma\.instance\("Leading Icon"\)[\s\S]*?figma\.enum\("Placement"/,
  "React NavigationItem Code Connect maps placement, the leading icon swap, and focus visibility",
);
assertNotContains(
  files.reactNavigationItemMdx,
  source.reactNavigationItemMdx,
  /Maps|Map Content|\/maps|Icons\.Default\.Map|import\s+\{[^}]*\bMap\b[^}]*\}\s+from\s+["']lucide-react["']/,
  "NavigationItem docs map-specific sample copy",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/NavigationItem/NavigationItem.figma.tsx",
  "Linked React Code Connect includes NavigationItem template",
);
assertContains(
  files.iosNavigationItem,
  source.iosNavigationItem,
  /public enum KozmosNavigationItemPlacement[\s\S]*?case top[\s\S]*?case side[\s\S]*?case rail/,
  "iOS NavigationItem exposes shared placement API",
);
assertContains(
  files.iosNavigationItem,
  source.iosNavigationItem,
  /public enum KozmosNavigationItemContent[\s\S]*?case label[\s\S]*?case iconLabel[\s\S]*?case iconOnly[\s\S]*?case badge[\s\S]*?case trailing/,
  "iOS NavigationItem exposes reusable slot content API",
);
assertContains(
  files.iosNavigationItem,
  source.iosNavigationItem,
  /public struct KozmosNavigationItem[\s\S]*?icon: AnyView\?[\s\S]*?badge: AnyView\?[\s\S]*?trailing: AnyView\?/,
  "iOS NavigationItem has icon, badge, and trailing composition slots",
);
assertContains(
  files.iosNavigationItemFigma,
  source.iosNavigationItemFigma,
  /node-id=861-7297[\s\S]*?@FigmaEnum\([\s\S]*?"Placement"[\s\S]*?@FigmaEnum\([\s\S]*?"Content"[\s\S]*?@FigmaBoolean\("Focus Visible"\)/,
  "iOS NavigationItem Code Connect maps placement, content, and focus visibility",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/NavigationItem/NavigationItem.figma.swift",
  "Linked iOS Code Connect includes NavigationItem template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/NavigationItem/NavigationItem.swift",
  "Linked iOS Code Connect includes NavigationItem source",
);
assertContains(
  files.androidNavigationItem,
  source.androidNavigationItem,
  /enum class KozmosNavigationItemPlacement[\s\S]*?Top[\s\S]*?Side[\s\S]*?Rail/,
  "Android NavigationItem exposes shared placement API",
);
assertContains(
  files.androidNavigationItem,
  source.androidNavigationItem,
  /enum class KozmosNavigationItemContent[\s\S]*?Label[\s\S]*?IconLabel[\s\S]*?IconOnly[\s\S]*?Badge[\s\S]*?Trailing/,
  "Android NavigationItem exposes reusable slot content API",
);
assertContains(
  files.androidNavigationItem,
  source.androidNavigationItem,
  /fun KozmosNavigationItem\([\s\S]*?icon: \(@Composable \(\) -> Unit\)\?[\s\S]*?badge: \(@Composable \(\) -> Unit\)\?[\s\S]*?trailing: \(@Composable \(\) -> Unit\)\?/,
  "Android NavigationItem has icon, badge, and trailing composition slots",
);
assertContains(
  files.androidNavigationItemFigma,
  source.androidNavigationItemFigma,
  /node-id=861-7297[\s\S]*?@FigmaProperty\(FigmaType\.Enum, "Placement"\)[\s\S]*?@FigmaProperty\(FigmaType\.Enum, "Content"\)[\s\S]*?@FigmaProperty\(FigmaType\.Boolean, "Focus Visible"\)/,
  "Android NavigationItem Code Connect maps placement, content, and focus visibility",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/NavigationItem/NavigationItem.figma.kt",
  "Linked Android Code Connect includes NavigationItem template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/NavigationItem/NavigationItem.kt",
  "Linked Android Code Connect includes NavigationItem source",
);
assertContains(
  files.iosTree,
  source.iosTree,
  /public enum KozmosTreeDensity[\s\S]*?case `default`[\s\S]*?case compact/,
  "iOS Tree exposes density API for the Figma density variant",
);
assertContains(
  files.iosTreeFigma,
  source.iosTreeFigma,
  /node-id=662-5094[\s\S]*?@FigmaEnum\([\s\S]*?"Density"[\s\S]*?KozmosTree\(/,
  "iOS Tree Code Connect links the real Tree node and maps Density",
);
assertNotContains(
  files.iosTreeFigma,
  source.iosTreeFigma,
  "Placeholder",
  "iOS Tree placeholder Code Connect",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Tree/Tree.figma.swift",
  "Linked iOS Code Connect includes Tree template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Tree/Tree.swift",
  "Linked iOS Code Connect includes Tree source",
);
assertContains(
  files.androidTree,
  source.androidTree,
  /enum class KozmosTreeDensity[\s\S]*?Default[\s\S]*?Compact/,
  "Android Tree exposes density API for the Figma density variant",
);
assertContains(
  files.androidTreeFigma,
  source.androidTreeFigma,
  /node-id=662-5094[\s\S]*?@FigmaProperty\(FigmaType\.Enum, "Density"\)[\s\S]*?KozmosTree\(/,
  "Android Tree Code Connect links the real Tree node and maps Density",
);
assertNotContains(
  files.androidTreeFigma,
  source.androidTreeFigma,
  "Placeholder",
  "Android Tree placeholder Code Connect",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Tree/Tree.figma.kt",
  "Linked Android Code Connect includes Tree template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Tree/Tree.kt",
  "Linked Android Code Connect includes Tree source",
);
assertContains(
  files.reactTimeline,
  source.reactTimeline,
  /export type TimelineDensity = ["']default["'] \| ["']compact["'];/,
  "React Timeline exposes the Figma density variant",
);
assertContains(
  files.reactTimeline,
  source.reactTimeline,
  "density?: TimelineDensity",
  "React Timeline exposes a density prop",
);
assertContains(
  files.reactTimeline,
  source.reactTimeline,
  "data-timeline-item",
  "React Timeline exposes stable generated anatomy hooks",
);
assertContains(
  files.reactTimelineFigma,
  source.reactTimelineFigma,
  /node-id=660-4393[\s\S]*?figma\.enum\("Content"[\s\S]*?figma\.enum\("Density"[\s\S]*?figma\.string\("Item 1 Time"\)[\s\S]*?figma\.string\("Item 3 Description"\)[\s\S]*?<Timeline density=\{density\}>/,
  "React Timeline Code Connect links the real Timeline node and maps content, density, and item text",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Timeline/Timeline.figma.tsx",
  "Linked React Code Connect includes Timeline template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Timeline/Timeline.tsx",
  "Linked React Code Connect includes Timeline source",
);
assertContains(
  files.iosTimeline,
  source.iosTimeline,
  /public enum KozmosTimelineDensity[\s\S]*?case `default`[\s\S]*?case compact/,
  "iOS Timeline exposes density API for the Figma density variant",
);
assertContains(
  files.iosTimelineFigma,
  source.iosTimelineFigma,
  /node-id=660-4393[\s\S]*?@FigmaEnum\([\s\S]*?"Content"[\s\S]*?@FigmaEnum\([\s\S]*?"Density"[\s\S]*?@FigmaString\("Item 1 Time"\)[\s\S]*?KozmosTimeline\(density:/,
  "iOS Timeline Code Connect links the real Timeline node and maps content, density, and item text",
);
assertNotContains(
  files.iosTimelineFigma,
  source.iosTimelineFigma,
  "Placeholder",
  "iOS Timeline placeholder Code Connect",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Timeline/Timeline.figma.swift",
  "Linked iOS Code Connect includes Timeline template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Timeline/Timeline.swift",
  "Linked iOS Code Connect includes Timeline source",
);
assertContains(
  files.androidTimeline,
  source.androidTimeline,
  /enum class KozmosTimelineDensity[\s\S]*?Default[\s\S]*?Compact/,
  "Android Timeline exposes density API for the Figma density variant",
);
assertContains(
  files.androidTimelineFigma,
  source.androidTimelineFigma,
  /node-id=660-4393[\s\S]*?@FigmaProperty\(FigmaType\.Enum, "Content"\)[\s\S]*?@FigmaProperty\(FigmaType\.Enum, "Density"\)[\s\S]*?@FigmaProperty\(FigmaType\.Text, "Item 1 Time"\)[\s\S]*?KozmosTimeline\(density = density\)/,
  "Android Timeline Code Connect links the real Timeline node and maps content, density, and item text",
);
assertNotContains(
  files.androidTimelineFigma,
  source.androidTimelineFigma,
  "Placeholder",
  "Android Timeline placeholder Code Connect",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Timeline/Timeline.figma.kt",
  "Linked Android Code Connect includes Timeline template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Timeline/Timeline.kt",
  "Linked Android Code Connect includes Timeline source",
);
assertNotContains(
  files.reactTreeMdx,
  source.reactTreeMdx,
  "Tree Content placeholder",
  "Tree docs stale native placeholder snippet",
);
assertNotContains(
  files.reactTimelineMdx,
  source.reactTimelineMdx,
  "Timeline Content placeholder",
  "Timeline docs stale native placeholder snippet",
);
const nativeSnippetDocs = [
  "Backdrop",
  "BottomNavigation",
  "BottomSheet",
  "Box",
  "Breadcrumb",
  "Container",
  "DatePicker",
  "DirectionStep",
  "FileUpload",
  "FloatingActionButton",
  "FloorSelector",
  "Grid",
  "Heading",
  "Icon",
  "Label",
  "Link",
  "List",
  "LocationPin",
  "MapView",
  "Menu",
  "OTPInput",
  "Pagination",
  "POICard",
  "Popover",
  "Progress",
  "Rating",
  "Search",
  "SearchBar",
  "Separator",
  "Skeleton",
  "Slider",
  "Spinner",
  "SplitButton",
  "Stack",
  "Stepper",
  "Table",
  "Tabs",
  "Tag",
  "Text",
  "Textarea",
  "ThemeProvider",
  "TimePicker",
  "ToggleButton",
  "Tree",
  "Timeline",
  "WayfindingCard",
];
for (const componentName of nativeSnippetDocs) {
  const docPath = `packages/react/src/components/${componentName}/${componentName}.mdx`;
  assertNotContains(
    docPath,
    read(docPath),
    `${componentName} Content placeholder`,
    `${componentName} docs stale native placeholder snippet`,
  );
}
const runtimePlaceholderPattern =
  /^\s*\/\/\s*Placeholder\b|Placeholder for content|Content placeholder|dummy view|not implemented/m;
const runtimePlaceholderFiles = [
  ...listFilesRecursive(
    "packages/react/src/components",
    (filePath) =>
      /\.(?:mdx|tsx|ts)$/.test(filePath) && !filePath.endsWith(".figma.tsx"),
  ),
  ...listFilesRecursive(
    "packages/ios/Sources/Components",
    (filePath) =>
      filePath.endsWith(".swift") && !filePath.endsWith(".figma.swift"),
  ),
  ...listFilesRecursive(
    "packages/android/src/main/java/com/kozmos/components",
    (filePath) => filePath.endsWith(".kt") && !filePath.endsWith(".figma.kt"),
  ),
];
for (const filePath of runtimePlaceholderFiles) {
  assertNotContains(
    filePath,
    read(filePath),
    runtimePlaceholderPattern,
    "runtime placeholder comment or content",
  );
}
assertContains(
  files.figma,
  source.figma,
  /function auditNodeContrast[\s\S]*?const childBackground = contrastChildBackground\([\s\S]*?auditNodeContrast\(\s*child,\s*childBackground,/,
  "Figma contrast audit evaluates text against filled wrapper backgrounds",
);
assertContains(
  files.figma,
  source.figma,
  /function auditComponentContrastForMode[\s\S]*?auditNodeContrast\(\s*component,\s*fallbackSurface,/,
  "Figma contrast audit applies root component fill exactly once during traversal",
);
assertContains(
  files.figma,
  source.figma,
  /function auditSurfaceQaInstanceContrast[\s\S]*?auditNodeContrast\(\s*instance,\s*hostBackground,/,
  "Figma Surface QA contrast audit applies instance fill exactly once during traversal",
);
assertContains(
  files.figma,
  source.figma,
  /text contrast pair\(s\) fail WCAG AA 4\.5:1\.\$\{failureDetails \? ` Details: \$\{failureDetails\}` : ""\}/,
  "Figma text contrast warnings include node and ratio details",
);
assertContains(
  files.figma,
  source.figma,
  /function formatContrastFailureDetails\(failures, kind\)[\s\S]*?ratio \$\{failure\.ratio\} < \$\{failure\.required\}/,
  "Figma contrast failure detail formatter includes ratios",
);
assertNotContains(
  files.figma,
  source.figma,
  'if (status !== "Default") {\n    return { token: config.fieldStroke, fallback: config.fieldStrokeFallback };\n  }',
  "NumberInput value text using validation stroke colors",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-number-input",
  "NumberInput UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-password-input",
  "PasswordInput UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="passwordInput">PasswordInput</option>',
  "PasswordInput UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'id="neverBuiltPanel"',
  "Figma importer exposes not-built component panel",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "(not built)",
  "Figma importer marks not-built dropdown options",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "componentsStageText",
  "Figma importer labels component warning count in workflow status",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "run Reorganize Components to remove stray generated instances",
  "Figma importer recommends Reorganize Components for stray top-level nodes",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'node.removeAttribute("title");',
  "Figma importer custom tooltips do not also trigger native title tooltips",
);
assertContains(
  files.reactNumberInput,
  source.reactNumberInput,
  "showSteppers = true",
  "React NumberInput exposes optional steppers",
);
const ownedNativeFieldsPath =
  "packages/react/src/styles/owned-native-fields.css";
const ownedNativeFields = read(ownedNativeFieldsPath);
assertContains(
  files.reactNumberInput,
  source.reactNumberInput,
  '"kozmos-number-input"',
  "React NumberInput selects its owned field recipe",
);
assertContains(
  ownedNativeFieldsPath,
  ownedNativeFields.match(/\.kozmos-number-input\s*\{([^}]*)\}/)?.[1] ?? "",
  "min-w-0 flex-1",
  "React NumberInput center field flexes between fixed steppers",
);
assertContains(
  files.reactPasswordInput,
  source.reactPasswordInput,
  'type={isVisible ? "text" : "password"}',
  "React PasswordInput controls native password type",
);
assertContains(
  files.reactPasswordInput,
  source.reactPasswordInput,
  "aria-pressed={isVisible}",
  "React PasswordInput visibility toggle exposes pressed state",
);
assertContains(
  files.reactPasswordInput,
  source.reactPasswordInput,
  "kozmos-field-action kozmos-password-toggle",
  "React PasswordInput selects its owned toggle recipe",
);
assertContains(
  ownedNativeFieldsPath,
  ownedNativeFields.match(/\.kozmos-field-action\s*\{([^}]*)\}/)?.[1] ?? "",
  "h-11 w-11",
  "React PasswordInput visibility toggle keeps 44px target",
);
assertContains(
  files.iosPasswordInput,
  source.iosPasswordInput,
  "SecureField(placeholder, text: $text)",
  "iOS PasswordInput uses native secure text entry",
);
assertContains(
  files.iosPasswordInput,
  source.iosPasswordInput,
  "TextField(placeholder, text: $text)",
  "iOS PasswordInput can reveal text when visible",
);
assertContains(
  files.iosPasswordInput,
  source.iosPasswordInput,
  "let showToggle: Bool",
  "iOS PasswordInput exposes optional visibility toggle",
);
assertContains(
  files.iosPasswordInput,
  source.iosPasswordInput,
  ".frame(width: 44, height: 44)",
  "iOS PasswordInput visibility toggle keeps 44px target",
);
assertContains(
  files.androidPasswordInput,
  source.androidPasswordInput,
  "PasswordVisualTransformation()",
  "Android PasswordInput uses native password visual transformation",
);
assertContains(
  files.androidPasswordInput,
  source.androidPasswordInput,
  "VisualTransformation.None",
  "Android PasswordInput can reveal text when visible",
);
assertContains(
  files.androidPasswordInput,
  source.androidPasswordInput,
  "showToggle: Boolean = true",
  "Android PasswordInput exposes optional visibility toggle",
);
assertContains(
  files.androidPasswordInput,
  source.androidPasswordInput,
  "modifier = Modifier.size(44.dp)",
  "Android PasswordInput visibility toggle keeps 44dp target",
);
assertContains(
  files.reactMultiSelect,
  source.reactMultiSelect,
  "ChipGroup",
  "React MultiSelect composes selected values with ChipGroup",
);
assertContains(
  files.iosMultiSelect,
  source.iosMultiSelect,
  "KozmosChipGroup",
  "iOS MultiSelect composes selected values with native ChipGroup",
);
assertContains(
  files.androidMultiSelect,
  source.androidMultiSelect,
  "KozmosChipGroup",
  "Android MultiSelect composes selected values with native ChipGroup",
);
assertContains(
  files.iosListbox,
  source.iosListbox,
  "public struct KozmosListboxOption",
  "iOS Listbox exposes reusable option model",
);
assertContains(
  files.androidListbox,
  source.androidListbox,
  "data class KozmosListboxOption",
  "Android Listbox exposes reusable option model",
);
assertContains(
  files.iosCombobox,
  source.iosCombobox,
  "KozmosListbox(",
  "iOS Combobox composes native Listbox",
);
assertContains(
  files.androidCombobox,
  source.androidCombobox,
  "KozmosListbox(",
  "Android Combobox composes native Listbox",
);
assertContains(
  files.iosMultiSelect,
  source.iosMultiSelect,
  "KozmosListbox(",
  "iOS MultiSelect composes native Listbox",
);
assertContains(
  files.androidMultiSelect,
  source.androidMultiSelect,
  "KozmosListbox(",
  "Android MultiSelect composes native Listbox",
);
assertContains(
  files.reactNumberInput,
  source.reactNumberInput,
  "inputVariants({ status: resolvedStatus })",
  "React NumberInput selects validation border/focus recipes",
);
assertContains(
  ownedNativeFieldsPath,
  ownedNativeFields.match(/\.kozmos-number-input\s*\{([^}]*)\}/)?.[1] ?? "",
  "text-foreground",
  "React NumberInput preserves readable value text separately from validation tone",
);
assertNotContains(
  files.iosNumberInput,
  source.iosNumberInput,
  "if effectiveStatus == .error { return KozmosColors.primitivesColorsEmotionalDanger600 }",
  "iOS NumberInput value text inheriting validation text colors",
);
assertNotContains(
  files.androidNumberInput,
  source.androidNumberInput,
  "val textColor = when {\n        effectiveStatus == KozmosInputStatus.Error -> KozmosThemeTokens.primitivesColorsEmotionalDanger600",
  "Android NumberInput value text inheriting validation text colors",
);
assertContains(
  files.reactNumberInputFigma,
  source.reactNumberInputFigma,
  'figma.enum("Steppers"',
  "React NumberInput Code Connect maps Steppers axis",
);
assertContains(
  files.reactPasswordInputFigma,
  source.reactPasswordInputFigma,
  'figma.enum("Visibility"',
  "React PasswordInput Code Connect maps Visibility axis",
);
assertContains(
  files.reactPasswordInputFigma,
  source.reactPasswordInputFigma,
  "node-id=412-2642",
  "React PasswordInput Code Connect node id",
);
assertNotContains(
  files.reactPasswordInputFigma,
  source.reactPasswordInputFigma,
  "node-id=TBD",
  "placeholder React PasswordInput Code Connect node id",
);
assertContains(
  files.iosPasswordInputFigma,
  source.iosPasswordInputFigma,
  '@FigmaEnum(\n        "Visibility"',
  "iOS PasswordInput Code Connect maps Visibility axis",
);
assertContains(
  files.iosPasswordInputFigma,
  source.iosPasswordInputFigma,
  "node-id=412-2642",
  "iOS PasswordInput Code Connect node id",
);
assertNotContains(
  files.iosPasswordInputFigma,
  source.iosPasswordInputFigma,
  "node-id=TBD",
  "placeholder iOS PasswordInput Code Connect node id",
);
assertContains(
  files.androidPasswordInputFigma,
  source.androidPasswordInputFigma,
  '@FigmaProperty(FigmaType.Enum, "Visibility")',
  "Android PasswordInput Code Connect maps Visibility axis",
);
assertContains(
  files.androidPasswordInputFigma,
  source.androidPasswordInputFigma,
  "node-id=412-2642",
  "Android PasswordInput Code Connect node id",
);
assertNotContains(
  files.androidPasswordInputFigma,
  source.androidPasswordInputFigma,
  "node-id=TBD",
  "placeholder Android PasswordInput Code Connect node id",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/PasswordInput/PasswordInput.figma.tsx",
  "PasswordInput React linked parser include",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/PasswordInput/PasswordInput.figma.swift",
  "PasswordInput iOS linked parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/PasswordInput/PasswordInput.figma.kt",
  "PasswordInput Android linked parser include",
);
assertContains(
  files.iosListboxFigma,
  source.iosListboxFigma,
  '@FigmaEnum(\n        "Selection"',
  "iOS Listbox Code Connect maps Selection axis",
);
assertContains(
  files.androidListboxFigma,
  source.androidListboxFigma,
  '@FigmaProperty(FigmaType.Enum, "Selection")',
  "Android Listbox Code Connect maps Selection axis",
);
assertContains(
  files.iosComboboxFigma,
  source.iosComboboxFigma,
  '@FigmaEnum(\n        "Content"',
  "iOS Combobox Code Connect maps Content axis",
);
assertContains(
  files.androidComboboxFigma,
  source.androidComboboxFigma,
  '@FigmaProperty(FigmaType.Enum, "Content")',
  "Android Combobox Code Connect maps Content axis",
);
assertContains(
  files.iosMultiSelectFigma,
  source.iosMultiSelectFigma,
  '@FigmaEnum(\n        "Content"',
  "iOS MultiSelect Code Connect maps Content axis",
);
assertContains(
  files.androidMultiSelectFigma,
  source.androidMultiSelectFigma,
  '@FigmaProperty(FigmaType.Enum, "Content")',
  "Android MultiSelect Code Connect maps Content axis",
);
for (const [filePath, content, nodeId, label] of [
  [
    files.reactListboxFigma,
    source.reactListboxFigma,
    "node-id=401-9475",
    "React Listbox",
  ],
  [
    files.iosListboxFigma,
    source.iosListboxFigma,
    "node-id=401-9475",
    "iOS Listbox",
  ],
  [
    files.androidListboxFigma,
    source.androidListboxFigma,
    "node-id=401-9475",
    "Android Listbox",
  ],
  [
    files.reactComboboxFigma,
    source.reactComboboxFigma,
    "node-id=398-8298",
    "React Combobox",
  ],
  [
    files.iosComboboxFigma,
    source.iosComboboxFigma,
    "node-id=398-8298",
    "iOS Combobox",
  ],
  [
    files.androidComboboxFigma,
    source.androidComboboxFigma,
    "node-id=398-8298",
    "Android Combobox",
  ],
  [
    files.reactMultiSelectFigma,
    source.reactMultiSelectFigma,
    "node-id=401-9365",
    "React MultiSelect",
  ],
  [
    files.iosMultiSelectFigma,
    source.iosMultiSelectFigma,
    "node-id=401-9365",
    "iOS MultiSelect",
  ],
  [
    files.androidMultiSelectFigma,
    source.androidMultiSelectFigma,
    "node-id=401-9365",
    "Android MultiSelect",
  ],
]) {
  assertContains(filePath, content, nodeId, `${label} Code Connect node id`);
  assertNotContains(
    filePath,
    content,
    "node-id=TBD",
    `placeholder ${label} Code Connect node id`,
  );
}
for (const [filePath, content, nodeId, label] of [
  [
    files.reactColorPickerFigma,
    source.reactColorPickerFigma,
    "node-id=451-13566",
    "React ColorPicker",
  ],
  [
    files.reactDatePickerFigma,
    source.reactDatePickerFigma,
    "node-id=438-4292",
    "React DatePicker",
  ],
  [
    files.reactDateRangePickerFigma,
    source.reactDateRangePickerFigma,
    "node-id=443-10939",
    "React DateRangePicker",
  ],
  [
    files.reactTimePickerFigma,
    source.reactTimePickerFigma,
    "node-id=444-12011",
    "React TimePicker",
  ],
  [
    files.reactFileUploadFigma,
    source.reactFileUploadFigma,
    "node-id=444-12724",
    "React FileUpload",
  ],
  [
    files.reactFloatingActionButtonFigma,
    source.reactFloatingActionButtonFigma,
    "node-id=383-2459",
    "React FloatingActionButton",
  ],
  [
    files.reactSplitButtonFigma,
    source.reactSplitButtonFigma,
    "node-id=383-2332",
    "React SplitButton",
  ],
  [
    files.reactToggleButtonFigma,
    source.reactToggleButtonFigma,
    "node-id=383-2019",
    "React ToggleButton",
  ],
]) {
  assertContains(filePath, content, nodeId, `${label} Code Connect node id`);
  assertNotContains(
    filePath,
    content,
    "node-id=TBD",
    `placeholder ${label} Code Connect node id`,
  );
}
for (const [filePath, content, nodeId, label] of [
  [
    files.iosDatePickerFigma,
    source.iosDatePickerFigma,
    "node-id=438-4292",
    "iOS DatePicker",
  ],
  [
    files.androidDatePickerFigma,
    source.androidDatePickerFigma,
    "node-id=438-4292",
    "Android DatePicker",
  ],
  [
    files.iosDateRangePickerFigma,
    source.iosDateRangePickerFigma,
    "node-id=443-10939",
    "iOS DateRangePicker",
  ],
  [
    files.androidDateRangePickerFigma,
    source.androidDateRangePickerFigma,
    "node-id=443-10939",
    "Android DateRangePicker",
  ],
  [
    files.iosTimePickerFigma,
    source.iosTimePickerFigma,
    "node-id=444-12011",
    "iOS TimePicker",
  ],
  [
    files.androidTimePickerFigma,
    source.androidTimePickerFigma,
    "node-id=444-12011",
    "Android TimePicker",
  ],
  [
    files.iosFileUploadFigma,
    source.iosFileUploadFigma,
    "node-id=444-12724",
    "iOS FileUpload",
  ],
  [
    files.androidFileUploadFigma,
    source.androidFileUploadFigma,
    "node-id=444-12724",
    "Android FileUpload",
  ],
  [
    files.iosColorPickerFigma,
    source.iosColorPickerFigma,
    "node-id=451-13566",
    "iOS ColorPicker",
  ],
  [
    files.androidColorPickerFigma,
    source.androidColorPickerFigma,
    "node-id=451-13566",
    "Android ColorPicker",
  ],
  [
    files.iosFloatingActionButtonFigma,
    source.iosFloatingActionButtonFigma,
    "node-id=383-2459",
    "iOS FloatingActionButton",
  ],
  [
    files.androidFloatingActionButtonFigma,
    source.androidFloatingActionButtonFigma,
    "node-id=383-2459",
    "Android FloatingActionButton",
  ],
  [
    files.iosSplitButtonFigma,
    source.iosSplitButtonFigma,
    "node-id=383-2332",
    "iOS SplitButton",
  ],
  [
    files.androidSplitButtonFigma,
    source.androidSplitButtonFigma,
    "node-id=383-2332",
    "Android SplitButton",
  ],
  [
    files.iosToggleButtonFigma,
    source.iosToggleButtonFigma,
    "node-id=383-2019",
    "iOS ToggleButton",
  ],
  [
    files.androidToggleButtonFigma,
    source.androidToggleButtonFigma,
    "node-id=383-2019",
    "Android ToggleButton",
  ],
]) {
  assertContains(filePath, content, nodeId, `${label} Code Connect node id`);
  assertNotContains(
    filePath,
    content,
    "Placeholder",
    `placeholder ${label} Code Connect`,
  );
}
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Combobox/Combobox.figma.tsx",
  "Combobox React linked parser include",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/MultiSelect/MultiSelect.figma.tsx",
  "MultiSelect React linked parser include",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/Listbox/Listbox.figma.tsx",
  "Listbox React linked parser include",
);
for (const [includePath, label] of [
  ["src/components/ColorPicker/ColorPicker.figma.tsx", "ColorPicker"],
  ["src/components/DatePicker/DatePicker.figma.tsx", "DatePicker"],
  [
    "src/components/DateRangePicker/DateRangePicker.figma.tsx",
    "DateRangePicker",
  ],
  ["src/components/TimePicker/TimePicker.figma.tsx", "TimePicker"],
  ["src/components/FileUpload/FileUpload.figma.tsx", "FileUpload"],
  [
    "src/components/FloatingActionButton/FloatingActionButton.figma.tsx",
    "FloatingActionButton",
  ],
  ["src/components/SplitButton/SplitButton.figma.tsx", "SplitButton"],
  ["src/components/ToggleButton/ToggleButton.figma.tsx", "ToggleButton"],
]) {
  assertContains(
    files.figmaLinked,
    source.figmaLinked,
    includePath,
    `${label} React linked parser include`,
  );
}
for (const [configFile, configSource, includePath, label] of [
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/DatePicker/DatePicker.figma.swift",
    "DatePicker iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/DatePicker/DatePicker.figma.kt",
    "DatePicker Android",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/TimePicker/TimePicker.figma.swift",
    "TimePicker iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/TimePicker/TimePicker.figma.kt",
    "TimePicker Android",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/FileUpload/FileUpload.figma.swift",
    "FileUpload iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/FileUpload/FileUpload.figma.kt",
    "FileUpload Android",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/FloatingActionButton/FloatingActionButton.figma.swift",
    "FloatingActionButton iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/FloatingActionButton/FloatingActionButton.figma.kt",
    "FloatingActionButton Android",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/SplitButton/SplitButton.figma.swift",
    "SplitButton iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/SplitButton/SplitButton.figma.kt",
    "SplitButton Android",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/ToggleButton/ToggleButton.figma.swift",
    "ToggleButton iOS",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/ToggleButton/ToggleButton.figma.kt",
    "ToggleButton Android",
  ],
]) {
  assertContains(
    configFile,
    configSource,
    includePath,
    `${label} linked parser include`,
  );
}
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Combobox/Combobox.figma.swift",
  "Combobox iOS linked parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Combobox/Combobox.figma.kt",
  "Combobox Android linked parser include",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/MultiSelect/MultiSelect.figma.swift",
  "MultiSelect iOS linked parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/MultiSelect/MultiSelect.figma.kt",
  "MultiSelect Android linked parser include",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Listbox/Listbox.figma.swift",
  "Listbox iOS linked parser include",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Listbox/Listbox.figma.kt",
  "Listbox Android linked parser include",
);
assertContains(
  files.reactNumberInputFigma,
  source.reactNumberInputFigma,
  "node-id=338-1796",
  "React NumberInput Code Connect node id",
);
assertContains(
  files.iosNumberInputFigma,
  source.iosNumberInputFigma,
  "node-id=338-1796",
  "iOS NumberInput Code Connect node id",
);
assertContains(
  files.androidNumberInputFigma,
  source.androidNumberInputFigma,
  "node-id=338-1796",
  "Android NumberInput Code Connect node id",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/NumberInput/NumberInput.figma.tsx",
  "Linked React Code Connect includes NumberInput template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/NumberInput/NumberInput.figma.swift",
  "Linked iOS Code Connect includes NumberInput template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/NumberInput/NumberInput.figma.kt",
  "Linked Android Code Connect includes NumberInput template",
);
assertContains(
  files.iosNumberInputFigma,
  source.iosNumberInputFigma,
  '@FigmaEnum(\n        "Steppers"',
  "iOS NumberInput Code Connect maps Steppers axis",
);
assertContains(
  files.androidNumberInputFigma,
  source.androidNumberInputFigma,
  '@FigmaProperty(FigmaType.Enum, "Steppers")',
  "Android NumberInput Code Connect maps Steppers axis",
);
for (const [filePath, content, label] of [
  [
    files.reactFieldWrapperFigma,
    source.reactFieldWrapperFigma,
    "React FormField",
  ],
  [files.iosFieldWrapperFigma, source.iosFieldWrapperFigma, "iOS FormField"],
  [
    files.androidFieldWrapperFigma,
    source.androidFieldWrapperFigma,
    "Android FormField",
  ],
]) {
  assertContains(
    filePath,
    content,
    "node-id=431-5810",
    `${label} Code Connect node id`,
  );
  assertNotContains(
    filePath,
    content,
    "node-id=TBD",
    `placeholder ${label} Code Connect node id`,
  );
}
for (const [configFile, configSource, includePath, label] of [
  [
    files.figmaLinked,
    source.figmaLinked,
    "src/components/FieldWrapper/FormField.figma.tsx",
    "React FormField",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/FieldWrapper/FieldWrapper.figma.swift",
    "iOS FormField",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/FieldWrapper/FieldWrapper.figma.kt",
    "Android FormField",
  ],
]) {
  assertContains(
    configFile,
    configSource,
    includePath,
    `${label} linked parser include`,
  );
}
assertContains(
  files.figma,
  source.figma,
  "buildOTPInputComponent",
  "Figma OTPInput build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildOTPInputComponent",
  "Figma OTPInput rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const OTP_INPUT_LENGTHS = ["4", "6"]',
  "Figma OTPInput length axis",
);
assertContains(
  files.figma,
  source.figma,
  "configureOTPInputProperties(componentSet, stats)",
  "Figma OTPInput text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseOTPInputVariantName(component.name) ||",
  "OTPInput contrast audit recognizes variant state",
);
assertContains(
  files.figma,
  source.figma,
  "bindOTPInputGeometryVariables",
  "Figma OTPInput geometry token binding",
);
assertContains(
  files.figma,
  source.figma,
  "OTPInput Cell Group",
  "Figma OTPInput cell group sizing marker",
);
assertContains(
  files.figma,
  source.figma,
  tokenAliasPattern("OTPInput/cell/radius", "Input/field/radius"),
  "Figma OTPInput cell radius follows Input",
);
assertContains(
  files.figma,
  source.figma,
  tokenAliasPattern("OTPInput/cell/size", "Input/field/height"),
  "Figma OTPInput cell size follows Input height",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-otp-input",
  "OTPInput UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="otpInput">OTPInput</option>',
  "OTPInput UI picker option",
);
assertContains(
  files.reactOTPInput,
  source.reactOTPInput,
  "helperText?: string",
  "React OTPInput supports helper text",
);
assertContains(
  files.reactOTPInput,
  source.reactOTPInput,
  "readOnly?: boolean",
  "React OTPInput supports readonly state",
);
assertContains(
  files.reactOTPInput,
  source.reactOTPInput,
  'className={cn("flex w-full items-center gap-2", className)}',
  "React OTPInput digit row fills its parent",
);
assertContains(
  files.reactOTPInput,
  source.reactOTPInput,
  "const inputId = id || defaultInputId;",
  "React OTPInput avoids duplicate wrapper and first-cell IDs",
);
assertContains(
  files.reactOTPInputFigma,
  source.reactOTPInputFigma,
  'figma.enum("Length"',
  "React OTPInput Code Connect maps Length axis",
);
assertContains(
  files.reactOTPInputFigma,
  source.reactOTPInputFigma,
  "node-id=475-38745",
  "React OTPInput Code Connect node id",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/OTPInput/OTPInput.figma.tsx",
  "Linked React Code Connect includes OTPInput template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/OTPInput/OTPInput.tsx",
  "Linked React Code Connect includes OTPInput source",
);
assertContains(
  files.iosOTPInput,
  source.iosOTPInput,
  "status: KozmosInputStatus = .default",
  "iOS OTPInput supports validation status",
);
assertContains(
  files.iosOTPInput,
  source.iosOTPInput,
  "helperText: String? = nil",
  "iOS OTPInput supports helper text",
);
assertContains(
  files.iosOTPInputFigma,
  source.iosOTPInputFigma,
  "node-id=475-38745",
  "iOS OTPInput Code Connect node id",
);
assertContains(
  files.iosOTPInputFigma,
  source.iosOTPInputFigma,
  '@FigmaEnum(\n        "Length"',
  "iOS OTPInput Code Connect maps Length axis",
);
assertContains(
  files.androidOTPInput,
  source.androidOTPInput,
  "status: KozmosInputStatus = KozmosInputStatus.Default",
  "Android OTPInput supports validation status",
);
assertContains(
  files.androidOTPInput,
  source.androidOTPInput,
  "helperText: String? = null",
  "Android OTPInput supports helper text",
);
assertContains(
  files.androidOTPInputFigma,
  source.androidOTPInputFigma,
  "node-id=475-38745",
  "Android OTPInput Code Connect node id",
);
assertContains(
  files.androidOTPInputFigma,
  source.androidOTPInputFigma,
  '@FigmaProperty(FigmaType.Enum, "Length")',
  "Android OTPInput Code Connect maps Length axis",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/OTPInput/OTPInput.figma.swift",
  "Linked iOS Code Connect includes OTPInput template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/OTPInput/OTPInput.swift",
  "Linked iOS Code Connect includes OTPInput source",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/OTPInput/OTPInput.figma.kt",
  "Linked Android Code Connect includes OTPInput template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/OTPInput/OTPInput.kt",
  "Linked Android Code Connect includes OTPInput source",
);
assertContains(
  files.figma,
  source.figma,
  'const EMPTY_STATE_CONTENT = ["Basic", "Icon", "Action"]',
  "EmptyState content axis",
);
assertContains(
  files.figma,
  source.figma,
  "buildEmptyStateComponent",
  "Figma EmptyState build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildEmptyStateComponent",
  "Figma EmptyState rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "EmptyState/width/default",
  "EmptyState width token",
);
assertContains(
  files.figma,
  source.figma,
  "configureEmptyStateProperties(componentSet, stats)",
  "EmptyState text component property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseEmptyStateVariantName(component.name) ||",
  "EmptyState contrast audit recognizes content variants",
);
assertContains(
  files.figma,
  source.figma,
  'markNestedComponentInstance(action, "Button", "empty-state-action")',
  "EmptyState Action composes live Button instance",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-empty-state",
  "EmptyState UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="emptyState">EmptyState</option>',
  "EmptyState UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-form-field",
  "FormField UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="formField">FormField</option>',
  "FormField UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "libraryState.auditStale && status.exists",
  "plugin UI suppresses stale component-specific audit warnings",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "Run Audit Again before acting on component-specific findings.",
  "plugin UI stale audit tooltip points to refresh before fixes",
);
assertContains(
  files.figma,
  source.figma,
  "buildFormFieldComponent",
  "Figma FormField build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildFormFieldComponent",
  "Figma FormField rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const FORM_FIELD_CONTENT = ["Basic", "Description", "Helper", "Full"]',
  "Figma FormField content axis",
);
assertContains(
  files.figma,
  source.figma,
  "function setFormFieldContentSlotSizing(contentSlot)",
  "Figma FormField content slot has dedicated hug-height sizing",
);
assertContains(
  files.figma,
  source.figma,
  "function normalizeFormFieldSizing(",
  "Figma FormField normalizes fill-width row sizing",
);
assertContains(
  files.figma,
  source.figma,
  'header.primaryAxisAlignItems = "MIN";',
  "Figma FormField header keeps label aligned to the start",
);
assertContains(
  files.figma,
  source.figma,
  'setNodePropertyIfSupported(contentSlot, "primaryAxisSizingMode", "AUTO");',
  "Figma FormField content slot hugs inserted content vertically",
);
assertNotContains(
  files.figma,
  source.figma,
  "setVerticalFixedFillChildSizing(contentSlot);",
  "Figma FormField content slot fixed-height sizing",
);
assertNotContains(
  files.figma,
  source.figma,
  /contentSlot,\s*"height",\s*"FormField\/content-slot\/height"/,
  "Figma FormField content slot height variable binding",
);
assertContains(
  files.figma,
  source.figma,
  "configureFormFieldProperties(componentSet, stats)",
  "Figma FormField text and slot property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseFormFieldVariantName(child.name)",
  "Figma FormField update parser",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-date-picker",
  "DatePicker UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="datePicker">DatePicker</option>',
  "DatePicker UI picker option",
);
assertContains(
  files.figma,
  source.figma,
  "buildDatePickerComponent",
  "Figma DatePicker build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildDatePickerComponent",
  "Figma DatePicker rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const DATE_PICKER_CONTENT = ["Closed", "Open"]',
  "Figma DatePicker content axis",
);
assertContains(
  files.figma,
  source.figma,
  /const DATE_PICKER_EXAMPLE = \{[\s\S]*?year: 2026[\s\S]*?monthIndex: 4[\s\S]*?selectedDay: 25[\s\S]*?todayDay: 22/,
  "Figma DatePicker example date is explicit and calendar-math driven",
);
assertContains(
  files.figma,
  source.figma,
  "const DATE_PICKER_GRID_ROWS = 6",
  "Figma DatePicker renders a full six-week calendar matrix",
);
assertContains(
  files.figma,
  source.figma,
  "const DATE_PICKER_STATE_ROW_STEP = 500",
  "Figma DatePicker build and update layout reserve six-week open calendars",
);
assertContains(
  files.figma,
  source.figma,
  /function createCalendarDaySpecs[\s\S]*?Date\.UTC\(year, monthIndex, 1\)[\s\S]*?index < 42[\s\S]*?outsideMonth: !inCurrentMonth/,
  "Figma calendar examples compute real month grids instead of static day arrays",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("DatePicker/calendar/radius", 16),
  "Figma DatePicker calendar radius token",
);
assertContains(
  files.figma,
  source.figma,
  /function createDatePickerCalendar[\s\S]*?nav\.name = "DatePicker Calendar Navigation"[\s\S]*?nav\.counterAxisSizingMode = "AUTO"[\s\S]*?setLayoutSizingVertical\(nav, "HUG"\)[\s\S]*?nav\.resizeWithoutConstraints\(68, 32\)/,
  "Figma DatePicker calendar navigation hugs its 32px controls",
);
assertContains(
  files.figma,
  source.figma,
  /weekdayRow\.name = "DatePicker Weekdays"[\s\S]*?weekdayRow\.resizeWithoutConstraints\(296, 20\)[\s\S]*?grid\.name = "DatePicker Calendar Grid"[\s\S]*?grid\.resizeWithoutConstraints\(296, DATE_PICKER_GRID_HEIGHT\)/,
  "Figma DatePicker calendar rows avoid default 100px frame bounds",
);
assertContains(
  files.figma,
  source.figma,
  /createDatePickerCalendar[\s\S]*?createCalendarDaySpecs\([\s\S]*?selectedDate:[\s\S]*?DATE_PICKER_EXAMPLE\.selectedDay[\s\S]*?todayDate:[\s\S]*?DATE_PICKER_EXAMPLE\.todayDay/,
  "Figma DatePicker selected/today examples are bound to the generated calendar grid",
);
assertNotContains(
  files.figma,
  source.figma,
  "const selected = index === 28",
  "Figma DatePicker must not hardcode the old Sunday-shifted May 25 selection index",
);
assertNotContains(
  files.figma,
  source.figma,
  "const dayValues = [",
  "Figma calendar examples must not return to static day arrays",
);
assertContains(
  files.figma,
  source.figma,
  "configureDatePickerProperties(componentSet, stats)",
  "Figma DatePicker text property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseDatePickerVariantName(child.name)",
  "Figma DatePicker update parser",
);
assertContains(
  files.figma,
  source.figma,
  "parseDatePickerVariantName(component.name) ||",
  "Figma DatePicker contrast audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedDatePickerCalendarDay(node)",
  "Figma DatePicker calendar day contrast local background",
);
assertContains(
  files.figma,
  source.figma,
  'node.getSharedPluginData(RUN_NAMESPACE, "availability") === "unavailable"',
  "Figma calendar unavailable day contrast exemption",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-date-range-picker",
  "DateRangePicker UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="dateRangePicker">DateRangePicker</option>',
  "DateRangePicker UI picker option",
);
assertContains(
  files.figma,
  source.figma,
  "buildDateRangePickerComponent",
  "Figma DateRangePicker build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildDateRangePickerComponent",
  "Figma DateRangePicker rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const DATE_RANGE_PICKER_CONTENT = ["Closed", "Open"]',
  "Figma DateRangePicker content axis",
);
assertContains(
  files.figma,
  source.figma,
  /const DATE_RANGE_PICKER_EXAMPLE = \{[\s\S]*?startDay: 21[\s\S]*?endDay: 25[\s\S]*?nextMonthIndex: 5/,
  "Figma DateRangePicker example range is explicit and calendar-math driven",
);
assertContains(
  files.figma,
  source.figma,
  "const DATE_RANGE_PICKER_GRID_ROWS = 6",
  "Figma DateRangePicker renders full six-week month matrices",
);
assertContains(
  files.figma,
  source.figma,
  "const DATE_RANGE_PICKER_STATE_ROW_STEP = 580",
  "Figma DateRangePicker build and update layout use the same open-calendar row step",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("DateRangePicker/calendar/radius", 16),
  "Figma DateRangePicker calendar radius token",
);
assertContains(
  files.figma,
  source.figma,
  /function createDateRangePickerMonth[\s\S]*?weekdayRow\.resizeWithoutConstraints\(304, 20\)[\s\S]*?grid\.resizeWithoutConstraints\(304, DATE_RANGE_PICKER_GRID_HEIGHT\)/,
  "Figma DateRangePicker month rows avoid default 100px frame bounds",
);
assertContains(
  files.figma,
  source.figma,
  /createDateRangePickerCalendar[\s\S]*?daySpecs: createCalendarDaySpecs\([\s\S]*?rangeStartDate:[\s\S]*?DATE_RANGE_PICKER_EXAMPLE\.startDay[\s\S]*?rangeEndDate:[\s\S]*?DATE_RANGE_PICKER_EXAMPLE\.endDay/,
  "Figma DateRangePicker month examples bind range highlights to generated calendar grids",
);
assertNotContains(
  files.figma,
  source.figma,
  "child.y = stateIndex * 470",
  "Figma DateRangePicker update layout must not use the old cramped row step",
);
assertNotContains(
  files.figma,
  source.figma,
  "rangeStartIndex",
  "Figma DateRangePicker range highlights must be generated from real dates",
);
assertNotContains(
  files.figma,
  source.figma,
  "rangeEndIndex",
  "Figma DateRangePicker range highlights must be generated from real dates",
);
assertContains(
  files.figma,
  source.figma,
  "configureDateRangePickerProperties(componentSet, stats)",
  "Figma DateRangePicker text property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseDateRangePickerVariantName(child.name)",
  "Figma DateRangePicker update parser",
);
assertContains(
  files.figma,
  source.figma,
  "parseDateRangePickerVariantName(component.name) ||",
  "Figma DateRangePicker contrast audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedDateRangePickerCalendarDay(node)",
  "Figma DateRangePicker calendar day contrast local background",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-time-picker",
  "TimePicker UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="timePicker">TimePicker</option>',
  "TimePicker UI picker option",
);
assertContains(
  files.figma,
  source.figma,
  "buildTimePickerComponent",
  "Figma TimePicker build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildTimePickerComponent",
  "Figma TimePicker rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const TIME_PICKER_CONTENT = ["Closed", "Open"]',
  "Figma TimePicker content axis",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("TimePicker/listbox/radius", 16),
  "Figma TimePicker listbox radius token",
);
assertContains(
  files.figma,
  source.figma,
  "configureTimePickerProperties(componentSet, stats)",
  "Figma TimePicker text property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseTimePickerVariantName(child.name)",
  "Figma TimePicker update parser",
);
assertContains(
  files.figma,
  source.figma,
  "parseTimePickerVariantName(component.name) ||",
  "Figma TimePicker contrast audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "isGeneratedTimePickerOption(node)",
  "Figma TimePicker option contrast local background",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-file-upload",
  "FileUpload UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="fileUpload">FileUpload</option>',
  "FileUpload UI picker option",
);
assertContains(
  files.figma,
  source.figma,
  "buildFileUploadComponent",
  "Figma FileUpload build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildFileUploadComponent",
  "Figma FileUpload rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const FILE_UPLOAD_CONTENT = ["Dropzone", "Files"]',
  "Figma FileUpload content axis includes DropZone alias",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("FileUpload/dropzone/radius", 16),
  "Figma FileUpload dropzone radius token",
);
assertContains(
  files.figma,
  source.figma,
  "configureFileUploadProperties(componentSet, stats)",
  "Figma FileUpload text property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseFileUploadVariantName(child.name)",
  "Figma FileUpload update parser",
);
assertContains(
  files.figma,
  source.figma,
  "parseFileUploadVariantName(component.name) ||",
  "Figma FileUpload contrast audit parser",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-combobox",
  "Combobox UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="combobox">Combobox</option>',
  "Combobox UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-multi-select",
  "MultiSelect UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="multiSelect">MultiSelect</option>',
  "MultiSelect UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-listbox",
  "Listbox UI build action",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="listbox">Listbox</option>',
  "Listbox UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="colorPicker">ColorPicker</option>',
  "ColorPicker input picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  "build-color-picker",
  "ColorPicker UI build action",
);
assertContains(
  files.figma,
  source.figma,
  "buildColorPickerComponent",
  "Figma ColorPicker build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildColorPickerComponent",
  "Figma ColorPicker rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const COLOR_PICKER_CONTENT = ["Closed", "Open"]',
  "Figma ColorPicker content axis",
);
assertContains(
  files.figma,
  source.figma,
  'const COLOR_PICKER_FORMATS = ["HSL", "RGB", "HEX"]',
  "Figma ColorPicker format axis",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("ColorPicker/popover/radius", 16),
  "Figma ColorPicker popover radius token",
);
assertContains(
  files.figma,
  source.figma,
  "configureColorPickerProperties(componentSet, stats)",
  "Figma ColorPicker text property binding",
);
assertContains(
  files.figma,
  source.figma,
  "parseColorPickerVariantName(child.name)",
  "Figma ColorPicker update parser",
);
assertContains(
  files.figma,
  source.figma,
  "parseColorPickerVariantName(component.name) ||",
  "Figma ColorPicker contrast audit parser",
);
assertContains(
  files.figma,
  source.figma,
  '"ColorPicker Field"',
  "Figma ColorPicker fill sizing includes field",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Slider"',
  "Figma ColorPicker reuses the Slider component for hue and opacity controls",
);
assertContains(
  files.figma,
  source.figma,
  'auditExpectedNestedInstance(componentSet, issues, "Hue Slider", "Slider")',
  "Figma ColorPicker audit requires nested Slider instances",
);
assertContains(
  files.figma,
  source.figma,
  'componentSetName: "Select"',
  "Figma ColorPicker reuses the Select component for palette selection",
);
assertContains(
  files.figma,
  source.figma,
  "ColorPicker Palette Select",
  "Figma ColorPicker includes a palette selector in the open panel",
);
assertContains(
  files.figma,
  source.figma,
  "ColorPicker Value Stack",
  "Figma ColorPicker keeps compact channel controls in a vertical stack",
);
assertContains(
  files.figma,
  source.figma,
  "resizeVerticalAutoLayoutFrameToVisibleChildren(component, 320)",
  "Figma ColorPicker open variant hugs visible children instead of keeping dead space",
);
assertContains(
  files.figma,
  source.figma,
  "resizeVerticalAutoLayoutFrameToVisibleChildren(popover, 320)",
  "Figma ColorPicker popover height is derived from visible controls",
);
assertContains(
  files.figma,
  source.figma,
  'sizing === "horizontal-fill"',
  "Figma ColorPicker HEX value field can fill inside the format row",
);
assertNotContains(
  files.figma,
  source.figma,
  "stack.appendChild(hexField)",
  "Figma ColorPicker HEX field is not always visible below HSL/RGB controls",
);
assertContains(
  files.figma,
  source.figma,
  'resolvedFormat === "HEX"',
  "Figma ColorPicker renders HEX controls only for the HEX format variant",
);
assertNotContains(
  files.figma,
  source.figma,
  '"Mode Text",\n    "Mode Text",\n    "HSL"',
  "Figma ColorPicker mode label is driven by the Format axis rather than a stale text property",
);
assertContains(
  files.figma,
  source.figma,
  "row.itemSpacing = gap",
  "Figma ColorPicker preset rows use equal horizontal and vertical gaps",
);
assertContains(
  files.figma,
  source.figma,
  "const columns = 8",
  "Figma ColorPicker preset grid uses an eight-column color stack",
);
assertContains(
  files.figma,
  source.figma,
  "resizeComponentSetToContainChildren(componentSet)",
  "Figma ColorPicker component set resizes to contain all variants",
);
assertContains(
  files.figma,
  source.figma,
  'handle.constraints = { horizontal: "SCALE", vertical: "SCALE" }',
  "Figma ColorPicker color-area handle scales with responsive parent sizing",
);
assertContains(
  files.figma,
  source.figma,
  'thumb.constraints = { horizontal: "SCALE", vertical: "CENTER" }',
  "Figma ColorPicker slider thumbs scale with responsive parent sizing",
);
assertContains(
  files.figma,
  source.figma,
  "ColorPicker Preset Row ${rowIndex + 1}",
  "Figma ColorPicker preset grid includes multiple rows",
);
assertContains(
  files.figma,
  source.figma,
  "sliderThumbs: [areaHandle, hue.thumb, alpha.thumb].filter(Boolean)",
  "Figma ColorPicker color-area handle uses handle sizing, not swatch sizing",
);
assertNotContains(
  files.figma,
  source.figma,
  "swatches: [areaHandle]",
  "ColorPicker area handle bound as a swatch",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  "export const ColorPicker",
  "React ColorPicker component",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  'type="color"',
  "React ColorPicker exposes native color input",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  "defaultOpen?: boolean",
  "React ColorPicker supports an expanded panel state",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  'gridTemplateColumns: "repeat(auto-fit, minmax(2rem, 1fr))"',
  "React ColorPicker preset grid is width-responsive",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  "gridTemplateColumns:",
  "React ColorPicker compact popover controls are responsive",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  'aria-label="Hex value"',
  "React ColorPicker popover exposes a HEX value field",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  'currentFormat === "hex"',
  "React ColorPicker only renders HEX input when HEX format is selected",
);
assertContains(
  files.reactColorPicker,
  source.reactColorPicker,
  '"h-8 w-full min-w-8 rounded-control',
  "React ColorPicker preset swatches fill their responsive grid cells",
);
assertContains(
  files.iosColorPicker,
  source.iosColorPicker,
  "KozmosSlider(value:",
  "iOS ColorPicker reuses native Slider for hue and opacity controls",
);
assertContains(
  files.androidColorPicker,
  source.androidColorPicker,
  "KozmosSlider(",
  "Android ColorPicker reuses native Slider for hue and opacity controls",
);
for (const [filePath, content, label] of [
  [files.iosColorPickerFigma, source.iosColorPickerFigma, "iOS ColorPicker"],
  [
    files.androidColorPickerFigma,
    source.androidColorPickerFigma,
    "Android ColorPicker",
  ],
]) {
  assertContains(
    filePath,
    content,
    "451-13566",
    `${label} Code Connect node id`,
  );
  assertContains(
    filePath,
    content,
    "Format",
    `${label} Code Connect maps format axis`,
  );
  assertContains(
    filePath,
    content,
    "Content",
    `${label} Code Connect maps content axis`,
  );
  assertContains(
    filePath,
    content,
    "State",
    `${label} Code Connect maps state axis`,
  );
  assertContains(
    filePath,
    content,
    "Status",
    `${label} Code Connect maps status axis`,
  );
  assertContains(
    filePath,
    content,
    "Label Text",
    `${label} Code Connect maps label text`,
  );
  assertContains(
    filePath,
    content,
    "Value Text",
    `${label} Code Connect maps color value text`,
  );
  // No "Palette Text" assertion. ColorPicker's palette name is rendered by a
  // nested Select instance, and a component property cannot drive text inside
  // one — so the Figma property was removed, and Code Connect's own validation
  // against the live file now *fails* if a mapping for it is present. This
  // assertion required exactly what that validation rejects; it is the third
  // check in this repo to have asserted something the file had moved past.
  assertContains(
    filePath,
    content,
    "Show Helper Text",
    `${label} Code Connect maps helper visibility`,
  );
}
for (const [filePath, content, label] of [
  [
    files.iosDateRangePickerFigma,
    source.iosDateRangePickerFigma,
    "iOS DateRangePicker",
  ],
  [
    files.androidDateRangePickerFigma,
    source.androidDateRangePickerFigma,
    "Android DateRangePicker",
  ],
]) {
  assertContains(
    filePath,
    content,
    "443-10939",
    `${label} Code Connect node id`,
  );
  assertContains(
    filePath,
    content,
    "Content",
    `${label} Code Connect maps content axis`,
  );
  assertContains(
    filePath,
    content,
    "State",
    `${label} Code Connect maps state axis`,
  );
  assertContains(
    filePath,
    content,
    "Status",
    `${label} Code Connect maps status axis`,
  );
  assertContains(
    filePath,
    content,
    "Label Text",
    `${label} Code Connect maps label text`,
  );
  assertContains(
    filePath,
    content,
    "Start Label Text",
    `${label} Code Connect maps start label`,
  );
  assertContains(
    filePath,
    content,
    "End Label Text",
    `${label} Code Connect maps end label`,
  );
  assertContains(
    filePath,
    content,
    "Start Value Text",
    `${label} Code Connect maps start value`,
  );
  assertContains(
    filePath,
    content,
    "End Value Text",
    `${label} Code Connect maps end value`,
  );
  assertContains(
    filePath,
    content,
    "Show Helper Text",
    `${label} Code Connect maps helper visibility`,
  );
}
assertContains(
  files.reactDateRangePickerFigma,
  source.reactDateRangePickerFigma,
  "dateTextToIso",
  "React DateRangePicker Code Connect normalizes display dates to ISO input values",
);
assertContains(
  files.reactDateRangePickerFigma,
  source.reactDateRangePickerFigma,
  "MONTH_INDEX_BY_NAME",
  "React DateRangePicker Code Connect parses generated month-name dates deterministically",
);
assertContains(
  files.reactDateRangePickerFigma,
  source.reactDateRangePickerFigma,
  /formatIsoDate\(\s*parsed\.getFullYear\(\),\s*parsed\.getMonth\(\) \+ 1,\s*parsed\.getDate\(\),?\s*\)/,
  "React DateRangePicker Code Connect keeps parsed fallback dates in local calendar days",
);
assertNotContains(
  files.reactDateRangePickerFigma,
  source.reactDateRangePickerFigma,
  "toISOString().slice(0, 10)",
  "React DateRangePicker Code Connect must not shift display dates through UTC serialization",
);
assertContains(
  files.reactIndex,
  source.reactIndex,
  "./components/ColorPicker/ColorPicker",
  "React index exports ColorPicker",
);
assertContains(
  files.reactEmptyState,
  source.reactEmptyState,
  "action?: React.ReactNode",
  "React EmptyState exposes optional action slot",
);
assertContains(
  files.reactEmptyState,
  source.reactEmptyState,
  "w-16 h-16 rounded-pill bg-muted",
  "React EmptyState icon container matches Figma geometry",
);
assertContains(
  files.reactEmptyStateFigma,
  source.reactEmptyStateFigma,
  "node-id=347-5316",
  "React EmptyState Code Connect node id",
);
assertContains(
  files.reactEmptyStateFigma,
  source.reactEmptyStateFigma,
  'import { SearchMd as Search } from "@kozmos-ds/icons"',
  "React EmptyState Code Connect draws Figma's search-md, not another size",
);
assertContains(
  files.reactEmptyStateFigma,
  source.reactEmptyStateFigma,
  'variant: { Content: "Action" }',
  "React EmptyState Code Connect maps Action content variant",
);
assertContains(
  files.reactEmptyStateFigma,
  source.reactEmptyStateFigma,
  'action: figma.children(["Action"])',
  "React EmptyState Code Connect maps nested Action button",
);
assertContains(
  files.iosEmptyStateFigma,
  source.iosEmptyStateFigma,
  "node-id=347-5316",
  "iOS EmptyState Code Connect node id",
);
assertContains(
  files.iosEmptyStateFigma,
  source.iosEmptyStateFigma,
  'var variant = ["Content": "Action"]',
  "iOS EmptyState Code Connect maps Action content variant",
);
assertContains(
  files.iosEmptyStateFigma,
  source.iosEmptyStateFigma,
  'KozmosButton("Clear filters", variant: .outline',
  "iOS EmptyState Code Connect composes Button action",
);
assertContains(
  files.androidEmptyStateFigma,
  source.androidEmptyStateFigma,
  "node-id=347-5316",
  "Android EmptyState Code Connect node id",
);
assertContains(
  files.androidEmptyStateFigma,
  source.androidEmptyStateFigma,
  '@FigmaVariant("Content", "Action")',
  "Android EmptyState Code Connect maps Action content variant",
);
assertContains(
  files.androidEmptyStateFigma,
  source.androidEmptyStateFigma,
  "KozmosButton(",
  "Android EmptyState Code Connect composes Button action",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/EmptyState/EmptyState.figma.tsx",
  "Linked React Code Connect includes EmptyState template",
);
assertContains(
  files.figmaLinked,
  source.figmaLinked,
  "src/components/EmptyState/EmptyState.tsx",
  "Linked React Code Connect includes EmptyState source",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/EmptyState/EmptyState.figma.swift",
  "Linked iOS Code Connect includes EmptyState template",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/EmptyState/EmptyState.swift",
  "Linked iOS Code Connect includes EmptyState source",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/EmptyState/EmptyState.figma.kt",
  "Linked Android Code Connect includes EmptyState template",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/EmptyState/EmptyState.kt",
  "Linked Android Code Connect includes EmptyState source",
);
assertContains(
  files.figma,
  source.figma,
  "buildCheckboxComponent",
  "Figma Checkbox build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildCheckboxComponent",
  "Figma Checkbox rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildRadioComponent",
  "Figma Radio build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildRadioComponent",
  "Figma Radio rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSwitchComponent",
  "Figma Switch build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSwitchComponent",
  "Figma Switch rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildInputComponent",
  "Figma Input build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildInputComponent",
  "Figma Input rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "function normalizeInputFamilyChildSizing(component)",
  "Figma input-family variants normalize fill-parent child sizing",
);
assertContains(
  files.figma,
  source.figma,
  '"NumberInput Field"',
  "Figma input-family fill sizing includes NumberInput field",
);
assertContains(
  files.figma,
  source.figma,
  '"FileUpload Dropzone"',
  "Figma input-family fill sizing includes FileUpload dropzone",
);
assertContains(
  files.figma,
  source.figma,
  '"Select Trigger"',
  "Figma input-family fill sizing includes Select trigger",
);
assertOccurrenceCount(
  files.figma,
  source.figma,
  /normalizeInputFamilyChildSizing\(component\);/g,
  17,
  "input-family fill sizing normalization calls",
);
assertContains(
  files.figma,
  source.figma,
  "buildPasswordInputComponent",
  "Figma PasswordInput build action",
);
assertContains(
  files.figma,
  source.figma,
  'findKozmosIconSourceComponent(isVisible ? "x-close" : "lock-01")',
  "Figma PasswordInput visibility icon uses stable curated sources first",
);
assertContains(
  files.figma,
  source.figma,
  '"PasswordInput Field"',
  "Figma PasswordInput stale anatomy cleanup recognizes field orphans",
);
assertContains(
  files.figma,
  source.figma,
  '"Eye Slash"',
  "Figma PasswordInput stale anatomy cleanup recognizes legacy vector orphans",
);
assertContains(
  files.figma,
  source.figma,
  "isKnownGeneratedTopLevelAnatomyArtifact(child)",
  "Figma Reorganize removes generated anatomy orphans",
);
assertContains(
  files.figma,
  source.figma,
  "await removeUnexpectedTopLevelArtifactsBeforeAudit(audit);",
  "Figma audit preflight removes generated anatomy orphans",
);
assertContains(
  files.figma,
  source.figma,
  "audit.maintenance.removedUnexpectedTopLevel",
  "Figma audit reports generated top-level cleanup",
);
assertContains(
  files.figma,
  source.figma,
  "component.appendChild(field);\n  field.layoutMode",
  "Figma PasswordInput attaches field before configuring descendants",
);
assertContains(
  files.figma,
  source.figma,
  "icon.remove();",
  "Figma PasswordInput visibility icon failure cleanup",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '[message.message, message.stack].filter(Boolean).join("\\n\\n")',
  "Figma importer error log includes message and stack",
);
assertContains(
  files.figma,
  source.figma,
  "Unknown plugin action",
  "Figma importer reports stale or unknown UI actions",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildPasswordInputComponent",
  "Figma PasswordInput rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "PasswordInput/toggle/size",
  "Figma PasswordInput visibility toggle touch target token",
);
assertContains(
  files.figma,
  source.figma,
  tokenAliasPattern("PasswordInput/field/radius", "Input/field/radius"),
  "Figma PasswordInput field radius follows Input",
);
assertContains(
  files.figma,
  source.figma,
  "parsePasswordInputVariantName(component.name) ||",
  "PasswordInput contrast audit recognizes variant state",
);
assertContains(
  files.figma,
  source.figma,
  "buildComboboxComponent",
  "Figma Combobox build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildComboboxComponent",
  "Figma Combobox rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const COMBOBOX_CONTENT = ["Closed", "Open"]',
  "Figma Combobox content axis",
);
assertContains(
  files.figma,
  source.figma,
  "Combobox/listbox/width",
  "Figma Combobox listbox geometry token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Combobox/listbox/radius", 16),
  "Figma Combobox dropdown radius token",
);
assertContains(
  files.figma,
  source.figma,
  // "Radius/Control", not "Semantics/Radius/Control": the collection is a
  // separate argument to createVariable, so the canonical path is not part of
  // the variable's name and an alias written that way binds to nothing.
  tokenAliasPattern("Combobox/listbox/radius", "Radius/Control"),
  "Figma Combobox dropdown radius aliases to the Control radius role",
);
assertContains(
  files.figma,
  source.figma,
  "parseComboboxVariantName(component.name)",
  "Figma Combobox audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "buildMultiSelectComponent",
  "Figma MultiSelect build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildMultiSelectComponent",
  "Figma MultiSelect rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const MULTI_SELECT_CONTENT = ["Empty", "Selected", "Open"]',
  "Figma MultiSelect content axis",
);
assertContains(
  files.figma,
  source.figma,
  "MultiSelect/listbox/width",
  "Figma MultiSelect listbox geometry token",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("MultiSelect/listbox/radius", 16),
  "Figma MultiSelect dropdown radius token",
);
assertContains(
  files.figma,
  source.figma,
  'role: "multiselect-chip"',
  "Figma MultiSelect selected values compose nested Chip instances",
);
assertContains(
  files.figma,
  source.figma,
  "parseMultiSelectVariantName(component.name)",
  "Figma MultiSelect audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "buildListboxComponent",
  "Figma Listbox build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildListboxComponent",
  "Figma Listbox rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  'const LISTBOX_SELECTION = ["Single", "Multiple"]',
  "Figma Listbox selection axis",
);
assertContains(
  files.figma,
  source.figma,
  tokenValuePattern("Listbox/radius", 16),
  "Figma Listbox radius token",
);
assertContains(
  files.figma,
  source.figma,
  tokenAliasPattern("Listbox/radius", "Combobox/listbox/radius"),
  "Figma Listbox radius follows shared dropdown radius",
);
assertContains(
  files.figma,
  source.figma,
  "Listbox/description/font-size",
  "Figma Listbox description typography token",
);
assertContains(
  files.figma,
  source.figma,
  "parseListboxVariantName(component.name)",
  "Figma Listbox audit parser",
);
assertContains(
  files.figma,
  source.figma,
  "buildTextareaComponent",
  "Figma Textarea build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildTextareaComponent",
  "Figma Textarea rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSearchComponent",
  "Figma Search build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSearchComponent",
  "Figma Search rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSelectComponent",
  "Figma Select build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSelectComponent",
  "Figma Select rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSliderComponent",
  "Figma Slider build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSliderComponent",
  "Figma Slider rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "setVerticalFixedFillChildSizing(root)",
  "Figma Slider control fills resized parent instances",
);
assertContains(
  files.figma,
  source.figma,
  'track.constraints = { horizontal: "STRETCH", vertical: "CENTER" }',
  "Figma Slider track stretches when nested instances resize",
);
assertContains(
  files.figma,
  source.figma,
  'range.constraints = { horizontal: "SCALE", vertical: "CENTER" }',
  "Figma Slider range scales when nested instances resize",
);
assertContains(
  files.figma,
  source.figma,
  'anchor.constraints = { horizontal: "SCALE", vertical: "STRETCH" }',
  "Figma Slider thumb anchors keep responsive proportional positions",
);
assertContains(
  files.figma,
  source.figma,
  'thumb.constraints = { horizontal: "CENTER", vertical: "CENTER" }',
  "Figma Slider thumbs keep fixed size when parent instances resize",
);
assertContains(
  files.figma,
  source.figma,
  '"slider-thumb-anchor"',
  "Figma Slider generated thumb anchor marker",
);
assertContains(
  files.figma,
  source.figma,
  "const RATING_VALUES =",
  "Figma Rating value axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "buildRatingComponent",
  "Figma Rating build action",
);
assertContains(
  files.figma,
  source.figma,
  "syncRatingVariantChildren",
  "Figma Rating variant renderer",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="rating">Rating</option>',
  "Rating UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-rating"',
  "Rating UI build action",
);
assertContains(
  files.figma,
  source.figma,
  "const STEPPER_COUNTS =",
  "Figma Stepper count axis registry",
);
assertContains(
  files.figma,
  source.figma,
  "buildStepperComponent",
  "Figma Stepper build action",
);
assertContains(
  files.figma,
  source.figma,
  "syncStepperVariantChildren",
  "Figma Stepper variant renderer",
);
assertContains(
  files.figma,
  source.figma,
  `number.fills = [
      paintFromVariable(
        "Colors/foreground/0",
        "#0B0D12",`,
  "Figma Stepper step numbers use readable foreground text",
);
assertContains(
  files.figma,
  source.figma,
  /text\.fills\s*=\s*\[\s*paintFromVariable\(\s*"Colors\/foreground\/0"\s*,\s*"#0B0D12"/,
  "Figma Stepper labels use readable foreground text",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  '<option value="stepper">Stepper</option>',
  "Stepper UI picker option",
);
assertContains(
  files.figmaUi,
  source.figmaUi,
  'build: "build-stepper"',
  "Stepper UI build action",
);
for (const [filePath, content, nodeId, label] of [
  [
    files.reactRatingFigma,
    source.reactRatingFigma,
    "node-id=512-39747",
    "React Rating",
  ],
  [
    files.iosRatingFigma,
    source.iosRatingFigma,
    "node-id=512-39747",
    "iOS Rating",
  ],
  [
    files.androidRatingFigma,
    source.androidRatingFigma,
    "node-id=512-39747",
    "Android Rating",
  ],
  [
    files.reactStepperFigma,
    source.reactStepperFigma,
    "node-id=512-39614",
    "React Stepper",
  ],
  [
    files.iosStepperFigma,
    source.iosStepperFigma,
    "node-id=512-39614",
    "iOS Stepper",
  ],
  [
    files.androidStepperFigma,
    source.androidStepperFigma,
    "node-id=512-39614",
    "Android Stepper",
  ],
]) {
  assertContains(filePath, content, nodeId, `${label} Code Connect node id`);
  assertNotContains(
    filePath,
    content,
    "Placeholder",
    `placeholder ${label} Code Connect`,
  );
}
assertContains(
  files.reactRatingFigma,
  source.reactRatingFigma,
  'figma.enum("Value"',
  "React Rating Code Connect maps value axis",
);
assertContains(
  files.reactRatingFigma,
  source.reactRatingFigma,
  'figma.enum("State"',
  "React Rating Code Connect maps state axis",
);
assertContains(
  files.reactStepperFigma,
  source.reactStepperFigma,
  'figma.enum("Count"',
  "React Stepper Code Connect maps count axis",
);
assertContains(
  files.reactStepperFigma,
  source.reactStepperFigma,
  'figma.enum("Current"',
  "React Stepper Code Connect maps current axis",
);
assertContains(
  files.reactStepperFigma,
  source.reactStepperFigma,
  'figma.string("Step 1 Text")',
  "React Stepper Code Connect maps step text",
);
assertContains(
  files.iosRatingFigma,
  source.iosRatingFigma,
  '@FigmaEnum(\n        "Value"',
  "iOS Rating Code Connect maps value axis",
);
assertContains(
  files.androidRatingFigma,
  source.androidRatingFigma,
  '@FigmaProperty(FigmaType.Enum, "Value")',
  "Android Rating Code Connect maps value axis",
);
assertContains(
  files.iosStepperFigma,
  source.iosStepperFigma,
  '@FigmaEnum(\n        "Count"',
  "iOS Stepper Code Connect maps count axis",
);
assertContains(
  files.iosStepperFigma,
  source.iosStepperFigma,
  '@FigmaString("Step 1 Text")',
  "iOS Stepper Code Connect maps step text",
);
assertContains(
  files.androidStepperFigma,
  source.androidStepperFigma,
  '@FigmaProperty(FigmaType.Enum, "Count")',
  "Android Stepper Code Connect maps count axis",
);
assertContains(
  files.androidStepperFigma,
  source.androidStepperFigma,
  '@FigmaProperty(FigmaType.Text, "Step 1 Text")',
  "Android Stepper Code Connect maps step text",
);
for (const [configFile, configSource, includePath, label] of [
  [
    files.figmaLinked,
    source.figmaLinked,
    "src/components/Rating/Rating.figma.tsx",
    "Rating React template",
  ],
  [
    files.figmaLinked,
    source.figmaLinked,
    "src/components/Rating/Rating.tsx",
    "Rating React source",
  ],
  [
    files.figmaLinked,
    source.figmaLinked,
    "src/components/Stepper/Stepper.figma.tsx",
    "Stepper React template",
  ],
  [
    files.figmaLinked,
    source.figmaLinked,
    "src/components/Stepper/Stepper.tsx",
    "Stepper React source",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/Rating/Rating.figma.swift",
    "Rating iOS template",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/Rating/Rating.swift",
    "Rating iOS source",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/Stepper/Stepper.figma.swift",
    "Stepper iOS template",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/Stepper/Stepper.swift",
    "Stepper iOS source",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/ColorPicker/ColorPicker.figma.swift",
    "ColorPicker iOS template",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/ColorPicker/ColorPicker.swift",
    "ColorPicker iOS source",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/DateRangePicker/DateRangePicker.figma.swift",
    "DateRangePicker iOS template",
  ],
  [
    files.iosFigmaLinked,
    source.iosFigmaLinked,
    "Sources/Components/DateRangePicker/DateRangePicker.swift",
    "DateRangePicker iOS source",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/Rating/Rating.figma.kt",
    "Rating Android template",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/Rating/Rating.kt",
    "Rating Android source",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/Stepper/Stepper.figma.kt",
    "Stepper Android template",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/Stepper/Stepper.kt",
    "Stepper Android source",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/ColorPicker/ColorPicker.figma.kt",
    "ColorPicker Android template",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/ColorPicker/ColorPicker.kt",
    "ColorPicker Android source",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/DateRangePicker/DateRangePicker.figma.kt",
    "DateRangePicker Android template",
  ],
  [
    files.androidFigmaLinked,
    source.androidFigmaLinked,
    "src/main/java/com/kozmos/components/DateRangePicker/DateRangePicker.kt",
    "DateRangePicker Android source",
  ],
]) {
  assertContains(
    configFile,
    configSource,
    includePath,
    `Linked Code Connect includes ${label}`,
  );
}
assertContains(
  files.figma,
  source.figma,
  "stateStatusComponentKey(state, status, type)",
  "Figma state/status/type variant reconciliation",
);
assertContains(
  files.figma,
  source.figma,
  "buildProgressComponent",
  "Figma Progress build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildProgressComponent",
  "Figma Progress rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildSpinnerComponent",
  "Figma Spinner build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildSpinnerComponent",
  "Figma Spinner rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildAvatarComponent",
  "Figma Avatar build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildAvatarComponent",
  "Figma Avatar rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildAlertComponent",
  "Figma Alert build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildAlertComponent",
  "Figma Alert rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildCardComponent",
  "Figma Card build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildCardComponent",
  "Figma Card rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildTabsComponent",
  "Figma Tabs build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildTabsComponent",
  "Figma Tabs rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildTooltipComponent",
  "Figma Tooltip build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildTooltipComponent",
  "Figma Tooltip rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildDialogComponent",
  "Figma Dialog build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildDialogComponent",
  "Figma Dialog rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildPopoverComponent",
  "Figma Popover build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildPopoverComponent",
  "Figma Popover rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildMenuComponent",
  "Figma Menu build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildMenuComponent",
  "Figma Menu rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "buildToastComponent",
  "Figma Toast build action",
);
assertContains(
  files.figma,
  source.figma,
  "rebuildToastComponent",
  "Figma Toast rebuild recovery action",
);
assertContains(
  files.figma,
  source.figma,
  "documentComponentLibrary",
  "Figma component documentation action",
);
assertContains(
  files.figma,
  source.figma,
  'COMPONENT_DOCS_PAGE_NAME = "Docs"',
  "Figma component docs catalog page",
);
assertContains(
  files.figma,
  source.figma,
  "DOCS_COLUMNS = 3",
  "Figma component docs side-by-side grid",
);
assertContains(
  files.figma,
  source.figma,
  "removeGeneratedSplitDocPages",
  "Figma split docs page cleanup",
);
assertContains(
  files.figma,
  source.figma,
  "applyComponentSetDescription",
  "Figma right-panel description refresh",
);
assertContains(
  files.figma,
  source.figma,
  "applyDocsPreviewOverrides",
  "Figma docs preview property override",
);
assertContains(
  files.figma,
  source.figma,
  "hasOwnedFocusNode(componentSet)",
  "Figma focus audit uses owned focus nodes",
);
if (
  source.figma.includes(
    "componentSet.description && /focus/i.test(componentSet.description)",
  )
) {
  fail(
    `${files.figma}: focus audit must not infer focus support from description prose`,
  );
}
assertContains(
  files.figma,
  source.figma,
  "removeGeneratedNodesForRebuild",
  "Figma corrupted component removal before rebuild",
);
assertNotContains(
  files.figma,
  source.figma,
  "archiveGeneratedNodesForRebuild",
  "Figma component archive before rebuild",
);
assertContains(
  files.figma,
  source.figma,
  "isArchivePageName",
  "Figma active-library audit excludes archive health",
);

// Native API and target-size parity.
assertAllVariants(
  files.iosButton,
  source.iosButton,
  button.variants,
  (variant) => `case ${variant === "default" ? "`default`" : variant}`,
  "iOS Button",
);
assertContains(
  files.iosButton,
  source.iosButton,
  "minHeight: 44",
  "iOS Button 44px minimum height",
);
assertContains(
  files.iosButton,
  source.iosButton,
  "minWidth: size == .icon ? 44 : nil",
  "iOS Button icon 44px minimum width",
);
assertContains(
  files.iosButton,
  source.iosButton,
  "KozmosSpinner(size: .sm, color: foregroundColor)",
  "iOS Button draws the system's arc in its own foreground while loading",
);

assertContains(
  files.reactIconFigma,
  source.reactIconFigma,
  "node-id=15-2",
  "React Icon Code Connect node ID",
);
assertContains(
  files.iosIcon,
  source.iosIcon,
  "public struct KozmosIcon",
  "iOS Icon public view",
);
assertContains(
  files.iosIcon,
  source.iosIcon,
  "public enum KozmosIconSize",
  "iOS Icon size API",
);
assertContains(
  files.iosIcon,
  source.iosIcon,
  'case "home-line": return "house"',
  "iOS Icon resolves Kozmos home icon",
);
assertContains(
  files.iosIcon,
  source.iosIcon,
  "public typealias Icon = KozmosIcon",
  "iOS Icon preserves legacy Icon alias",
);
assertContains(
  files.iosIconFigma,
  source.iosIconFigma,
  "node-id=15-2",
  "iOS Icon Code Connect node ID",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Icon/Icon.figma.swift",
  "iOS linked Code Connect includes Icon",
);

assertAllVariants(
  files.iosIconButton,
  source.iosIconButton,
  iconButton.variants,
  (variant) => `case ${variant === "default" ? "`default`" : variant}`,
  "iOS IconButton",
);
assertContains(
  files.iosIconButton,
  source.iosIconButton,
  ".frame(width: size == .lg ? 48 : 44, height: size == .lg ? 48 : 44)",
  "iOS IconButton 44px frame, 48 for the large size",
);
assertContains(
  files.iosIconButton,
  source.iosIconButton,
  "KozmosSpinner(size: .sm, color: foregroundColor)",
  "iOS IconButton draws the system's arc in its own foreground while loading",
);

// CategoryTile: the count is the system's counter, brand tone, at the icon
// square's top-right, the contract's overhang beyond its top and right edges.
{
  const overhang = categoryTile.content.counterOverhang;
  const tone = categoryTile.content.counterTone;
  assertContains(
    files.reactCategoryTile,
    source.reactCategoryTile,
    // An absolute offset counts from inside the square's 1px border.
    new RegExp(
      `<Counter\\s+className="absolute -right-\\[${overhang + 1}px\\] -top-\\[${overhang + 1}px\\]"[\\s\\S]{0,240}?tone="${tone}"`,
    ),
    `React CategoryTile counter at the square's top-right, ${overhang} beyond its edges, ${tone} tone`,
  );
  assertContains(
    files.iosCategoryTile,
    source.iosCategoryTile,
    `KozmosCounter("\\(count)", tone: .${tone}, fill: tint?.fill)`,
    `iOS CategoryTile counter, ${tone} tone, the tint as its fill`,
  );
  assertContains(
    files.iosCategoryTile,
    source.iosCategoryTile,
    `.offset(x: ${overhang}, y: -${overhang})`,
    `iOS CategoryTile counter ${overhang} beyond the square's edges`,
  );
  assertContains(
    files.androidCategoryTile,
    source.androidCategoryTile,
    `tone = CounterTone.${tone[0].toUpperCase()}${tone.slice(1)}`,
    `Android CategoryTile counter, ${tone} tone`,
  );
  assertContains(
    files.androidCategoryTile,
    source.androidCategoryTile,
    `.offset(x = ${overhang}.dp, y = (-${overhang}).dp)`,
    `Android CategoryTile counter ${overhang} beyond the square's edges`,
  );
  for (const [file, content] of [
    [files.reactCategoryTile, source.reactCategoryTile],
    [files.iosCategoryTile, source.iosCategoryTile],
    [files.androidCategoryTile, source.androidCategoryTile],
  ]) {
    if (
      /resultCountLabel\s*[?!]?\.let\s*\{\s*resultCountLabel|text-muted-foreground|KozmosTypography\.caption\b/.test(
        content,
      )
    ) {
      fail(
        `${file}: draws resultCountLabel as a caption; it is the spoken form only`,
      );
    }
  }
  // The tint: the icon and the counter's fill take it on each platform.
  if (categoryTile.content.tint) {
    assertContains(
      files.iosCategoryTile,
      source.iosCategoryTile,
      ".foregroundColor(tint?.accent ?? KozmosColors.primitivesColorsTheme500)",
      "iOS CategoryTile icon in the tint",
    );
    assertContains(
      files.reactCategoryTile,
      source.reactCategoryTile,
      "backgroundColor: tint.fill, color: tint.onFill",
      "React CategoryTile counter in the tint",
    );
    assertContains(
      files.reactCategoryTile,
      source.reactCategoryTile,
      '"--kozmos-category-tint": tint.accent',
      "React CategoryTile tint variable",
    );
    assertContains(
      files.androidCategoryTile,
      source.androidCategoryTile,
      "LocalContentColor provides (tint?.accent ?: KozmosThemeTokens.primitivesColorsTheme500)",
      "Android CategoryTile icon in the tint",
    );
    assertContains(
      files.androidCategoryTile,
      source.androidCategoryTile,
      "fill = tint?.fill",
      "Android CategoryTile counter in the tint",
    );
  }
}

// Counter: an inked fill — the fill and its ink together — on each platform.
if (counter.fill) {
  assertContains(
    files.iosCounter,
    source.iosCounter,
    "fill?.fill ?? emotion?.surface ?? backgroundColor",
    "iOS Counter fill",
  );
  assertContains(
    files.iosCounter,
    source.iosCounter,
    "fill?.ink ?? emotion?.onSurface ?? foregroundColor",
    "iOS Counter ink",
  );
  assertContains(
    files.androidCounter,
    source.androidCounter,
    "fill?.fill ?: emotion?.surface ?: containerColor",
    "Android Counter fill",
  );
  assertContains(
    files.androidCounter,
    source.androidCounter,
    "fill?.ink ?: emotion?.onSurface ?: contentColor",
    "Android Counter ink",
  );
}

// LocationPin: a tint for the marker, over the variant's colour; featured still wins.
if (locationPin.content.tint) {
  assertContains(
    files.iosLocationPin,
    source.iosLocationPin,
    /if featured \{ return KozmosColors\.primitivesColorsEmotionalAlert500 \}\s+if let tint \{ return tint\.fill\.fill \}/,
    "iOS LocationPin tint after featured",
  );
  assertContains(
    files.reactLocationPin,
    source.reactLocationPin,
    "tint && !featured",
    "React LocationPin tint unless featured",
  );
  assertContains(
    files.androidLocationPin,
    source.androidLocationPin,
    /featured -> KozmosThemeTokens\.primitivesColorsEmotionalAlert500\s+tint != null -> tint\.fill\.fill/,
    "Android LocationPin tint after featured",
  );
}

// LocationPin off the floor: a hollow ring on the background, the number in
// foreground/0, not dimmed (ruled 2026-09-21).
if (locationPin.content.offFloorNumberColor === "foreground/0") {
  assertContains(
    files.iosLocationPin,
    source.iosLocationPin,
    "offFloor ? KozmosColors.primitivesColorsForeground0 : (tint?.fill.ink",
    "iOS LocationPin off-floor number in foreground/0",
  );
  assertContains(
    files.androidLocationPin,
    source.androidLocationPin,
    "if (offFloor) KozmosThemeTokens.primitivesColorsForeground0 else (tint?.fill?.ink",
    "Android LocationPin off-floor number in foreground/0",
  );
  assertContains(
    files.reactLocationPin,
    source.reactLocationPin,
    'offFloor ? "fill-background" : "fill-current"',
    "React LocationPin solid on the floor, hollow off it",
  );
  assertContains(
    files.reactLocationPin,
    source.reactLocationPin,
    'offFloor ? "text-foreground" : inkClasses[variant]',
    "React LocationPin off-floor number in the foreground",
  );
  assertNotContains(
    files.reactLocationPin,
    source.reactLocationPin,
    'offFloor && "opacity-50"',
    "React LocationPin dimming off the floor",
  );
  assertContains(
    files.figma,
    source.figma,
    /const LOCATION_PIN_OFF_FLOOR_INK = \{\s*name: "Colors\/foreground\/0",/,
    "Figma LocationPin off-floor ink is foreground/0",
  );
  assertContains(
    files.figma,
    source.figma,
    "colorToken: offFloor ? LOCATION_PIN_OFF_FLOOR_INK.name : ink.name,",
    "Figma LocationPin off-floor number takes that ink",
  );
}

// POIDetailPanel: in a sheet, no surface of its own.
if (
  poiDetailPanel.content.sheetSurface ===
  "none; in a sheet the panel paints no surface, border or shadow of its own and sits on the sheet's"
) {
  assertContains(
    files.iosPOIDetailPanel,
    source.iosPOIDetailPanel,
    ".background(presentation == .sheet ? Color.clear : KozmosColors.primitivesColorsBackground0)",
    "iOS POIDetailPanel sheet surface none",
  );
  assertContains(
    files.reactPOIDetailCss,
    source.reactPOIDetailCss,
    /\.kozmos-poi-detail\[data-presentation="sheet"\] \{\s+@apply rounded-t-control;\s+background: transparent;\s+border: 0;/,
    "React POIDetailPanel sheet surface none",
  );
  assertContains(
    files.androidPOIDetailPanel,
    source.androidPOIDetailPanel,
    "color = if (presentation == KozmosPOIDetailPanelPresentation.Sheet) Color.Transparent else KozmosThemeTokens.primitivesColorsBackground0",
    "Android POIDetailPanel sheet surface none",
  );
  assertContains(
    files.androidPOIDetailPanel,
    source.androidPOIDetailPanel,
    "KozmosPOIDetailPanelPresentation.Sheet -> 0.dp",
    "Android POIDetailPanel sheet shadow none",
  );
}

assertAllVariants(
  files.iosCounter,
  source.iosCounter,
  counter.tones,
  (tone) => `case ${tone}`,
  "iOS Counter",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "public struct KozmosCounter",
  "iOS Counter public view",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "public enum KozmosCounterSize",
  "iOS Counter size API",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "size == .sm ? 18 : 20",
  "iOS Counter 18px/20px dimensions",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "size == .sm ? 5 : KozmosDimensions.primitivesLayoutSpacing75",
  "iOS Counter 5px/6px horizontal padding",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "size == .sm ? 11 : 12",
  "iOS Counter 11px/12px font sizes",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  ".monospacedDigit()",
  "iOS Counter tabular numeric rendering",
);
assertContains(
  files.iosCounter,
  source.iosCounter,
  "normalizedText",
  "iOS Counter normalizes legacy wrapped values",
);
assertContains(
  files.iosCounterFigma,
  source.iosCounterFigma,
  "node-id=149-13430",
  "iOS Counter Code Connect node ID",
);
assertContains(
  files.iosCounterFigma,
  source.iosCounterFigma,
  '@FigmaString("Counter Text")',
  "iOS Counter Code Connect text mapping",
);
assertContains(
  files.iosCounterFigma,
  source.iosCounterFigma,
  '@FigmaEnum(\n        "Tone"',
  "iOS Counter Code Connect tone mapping",
);
assertContains(
  files.iosCounterFigma,
  source.iosCounterFigma,
  '@FigmaEnum(\n        "Size"',
  "iOS Counter Code Connect size mapping",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Counter/Counter.figma.swift",
  "iOS linked Code Connect includes Counter",
);

assertAllVariants(
  files.iosBadge,
  source.iosBadge,
  badge.variants,
  (variant) => `case ${variant === "default" ? "`default`" : variant}`,
  "iOS Badge",
);
for (const sizeName of ["`default`", "sm", "lg", "icon"]) {
  assertContains(
    files.iosBadge,
    source.iosBadge,
    `case ${sizeName}`,
    `iOS Badge size "${sizeName}"`,
  );
}
assertContains(
  files.iosBadge,
  source.iosBadge,
  "minHeight: 44",
  "iOS Badge 44px minimum height",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "minWidth: size == .icon ? 44 : nil",
  "iOS Badge icon 44px minimum width",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "counter: String? = nil",
  "iOS Badge counter API",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "showCounter: Bool = false",
  "iOS Badge counter visibility API",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "KozmosCounter(counter, tone: counterTone)",
  "iOS Badge composes Counter",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50)",
  "iOS Badge uses 4px content gap",
);
assertContains(
  files.iosBadge,
  source.iosBadge,
  "size != .icon && showCounter && counter != nil",
  "iOS Badge hides Counter for icon-only variants",
);
assertContains(
  files.iosBadgeFigma,
  source.iosBadgeFigma,
  "node-id=78-246",
  "iOS Badge Code Connect node ID",
);
assertContains(
  files.iosBadgeFigma,
  source.iosBadgeFigma,
  '@FigmaString("Label Text")',
  "iOS Badge Code Connect label mapping",
);
assertContains(
  files.iosBadgeFigma,
  source.iosBadgeFigma,
  '@FigmaBoolean("Show Counter")',
  "iOS Badge Code Connect counter visibility mapping",
);
assertContains(
  files.iosFigmaLinked,
  source.iosFigmaLinked,
  "Sources/Components/Badge/Badge.figma.swift",
  "iOS linked Code Connect includes Badge",
);

assertContains(
  files.iosCheckbox,
  source.iosCheckbox,
  "disabled: Bool = false",
  "iOS Checkbox disabled API",
);
assertContains(
  files.iosCheckbox,
  source.iosCheckbox,
  "error: Bool = false",
  "iOS Checkbox error API",
);
assertContains(
  files.iosCheckbox,
  source.iosCheckbox,
  ".frame(minHeight: 44",
  "iOS Checkbox 44px row target",
);
assertContains(
  files.iosCheckbox,
  source.iosCheckbox,
  "frame(width: 20, height: 20)",
  "iOS Checkbox 20px visual control",
);
assertContains(
  files.iosRadio,
  source.iosRadio,
  "disabled: Bool = false",
  "iOS Radio disabled API",
);
assertContains(
  files.iosRadio,
  source.iosRadio,
  "error: Bool = false",
  "iOS Radio error API",
);
assertContains(
  files.iosRadio,
  source.iosRadio,
  ".frame(minHeight: 44",
  "iOS Radio 44px row target",
);
assertContains(
  files.iosRadio,
  source.iosRadio,
  ".frame(width: 20, height: 20)",
  "iOS Radio 20px visual control",
);
assertContains(
  files.iosRadio,
  source.iosRadio,
  ".frame(width: 10, height: 10)",
  "iOS Radio checked dot",
);
assertContains(
  files.iosSwitch,
  source.iosSwitch,
  "disabled: Bool = false",
  "iOS Switch disabled API",
);
assertContains(
  files.iosSwitch,
  source.iosSwitch,
  "error: Bool = false",
  "iOS Switch error API",
);
assertContains(
  files.iosSwitch,
  source.iosSwitch,
  ".frame(minHeight: 44",
  "iOS Switch 44px row target",
);
assertContains(
  files.iosSwitch,
  source.iosSwitch,
  ".frame(width: 44, height: 24)",
  "iOS Switch 44x24 visual track",
);
assertContains(
  files.iosSwitch,
  source.iosSwitch,
  ".frame(width: 20, height: 20)",
  "iOS Switch 20px visual thumb",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "disabled: Bool = false",
  "iOS Input disabled API",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "readOnly: Bool = false",
  "iOS Input readOnly API",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "status: KozmosInputStatus = .default",
  "iOS Input validation status API",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "helperText: String? = nil",
  "iOS Input helper text API",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "error: Bool = false",
  "iOS Input error API",
);
assertContains(
  files.iosInput,
  source.iosInput,
  ".frame(height: 44",
  "iOS Input 44px field height",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "semanticsRadiusControl",
  "iOS Input field radius uses the Control role",
);
assertContains(
  files.iosInput,
  source.iosInput,
  "KozmosDimensions.primitivesLayoutSpacing150",
  "iOS Input 12px horizontal padding",
);

assertAllVariants(
  files.androidButton,
  source.androidButton,
  button.variants,
  (variant) => {
    const name =
      variant === "default"
        ? "Default"
        : variant[0].toUpperCase() + variant.slice(1);
    return name;
  },
  "Android Button",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "KozmosButtonSize.Sm -> 44.dp",
  "Android Button small 44dp height",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "KozmosButtonSize.Default -> 44.dp",
  "Android Button default 44dp height",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "KozmosButtonSize.Icon -> 44.dp",
  "Android Button icon 44dp height",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "Modifier.width(44.dp)",
  "Android Button icon 44dp width",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "size = KozmosSpinnerSize.Sm",
  "Android Button draws the system's arc while loading",
);
assertContains(
  files.androidButton,
  source.androidButton,
  "KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle",
  "Android Button themed runtime token",
);

assertContains(
  files.androidIcon,
  source.androidIcon,
  "fun KozmosIcon",
  "Android Icon composable",
);
assertContains(
  files.androidIcon,
  source.androidIcon,
  "enum class KozmosIconSize",
  "Android Icon size API",
);
assertContains(
  files.androidIcon,
  source.androidIcon,
  '"home-line" -> Icons.Default.Home',
  "Android Icon resolves Kozmos home icon",
);
assertContains(
  files.androidIcon,
  source.androidIcon,
  "LocalContentColor.current",
  "Android Icon supports inherited content color",
);
assertContains(
  files.androidIconFigma,
  source.androidIconFigma,
  "node-id=15-2",
  "Android Icon Code Connect node ID",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Icon/Icon.figma.kt",
  "Android linked Code Connect includes Icon",
);

assertAllVariants(
  files.androidIconButton,
  source.androidIconButton,
  iconButton.variants,
  (variant) => {
    const name =
      variant === "default"
        ? "Default"
        : variant[0].toUpperCase() + variant.slice(1);
    return name;
  },
  "Android IconButton",
);
assertContains(
  files.androidIconButton,
  source.androidIconButton,
  "modifier.size(if (size == KozmosIconButtonSize.Lg) 48.dp else 44.dp)",
  "Android IconButton 44dp frame, 48 for the large size",
);
assertContains(
  files.androidIconButton,
  source.androidIconButton,
  "size = KozmosSpinnerSize.Sm",
  "Android IconButton draws the system's arc while loading",
);
assertContains(
  files.androidIconButton,
  source.androidIconButton,
  "KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle",
  "Android IconButton themed runtime token",
);

assertAllVariants(
  files.androidCounter,
  source.androidCounter,
  counter.tones,
  (tone) => {
    const name =
      tone === "brand" ? "Brand" : tone[0].toUpperCase() + tone.slice(1);
    return name;
  },
  "Android Counter",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "enum class CounterSize",
  "Android Counter size API",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "fun KozmosCounter",
  "Android Counter composable",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "if (size == CounterSize.Sm) 18.dp else 20.dp",
  "Android Counter 18dp/20dp dimensions",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "if (size == CounterSize.Sm) 5.dp else KozmosDimensions.primitivesLayoutSpacing75",
  "Android Counter 5dp/6dp horizontal padding",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "if (size == CounterSize.Sm) 11.sp else 12.sp",
  "Android Counter 11sp/12sp font sizes",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  ".widthIn(min = minWidth)",
  "Android Counter minimum width",
);
assertContains(
  files.androidCounter,
  source.androidCounter,
  "normalizeCounterText",
  "Android Counter normalizes legacy wrapped values",
);
assertContains(
  files.androidCounterFigma,
  source.androidCounterFigma,
  "node-id=149-13430",
  "Android Counter Code Connect node ID",
);
assertContains(
  files.androidCounterFigma,
  source.androidCounterFigma,
  '@FigmaProperty(FigmaType.Text, "Counter Text")',
  "Android Counter Code Connect text mapping",
);
assertContains(
  files.androidCounterFigma,
  source.androidCounterFigma,
  '@FigmaProperty(FigmaType.Enum, "Tone")',
  "Android Counter Code Connect tone mapping",
);
assertContains(
  files.androidCounterFigma,
  source.androidCounterFigma,
  '@FigmaProperty(FigmaType.Enum, "Size")',
  "Android Counter Code Connect size mapping",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Counter/Counter.figma.kt",
  "Android linked Code Connect includes Counter",
);

assertAllVariants(
  files.androidBadge,
  source.androidBadge,
  badge.variants,
  (variant) => {
    const name =
      variant === "default"
        ? "Default"
        : variant[0].toUpperCase() + variant.slice(1);
    return name;
  },
  "Android Badge",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  ".height(44.dp)",
  "Android Badge 44dp height",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "Modifier.width(44.dp)",
  "Android Badge icon 44dp width",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle",
  "Android Badge themed runtime token",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "counter: String? = null",
  "Android Badge counter API",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "showCounter: Boolean = false",
  "Android Badge counter visibility API",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "KozmosCounter(",
  "Android Badge composes Counter",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)",
  "Android Badge uses 4px content gap",
);
assertContains(
  files.androidBadge,
  source.androidBadge,
  "size != BadgeSize.Icon && showCounter && counter != null",
  "Android Badge hides Counter for icon-only variants",
);
assertContains(
  files.androidBadgeFigma,
  source.androidBadgeFigma,
  "node-id=78-246",
  "Android Badge Code Connect node ID",
);
assertContains(
  files.androidBadgeFigma,
  source.androidBadgeFigma,
  '@FigmaProperty(FigmaType.Text, "Label Text")',
  "Android Badge Code Connect label mapping",
);
assertContains(
  files.androidBadgeFigma,
  source.androidBadgeFigma,
  '@FigmaProperty(FigmaType.Boolean, "Show Counter")',
  "Android Badge Code Connect counter visibility mapping",
);
assertContains(
  files.androidFigmaLinked,
  source.androidFigmaLinked,
  "src/main/java/com/kozmos/components/Badge/Badge.figma.kt",
  "Android linked Code Connect includes Badge",
);
assertContains(
  files.androidCheckbox,
  source.androidCheckbox,
  ".heightIn(min = 44.dp)",
  "Android Checkbox 44dp row target",
);
assertContains(
  files.androidCheckbox,
  source.androidCheckbox,
  "error: Boolean = false",
  "Android Checkbox error API",
);
assertContains(
  files.androidCheckbox,
  source.androidCheckbox,
  "KozmosThemeTokens.primitivesColorsTheme500",
  "Android Checkbox themed runtime checked token",
);
assertContains(
  files.androidCheckbox,
  source.androidCheckbox,
  "KozmosThemeTokens.primitivesColorsEmotionalDanger600",
  "Android Checkbox error token",
);
assertContains(
  files.androidRadio,
  source.androidRadio,
  ".heightIn(min = 44.dp)",
  "Android Radio 44dp row target",
);
assertContains(
  files.androidRadio,
  source.androidRadio,
  "enabled: Boolean = true",
  "Android Radio enabled API",
);
assertContains(
  files.androidRadio,
  source.androidRadio,
  "error: Boolean = false",
  "Android Radio error API",
);
assertContains(
  files.androidRadio,
  source.androidRadio,
  "KozmosThemeTokens.primitivesColorsTheme500",
  "Android Radio themed runtime checked token",
);
assertContains(
  files.androidRadio,
  source.androidRadio,
  "KozmosThemeTokens.primitivesColorsEmotionalDanger600",
  "Android Radio error token",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  ".heightIn(min = 44.dp)",
  "Android Switch 44dp row target",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  ".width(44.dp)",
  "Android Switch 44dp visual track width",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  ".height(24.dp)",
  "Android Switch 24dp visual track height",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  ".size(20.dp)",
  "Android Switch 20dp visual thumb",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  "enabled: Boolean = true",
  "Android Switch enabled API",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  "error: Boolean = false",
  "Android Switch error API",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  "KozmosThemeTokens.primitivesColorsTheme500",
  "Android Switch themed runtime checked token",
);
assertContains(
  files.androidSwitch,
  source.androidSwitch,
  "KozmosThemeTokens.primitivesColorsEmotionalDanger600",
  "Android Switch error token",
);
assertContains(
  files.androidInput,
  source.androidInput,
  ".height(44.dp)",
  "Android Input 44dp field height",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "enabled: Boolean = true",
  "Android Input enabled API",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "readOnly: Boolean = false",
  "Android Input readOnly API",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "status: KozmosInputStatus = KozmosInputStatus.Default",
  "Android Input validation status API",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "helperText: String? = null",
  "Android Input helper text API",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "error: Boolean = false",
  "Android Input error API",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "KozmosThemeTokens.primitivesColorsForeground500",
  "Android Input neutral border token",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "KozmosThemeTokens.primitivesColorsEmotionalDanger600",
  "Android Input error token",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "KozmosThemeTokens.primitivesColorsEmotionalAlert600",
  "Android Input warning token",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "KozmosThemeTokens.primitivesColorsEmotionalSuccess600",
  "Android Input success token",
);
assertContains(
  files.androidInput,
  source.androidInput,
  "semanticsRadiusControl",
  "Android Input field radius uses the Control role",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "LocalKozmosUseDarkTokens",
  "Android runtime dark token selector",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundIdle",
  "Android dark component token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsTheme500",
  "Android dark primitive checked token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsEmotionalDanger600",
  "Android dark primitive error token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsEmotionalAlert600",
  "Android dark primitive warning token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsEmotionalSuccess600",
  "Android dark primitive success token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsBackground100",
  "Android dark Input disabled background token source",
);
assertContains(
  files.androidThemeTokens,
  source.androidThemeTokens,
  "KozmosColorsDark.primitivesColorsForeground400",
  "Android dark Input placeholder token source",
);
assertContains(
  files.androidThemeProvider,
  source.androidThemeProvider,
  "LocalKozmosUseDarkTokens provides useDarkTheme",
  "Android ThemeProvider dark token binding",
);

const runtimePlaceholderComponentNames = [
  "DynamicIsland",
  "FeedbackCard",
  "MapControlsGroup",
  "RouteSummary",
  "RoutingInputGroup",
  "SaveLocationCard",
];
const runtimeSourceFiles = [
  ...listFilesRecursive(
    "packages/react/src/components",
    (filePath) =>
      filePath.endsWith(".tsx") &&
      !filePath.includes(".figma.") &&
      !filePath.includes(".stories.") &&
      !filePath.includes(".test."),
  ),
  ...listFilesRecursive(
    "packages/ios/Sources/Components",
    (filePath) => filePath.endsWith(".swift") && !filePath.includes(".figma."),
  ),
  ...listFilesRecursive(
    "packages/android/src/main/java/com/kozmos/components",
    (filePath) => filePath.endsWith(".kt") && !filePath.includes(".figma."),
  ),
];

for (const filePath of runtimeSourceFiles) {
  const content = read(filePath);
  for (const componentName of runtimePlaceholderComponentNames) {
    assertNotContains(
      filePath,
      content,
      `Text("${componentName}")`,
      `${componentName} component-name-only SwiftUI placeholder`,
    );
    assertNotContains(
      filePath,
      content,
      `text = "${componentName}"`,
      `${componentName} component-name-only Compose placeholder`,
    );
  }
  assertNotContains(
    filePath,
    content,
    "Map View Placeholder",
    "visible MapView placeholder text",
  );
  assertNotContains(
    filePath,
    content,
    "Map View Container",
    "visible MapView container placeholder text",
  );
}

assertNotContains(
  "packages/react/src/components/MapView/MapView.mdx",
  read("packages/react/src/components/MapView/MapView.mdx"),
  "Map View Placeholder",
  "documented MapView placeholder text",
);

assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  [
    "Components",
    "Primary Buttons",
    "themed",
    "button",
    "background",
    "idle",
    "$value",
  ],
  "#7EA2F6",
  "dark themed primary button background",
);
assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  [
    "Components",
    "Primary Buttons",
    "danger",
    "button",
    "background",
    "idle",
    "$value",
  ],
  "#EE7E95",
  "dark destructive primary button background",
);
assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  [
    "Components",
    "Secondary Buttons",
    "themed",
    "button",
    "foreground",
    "content",
    "idle",
    "$value",
  ],
  "#7EA2F6",
  "dark secondary button themed foreground",
);
assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  ["Semantics", "Data", "Blue", "$value"],
  "#60A5FA",
  "dark semantic data blue",
);
assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  ["Semantics", "Data", "Red", "$value"],
  "#F87171",
  "dark semantic data red",
);
assertJsonPathEquals(
  files.tokensDark,
  tokensDark,
  ["Semantics", "Data", "Yellow", "$value"],
  "#FBBF24",
  "dark semantic data yellow",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Components/Primary Buttons/themed/button/background/idle",
  "#7EA2F6",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Components/Primary Buttons/danger/button/background/idle",
  "#EE7E95",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Components/Secondary Buttons/themed/button/foreground/content/idle",
  "#7EA2F6",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Semantics/Data/Blue",
  "#60A5FA",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Semantics/Data/Red",
  "#F87171",
);
assertFigmaPayloadDarkValue(
  files.figmaFoundationsPayload,
  figmaFoundationsPayload,
  "Semantics/Data/Yellow",
  "#FBBF24",
);
assertContains(
  files.iosColors,
  source.iosColors,
  'UIColor(hex: "#7EA2F6") : UIColor(hex: "#0D44C2")',
  "iOS dark themed primary button background stays blue",
);
assertContains(
  files.iosColors,
  source.iosColors,
  'UIColor(hex: "#EE7E95") : UIColor(hex: "#B01736")',
  "iOS dark destructive primary button background stays red",
);
assertContains(
  files.androidColorsDark,
  source.androidColorsDark,
  "val componentsPrimaryButtonsThemedButtonBackgroundIdle = Color(0xff7ea2f6)",
  "Android dark themed primary button background stays blue",
);
assertContains(
  files.androidColorsDark,
  source.androidColorsDark,
  "val componentsPrimaryButtonsDangerButtonBackgroundIdle = Color(0xffee7e95)",
  "Android dark destructive primary button background stays red",
);

// A popover row is inset far enough to be concentric with it: a marker-radius
// row inside a control-radius popover needs 12, because R_outer = R_inner +
// padding. The plugin derives that as POPOVER_ROW_INSET; the web has to spell
// it as a padding class, and for a day it said 4 while Figma said 12. These
// assertions are the only thing that ties the two spellings together.
for (const [key, needle, label] of [
  ["reactCombobox", "bg-popover p-3", "Combobox"],
  ["reactMultiSelect", "bg-popover p-3", "MultiSelect"],
  ["reactMenu", "bg-popover p-3", "Menu"],
  ["reactSelect", '"p-3",', "Select viewport"],
]) {
  assertContains(
    files[key],
    source[key],
    needle,
    `${label} pads its popover to the concentric inset (12)`,
  );
}
const ownedSelectionPath = "packages/react/src/styles/owned-selection.css";
assertContains(
  files.reactListbox,
  source.reactListbox,
  "kozmos-listbox",
  "Listbox selects its owned recipe",
);
assertContains(
  ownedSelectionPath,
  read(ownedSelectionPath).match(/\.kozmos-listbox\s*\{([^}]*)\}/)?.[1] ?? "",
  "bg-popover p-3",
  "Listbox preserves its concentric inset (12)",
);
for (const token of [
  "Menu/padding",
  "Combobox/listbox/padding",
  "MultiSelect/listbox/padding",
  "Listbox/padding",
  "TimePicker/listbox/padding",
]) {
  assertContains(
    files.figma,
    source.figma,
    new RegExp(
      `name: "${escapeRegExp(token)}",\\s*value: POPOVER_ROW_INSET\\b`,
    ),
    `${token} derives from POPOVER_ROW_INSET rather than a literal`,
  );
}

// A file row is a small card. Both surfaces draw it at the container radius,
// and the list sits 12 under the dropzone on both.
assertContains(
  files.reactFileUpload,
  source.reactFileUpload,
  "rounded-container",
  "FileUpload row uses the container radius on the web",
);
assertContains(
  files.reactFileUpload,
  source.reactFileUpload,
  "mt-3 grid min-w-0 grid-cols-1 gap-2",
  "FileUpload list sits 12 under the dropzone on the web",
);
assertContains(
  files.figma,
  source.figma,
  tokenAliasPattern("FileUpload/file-row/radius", "Radius/Container"),
  "Figma FileUpload row radius aliases the Container role",
);

// spacingPx() throws for a step that is not on the scale, and it is called at
// module scope, so one bad constant stops the plugin loading at all rather than
// drawing a wrong number. That is the right failure, but nothing would catch it
// before Figma does — the plugin is never executed in Node. This makes the
// throw unreachable in practice.
{
  const steps = /const SPACING_STEPS = new Set\(\[([^\]]*)\]/.exec(
    source.figma,
  );
  if (!steps) {
    fail("figma/foundations-importer/code.js: SPACING_STEPS was not found");
  } else {
    const known = new Set(
      steps[1]
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
    );
    const bad = [];
    for (const m of source.figma.matchAll(/spacingPx\((\d+)\)/g)) {
      if (!known.has(m[1])) bad.push(m[1]);
    }
    if (bad.length > 0) {
      fail(
        `figma/foundations-importer/code.js: spacingPx() called with ${[...new Set(bad)].sort().join(", ")}, which SPACING_STEPS does not contain — the plugin would throw at load`,
      );
    }
  }
}

// A map control is a Button wearing map chrome, not a rectangle drawn to look
// like one. It used to type "+" into a text node while the library held 2,279
// real icon instances; redrawing a primitive is what lets Figma and React drift.
assertContains(
  files.figma,
  source.figma,
  /componentSetName: "Button",\s*variantProperties: buttonVariant,\s*name: "Control Button"/,
  "Figma MapControlButton nests a real Button instance",
);
assertContains(
  files.figma,
  source.figma,
  'const MAP_CONTROL_BUTTON_DEFAULT_ICON = "plus"',
  "MapControlButton's icon is a named Pointr Icon Library symbol",
);
assertNotContains(
  files.figma,
  source.figma,
  /name: "Control Glyph"/,
  "MapControlButton no longer draws its icon as a text glyph",
);
assertContains(
  files.reactMapControlButtonFigma,
  source.reactMapControlButtonFigma,
  'figma.nestedProps("Control Button"',
  "Code Connect reads the label and icon from the nested Button",
);

// A map control is a mode, so the Figma set and the React component have to
// agree on what "on" means. React has carried `pressed` with aria-pressed and
// inherited `disabled` since it was written; Figma had one axis until
// 2026-09-05 and could express neither, which is why products drew their own.
assertContains(
  files.figma,
  source.figma,
  /const MAP_CONTROL_BUTTON_STATES = \[\s*"Default",\s*"Pressed",\s*"Disabled",?\s*\]/,
  "Figma MapControlButton has a State axis of Default, Pressed and Disabled",
);
assertContains(
  files.figma,
  source.figma,
  /canonicalName === "MapControlButton"\)[\s\S]{0,200}State: MAP_CONTROL_BUTTON_STATES/,
  "MapControlButton's expected axes include State, so drift is checked",
);
assertContains(
  files.reactMapControlButton,
  source.reactMapControlButton,
  "pressed?: boolean",
  "React MapControlButton exposes pressed",
);
assertContains(
  files.reactMapControlButton,
  source.reactMapControlButton,
  "aria-pressed={pressed}",
  "React MapControlButton announces pressed to assistive technology",
);
assertContains(
  files.reactMapControlButtonFigma,
  source.reactMapControlButtonFigma,
  'figma.enum("State", { Pressed: true })',
  "Code Connect maps the Pressed state to the pressed prop",
);
assertContains(
  files.reactMapControlButtonFigma,
  source.reactMapControlButtonFigma,
  'figma.enum("State", { Disabled: true })',
  "Code Connect maps the Disabled state to the disabled prop",
);

// Every Core set the plugin can update must appear in CORE_UPDATE_SEQUENCE.
// A bulk action that quietly skips a component is worse than no bulk action:
// the sets it misses look updated because the run reported success.
{
  const plugin = source.figma;
  const sequenceBody = plugin.slice(
    plugin.indexOf("const CORE_UPDATE_SEQUENCE = ["),
    plugin.indexOf("];", plugin.indexOf("const CORE_UPDATE_SEQUENCE = [")),
  );
  const productBody = plugin.slice(
    plugin.indexOf("const PRODUCT_SDK_UPDATE_SEQUENCE = ["),
    plugin.indexOf(
      "];",
      plugin.indexOf("const PRODUCT_SDK_UPDATE_SEQUENCE = ["),
    ),
  );
  const handlers = new Set();
  for (const m of plugin.matchAll(/message\.type === "(update-[a-z-]+)"/g)) {
    const after = plugin.slice(
      plugin.indexOf(m[0]),
      plugin.indexOf(m[0]) + 240,
    );
    const fn = /await ([A-Za-z0-9_]+)\(/.exec(after);
    if (fn) handlers.add(fn[1]);
  }
  for (const m of plugin.matchAll(
    /^ {4}"update-[a-z-]+": ([A-Za-z0-9_]+),$/gm,
  )) {
    handlers.add(m[1]);
  }
  const exempt = new Set([
    // The icon sync is not a component set: it mirrors an icon library.
    "syncIconSourceLibrary",
    "updateAllProductSdkComponents",
    "updateAllCoreComponents",
  ]);
  const missing = [];
  for (const fn of handlers) {
    if (exempt.has(fn)) continue;
    if (productBody.includes(fn) || sequenceBody.includes(fn)) continue;
    missing.push(fn);
  }
  if (missing.length > 0) {
    fail(
      `figma/foundations-importer/code.js: ${missing.length} update handler(s) in neither bulk sequence — ${missing.sort().join(", ")}`,
    );
  }
}

// A bulk run has to be able to pick up where it stopped. Update All Core died
// three times on 2026-09-08, and each retry began at set one, redid the
// sixty-odd it had already done, and arrived at the 432-variant Tree block
// carrying the whole run. These four properties are what make a retry cheap;
// each was absent at some point that day.
{
  const plugin = source.figma;
  const runner = /async function runUpdateSequence\([\s\S]*?\n}/.exec(plugin);
  if (!runner) {
    fail("figma/foundations-importer/code.js: runUpdateSequence not found");
  } else {
    const body = runner[0];
    const checks = [
      [
        /getSharedPluginData\(\s*RUN_NAMESPACE,\s*SEQUENCE_COMPLETION_KEY\s*\)/.test(
          body,
        ),
        "reads the completion stamp, so a retry can skip finished sets",
      ],
      [
        /if \(result\.updated\) markComponentSetCompleted\(page, name\);/.test(
          body,
        ),
        "stamps completion only when the updater reports a real update",
      ],
      [
        /await yieldToFigma\(\);/.test(body),
        "yields between sets, so Figma can save mid-run",
      ],
      [
        /const resuming = stampable > 0 && finishedCount < stampable;/.test(
          body,
        ),
        "runs everything when nothing is left to resume, so the button is never a no-op",
      ],
    ];
    for (const [held, what] of checks) {
      if (!held)
        fail(
          `figma/foundations-importer/code.js: runUpdateSequence no longer ${what}`,
        );
    }
  }
  // The two stamps mean different things and must not be conflated: "build" is
  // written before a set is touched, the completion key after it comes back.
  if (!/SEQUENCE_COMPLETION_KEY = "completedBuild"/.test(plugin)) {
    fail(
      "figma/foundations-importer/code.js: the completion stamp is no longer a key distinct from build",
    );
  }
}

console.log("Component contract parity ok");
