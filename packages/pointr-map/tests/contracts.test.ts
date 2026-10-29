import { describe, expectTypeOf, it } from "vitest";
import type {
  BuildingPresentation,
  FloorPresentation,
  SitePresentation,
} from "@kozmos-ds/product-contracts";
import type { PointrMapProps } from "../src";
// @ts-expect-error the adapter's own building shape is gone (GAP-175)
import type { PointrBuildingPresentation } from "../src";
// @ts-expect-error the adapter's own site shape is gone (GAP-175)
import type { PointrSitePresentation } from "../src";
import { toBuilding, toSite } from "../src/convert";

/**
 * GAP-175: the building and the site the map reports are the contracts' own
 * `BuildingPresentation` and `SitePresentation`, the shapes SwiftUI and
 * Compose have too, and the adapter's own two are gone. The assertions are
 * types, checked by `tsc -p tsconfig.test.json` (the package's typecheck);
 * PointrMap.test.tsx checks what is reported against the fake SDK, field for
 * field.
 */
export type Gone = [PointrBuildingPresentation, PointrSitePresentation];

type Callback<K extends keyof PointrMapProps> = NonNullable<PointrMapProps[K]>;

describe("the building and the site are the contracts' (GAP-175)", () => {
  it("reports them in the contracts' types", () => {
    expectTypeOf(toBuilding).returns.toEqualTypeOf<
      BuildingPresentation | undefined
    >();
    expectTypeOf(toSite).returns.toEqualTypeOf<SitePresentation | undefined>();
    expectTypeOf<Parameters<Callback<"onBuildingChange">>>().toEqualTypeOf<
      [building?: BuildingPresentation]
    >();
    expectTypeOf<Parameters<Callback<"onSiteChange">>>().toEqualTypeOf<
      [site?: SitePresentation]
    >();
    expectTypeOf<Parameters<Callback<"onLevelChange">>>().toEqualTypeOf<
      [floor: FloorPresentation, building?: BuildingPresentation]
    >();
  });

  it("names the level to start on, which a building may leave out (decision 141)", () => {
    expectTypeOf<BuildingPresentation>()
      .toHaveProperty("defaultFloorId")
      .toEqualTypeOf<string | undefined>();
    expectTypeOf<{
      id: string;
      label: string;
      siteId: string;
      floors: readonly FloorPresentation[];
    }>().toMatchTypeOf<BuildingPresentation>();
  });
});
