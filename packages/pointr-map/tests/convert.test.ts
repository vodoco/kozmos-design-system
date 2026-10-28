import { describe, expect, it } from "vitest";
import {
  poiCoordinates,
  toBuilding,
  toFloor,
  toFloors,
  toPoiItem,
  toSearchResponse,
  toSite,
} from "../src/convert";
import { FakeLevel, FakePoi } from "./fake-sdk";

describe("floors", () => {
  it("labels a level with the Cloud's titles, and with its index when it has none", () => {
    expect(
      toFloor({
        levelIndex: 3,
        levelShortTitle: "3",
        levelLongTitle: "Third floor",
      }),
    ).toEqual({
      id: "3",
      label: "Third floor",
      shortLabel: "3",
    });
    expect(
      toFloor({ levelIndex: -1, levelShortTitle: "B1", levelLongTitle: "" }),
    ).toEqual({
      id: "-1",
      label: "B1",
      shortLabel: "B1",
    });
    expect(toFloor({ levelIndex: 4 })).toEqual({
      id: "4",
      label: "4",
      shortLabel: "4",
    });
    expect(toFloor({ levelIndex: 1.5 })).toBeUndefined();
    expect(toFloor(undefined)).toBeUndefined();
  });

  it("orders a building's floors top first, each level once", () => {
    const floors = toFloors([
      new FakeLevel({ levelIndex: 0 }),
      new FakeLevel({ levelIndex: -1 }),
      new FakeLevel({ levelIndex: 2 }),
      new FakeLevel({ levelIndex: 0, levelLongTitle: "duplicate" }),
    ]);
    expect(floors.map((f) => f.id)).toEqual(["2", "0", "-1"]);
    expect(floors[1].label).toBe("0");
  });
});

describe("buildings and sites", () => {
  it("needs an id, and keeps an untitled building with an empty label", () => {
    expect(toBuilding(undefined)).toBeUndefined();
    expect(
      toBuilding({
        buildingInternalIdentifier: "",
        siteInternalIdentifier: "s",
      }),
    ).toBeUndefined();
    expect(
      toBuilding({
        buildingInternalIdentifier: "b",
        siteInternalIdentifier: "s",
      }),
    ).toEqual({ id: "b", label: "", siteId: "s", floors: [] });
  });

  it("reads a site's numeric id as a string, and its buildings", () => {
    expect(
      toSite({
        siteInternalIdentifier: 42 as unknown as string,
        siteTitle: "Campus",
        buildings: [
          { buildingInternalIdentifier: "b", siteInternalIdentifier: "42" },
        ],
      }),
    ).toEqual({
      id: "42",
      label: "Campus",
      buildings: [{ id: "b", label: "", siteId: "42", floors: [] }],
    });
  });

  it("names the level the venue's data marks as the default, the first marked, as 10.13.0 finds it (decision 141)", () => {
    const building = (levels: unknown[]) =>
      toBuilding({
        buildingInternalIdentifier: "b",
        siteInternalIdentifier: "s",
        levels: levels as never,
      });
    expect(
      building([
        { levelIndex: 0, properties: {} },
        { levelIndex: -1, properties: { isDefault: true } },
        { levelIndex: 2, properties: { isDefault: true } },
      ])?.defaultFloorId,
    ).toBe("-1");
    // None marked, or the marked one has no index: no default, the key left out.
    for (const levels of [
      [{ levelIndex: 0, properties: {} }, { levelIndex: 1 }],
      [{ levelIndex: 0 }, { properties: { isDefault: true } }],
      [],
    ])
      expect(building(levels)).not.toHaveProperty("defaultFloorId");
    // The SDK's own Level instances have lost the mark.
    expect(building([new FakeLevel({ levelIndex: 1 })])).not.toHaveProperty(
      "defaultFloorId",
    );
    // A site's buildings keep it.
    expect(
      toSite({
        siteInternalIdentifier: "s",
        buildings: [
          {
            buildingInternalIdentifier: "b",
            siteInternalIdentifier: "s",
            levels: [
              { levelIndex: 1, properties: { isDefault: true } },
            ] as never,
          },
        ],
      })?.buildings[0].defaultFloorId,
    ).toBe("1");
  });

  it("gives a site's buildings the site's own id, whatever their data names (GAP-175)", () => {
    const site = toSite({
      siteInternalIdentifier: "campus",
      buildings: [
        {
          buildingInternalIdentifier: "a",
          siteInternalIdentifier: null as never,
        },
        { buildingInternalIdentifier: "b", siteInternalIdentifier: "" },
        { buildingInternalIdentifier: "c", siteInternalIdentifier: "other" },
        { buildingInternalIdentifier: "d", siteInternalIdentifier: "campus" },
      ],
    });
    expect(site?.buildings.map((b) => b.id)).toEqual(["a", "b", "c", "d"]);
    expect(site?.buildings.every((b) => b.siteId === site.id)).toBe(true);
  });
});

describe("POIs", () => {
  it("centres a point on itself and a shape on its bounds, as the SDK does", () => {
    expect(poiCoordinates({ type: "Point", coordinates: [5, 6] })).toEqual([
      5, 6,
    ]);
    expect(
      poiCoordinates({
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [4, 0],
              [4, 2],
              [0, 0],
            ],
          ],
          [
            [
              [6, 8],
              [7, 8],
              [6, 8],
            ],
          ],
        ],
      }),
    ).toEqual([3.5, 4]);
    expect(
      poiCoordinates({ type: "Polygon", coordinates: [] }),
    ).toBeUndefined();
    expect(poiCoordinates(undefined)).toBeUndefined();
  });

  it("reads a plain feature as it reads a Poi instance", () => {
    const data = {
      properties: { fid: 12, name: "Gate 4", lvl: "0", isFeatured: "true" },
      geometry: { type: "Point", coordinates: [1, 2] },
    };
    const context = { resultIndex: 3, selected: false };
    const fromInstance = toPoiItem(new FakePoi(data), context);
    expect(toPoiItem(data, context)).toEqual(fromInstance);
    expect(fromInstance).toEqual({
      poi: { id: "12", name: "Gate 4", floorId: "0", media: [], actions: [] },
      result: {
        poiId: "12",
        resultIndex: 3,
        selected: false,
        featured: true,
        floorId: "0",
      },
      coordinates: [1, 2],
      levelIndex: 0,
    });
  });

  it("skips a feature with no id or no name, and labels no floor of another building", () => {
    const context = { resultIndex: 1, selected: false };
    expect(toPoiItem({ properties: { name: "x" } }, context)).toBeUndefined();
    expect(
      toPoiItem({ properties: { fid: "1", name: " " } }, context),
    ).toBeUndefined();
    const other = toPoiItem(
      { properties: { fid: "1", name: "Desk", lvl: 0, bid: "b-2" } },
      {
        ...context,
        building: {
          id: "b-1",
          label: "Main",
          siteId: "s",
          floors: [{ id: "0", label: "Ground", shortLabel: "G" }],
        },
      },
    );
    expect(other?.poi).toEqual({
      id: "1",
      name: "Desk",
      floorId: "0",
      buildingId: "b-2",
      media: [],
      actions: [],
    });
  });

  it("answers a search with every POI once, numbered from 1, and an empty one as noMatch", () => {
    const poi = (fid: string) => ({ properties: { fid, name: fid } });
    const response = toSearchResponse(
      [poi("a"), poi("b"), poi("a"), { properties: {} }, poi("c")],
      {},
    );
    expect(response.results.map((r) => [r.poiId, r.resultIndex])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
    expect(response.emptyKind).toBeUndefined();
    expect(toSearchResponse([], {})).toEqual({
      results: [],
      items: [],
      emptyKind: "noMatch",
    });
  });
});

describe("the 20 Oct audit", () => {
  it("reads every id with one rule: a number is kept, null and undefined are none", () => {
    expect(
      toBuilding({
        buildingInternalIdentifier: 7 as never,
        siteInternalIdentifier: 3 as never,
      }),
    ).toMatchObject({ id: "7", siteId: "3" });
    expect(
      toBuilding({
        buildingInternalIdentifier: "b",
        siteInternalIdentifier: null as never,
      })?.siteId,
    ).toBe("");
    expect(toSite({ siteInternalIdentifier: null as never })).toBeUndefined();
    expect(toSite({ siteInternalIdentifier: 12 as never })?.id).toBe("12");
  });

  it("centres a geometry without a type on its bounds, rather than throwing", () => {
    expect(poiCoordinates({ coordinates: [3, 4] } as never)).toEqual([3, 4]);
    expect(
      poiCoordinates({
        coordinates: [
          [0, 0],
          [2, 2],
        ],
      } as never),
    ).toEqual([1, 1]);
  });
});
