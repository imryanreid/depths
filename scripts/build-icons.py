#!/usr/bin/env python3
# ==============================================
# BUILD ICONS
# Renders public/favicon.svg and the PNG fallbacks
# from one description of the shape.
#
# Why the PNGs exist: browsers take the SVG happily,
# but Google Search's favicon documentation lists
# neither SVG among its supported formats nor anything
# below 48x48 as a good idea — and the SVG declares an
# intrinsic 32x32. So a search result needs a real
# raster fallback or it gets the generic globe.
#
# Why it's hand-rolled: pure stdlib, matching the
# family. The figure is three offset squares on a
# rounded plate; pulling in a rasterizer to draw that
# would cost more than drawing it. zlib and struct are
# all a PNG needs, and antialiasing is 4x
# supersampling with a box filter.
#
# Run it after changing PLANES, or the SVG and the
# PNGs drift apart:
#     python3 scripts/build-icons.py
# ==============================================
import math
import os
import struct
import zlib

# The shape, in a 32-unit coordinate space with the family's 6-unit inset.
#
# Three squares stepping down and to the right — surfaces at three elevations,
# the diagonal offset being the z-axis this tool is about. Painted back to
# front, deepest darkest, so the front-left square reads as the raised one.
# Ramps is horizontal bars, Beeps vertical bars, Springs a coil; Depths is
# stacked planes. Keep in step with the `depths` figure in the shared ToolMark.
INK = (0x13, 0x12, 0x10)
PLATE_RADIUS = 7.0

PLANE_SIZE = 12.0
PLANE_RADIUS = 2.0
# (x, y, color), back to front.
PLANES = [
    (14.0, 14.0, (0x24, 0x52, 0xB0)),
    (10.0, 10.0, (0x3D, 0x7D, 0xFF)),
    (6.0, 6.0, (0x8D, 0xB0, 0xFF)),
]


def write_svg(path):
    rects = "\n  ".join(
        f'<rect x="{x:.2f}" y="{y:.2f}" width="{PLANE_SIZE:.2f}" height="{PLANE_SIZE:.2f}" '
        f'rx="{PLANE_RADIUS:g}" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}" />'
        for x, y, c in PLANES
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <!-- Three squares stepping down-right — surfaces at three elevations, the
       diagonal offset being the z-axis this tool is about. Deepest darkest,
       painted back to front. Shares the family plate: #131210, rx 7, a 6-unit
       inset. Keep in step with the `depths` figure in the shared ToolMark. -->
  <rect width="32" height="32" rx="{PLATE_RADIUS:g}" fill="#{INK[0]:02x}{INK[1]:02x}{INK[2]:02x}" />
  {rects}
</svg>
"""
    with open(path, "w") as f:
        f.write(svg)
    print(f"{path}")


def in_rounded_rect(px, py, x, y, w, h, r):
    if not (x <= px <= x + w and y <= py <= y + h):
        return False
    r = min(r, w / 2, h / 2)
    cx = x + r if px < x + r else (x + w - r if px > x + w - r else px)
    cy = y + r if py < y + r else (y + h - r if py > y + h - r else py)
    if cx == px or cy == py:
        return True
    return math.hypot(px - cx, py - cy) <= r


def render(size, supersample=4):
    """RGB rows at `size` px, drawn at 4x and box-filtered down."""
    big = size * supersample
    scale = 32.0 / big

    # One coverage mask for the plate, one per plane. Planes overlap, so the
    # LAST plane covering a sample wins — that is the painter's order.
    plate = bytearray(big * big)
    plane_idx = bytearray(big * big)  # 0 = none, 1..n = PLANES index + 1
    for py in range(big):
        uy = (py + 0.5) * scale
        row = py * big
        for px in range(big):
            ux = (px + 0.5) * scale
            if in_rounded_rect(ux, uy, 0, 0, 32, 32, PLATE_RADIUS):
                plate[row + px] = 1
                for i, (x, y, _c) in enumerate(PLANES):
                    if in_rounded_rect(ux, uy, x, y, PLANE_SIZE, PLANE_SIZE, PLANE_RADIUS):
                        plane_idx[row + px] = i + 1
    rows = []
    n = supersample * supersample
    for y in range(size):
        out = bytearray([0])  # PNG filter byte: none
        for x in range(size):
            acc = [0.0, 0.0, 0.0]
            covered = 0
            for sy in range(supersample):
                base = (y * supersample + sy) * big + x * supersample
                for sx in range(supersample):
                    if not plate[base + sx]:
                        continue
                    covered += 1
                    idx = plane_idx[base + sx]
                    color = PLANES[idx - 1][2] if idx else INK
                    for c in range(3):
                        acc[c] += color[c]
            for c in range(3):
                # The plate is opaque wherever it covers; outside it, black at
                # zero coverage fades the plate's rounded corner smoothly.
                out.append(max(0, min(255, round(acc[c] / n))))
            _ = covered
        rows.append(bytes(out))
    return b"".join(rows)


def write_png(path, size):
    raw = render(size)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print(f"{path}  {size}x{size}  {len(png)} bytes")


if __name__ == "__main__":
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public = os.path.join(here, "public")
    write_svg(os.path.join(public, "favicon.svg"))
    write_png(os.path.join(public, "icon-192.png"), 192)
    write_png(os.path.join(public, "apple-touch-icon.png"), 180)
