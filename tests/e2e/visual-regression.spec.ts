import { test, expect } from "@playwright/test";

// Define the core components to snapshot
const COMPONENT_STORIES = [
  { id: "data-display-accordion--default", name: "Accordion" },
  { id: "feedback-alert--default", name: "Alert" },
  { id: "data-display-avatar--default", name: "Avatar" },
  { id: "feedback-backdrop--default", name: "Backdrop" },
  { id: "components-badge--default", name: "Badge" },
  { id: "navigation-bottomnavigation--default", name: "BottomNavigation" },
  { id: "overlay-bottomsheet--default", name: "BottomSheet" },
  { id: "foundations-box--default", name: "Box" },
  { id: "navigation-breadcrumb--default", name: "Breadcrumb" },
  { id: "components-button--default", name: "Button" },
  { id: "components-card--default", name: "Card" },
  { id: "components-checkbox--default", name: "Checkbox" },
  { id: "components-chip--default", name: "Chip" },
  { id: "foundations-container--default", name: "Container" },
  { id: "input-datepicker--default", name: "DatePicker" },
  { id: "components-dialog--default", name: "Dialog" },
  { id: "map-directionstep--default", name: "DirectionStep" },
  { id: "feedback-drawer--default", name: "Drawer" },
  { id: "components-emptystate--default", name: "EmptyState" },
  { id: "input-fileupload--default", name: "FileUpload" },
  { id: "action-floatingactionbutton--default", name: "FloatingActionButton" },
  { id: "map-floorselector--default", name: "FloorSelector" },
  { id: "foundations-grid--default", name: "Grid" },
  { id: "foundations-heading--default", name: "Heading" },
  { id: "foundations-icon--default", name: "Icon" },
  { id: "action-iconbutton--default", name: "IconButton" },
  { id: "components-input--default", name: "Input" },
  { id: "components-label--default", name: "Label" },
  { id: "navigation-link--default", name: "Link" },
  { id: "data-display-list--default", name: "List" },
  { id: "map-locationpin--default", name: "LocationPin" },
  { id: "map-mapview--default", name: "MapView" },
  { id: "navigation-menu--default", name: "Menu" },
  { id: "navigation-navbar--default", name: "Navbar" },
  { id: "input-otpinput--default", name: "OTPInput" },
  { id: "components-poicard--default", name: "POICard" },
  { id: "navigation-pagination--default", name: "Pagination" },
  { id: "overlay-popover--default", name: "Popover" },
  { id: "feedback-progress--default", name: "Progress" },
  { id: "inputs-radiogroup--default", name: "Radio" },
  { id: "input-rating--default", name: "Rating" },
  { id: "components-scrollarea--horizontalquickaccess", name: "ScrollArea" },
  { id: "inputs-search--default", name: "Search" },
  { id: "components-searchbar--default", name: "SearchBar" },
  { id: "action-segmentedcontrol--default", name: "SegmentedControl" },
  { id: "components-select--default", name: "Select" },
  { id: "data-display-separator--default", name: "Separator" },
  { id: "navigation-sidebar--default", name: "Sidebar" },
  { id: "feedback-skeleton--default", name: "Skeleton" },
  { id: "inputs-slider--default", name: "Slider" },
  { id: "feedback-spinner--default", name: "Spinner" },
  { id: "action-splitbutton--default", name: "SplitButton" },
  { id: "foundations-stack--default", name: "Stack" },
  { id: "navigation-stepper--default", name: "Stepper" },
  { id: "components-switch--default", name: "Switch" },
  { id: "data-display-table--default", name: "Table" },
  { id: "components-tabs--default", name: "Tabs" },
  { id: "data-display-tag--default", name: "Tag" },
  { id: "foundations-text--default", name: "Text" },
  { id: "components-textarea--default", name: "Textarea" },
  { id: "system-themeprovider--default", name: "ThemeProvider" },
  { id: "input-timepicker--default", name: "TimePicker" },
  { id: "data-display-timeline--default", name: "Timeline" },
  { id: "feedback-toast--default", name: "Toast" },
  { id: "action-togglebutton--default", name: "ToggleButton" },
  { id: "overlay-tooltip--default", name: "Tooltip" },
  { id: "data-display-tree--default", name: "Tree" },
  { id: "components-userlocationmarker--default", name: "UserLocationMarker" },
  { id: "components-wayfindingcard--default", name: "WayfindingCard" },
];

test.describe("Visual Regression Snapshots", () => {
  for (const story of COMPONENT_STORIES) {
    test(`Snapshot for ${story.name}`, async ({ page }) => {
      // Relative to `baseURL`, which is STORYBOOK_URL where it is set.
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);

      // Wait for the root element to be visible to ensure rendering is complete
      await page.locator("#storybook-root").waitFor({ state: "visible" });

      // Ensure network settles and fonts/images load
      await page.waitForLoadState("networkidle");

      // `animations: 'disabled'` cancels a finite animation and rewinds an
      // infinite one — but not reliably: the AI search ring was measured
      // mid-turn through it on 2026-09-23, at `matrix(0.999898, …)`. A
      // spinner, a skeleton or that ring caught at a different frame is a
      // diff nobody can act on, so the page is stopped outright first.
      await page.addStyleTag({
        content: `*, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                    caret-color: transparent !important;
                }`,
      });

      await expect(page).toHaveScreenshot(`${story.id}-snapshot.png`, {
        fullPage: true,
        animations: "disabled",
      });
    });
  }
});
