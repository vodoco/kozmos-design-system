import { createPointrIcon } from "../pointr/createPointrIcon";
import { createTaxonomyIcon } from "../taxonomy/createTaxonomyIcon";
import { createSymbolIcon } from "./createSymbolIcon";

/**
 * The artwork this package owns, because neither source it draws from has it.
 *
 * The Pointr Icon Library carries 1,174 outlines and not one of them is a
 * wheelchair or a place to eat. Searching its published names for food, eat,
 * dine, cutlery, fork, spoon, knife, plate, dish, bowl, cup, mug, coffee, tea,
 * drink, beverage, bar, wine, restaurant, kitchen, chef, menu or snack returns
 * bar-chart, glasses and dice. Both concepts are core to a venue, and both had
 * to come from outside.
 *
 * The factories are named for where their shape came from rather than what it
 * is: createPointrIcon builds a 24x24 outline at stroke 2, createTaxonomyIcon
 * a filled symbol on its own squared canvas. The artwork below is neither
 * library's, and uses whichever factory matches its shape.
 */

/**
 * The Accessible Icon Project's mark, from accessibleicon.org.
 *
 * Its makers put it in the public domain - "we put it in the public domain, so
 * we've never made any money on it. It's an image that's free for
 * appropriation" - with no attribution or share-alike asked, which is what
 * lets an MIT package carry it. Read 2026-09-24; the site states this in prose
 * and publishes no formal dedication text, so the provenance is recorded here
 * rather than assumed.
 *
 * It is a solid mark, not an outline: it fills with `color`, as a taxonomy
 * symbol does, and ignores `strokeWidth`. The viewBox squares the artwork's
 * own 505x647 bounding box - measured, not guessed - so its longer side spans
 * 20 of 24, the live area an icon is drawn in.
 */
export const Accessibility = /* @__PURE__ */ createTaxonomyIcon(
  "Accessibility",
  "203.8 9.64 776.13 776.13",
  [
    {
      d: "M833.556,367.574c-7.753-7.955-18.586-12.155-29.656-11.549l-133.981,7.458l73.733-83.975 c10.504-11.962,13.505-27.908,9.444-42.157c-2.143-9.764-8.056-18.648-17.14-24.324c-0.279-0.199-176.247-102.423-176.247-102.423 c-14.369-8.347-32.475-6.508-44.875,4.552l-85.958,76.676c-15.837,14.126-17.224,38.416-3.097,54.254 c14.128,15.836,38.419,17.227,54.255,3.096l65.168-58.131l53.874,31.285l-95.096,108.305 c-39.433,6.431-74.913,24.602-102.765,50.801l49.66,49.66c22.449-20.412,52.256-32.871,84.918-32.871 c69.667,0,126.346,56.68,126.346,126.348c0,32.662-12.459,62.467-32.869,84.916l49.657,49.66 c33.08-35.166,53.382-82.484,53.382-134.576c0-31.035-7.205-60.384-20.016-86.482l51.861-2.889l-12.616,154.75 c-1.725,21.152,14.027,39.695,35.18,41.422c1.059,0.086,2.116,0.127,3.163,0.127c19.806,0,36.621-15.219,38.257-35.306 l16.193-198.685C845.235,386.445,841.305,375.527,833.556,367.574z",
    },
    {
      d: "M762.384,202.965c35.523,0,64.317-28.797,64.317-64.322c0-35.523-28.794-64.323-64.317-64.323 c-35.527,0-64.323,28.8-64.323,64.323C698.061,174.168,726.856,202.965,762.384,202.965z",
    },
    {
      d: "M535.794,650.926c-69.668,0-126.348-56.68-126.348-126.348c0-26.256,8.056-50.66,21.817-70.887l-50.196-50.195 c-26.155,33.377-41.791,75.393-41.791,121.082c0,108.535,87.983,196.517,196.518,196.517c45.691,0,87.703-15.636,121.079-41.792 l-50.195-50.193C586.452,642.867,562.048,650.926,535.794,650.926z",
    },
  ],
);

/**
 * A place to eat, from lucide's `utensils`.
 *
 * lucide is ISC licensed, which permits the artwork to be carried here with
 * its notice: "Copyright (c) for portions of Lucide are held by Cole Bemis
 * 2013-2026 as part of Feather (MIT). All other copyright (c) for Lucide are
 * held by Lucide Contributors 2026." This is the outline itself, not a
 * dependency - lucide-react left this package on 2026-09-23 and does not
 * return with it.
 *
 * It is drawn on the same grid the other outlines are, 24x24 at stroke 2, so
 * it sits in a row with them.
 */
export const Utensils = /* @__PURE__ */ createPointrIcon("Utensils", [
  {
    d: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2",
  },
  {
    d: "M7 2v20",
  },
  {
    d: "M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  },
]);

/**
 * The location control's following mark: the Pointr pointer, solid, with a
 * cone the way it points.
 *
 * From Pointr's Location Tracking Buttons revamp (Figma
 * `ce7phRJR1sCkH6zT8EMH8I`, node `3415:7514`, "focusOn-location_SingleSymbol"),
 * exported over REST on 2026-09-27. The pointer is `navigation-pointer-01`
 * filled; the revamp sets the cone at 10% of the same colour.
 *
 * It is a symbol on the revamp's 36-unit canvas, not an outline on the icon
 * grid — see createSymbolIcon for how to size it beside other icons.
 */
export const LocationFollowing = /* @__PURE__ */ createSymbolIcon(
  "LocationFollowing",
  "0 0 36 36",
  [
    {
      paths: [
        {
          paint: "fill",
          d: "M9.4132 16.745C8.81787 16.5135 8.5202 16.3977 8.4333 16.2309C8.35796 16.0863 8.35786 15.9141 8.43303 15.7694C8.51974 15.6025 8.81726 15.4864 9.41232 15.2542L26.2996 8.66402C26.8368 8.45439 27.1054 8.34958 27.277 8.40691C27.426 8.4567 27.543 8.57367 27.5928 8.72271C27.6501 8.89434 27.5453 9.16292 27.3357 9.70008L20.7455 26.5874C20.5133 27.1824 20.3972 27.48 20.2303 27.5667C20.0856 27.6418 19.9134 27.6417 19.7688 27.5664C19.602 27.4795 19.4862 27.1818 19.2547 26.5865L16.6267 19.8287C16.5797 19.7078 16.5562 19.6474 16.5199 19.5965C16.4877 19.5514 16.4483 19.512 16.4032 19.4798C16.3523 19.4435 16.2919 19.42 16.171 19.373L9.4132 16.745Z",
        },
      ],
    },
    {
      opacity: 0.1,
      paths: [
        {
          paint: "fill",
          d: "M33.3495 24.3038C34.7942 21.2678 35.3061 17.8715 34.8205 14.5446C34.335 11.2176 32.8738 8.10939 30.6217 5.61289C28.3697 3.11639 25.4279 1.34376 22.1684 0.519179C18.9088 -0.305405 15.478 -0.144915 12.3097 0.980354L17.9992 16.9995L33.3495 24.3038Z",
        },
      ],
    },
  ],
);

/**
 * The location control's heading mark: the upright Pointr pointer, solid,
 * with a cone ahead of it and a dashed arc behind it that says the map turns.
 *
 * From the same revamp (node `3415:7499`, "rotational_SingleSymbol"), exported
 * on 2026-09-27. Row 77 asked for a `location-heading` icon: the Pointr Icon
 * Library has no such mark, and its `heading-01` and `heading-02` are the
 * typographic H. The revamp's theming note gives the three tones as one
 * colour at 100% (the pointer), 10% (the cone) and 60% (the arc and its
 * arrowheads).
 *
 * The arc's round caps reach half a unit below the canvas; the factory lets
 * them show rather than clipping them.
 */
export const LocationHeading = /* @__PURE__ */ createSymbolIcon(
  "LocationHeading",
  "0 0 36 36",
  [
    {
      paths: [
        {
          paint: "fill",
          d: "M11.0368 27.3248C10.4522 27.5821 10.1598 27.7107 9.98042 27.6542C9.8249 27.6052 9.70303 27.4835 9.65387 27.328C9.59717 27.1487 9.72545 26.8562 9.98203 26.2712L17.2634 9.66971C17.495 9.14163 17.6108 8.8776 17.7727 8.79678C17.9133 8.72659 18.0787 8.72659 18.2193 8.79678C18.3812 8.8776 18.497 9.14163 18.7287 9.66971L26.01 26.2712C26.2666 26.8562 26.3949 27.1487 26.3382 27.328C26.289 27.4835 26.1671 27.6052 26.0116 27.6542C25.8322 27.7107 25.5399 27.5821 24.9552 27.3248L18.3182 24.4045C18.1995 24.3523 18.1402 24.3262 18.0785 24.3159C18.0239 24.3067 17.9681 24.3067 17.9135 24.3159C17.8519 24.3262 17.7925 24.3523 17.6738 24.4045L11.0368 27.3248Z",
        },
      ],
    },
    {
      opacity: 0.1,
      paths: [
        {
          paint: "fill",
          d: "M34.0196 11.3104C32.8943 8.14201 30.8548 5.37847 28.1588 3.36923C25.4629 1.36 22.2318 0.195324 18.8739 0.022478C15.5161 -0.150368 12.1824 0.676381 9.29444 2.39818C6.40647 4.11998 4.09393 6.65949 2.64925 9.69558L18 17L34.0196 11.3104Z",
        },
      ],
    },
    {
      opacity: 0.6,
      paths: [
        {
          paint: "fill",
          d: "M30.7791 26.2316C30.5934 26.2602 30.5005 26.2745 30.4538 26.2447C30.4133 26.219 30.3879 26.1751 30.3858 26.1272C30.3834 26.0719 30.4421 25.9985 30.5596 25.8518L33.8934 21.6879C33.9994 21.5554 34.0524 21.4892 34.1046 21.4786C34.1499 21.4693 34.1969 21.4819 34.2315 21.5126C34.2714 21.5479 34.2842 21.6317 34.3098 21.7995L35.115 27.0724C35.1434 27.2582 35.1576 27.3511 35.1278 27.3978C35.102 27.4382 35.0581 27.4635 35.0101 27.4656C34.9549 27.468 34.8816 27.4092 34.735 27.2915L33.071 25.9561C33.0413 25.9322 33.0264 25.9203 33.0097 25.9127C32.9948 25.9059 32.979 25.9016 32.9627 25.9001C32.9444 25.8983 32.9256 25.9012 32.8879 25.907L30.7791 26.2316Z",
        },
        {
          paint: "fill",
          d: "M5.34347 26.2089C5.52831 26.2373 5.62073 26.2515 5.66719 26.222C5.70746 26.1963 5.7327 26.1527 5.73482 26.105C5.73727 26.05 5.67882 25.977 5.56193 25.831L2.24474 21.6878C2.13922 21.556 2.08647 21.4901 2.03456 21.4795C1.98948 21.4703 1.94269 21.4829 1.90825 21.5134C1.86859 21.5485 1.85585 21.6319 1.83036 21.7988L1.02918 27.0455C1.00095 27.2304 0.986835 27.3228 1.01646 27.3693C1.04214 27.4095 1.08583 27.4347 1.13352 27.4368C1.18854 27.4391 1.26147 27.3806 1.40732 27.2635L3.06299 25.9348C3.0926 25.911 3.1074 25.8991 3.12405 25.8915C3.13881 25.8848 3.15458 25.8806 3.17073 25.879C3.18894 25.8773 3.2077 25.8802 3.24522 25.8859L5.34347 26.2089Z",
        },
        {
          paint: "stroke",
          width: 1.11129,
          dashes: "1.11 3.33",
          d: "M2 24.5714C4.31533 31.2297 10.5627 36 17.9062 36C25.4582 36 31.8508 30.955 34 24",
        },
      ],
    },
  ],
);
