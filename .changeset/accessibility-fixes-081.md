---
"@kozmos-ds/react": patch
---

Accessibility fixes found in the 0.8.0 audit. No props change.

- **LanguageSwitcher keeps focus while the host applies a language.** In the documented async flow the trigger was disabled while `pending`, which dropped keyboard focus to the page for the whole wait. It is now `aria-disabled` and stays focusable; opening and requesting are still refused. The pending status region stays mounted, so its text is announced. A test that expected the trigger to be `disabled` while pending should expect `aria-disabled="true"`.
- **MapInfo beside the map ignores an Escape from the map.** It closed on any Escape and moved focus to its trigger, even while the visitor typed in the map's search. It now closes on Escape only with focus in the pane, and hands focus to the trigger only if it was there. Its dialog is named once, by the panel's visible heading (no hidden copy), and inside the dialog the panel is no longer a second landmark of the same name.
- **FloorSelector reads each level once.** The full-name hint is visual: no longer each button's description, which read every name twice. It no longer pops up for the focus the selector moves itself as the column opens or closes; keyboard focus and hover still show it.
- **MapAttribution's credit line is a tab stop only when it overflows**, as a group named by `label`, so a keyboard can scroll it. A line that fits is no longer an unnamed stop before its link.
- **The default result look keeps its layout without native `@scope`.** POIResultCard's selection button and its SDK name are owned rules, so the SDK tab stays flush with the card's top and long names wrap in a browser without `@scope`. Nothing changes where `@scope` is supported.
