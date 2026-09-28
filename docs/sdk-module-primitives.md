# What the SDK Modules Need From the Design System

Written 2026-09-05. Measured against the POI Details Card Revamp designs
(`HbFSXhCPxKUy2fWa5x9TKO`) and the Kozmos library over REST.

## The premise

**An SDK module is a composition, not a component.** A POI detail card is a
product decision about which facts to show and in what order. It should not be
a design-system component, and the design system should not be chasing its
anatomy.

What the design system owes it is **parts**: a control that can be in an active
state, a status message that lives inside a map, a labelled row of chips. If
those exist, a product team assembles the card and the system never has to know
what a POI is.

That reframes the gap audit of 2026-09-05, which found the 24 Product/SDK sets
diverging from their React implementations. That matters much less than this:
**can a module be built from Kozmos alone today?** For every module below, the
answer is no, and the missing pieces are small and reusable rather than large
and bespoke.

## The map module

The design puts nine kinds of control over the map: location tracking mode,
wheelchair-friendly mode, 2D/3D, info, Mark My Car, exit, zoom, the level
switcher, and a status message anchored bottom-centre.

What the library offers them today:

| Primitive          | Today                                                                | Enough?                                                        |
| ------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `MapControlButton` | 2 variants, 44×44 and 98×44, axis **`Presentation` only**            | **No.** There is no state axis at all                          |
| `MapControlsGroup` | 2 variants, a fixed stack of zoom in, zoom out, compass, my-location | **No.** It cannot hold anything else                           |
| `FloorSelector`    | 3 variants: vertical list, horizontal list, compact stepper          | **Partly.** No collapsed form, no current indicator, no paging |
| status message     | `Toast` is 420×92 and document-level; `Alert` is block-level         | **No.** Neither can sit inside the map                         |

### 1. A control button has no state

This is the single most reused gap. **Location tracking, wheelchair mode and
2D/3D are all mode toggles** — they are either on or off, and the design shows
that. `MapControlButton` has one axis, `Presentation`, with values `IconOnly`
and `Labelled`. There is nowhere to express "on".

Mark My Car adds a second need: it only applies when a car is saved, so it has
a disabled state too.

**Needed:** a `State` axis — `Default | Active | Disabled` — on
`MapControlButton`. Everything else in this document is a new component; this
one is an axis on an existing one, and it unblocks four controls at once.

`ToggleButton` already has `State: Default | Pressed | Disabled | Focus`, so
the vocabulary exists. It is 96×44 with a label, not a square icon button, so
it is the wrong shape rather than the wrong idea.

### 2. There is no generic control cluster

The design has four corner clusters with different contents: one holds the
level switcher and tracking, another holds info, 2D/3D and Mark My Car, another
the exit button. `MapControlsGroup` is hard-wired to four specific buttons.

**Needed:** a cluster that takes arbitrary children, with orientation, optional
dividers, and corner anchoring. `MapControlsGroup` then becomes a composition
of it rather than a component in its own right — which is the same reframing
this document is about, applied inside the library.

### 3. There is no status message that lives inside a surface

The design's bottom-centre message is 180×48: an icon, a line of text, and it
comes and goes. "Walking improves accuracy." That is the pattern the user
called the bottom-centre toast.

`Toast` needs a viewport at document level and is 420×92. `Alert` is a block in
the flow. Neither can be anchored inside a map without being fought.

**Needed:** an in-surface status message, sized for chrome rather than for a
page, that can be anchored to a corner or the centre of whatever contains it.
The MapScale prototype rebuilt exactly this for the same reason, and its
comment says so.

### 4. The level switcher is three features short

`FloorSelector` has the right three layouts. The design needs:

- a **collapsed** form, 48×48, showing only the current level until tapped;
- a **current-level indicator**, drawn as a small concentric dot;
- a **long-name tooltip** per item, since "L2" needs to expand to "Upper
  Convention Promenade";
- **paging chevrons** when there are more levels than fit.

The first two are the ones a product cannot work around.

## The POI module

The card itself should not be a component. Its parts should be.

| Part                                                                                     | Uses in the design | In the library        |
| ---------------------------------------------------------------------------------------- | ------------------ | --------------------- |
| **Attribute section** — a label above a row of chips                                     | **~26**            | No                    |
| **Meta strip** — time, distance, rating, price, accessibility, crowd, access restriction | 7 cell kinds       | No                    |
| **Opening hours** — a week of day rows                                                   | 7 rows             | No                    |
| **Drag handle** — 60×4, the sheet affordance                                             | 2                  | In `BottomSheet` only |
| Media gallery                                                                            | 1                  | `POIMediaGallery`     |
| Rating                                                                                   | 1                  | `Rating`              |
| Chips and tags                                                                           | many               | `Chip`, `Tag`         |

The attribute section is the dominant pattern of the whole card and the highest
value item in this document after the control state. It is a label, a wrap of
chips, and nothing else — but twenty-six sections are built by hand today.

**A note on the drag handle.** It is not absent — `BottomSheet` builds one as a
child node. It is simply not available on its own, so the POI sheet, the map
panel and the browse panel each redraw a 60×4 rectangle. Lifting it out is the
cheapest item in this document.

## The wayfinding module

| Part                                                                                        | In the library                                            |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Step list with a connector** — several direction steps joined by a "follow the line" rail | `DirectionStep` is one 360×72 row. Nothing composes them  |
| **Route meta strip** — 398×52 of route metrics                                              | No. Same shape as the POI meta strip                      |
| **Journey progress** — a 348×4 rail                                                         | `Progress` is 320×**8**; needs a thickness option         |
| **Level-change marker** — 48×48                                                             | No                                                        |
| **Accessible-route toggle** — 129×48, collapsed and expanded                                | No. This is the control-state gap plus an expandable form |
| Checkpoints                                                                                 | No                                                        |

The step list and the meta strip are the two that recur.

## The search and browse module

| Part                                     | In the library                                     |
| ---------------------------------------- | -------------------------------------------------- |
| Search box                               | `Search`, `SearchBar`                              |
| **Filter row** — 375×32                  | **No `Filter` component anywhere**                 |
| Category grid                            | `CategoryTile`, `BrowseCategoriesPanel`            |
| **Carousel** — a header plus paged cards | **No `Carousel`**                                  |
| **Empty result card** — 375×96           | `EmptyState` exists but not in a result-card shape |
| Drag handle                              | In `BottomSheet` only, as POI                      |

## The missing primitives, ranked by reuse

Ordered by how many modules each unblocks, not by size.

| #   | Primitive                                      | Unblocks                                                        | Size                                            |
| --- | ---------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| 1   | **`State` axis on `MapControlButton`**         | tracking, wheelchair, 2D/3D, Mark My Car, and every future mode | An axis on an existing set                      |
| 2   | **Attribute section** — label plus chip wrap   | ~26 sections in the POI card alone                              | Small                                           |
| 3   | **In-surface status message**                  | map status, and the prototype's saved-notice                    | Small                                           |
| 4   | **Generic control cluster**                    | all four map corners; `MapControlsGroup` becomes a composition  | Small                                           |
| 5   | **Meta strip** — a row of icon-and-value cells | POI card and route summary, same shape                          | Small                                           |
| 6   | **Drag handle**, lifted out of `BottomSheet`   | POI sheet, map panel, browse panel                              | Trivial                                         |
| 7   | **Step list with connector**                   | wayfinding directions                                           | Medium                                          |
| 8   | **Collapsed-expandable control**               | level switcher, accessible route                                | Medium                                          |
| 9   | **Filter row**                                 | search and browse                                               | Medium                                          |
| 10  | **Carousel**                                   | browse, POI media                                               | Medium                                          |
| 11  | **Opening hours**                              | POI card                                                        | Medium, and arguably product rather than system |

Items 1 through 6 are each a day or less and together cover most of what the
modules build by hand. Items 7 through 10 are real components.

## What to do with the existing SDK sets

Once the primitives exist, the 24 Product/SDK sets should be **re-examined as
compositions**, not repaired as components. Several probably should not be
design-system sets at all — `POIDetailPanel`, `POICard`, `RoutePreviewPanel`
and `WayfindingCard` are product layouts. Keeping them in the library is what
produced the anatomy drift that audit found: two teams modelling the same
product decision independently.

The ones that should stay are the ones that are genuinely primitives wearing a
map-shaped name: `MapControlButton`, `MapControlsGroup`, `FloorSelector`,
`LocationPin`, `MapOverlay`.

That is a decision to take deliberately rather than by attrition, and it should
be taken before anyone spends time reconciling the twelve divergences in the
audit — several of them would disappear with the component.

## How this was measured

- The three design nodes named by the user, read over REST, with every instance
  name, size and nesting recorded.
- The Kozmos library's own variant axes for `MapControlButton`,
  `MapControlsGroup`, `FloorSelector`, `MapOverlay`, `ToggleButton`, `Tooltip`
  and `Toast`, read from the published file rather than from the plugin source.
- The MapScale prototype's local rebuilds, which independently confirm four of
  these gaps.
