# Kozmos Design System - Implementation Status

Generated from the component directories by `scripts/skills/check-completion.ts`.

`Code Connect File` means a scaffold or mapping file exists. `Code Connect Linked` means the mapping uses a real Figma node ID and has no placeholder markers such as `node-id=TBD`.

Variant and API parity are **not** covered here. Run `pnpm components:variant:check` and see `docs/component-variant-gap-analysis.md` for which variant axes and values each platform can actually express.

`—` means Code Connect is not expected because the component is a code-only, nonvisual, provider, or typography-token primitive.

Internal-only component directories are excluded from the table. Current exclusions: GlassSettingsPanel.

Folders in a platform's component directory that hold no component are skipped too: Motion.

## Scope Of This Report

LanguageSwitcher is intentionally web-only: iOS and Android use device/app language without a dedicated button. Its absent native implementations are a product policy, not a parity backlog. See `docs/sdk-module-primitives.md`.

A checkmark confirms repository structure only: the expected implementation, story, test, export, or Code Connect mapping file was found. It does not grade the depth or correctness of that file.

This report does **not** prove visual fidelity, accessibility conformance, behavioral completeness, responsive coverage, API parity between React, Vue, SwiftUI, and Compose, meaningful test assertions, or production readiness. Those require separate contract, interaction, accessibility, visual-regression, and cross-platform review gates. Vue is not included in this table.

## Lane Summary

| Lane                   | Components | Web   | Web Tests | Web CCL | iOS   | iOS CCL | Android | Android CCL |
| ---------------------- | ---------- | ----- | --------- | ------- | ----- | ------- | ------- | ----------- |
| Core                   | 83         | 83/83 | 83/83     | 71/83   | 75/83 | 71/83   | 76/83   | 71/83       |
| Code-Only / Utility    | 5          | 5/5   | 5/5       | —       | 5/5   | —       | 5/5     | —           |
| Product / SDK          | 28         | 28/28 | 28/28     | 22/28   | 27/28 | 22/28   | 27/28   | 22/28       |
| Platform / Form-Factor | 2          | 2/2   | 2/2       | 2/2     | 2/2   | 2/2     | 2/2     | 2/2         |

## Core

Domain-neutral design-system components expected to reach Figma, Code Connect, and platform parity.

| Component            | Web (Comp) | Web (Story) | Web (Test) | Web (Code Connect File) | Web (Code Connect Linked) | Web (Barrel) | Web (Export) | iOS (Comp) | iOS (Code Connect File) | iOS (Code Connect Linked) | Android (Comp) | Android (Code Connect File) | Android (Code Connect Linked) |
| -------------------- | ---------- | ----------- | ---------- | ----------------------- | ------------------------- | ------------ | ------------ | ---------- | ----------------------- | ------------------------- | -------------- | --------------------------- | ----------------------------- |
| Accordion            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| ActionCard           | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| AICompanionPanel     | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| AIInputBar           | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| AIMessage            | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| AIMessageList        | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| AISearchButton       | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Alert                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Avatar               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Backdrop             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Badge                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| BottomNavigation     | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| BottomSheet          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Box                  | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Breadcrumb           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Button               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Card                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| CategoryField        | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Checkbox             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Chip                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| ColorPicker          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Combobox             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Container            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Counter              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| DatePicker           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| DateRangePicker      | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Dialog               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Drawer               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| EmptyState           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| FieldWrapper         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| FileUpload           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| FloatingActionButton | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Grid                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Icon                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| IconButton           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Input                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Itinerary            | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| Link                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| List                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Listbox              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| ManoeuvreCard        | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| Menu                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MetaStrip            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MultiSelect          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Navbar               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| NavigationItem       | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Notice               | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| NumberInput          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| OTPInput             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Pagination           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| PasswordInput        | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POIResultGroup       | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| Popover              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Progress             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Radio                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Rating               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| RouteProgressRail    | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| ScrollArea           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Search               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| SearchBar            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| SegmentedControl     | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Select               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Separator            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Sidebar              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Skeleton             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Slider               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Spinner              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| SplitButton          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Stack                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Stepper              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Surface              | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| Switch               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Table                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Tabs                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Tag                  | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Textarea             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Timeline             | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| TimePicker           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Toast                | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| ToggleButton         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Tooltip              | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| Tree                 | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| UserMessage          | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |

## Code-Only / Utility

Runtime, typography, or nonvisual primitives that are intentionally not Figma component sets.

| Component           | Web (Comp) | Web (Story) | Web (Test) | Web (Code Connect File) | Web (Code Connect Linked) | Web (Barrel) | Web (Export) | iOS (Comp) | iOS (Code Connect File) | iOS (Code Connect Linked) | Android (Comp) | Android (Code Connect File) | Android (Code Connect Linked) |
| ------------------- | ---------- | ----------- | ---------- | ----------------------- | ------------------------- | ------------ | ------------ | ---------- | ----------------------- | ------------------------- | -------------- | --------------------------- | ----------------------------- |
| Heading             | ✅         | ✅          | ✅         | —                       | —                         | ✅           | ✅           | ✅         | —                       | —                         | ✅             | —                           | —                             |
| Label               | ✅         | ✅          | ✅         | —                       | —                         | ✅           | ✅           | ✅         | —                       | —                         | ✅             | —                           | —                             |
| NavigationAnnouncer | ✅         | ✅          | ✅         | —                       | —                         | ✅           | ✅           | ✅         | —                       | —                         | ✅             | —                           | —                             |
| Text                | ✅         | ✅          | ✅         | —                       | —                         | ✅           | ✅           | ✅         | —                       | —                         | ✅             | —                           | —                             |
| ThemeProvider       | ✅         | ✅          | ✅         | —                       | —                         | ✅           | ✅           | ✅         | —                       | —                         | ✅             | —                           | —                             |

## Product / SDK

Map, wayfinding, CMS, dashboard, or product-specific compositions that should consume Core primitives.

| Component             | Web (Comp) | Web (Story) | Web (Test) | Web (Code Connect File) | Web (Code Connect Linked) | Web (Barrel) | Web (Export) | iOS (Comp) | iOS (Code Connect File) | iOS (Code Connect Linked) | Android (Comp) | Android (Code Connect File) | Android (Code Connect Linked) |
| --------------------- | ---------- | ----------- | ---------- | ----------------------- | ------------------------- | ------------ | ------------ | ---------- | ----------------------- | ------------------------- | -------------- | --------------------------- | ----------------------------- |
| AdaptiveMapShell      | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| ArrivalPanel          | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| BrowseCategoriesPanel | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| CategoryTile          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| DirectionStep         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| FloorSelector         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| LanguageSwitcher      | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ❌         | ❌                      | ❌                        | ❌             | ❌                          | ❌                            |
| LocationPin           | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MapAttribution        | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| MapControlButton      | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MapControlsGroup      | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MapInfoPanel          | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| MapOverlay            | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| MapStatusPill         | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| MapView               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POICard               | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POIDetailPanel        | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POIMediaGallery       | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POIResultCard         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| POIResultList         | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| RouteLocationField    | ✅         | ✅          | ✅         | ❌                      | ❌                        | ✅           | ✅           | ✅         | ❌                      | ❌                        | ✅             | ❌                          | ❌                            |
| RouteOptionCard       | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| RoutePreviewPanel     | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| RouteSummary          | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| RoutingInputGroup     | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| SaveLocationCard      | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| UserLocationMarker    | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| WayfindingCard        | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |

## Platform / Form-Factor

Dynamic Island, watch, kiosk, spatial, landscape, and other device-specific surfaces that need separate platform validation before Core promotion.

| Component     | Web (Comp) | Web (Story) | Web (Test) | Web (Code Connect File) | Web (Code Connect Linked) | Web (Barrel) | Web (Export) | iOS (Comp) | iOS (Code Connect File) | iOS (Code Connect Linked) | Android (Comp) | Android (Code Connect File) | Android (Code Connect Linked) |
| ------------- | ---------- | ----------- | ---------- | ----------------------- | ------------------------- | ------------ | ------------ | ---------- | ----------------------- | ------------------------- | -------------- | --------------------------- | ----------------------------- |
| DynamicIsland | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |
| FeedbackCard  | ✅         | ✅          | ✅         | ✅                      | ✅                        | ✅           | ✅           | ✅         | ✅                      | ✅                        | ✅             | ✅                          | ✅                            |

## Code Connect Not Applicable

- Heading: Typography primitive maintained through text styles/tokens rather than a Figma component set.
- Label: Typography/form-label primitive maintained through text styles/tokens and FieldWrapper anatomy.
- NavigationAnnouncer: Nonvisual accessibility utility with no visible Figma component anatomy.
- Text: Typography primitive maintained through text styles/tokens rather than a Figma component set.
- ThemeProvider: Runtime provider infrastructure; it does not have a visible Figma component set.

## Summary

- Web components: 118/118
- Web stories: 118/118
- Web tests: 118/118
- Web Code Connect files: 95/113
- Web Code Connect scaffolds: 0/113
- Web Code Connect linked: 95/113
- iOS components: 109/118
- iOS Code Connect files: 95/113
- iOS Code Connect scaffolds: 0/113
- iOS Code Connect linked: 95/113
- Android components: 110/118
- Android Code Connect files: 95/113
- Android Code Connect scaffolds: 0/113
- Android Code Connect linked: 95/113
- Code Connect not applicable: 5/118
