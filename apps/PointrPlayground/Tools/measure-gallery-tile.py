#!/usr/bin/env python3
"""A gallery tile's rendered size, aspect and corner radius, in points.

Reads the first tile of `KozmosPOIMediaGallery` from a screenshot or a test
attachment where the tile shows its background (an unloaded or unavailable
tile), and fits a circle to its top-left corner. On the render test's
attachment, 2026-09-19, it read 314.7 × 236.0pt, 4:3, radius 16.0pt.

    python3 apps/PointrPlayground/Tools/measure-gallery-tile.py shot.png \
        --width 402 --region 8 335 74 330

--region is the box, in points, that contains the first tile and nothing else
of the tile's colour: exclude the arrow buttons above it and the second tile
beside it. Needs Pillow (`python3 -m pip install pillow`).
"""
import argparse
import math
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("image")
parser.add_argument("--width", type=float, default=402, help="image width in points")
parser.add_argument("--region", type=float, nargs=4, metavar=("X0", "X1", "Y0", "Y1"), required=True)
parser.add_argument("--tile-rgb", type=int, nargs=3, default=(227, 228, 232),
                    help="the tile background as rendered (Kozmos background 100 in light mode)")
args = parser.parse_args()

image = Image.open(args.image).convert("RGB")
scale = image.size[0] / args.width
x0, x1, y0, y1 = args.region
target = tuple(args.tile_rgb)


def is_tile(p):
    return all(abs(p[i] - target[i]) < 4 for i in range(3))


xs = [x for x in range(int(x0 * scale), int(x1 * scale)) if any(is_tile(image.getpixel((x, y))) for y in range(int(y0 * scale), int(y1 * scale), 3))]
ys = [y for y in range(int(y0 * scale), int(y1 * scale)) if any(is_tile(image.getpixel((x, y))) for x in range(int(x0 * scale), int(x1 * scale), 3))]
if not xs or not ys:
    raise SystemExit("no tile-coloured pixels in the region")
left, right, top, bottom = min(xs) / scale, (max(xs) + 1) / scale, min(ys) / scale, (max(ys) + 1) / scale
print(f"tile: x {left:.1f}..{right:.1f} (width {right - left:.1f}pt)  y {top:.1f}..{bottom:.1f} (height {bottom - top:.1f}pt)")
print(f"width / height = {(right - left) / (bottom - top):.3f}  (4:3 is 1.333)")


def inset_at_depth(d):
    y = int(round((top + d) * scale))
    row = [x for x in range(int(left * scale), int((left + 40) * scale)) if is_tile(image.getpixel((x, y)))]
    return row[0] / scale - left if row else None


# A circle of radius r tangent to the top and left edges: at depth d below the top
# the tile begins r - sqrt(r² - (r - d)²) in from the left. Fit r to what is drawn.
best = None
for r in [x / 2 for x in range(8, 64)]:
    error = 0
    for d in (0.5, 1, 2, 3, 4, 6, 8, 10, 12):
        measured = inset_at_depth(d)
        expected = r - math.sqrt(max(r * r - (r - d) * (r - d), 0)) if d < r else 0
        error += (measured - expected) ** 2 if measured is not None else 100
    if best is None or error < best[1]:
        best = (r, error)
print(f"fitted top-left corner radius: {best[0]:.1f}pt (fit error {best[1]:.2f})")
