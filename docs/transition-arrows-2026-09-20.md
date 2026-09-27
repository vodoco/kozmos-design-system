# Directions for transitions, 20 September 2026

The coding agent, in Olcay's order after the glass and sheet stages, on his answer "each platform's
own icon set": the design system's `DirectionType` had four arrows and no way to say a lift, an
escalator or stairs, so "Take Elevator down to First Floor" carried a straight arrow on the card,
the rail and the itinerary alike — the gap recorded since Pass 3. Built on iOS, React and
Android; the Pointr QA app reads the SDK's transition subtype and shows the right arrow. Branch
`claude/pointr-browse-repairs`, pushed.

| Commit    | What                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `7c9e9ea` | iOS: ten cases and their SF Symbols; the QA app's mapping from message type and transition subtype; the fixture playground's switches |
| `1e9f856` | React: the same cases, lucide's arrows, a test over every case, a Transitions story, docs                                             |
| `6c69f60` | Android: the same cases, Material's lift, escalator and stairs; two goldens                                                           |
| the last  | This report, the guide, the index, the log                                                                                            |

## 1. The model

`DirectionType` keeps its four turns and gains ten cases: a level change by lift, escalator or
stairs, up or down (`liftUp`, `escalatorDown`, `stairsUp`…); by something the route does not name
(`levelUp`, `levelDown`); a transition on the same level — a walkway, a corridor, another
building (`transition`); and turning back (`turnBack`). Flat cases, so the Figma mappings and the
contracts stay as they are; the web spells them `lift-up`, `level-down`, `turn-back`.

**What each platform draws**, from its own icon set, as ruled:

| Direction                | iOS (SF Symbols)                          | Web (lucide)                      | Android (Material)          |
| ------------------------ | ----------------------------------------- | --------------------------------- | --------------------------- |
| lift up / down           | `arrow.up.to.line` / `arrow.down.to.line` | ArrowUpFromLine / ArrowDownToLine | Elevator                    |
| escalator up / down      | the same arrows                           | the same arrows                   | Escalator                   |
| stairs up / down         | `figure.stairs`                           | the same arrows                   | Stairs                      |
| level up / down, unnamed | the same arrows                           | the same arrows                   | ArrowUpward / ArrowDownward |
| transition, same level   | `arrow.forward.to.line`                   | ArrowRightToLine                  | ArrowRightAlt               |
| turn back                | `arrow.uturn.backward`                    | Undo2                             | UTurnLeft                   |

SF Symbols has no lift and no escalator (probed: `elevator` and `escalator` do not exist on the
macOS 26 SDK; `stairs`, `figure.stairs` and the line arrows do); lucide 0.563 has none of the
three; Material's extended set has all three, with no direction. So the web and iOS show a level
change as the direction of travel and the words carry the means; Android shows the means and the
words carry the direction. One model, three honest drawings.

## 2. The QA app's mapping

`PTRRouteDirection.transitionInfo.subType` carries the taxonomy's transition subtype (release
10.12.0: elevator, escalator, interior-step, moving-walkway, raise-above/below/through, ramp,
staircase, stairs, wheelchair-lift). `SDKRoutePresenter.directionType(forMessageType:transitionSubType:)`
maps message type 9 (downward) and 10 (upward) by subtype — elevator and wheelchair-lift are
lifts; escalator; stairs, staircase and interior-step are stairs; the rest show the direction
alone — and 5 to turning back, 8, 11 and 12 (same-level and the two inter-building transitions)
to the transition; the turns and the destination as before. Live, Dunkin' to Airport Shuttles:
"Take Elevator down to First Floor" shows the down arrow, "Take Corridor to Garage B" and "Take
Walkway to Terminal B" the transition arrow.

## 3. Verified

| Check                                                                                   | Result                                                                                |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| iOS render test: every case drawn in the theme colour                                   | 14 of 14 leave theme pixels — a symbol the platform lacked would leave none           |
| Package, iOS 26.5 (baselines skipped); iOS 18.4                                         | 105, from 104; 107, from 106                                                          |
| `node scripts/check-ios-poi.mjs`                                                        | 52                                                                                    |
| QA app unit tests (the mapping table and the subtypes); the flow UI test                | 40; passed, the arrows on the card and in the itinerary                               |
| Fixture playground build (its exhaustive switches)                                      | succeeded                                                                             |
| React: DirectionStep and the parts that draw its arrows, lint, build, classes, snippets | 14; clean; ok; ok; 347 identifiers                                                    |
| Storybook docs check; `test:navigation` on chromium                                     | 103 pages at two widths, 174 snippet sections, keyboard navigation and axe.; 20 of 20 |
| Android, `verifyPaparazziDebug`                                                         | passed; two goldens of every direction                                                |

## 4. Change it yourself

| Behaviour                  | iOS                                                                              | Web                                                                   | Android                                                     |
| -------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| The cases and their glyphs | `DirectionStep/DirectionStep.swift`: `DirectionType`, `iconName`                 | `DirectionStep/DirectionStep.tsx`: `DirectionType`, `DIRECTION_ICONS` | `DirectionStep/DirectionStep.kt`: `DirectionType`, `icon()` |
| The SDK's mapping          | `apps/PointrPlayground/…/Routing/SDKRoute.swift`: `directionType`, `levelChange` | —                                                                     | —                                                           |
| Tests                      | `KozmosDirectionStepTests.swift`; `RoutePresenterTests.swift`                    | `DirectionStep.test.tsx`                                              | `directionstep/KozmosDirectionStepPaparazziTest.kt`         |
