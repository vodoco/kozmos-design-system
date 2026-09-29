# @kozmos-ds/icons

## 0.5.0

### Minor Changes

- b46112a: `@kozmos-ds/icons` gains `Walking`, the walking figure the SDK's position status draws beside "Walking improves accuracy", sourced from Pointr's Figma. It is a solid mark squared on the icon grid, 20 of 24 tall, in `currentColor`. `bluetooth-off`, the pill's No Bluetooth mark, joins the icon name list, so `getIconComponent("bluetooth-off")` and `<Icon name="bluetooth-off" />` reach Pointr's outline. React 0.6.0 requires icons 0.5.0; they are released together.

  ```tsx
  import { MapStatusPill } from "@kozmos-ds/react";
  import { BluetoothOff, Walking } from "@kozmos-ds/icons";

  <MapStatusPill tone="progress" icon={<Walking />}>
    Walking improves accuracy
  </MapStatusPill>;
  <MapStatusPill tone="danger" icon={<BluetoothOff />}>
    No Bluetooth
  </MapStatusPill>;
  ```

  Dedicated Turn Back and Wayfinding Unavailable marks are not included. Their examples explicitly pass `icon={null}` to omit a mark. A `warning` or `danger` pill without an `icon` prop still draws its default warning triangle; pass `icon={null}` when no fallback mark is appropriate.

### Patch Changes

- f028338: Importing one icon no longer bundles every icon in the registry. `kozmosIconRegistry` was built at module scope by `Object.fromEntries(kozmosIconDefinitions.map(...))`, and only the outer call was marked `/* @__PURE__ */`. A mark covers its own call, not the calls in its arguments, so Rollup and esbuild both kept the `.map`, and with it every definition and every icon they name. In 0.4.0, `import { Check } from "@kozmos-ds/icons"` cost an app 11.49 KB gzip (32.84 KB minified), all 56 of the registry's icons. It now costs 0.38 KB (0.54 KB minified), the icon and its factory. The `.map` is marked too.

  Nothing else changes: the same exports, names and registry. Anything that looks an icon up by name, `getIconComponent`, `getIconDefinition`, `isKozmosIconKey` or the registry itself, still brings in every icon the registry names, as it must.

## 0.4.0

### Minor Changes

- 415e486: The map's controls take the product's words, the location control shows its mode, and step-free
  has a control of its own.

  **Every label is the product's.** `MapControlsGroup` gains `zoomInLabel`, `zoomOutLabel` and
  `compassResetLabel` (`locationLabel` already existed), `UserLocationMarker` gains `label`, and
  `FloorSelector` gains `previousFloorLabel` and `nextFloorLabel`. The defaults stay English: a design
  system has no locale of its own, and the product now has somewhere to put one.

  **The location control draws each mode.** A mark per `locationState` — `off`, `locating`,
  `following`, `heading`, `permission-denied`, `stale`, `unavailable` — replaceable with
  `locationIcons`. `locationRevealOnChange` shows the mode's label when it changes, and
  `locationLabelPlacement` puts that label `inline` or `stacked`. `@kozmos-ds/icons` gains
  `LocationFollowing` and `LocationHeading`, which the control draws, so this react needs this icons.

  ```tsx
  <MapControlsGroup
    locationState={locationState}
    locationRevealOnChange
    zoomInLabel={t("map.zoomIn")}
    zoomOutLabel={t("map.zoomOut")}
    onStepFreeChange={onRoute ? setStepFree : undefined}
    stepFree={stepFree}
    stepFreeLabel={t("map.stepFree")}
  />
  ```

  **Step-free takes the location control's place on a route.** With `onStepFreeChange` the control
  is a step-free toggle (`stepFree`, `stepFreeLabel`, `stepFreeOnLabel`, `stepFreeOffLabel`,
  `stepFreeIcon`). It is keyed apart from the location control, so assistive technology meets a new
  control rather than the old one changing its name.

  **The marker admits it is elsewhere.** `UserLocationMarker` gains `offFloor` and `offFloorLabel`.
  Off the level in view it is hollow, without its halo, ping or heading cone — shape carries the
  state, not colour alone — where the map page used to hide it and the visitor lost their position.

  **Pins sit on their place right to left.** `LocationPin` anchors to a physical origin, to match its
  physical translate. In Arabic every pin drew one pin-width to the left of the place it marks.

  **The map fills its shell.** `MapView` gains `variant="fill"`: no border, radius or 400px minimum,
  and `role="group"` rather than a second landmark inside `AdaptiveMapShell`'s map region. The
  default, `"framed"`, draws what it always drew. The labels beside map controls keep their gap right
  to left.

## 0.3.0

### Minor Changes

- 558344b: Take the taxonomy's eight quick-access symbols out of the icon set.

  `TaxonomyAmenitySpaceDesk`, `TaxonomyEntranceExit`, `TaxonomyFoodBeverageSpace`,
  `TaxonomyParkingSpace`, `TaxonomyRetailSpace`, `TaxonomySecuritySpace`,
  `TaxonomyServiceSpaceOffice` and `TaxonomyTransportationSpaceBoardingGate` are
  gone, with their `taxonomy-*` registry names and their Code Connect
  connections. 1183 icons become 1175.

  They were never the design system's to ship. A category symbol belongs to the
  venue's taxonomy, which Pointr publishes and versions on its own cadence;
  an icon here is drawn once and versioned with the components. Carrying both
  meant eight PNGs that went stale the moment a taxonomy release landed.

  Read the artwork from the taxonomy instead. Every quick-access category carries
  its own `iconUrl`, and the panel's `renderIcon` takes whatever you give it:

  ```tsx
  <BrowseCategoriesPanel
    renderIcon={(category) => <img src={category.iconUrl} alt="" aria-hidden />}
  />
  ```

  `CategoryPresentation` now carries `iconUrl` for exactly this - the venue's own
  artwork, beside `iconName` for a design system glyph. `BrowseCategoriesPanel`'s
  `AviationQuickAccess` story reads `quick-access/aviation_customer.json` at
  10.12.0.

  The `Accessibility` and `Utensils` glyphs added in 0.2.0 are unaffected: they
  are drawn here and stay.

## 0.2.0

### Minor Changes

- Every icon name now draws the Pointr Icon Library's own outline.

  `@kozmos-ds/icons` carries all 1,175 of them and no longer depends on
  lucide-react, which 43 of the 64 names still resolved to: the same concept in a
  different hand from the one Figma shows. Nothing maps onto a near-miss any
  more, and a consumer installs this package and React alone.

  Two glyphs the Pointr library does not have are drawn from elsewhere and
  carried here. `Accessibility` is the Accessible Icon Project's mark, which its
  makers put in the public domain. `Utensils` is lucide's outline under ISC, the
  artwork alone rather than a dependency.

  `@kozmos-ds/react` no longer depends on lucide-react either. The names it uses
  are unchanged, so no import needs editing; what changes is which outline each
  one draws.

## 0.1.0

### Minor Changes

- c5ec97c: First public release: the curated Pointr icon set and the taxonomy's eight
  quick-access symbols as React components.
