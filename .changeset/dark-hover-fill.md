---
"@kozmos-ds/tokens": minor
"@kozmos-ds/styles": minor
"@kozmos-ds/react": minor
---

A hover fill role, `Semantics.Hover.fill` (GAP-228, decision 173): `--semantics-hover-fill` in CSS, `SemanticsHoverFill` in TypeScript, `semanticsHoverFill` in Swift and Kotlin, and `semantics_hover_fill` in the Android resources. It is background/100 in light, the muted fill hovers always drew, and background/200 in dark, #2E3138, 1.61:1 on the black page where background/100, #17191C, is 1.19:1 and a hover was barely seen. The stylesheet adds the `bg-hover-fill` utility, with its variants and opacity steps.

Every fill under the pointer moves to it, so in light these hovers draw exactly what they drew and in dark they draw one step lighter: AIInputBar's voice button, BottomNavigation's and NavigationItem's items (hovered and pressed, and NavigationItem's `state="hover"`), BottomSheet's and Drawer's close buttons, Chip's neutral variant, FileUpload's drop zone, POIResultGroup's show-more row, RouteOptionCard, Table's rows, ToggleButton, Tree's rows, Accordion's trigger, NumberInput's steps, the buttons at a field's end (Combobox, MultiSelect, Input's action, PasswordInput's reveal, DatePicker's and TimePicker's triggers), Calendar's days and the ghost map controls.

The highlighted option, under the pointer or the keyboard, in Listbox, Combobox, MultiSelect, Select, TimePicker and LanguageSwitcher, takes the hover fill too. **This is a deliberate change in light**: the highlight moves from background/50 (#F1F2F4) to background/100 (#E3E4E8), a slightly stronger row, and in dark from background/50 (#0C0D0E) to background/200. In light the highlighted row and the chosen row are now one grey; the chosen row keeps its check.

A selected Tree row and a selected Table row draw the hover fill at full strength, so selection stays stronger than the hover at its opacity step (`/50`): unchanged in light, background/200 in dark. A selected Tree row now keeps its full fill under the pointer, where the hover's half step used to replace it; the half step is for the rows not selected.

Fills that are not a hover stay on `muted`: Calendar's today, disabled fields, placeholders and tracks. Two named exceptions keep the muted step, checked by `tokens:contrast:check`: Button's outline and text treatments with an emotion keep the muted hover, because on the dark hover fill the themed and danger hover inks read 3.83:1 and 3.84:1, under AA. A selected NavigationItem (top and side) and BottomNavigation item keep the muted fill, because their theme 600 label reads 3.83:1 on the dark hover fill.
