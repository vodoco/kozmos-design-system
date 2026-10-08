---
"@kozmos-ds/tokens": minor
---

Decision 60: a filled emotion button's hover is one step and its pressed two steps further along the emotion's own ramp, away from the page: darker in light, lighter in dark. Its focus is its hover. `Components.Primary Buttons.{success,alert,danger,informative,neutral}.button.background.{idle,hover,pressed,focus}` are now references to their ramp steps, so the CSS writes them as `var()` references (GAP-23), and the Swift, Kotlin and Figma outputs carry the same steps. `tokens:contrast:check` holds each state to its ramp step and its direction, and focus to hover.

**What you'll see:** hovered and pressed emotion buttons move away from the page in both themes.

| Emotion                     | Theme | Idle      | Hover and focus                                  | Pressed                                     |
| --------------------------- | ----- | --------- | ------------------------------------------------ | ------------------------------------------- |
| Danger                      | Light | `#B01736` | `#8C132B` (was `#D41C42`, lighter than the fill) | `#670E20` (was `#8C132B`)                   |
| Danger                      | Dark  | `#EE7E95` | `#F3A2B3` (was `#E95A77`)                        | `#F8C6D0` (was `#F3A2B3`)                   |
| Success, alert, informative | Dark  | 700       | 800 (was 600)                                    | 900 (was 800)                               |
| Informative                 | Light | 700       | 800                                              | 900, `#154761` (was 800, the same as hover) |
| Neutral                     | Light | `#C7CAD1` | `#ABAFBA`                                        | `#9095A2` (was `#E3E4E8`, lighter)          |
| Neutral                     | Dark  | `#464A53` | `#2E3138` (was `#5C6069`)                        | `#17191C` (was `#2E3138`)                   |

- Light success and alert already followed the rule and don't change.
- The dark neutral keeps darkening: white, its ink, reads 3.72:1 on the lighter step.
- The themed button keeps decision 59's values.
- The inks don't change. Each still reads at least 4.5:1, and black on the light neutral pressed reads 7.01:1.
