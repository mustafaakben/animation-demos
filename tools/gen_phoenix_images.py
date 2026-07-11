"""gen_phoenix_images.py - build-time art for The Phoenix Brief (Nano Banana).

Generates scene backdrops + character portraits in a consistent editorial-
illustration style, plus ONE deliberately photorealistic AI 'team photo'
whose subtle generation artifacts are the in-game puzzle.

Idempotent: existing files are skipped. Delete a file to regenerate it.

Usage: python tools/gen_phoenix_images.py [--only name1,name2]
"""
import os
import sys
import time
from pathlib import Path

from google import genai
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "phoenix" / "img"
OUT.mkdir(parents=True, exist_ok=True)

MODEL = "gemini-2.5-flash-image"  # Nano Banana

STYLE = (
    "Warm editorial illustration, flat shapes with soft film grain, "
    "deep indigo night palette (#232946, #151a30) with amber lamplight (#eebb4d) "
    "accents and chalk-white highlights. Cinematic, cozy, slightly nostalgic. "
    "No text, no words, no letters anywhere in the image."
)
PORTRAIT = (
    "Portrait bust, chest up, facing slightly left, on a SOLID deep indigo "
    "background (#151a30). " + STYLE
)

IMAGES = {
    "bg_title": (
        "A university campus at dawn: red brick colonnade, huge oak trees, a round "
        "fountain, warm amber sky low on the horizon, and the faint silhouette of a "
        "phoenix rising woven subtly into the sky gradient. Wide establishing shot. " + STYLE
    ),
    "bg_office": (
        "Interior of a small university communications office in early morning: two desks "
        "with monitors, a warm desk lamp, coffee mug, pinned press clippings as blank shapes, "
        "a window showing brick campus and oaks outside, one chair pulled out. Wide shot. " + STYLE
    ),
    "bg_it": (
        "A campus IT security desk corner at morning: three monitors with abstract network "
        "graphs (no readable text), a lanyard and badge on the desk, server closet door ajar "
        "with soft blue glow, coffee thermos. Wide shot. " + STYLE
    ),
    "bg_publish": (
        "Over-the-shoulder close-up of hands hovering above a laptop keyboard, one finger "
        "raised in hesitation, screen glowing warm amber with an abstract button shape "
        "(no readable text), dark office around the pool of light. " + STYLE
    ),
    "bg_quad": (
        "A sunny university lawn mid-morning gathering: students and faculty holding coffee "
        "cups under enormous oak trees, red brick buildings behind, banners as blank color "
        "shapes, relaxed festive mood, long soft shadows. Wide shot. " + STYLE
    ),
    "maya": (
        "A Latina woman in her early forties, university communications director: blazer over "
        "a college t-shirt, ID lanyard, short dark hair tucked behind one ear, holding a coffee "
        "mug, expression warm, quick and slightly tired-around-the-eyes. " + PORTRAIT
    ),
    "jordan": (
        "A Black woman, twenty years old, university junior and undergraduate researcher: "
        "natural coily hair, denim jacket with an enamel pin, holding a lab notebook, "
        "expression bright, precise, quietly proud. " + PORTRAIT
    ),
    "sam": (
        "A Filipino man in his mid-thirties, campus IT security analyst: navy polo with badge "
        "clip, trimmed beard, headset around neck, expression calm with dry amusement. " + PORTRAIT
    ),
    "nova": (
        "An abstract AI assistant avatar: a softly glowing amber orb with two thin concentric "
        "rings, faint circuitry filigree inside, hovering over a deep indigo void, minimal and "
        "elegant, gentle bloom. " + STYLE
    ),
    "photo_team_ai": (
        "A framed group 'photo' rendered as a warm editorial illustration: FOUR diverse college "
        "students in a research lab posing proudly around an academic poster on an easel. "
        "Deliberate uncanny details, clearly visible: one student wears a crimson t-shirt with "
        "the word HARVARD in clean collegiate lettering across the chest; the research poster's "
        "title and text are unreadable melted squiggles that only imitate writing; every ID badge "
        "on their lanyards shows smudged letter-like marks instead of names. Slightly too-perfect "
        "smiles. Flat shapes with soft film grain, indigo and amber palette with chalk highlights. "
        "The HARVARD lettering is the ONLY legible text in the image."
    ),
    # Follow-up shots: Nano Banana image-to-image, using the finished portraits
    # as identity + style references so new scenes stay consistent.
    "bg_lab_call": {
        "prompt": (
            "Using the attached character reference image (keep the SAME woman: same face, hair, "
            "denim jacket, enamel pin, same illustration style), draw her in a psychology lab "
            "between experiment stations, holding a phone to her ear mid-conversation, smiling, "
            "lab bench and glassware around her, morning light through a window. Wide cinematic "
            "shot, she stands on the right third. " + STYLE
        ),
        "refs": ["jordan.jpg"],
    },
    "bg_coffee": {
        "prompt": (
            "Using the two attached character reference images (keep the SAME two women: the older "
            "one in the blazer with the coffee mug, the younger one in the denim jacket — same "
            "faces, same illustration style), draw them standing together on a sunny university "
            "lawn during a morning coffee gathering, laughing, holding paper cups, students and "
            "oak trees and red brick buildings softly behind them. Wide warm shot. " + STYLE
        ),
        "refs": ["maya.jpg", "jordan.jpg"],
    },
}


def main() -> None:
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    done = skipped = failed = 0

    for name, spec in IMAGES.items():
        if only and name not in only:
            continue
        prompt = spec["prompt"] if isinstance(spec, dict) else spec
        refs = spec.get("refs", []) if isinstance(spec, dict) else []
        out = OUT / f"{name}.png"
        if out.exists() and not only:
            skipped += 1
            continue
        contents = [Image.open(OUT / r) for r in refs] + [prompt]
        for attempt in range(3):
            try:
                resp = client.models.generate_content(model=MODEL, contents=contents)
                blob = None
                for part in resp.candidates[0].content.parts:
                    if getattr(part, "inline_data", None) and part.inline_data.data:
                        blob = part.inline_data.data
                        break
                if not blob:
                    raise RuntimeError("no image in response")
                out.write_bytes(blob)
                print(f"[img] {name}.png ok ({len(blob)//1024} KB)")
                done += 1
                break
            except Exception as exc:  # noqa: BLE001
                print(f"[img] {name} attempt {attempt + 1} failed: {exc}")
                time.sleep(8 * (attempt + 1))
        else:
            failed += 1
        time.sleep(2)

    print(f"[img] done - {done} generated, {skipped} already present, {failed} failed.")


if __name__ == "__main__":
    main()
