# @kozmos-ds/product-contracts

Platform-neutral presentation contracts for Kozmos map, POI, floor and routing
components: TypeScript types describing what a POI card, a result row or a
travel estimate shows, independently of how any platform draws it.

It also defines `MapLayoutRect`, `MapPanelPresentation`, `AdaptiveMapLayout`,
`MapOcclusion` and `AdaptiveMapLayoutSnapshot`. Rectangles are physical and
shell-local; collision padding is relative to the reported renderer bounds.
Units belong to the adapter boundary: CSS pixels on web, points or dp natively.
The React shell implements this geometry contract first; equivalent native
region-aware behavior is not yet implemented.

## Install

```sh
npm install @kozmos-ds/product-contracts
```

## Use

```ts
import type {
  POIPresentation,
  UserLocationState,
} from "@kozmos-ds/product-contracts";
```

The package is types only — it has no runtime code, so `import type` is all it
needs.

## Licence

MIT
