"""Slack GIF: a kraft package opens and a glowing wisdom-spark rises out.

Evening-indigo palette matching the animation-demos reel set.
Outputs a 480x480 message GIF and a 128x128 emoji variant.
"""
import math
import sys
from pathlib import Path

SKILL = Path(r"C:\Users\musta\.claude\skills\slack-gif-creator")
sys.path.insert(0, str(SKILL))

from PIL import Image, ImageDraw, ImageFilter
from core.gif_builder import GIFBuilder
from core.easing import interpolate
from core.validators import validate_gif

SIZE = 480
FPS = 14
N = 44  # ~3.1s loop

# palette
INK_TOP = (45, 53, 89)      # #2d3559
INK_BOT = (21, 26, 48)      # #151a30
KRAFT = (201, 143, 78)      # #c98f4e
KRAFT_D = (169, 113, 58)    # #a9713a
TAPE = (232, 226, 210)
AMBER = (238, 187, 77)      # #eebb4d
CHALK = (244, 244, 240)
VERDI = (126, 189, 180)     # #7ebdb4

# box geometry
CX = SIZE // 2
BOX_W, BOX_H = 224, 158
BOX_TOP = 300
BOX_BOT = BOX_TOP + BOX_H
FLAP_L = BOX_W // 2
FLAP_T = 18


def gradient_bg():
    img = Image.new("RGB", (SIZE, SIZE))
    d = ImageDraw.Draw(img)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        c = tuple(round(a + (b - a) * t) for a, b in zip(INK_TOP, INK_BOT))
        d.line([(0, y), (SIZE, y)], fill=c)
    return img


def rot(px, py, ax, ay, ang):
    s, c = math.sin(ang), math.cos(ang)
    dx, dy = px - ax, py - ay
    return (ax + dx * c - dy * s, ay + dx * s + dy * c)


def flap_quad(side, ang):
    """Flap anchored at box top edge; ang=0 closed (lying inward), + opens outward."""
    ax = CX - BOX_W // 2 if side == "L" else CX + BOX_W // 2
    ay = BOX_TOP
    d = 1 if side == "L" else -1          # inward direction
    a = -ang * d                          # rotate outward/up
    pts = [(ax, ay), (ax + d * FLAP_L, ay),
           (ax + d * FLAP_L, ay - FLAP_T), (ax, ay - FLAP_T)]
    return [rot(x, y, ax, ay, a) for x, y in pts]


def spark_layer(x, y, r, alpha, wobble):
    """Glowing 4-point star on an RGBA layer."""
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    # halo rings
    for gr, ga in ((r * 3.1, 0.10), (r * 2.2, 0.20), (r * 1.5, 0.38)):
        d.ellipse([x - gr, y - gr, x + gr, y + gr],
                  fill=AMBER + (int(255 * ga * alpha),))
    # 4-point star (long vertical diamond + short horizontal)
    lr, sr = r * 1.55, r * 0.52
    ang = wobble
    pts = []
    for k in range(8):
        rad = lr if k % 2 == 0 else sr
        a = math.pi / 4 * k + ang
        pts.append((x + rad * math.sin(a), y - rad * math.cos(a)))
    d.polygon(pts, fill=CHALK + (int(255 * alpha),))
    core = r * 0.62
    d.ellipse([x - core, y - core, x + core, y + core],
              fill=AMBER + (int(255 * alpha),))
    return layer.filter(ImageFilter.GaussianBlur(0.6))


def sparkle(d, x, y, r, color, alpha):
    pts = [(x, y - r), (x + r * 0.3, y - r * 0.3), (x + r, y), (x + r * 0.3, y + r * 0.3),
           (x, y + r), (x - r * 0.3, y + r * 0.3), (x - r, y), (x - r * 0.3, y - r * 0.3)]
    d.polygon(pts, fill=color + (int(255 * alpha),))


def phase(i):
    """Return (flap_angle, spark_progress, spark_alpha, squash).

    Loop: anticipate -> flaps open -> spark rises & hovers -> spark sets -> flaps close.
    """
    t = i / N
    # flaps: open during [0.12, 0.30], close during [0.82, 0.97]
    if t < 0.12:
        fa = 0.0
    elif t < 0.30:
        fa = interpolate(0, 1, (t - 0.12) / 0.18, easing="back_out")
    elif t < 0.82:
        fa = 1.0
    elif t < 0.97:
        fa = interpolate(1, 0, (t - 0.82) / 0.15, easing="ease_in_out")
    else:
        fa = 0.0
    # spark: rise [0.26,0.5], hover [0.5,0.72], set [0.72,0.86]
    if t < 0.26:
        sp, sa = 0.0, 0.0
    elif t < 0.5:
        p = (t - 0.26) / 0.24
        sp = interpolate(0, 1, p, easing="ease_out")
        sa = min(1.0, p * 2.5)
    elif t < 0.72:
        sp, sa = 1.0, 1.0
    elif t < 0.86:
        p = (t - 0.72) / 0.14
        sp = interpolate(1, 0.1, p, easing="ease_in")
        sa = 1.0 - p
    else:
        sp, sa = 0.0, 0.0
    # anticipation squash just before opening
    if t < 0.12:
        squash = 1.0 + 0.05 * math.sin(t / 0.12 * math.pi)
    else:
        squash = 1.0
    return fa * math.radians(132), sp, sa, squash


def make_frame(i):
    frame = gradient_bg().convert("RGBA")
    d = ImageDraw.Draw(frame)

    # lamplight pool behind the box
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([CX - 190, BOX_TOP - 140, CX + 190, BOX_BOT + 60],
               fill=AMBER + (18,))
    frame = Image.alpha_composite(frame, glow.filter(ImageFilter.GaussianBlur(30)))
    d = ImageDraw.Draw(frame)

    fa, sp, sa, squash = phase(i)

    # spark behind front face while low, above when risen: draw box first, spark after,
    # but mask spark's lower part by redrawing box front when sp small — simpler:
    # draw spark before box when sp < 0.25, after otherwise.
    spark_y = BOX_TOP + 10 - sp * 165 + 4 * math.sin(i * 0.5)
    wob = 0.25 * math.sin(i * 0.7)
    spark_img = spark_layer(CX, spark_y, 26 + 3 * math.sin(i * 0.9), sa, wob) if sa > 0 else None

    if spark_img is not None and sp < 0.25:
        frame = Image.alpha_composite(frame, spark_img)
        d = ImageDraw.Draw(frame)

    # box body (with anticipation squash)
    bh = int(BOX_H / squash)
    bw = int(BOX_W * squash)
    top = BOX_BOT - bh
    d.rectangle([CX - bw // 2, top, CX + bw // 2, BOX_BOT], fill=KRAFT)
    d.rectangle([CX - bw // 2, top, CX + bw // 2, BOX_BOT], outline=KRAFT_D, width=3)
    # side shading
    d.rectangle([CX + bw // 2 - 26, top, CX + bw // 2, BOX_BOT], fill=KRAFT_D)
    # tape stripe
    d.rectangle([CX - 13, top, CX + 13, BOX_BOT], fill=TAPE + (200,))
    # label
    d.rectangle([CX - bw // 2 + 18, BOX_BOT - 52, CX - bw // 2 + 88, BOX_BOT - 18],
                fill=CHALK)
    d.line([CX - bw // 2 + 26, BOX_BOT - 42, CX - bw // 2 + 80, BOX_BOT - 42],
           fill=(35, 41, 70), width=3)
    d.line([CX - bw // 2 + 26, BOX_BOT - 30, CX - bw // 2 + 64, BOX_BOT - 30],
           fill=(176, 174, 165), width=3)

    # flaps
    for side in ("L", "R"):
        q = flap_quad(side, fa)
        d.polygon(q, fill=(216, 163, 95), outline=KRAFT_D)

    if spark_img is not None and sp >= 0.25:
        frame = Image.alpha_composite(frame, spark_img)
        d = ImageDraw.Draw(frame)

    # ambient sparkles while spark is up
    if sa > 0.5:
        import random
        rng = random.Random(7)
        for k in range(6):
            ox = rng.uniform(-120, 120)
            oy = rng.uniform(-90, 30)
            ph = rng.uniform(0, math.tau)
            a = max(0.0, math.sin(i * 0.55 + ph)) * (sa - 0.5) * 2
            if a > 0.05:
                col = VERDI if k % 2 else AMBER
                sparkle(d, CX + ox, spark_y - 20 + oy, 5 + 2 * (k % 3), col, a * 0.85)

    return frame.convert("RGB")


def build(size, out, emoji):
    builder = GIFBuilder(width=size, height=size, fps=FPS)
    for i in range(N):
        f = make_frame(i)
        if size != SIZE:
            f = f.resize((size, size), Image.LANCZOS)
        builder.add_frame(f)
    builder.save(out, num_colors=96 if not emoji else 48,
                 optimize_for_emoji=emoji, remove_duplicates=True)
    passes, info = validate_gif(out, is_emoji=emoji, verbose=True)
    print(f"{out}: passes={passes}")


if __name__ == "__main__":
    media = Path(r"C:\Users\musta\Documents\animation-demos\media")
    media.mkdir(exist_ok=True)
    build(SIZE, str(media / "04-slack.gif"), emoji=False)
    build(128, str(media / "04-slack-emoji.gif"), emoji=True)
