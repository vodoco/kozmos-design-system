# Pointr branding

`pointr-logo.svg` is the unmodified 98×34 logo embedded in the official
[Pointr Web SDK 10.11.0](https://pointr-websdk.azureedge.net/10.11.0/pointrwebsdk.js)
(resource `./logo-pointr.svg`, module 194), retrieved 2026-09-29.
Pointr branding remains its owner's artwork; this file does not grant trademark rights.

Run `node scripts/build-pointr-brand.mjs` after changing the canonical artwork.
Run with `--check` to verify packaged copies. React embeds the SVG as a data URI;
Swift Package Manager bundles an image asset; Android uses the same paths and
clipping as a vector drawable. No remote image request or icon approximation.
Keep original colors and proportions. Default display size is 98×34 logical units.

MapAttribution uses this logo unless a host supplies `brand`. `showBrand=false`
hides either default or custom branding, never the host-supplied credits.
