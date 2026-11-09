---
"@kozmos-ds/tokens": minor
"@kozmos-ds/styles": minor
"@kozmos-ds/react": minor
---

A hover fill role, `Semantics.Hover.fill` (GAP-228, decision 173): `--semantics-hover-fill` in CSS, `semanticsHoverFill` in TypeScript, Swift and Kotlin, and `semantics_hover_fill` in the Android resources. It is background/100 in light, the muted fill hovers always drew, and background/200 in dark, #2E3138, 1.61:1 on the black page where background/100, #17191C, is 1.19:1 and a hover was barely seen. The stylesheet adds the `bg-hover-fill` utility, with its variants and opacity steps.

Every fill under the pointer moves to it, so the light theme draws exactly what it drew and the dark theme draws its hovers one step lighter: AIInputBar's voice button, BottomNavigation's and NavigationItem's items (hovered and pressed, and NavigationItem's `state="hover"`), BottomSheet's and Drawer's close buttons, Chip's neutral variant, FileUpload's drop zone, POIResultGroup's show-more row, RouteOptionCard, Table's rows, ToggleButton, Tree's rows, Accordion's trigger, NumberInput's steps, the buttons at a field's end (Combobox, MultiSelect, Input's action, PasswordInput's reveal, DatePicker's and TimePicker's triggers), Calendar's days and the ghost map controls. Fills that are not a hover stay on `muted`: selected rows and items, today in Calendar, disabled fields, placeholders and tracks. Button's outline and text treatments with an emotion keep the muted hover in both themes: on the dark hover fill the themed and danger hover inks read 3.83:1 and 3.84:1, under AA.
