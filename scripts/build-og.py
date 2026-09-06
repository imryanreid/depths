#!/usr/bin/env python3
"""
Builds the static OG card. Run by hand with the SYSTEM python — it is the one
with Pillow (Motion's card was built the same way):

    /usr/bin/python3 scripts/build-og.py

Not a build step: the image never changes, so committing the PNG beats
rendering it on every request.

Mirrors the family card: mono eyebrow, big Geist title, ash subtitle on the
left; the tool's actual subject bleeding off the right edge. There it's
colour swatches (Ramps) and easing curves (Motion); here it's paper cards at
the five elevation levels, their shadows computed by the same recipe as
src/lib/depths.ts — key + ambient layers, Soft preset, overhead light. The
values are scaled up (SCALE below) because a 1px/2.6px level-one shadow is
invisible at card size; the ratios between levels are the real ones, which is
what makes the staircase read as one material at five heights.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FAMILY_ROOT = ROOT.parent
F = FAMILY_ROOT / "Ramps Studio" / "public" / "fonts"
OUT = ROOT / "public" / "og.png"
W, H, S = 1200, 630, 2          # S = supersample factor, downsampled at the end
PAPER, INK, ASH, LINE = (253, 253, 252), (22, 21, 15), (107, 106, 99), (230, 229, 223)


def f(name, size):
    return ImageFont.truetype(str(F / name), size * S)


# ---- The model, ported: Dramatic preset, overhead light ----
# Kept in step with src/lib/presets.ts and the layer recipe in depths.ts.
# Dramatic rather than Soft, on its own stated terms — "marketing surfaces and
# hero moments" is presets.ts's description of it, and an OG card is exactly
# that. Its three layers (contact + key + ambient) also read at card size,
# where Soft's 7% is a rumour.
DISTANCE, GROWTH, BLUR, OPACITY, FALLOFF = 2.0, 2.15, 2.2, 15.0, 0.85
SCALE = 1.6  # print legibility; ratios stay honest


def level_layers(level):
    """(dy, blur, alpha) per layer — contact, key, ambient — in card pixels."""
    u = DISTANCE * GROWTH ** (level - 1)
    a = (OPACITY / 100) * FALLOFF ** (level - 1)
    return [
        (min(u * 0.15, 1) * SCALE, max(1, u * 0.4) * SCALE, min(a * 1.4, 0.5)),
        (u * SCALE, u * BLUR * SCALE, a),
        (u * 0.35 * SCALE, u * BLUR * 2.2 * SCALE, a * 0.65),
    ]


img = Image.new("RGB", (W * S, H * S), PAPER)
d = ImageDraw.Draw(img)

# ---- Left: the same words as the page header ----
d.text((72 * S, 168 * S), "D E P T H S . S T U D I O", font=f("GeistMono-Regular.ttf", 19), fill=ASH)
title = f("Geist-SemiBold.ttf", 72)
d.text((72 * S, 214 * S), "Elevation & Shadow", font=title, fill=INK)
d.text((72 * S, 292 * S), "Generator", font=title, fill=INK)
sub = f("Geist-Regular.ttf", 26)
d.text((72 * S, 404 * S), "A six-level shadow scale from one light", font=sub, fill=ASH)
d.text((72 * S, 440 * S), "source, with a handoff your agent can read.", font=sub, fill=ASH)

# ---- Right: the staircase, bleeding off the edge like the family's cards ----
#
# Column start is measured off the widest line rather than hardcoded, same as
# Motion — the title is the widest thing on the left and its extent depends on
# the font.
widest = max(
    72 + d.textlength("Elevation & Shadow", font=title) / S,
    72 + d.textlength("A six-level shadow scale from one light", font=sub) / S,
)
GUTTER = 64
COL = math.ceil(widest + GUTTER)

CARD, RADIUS = 200, 16
STEP_X, STEP_Y = 58, 82
# Level 1 sits low-left, level 5 high-right with a modest bleed — ascending,
# the way elevation should read. Drawn in that order so higher levels overlap
# lower ones, shadows landing on whatever is beneath. Steps are tight (the
# favicon's overlap, at card scale) so the whole staircase stays on the page.
base_x = COL
base_y = H - CARD - 64

for level in range(1, 6):
    x = base_x + (level - 1) * STEP_X
    y = base_y - (level - 1) * STEP_Y

    # Shadows first, each layer blurred on its own overlay. CSS blur radius is
    # roughly twice the Gaussian sigma, hence the /2.
    for dy, blur, alpha in level_layers(level):
        overlay = Image.new("L", (W * S, H * S), 0)
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle(
            [x * S, (y + dy) * S, (x + CARD) * S, (y + CARD + dy) * S],
            radius=RADIUS * S,
            fill=int(alpha * 255),
        )
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=blur * S / 2))
        img.paste(Image.new("RGB", img.size, (0, 0, 0)), (0, 0), overlay)
        d = ImageDraw.Draw(img)

    # Then the card: paper with the family hairline.
    d.rounded_rectangle(
        [x * S, y * S, (x + CARD) * S, (y + CARD) * S],
        radius=RADIUS * S,
        fill=PAPER,
        outline=LINE,
        width=S,
    )
    # The level number, quiet mono in the card's lower-left — the region the
    # next card never overlaps.
    d.text(
        ((x + 18) * S, (y + CARD - 40) * S),
        str(level),
        font=f("GeistMono-Regular.ttf", 17),
        fill=ASH,
    )

img.resize((W, H), Image.LANCZOS).save(OUT)
print("wrote", OUT)
