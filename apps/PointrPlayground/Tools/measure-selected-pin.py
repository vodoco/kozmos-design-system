#!/usr/bin/env python3
"""Where the selected place's pin sits in a simulator screenshot, in points.

The Pointr QA app's camera padding (`SDKCameraPadding`) reserves a measured
height for the highlighted pin above its anchor. This reads that height, and
the pin's clearance below the search bar, from a screenshot — the evidence
behind `SDKCameraPadding.selectedPinHeight`. Re-run it after a PointrKit or
map-style update and update `selectedPinHeight` if it moved.

    xcrun simctl io <udid> screenshot shot.png
    python3 apps/PointrPlayground/Tools/measure-selected-pin.py shot.png

Needs Pillow (`python3 -m pip install pillow`). Assumes a 402pt-wide phone
(iPhone 17 Pro) at 3×; pass --width for another device. The search bar's
bottom edge is 134pt on that phone with the shell's default top bar.
"""
import argparse
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument("screenshot")
parser.add_argument("--width", type=float, default=402, help="device width in points (default 402)")
parser.add_argument("--bar-bottom", type=float, default=134, help="search bar's bottom edge in points")
parser.add_argument("--map-top", type=float, default=62, help="top of the region to search, in points")
parser.add_argument("--map-bottom", type=float, default=560, help="bottom of the region to search, in points")
args = parser.parse_args()

image = Image.open(args.screenshot).convert("RGB")
scale = image.size[0] / args.width


def is_pin_green(p):
    # PointrKit's highlighted-POI green on the Design-QA style.
    return p[1] > 120 and p[0] < 60 and p[2] < 110 and p[1] - p[0] > 60


# The pin's head is the widest green run in the map; its centre gives the pin's column.
best = None
for y in range(int(args.map_top * scale), int(args.map_bottom * scale)):
    run, start = 0, 0
    for x in range(image.size[0]):
        if is_pin_green(image.getpixel((x, y))):
            if run == 0:
                start = x
            run += 1
            if best is None or run > best[0]:
                best = (run, y, start, x)
        else:
            run = 0
if best is None:
    raise SystemExit("no pin found: nothing pin-green in the map region")
_, head_y, head_left, head_right = best
column = int((head_left + head_right) / 2)

# Walk the pin's column: head, the white disc's gap, tail, then the anchor dot.
rows = [y for y in range(int(args.map_top * scale), int(args.map_bottom * scale)) if is_pin_green(image.getpixel((column, y)))]
runs, start, previous = [], rows[0], rows[0]
for y in rows[1:]:
    if y != previous + 1:
        runs.append((start, previous))
        start = y
    previous = y
runs.append((start, previous))
runs_pt = [(round(a / scale, 1), round((b + 1) / scale, 1)) for a, b in runs]

pin_top = runs_pt[0][0]
anchor_bottom = runs_pt[-1][1]
clearance = pin_top - args.bar_bottom
print(f"pin column x={column / scale:.1f}pt; green runs (pt): {runs_pt}")
print(f"visible pin top {pin_top}pt, anchor dot bottom {anchor_bottom}pt, visible height {anchor_bottom - pin_top:.1f}pt")
if clearance <= 0:
    print(f"the pin is cut by the search bar ({args.bar_bottom}pt): its top is under it")
else:
    print(f"clearance below the search bar ({args.bar_bottom}pt): +{clearance:.1f}pt")
