#!/usr/bin/env python3
"""Génère public/og.png (1200×630) aux couleurs du site."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og.png"
ICON = ROOT / "public" / "icons" / "icon-512.png"
FRAUNCES = "/usr/share/fonts/truetype/sand-box/google/Fraunces/Fraunces-VariableFont_SOFT,WONK,opsz,wght.ttf"
OUTFIT = "/usr/share/fonts/truetype/sand-box/google/Outfit/Outfit-VariableFont_wght.ttf"
PAPER = (243, 238, 230, 255)
INK = (28, 23, 20, 255)
MUTED = (78, 70, 63, 255)
ACCENT = (154, 52, 18, 255)
PEACH = (253, 232, 216, 255)
MINT = (231, 243, 234, 255)


def load_font(path: str, size: int, wanted: dict[str, float]) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(path, size=size)
    values = []
    for item in font.get_variation_axes():
        name = item["name"].decode() if isinstance(item["name"], bytes) else item["name"]
        values.append(wanted.get(name, item["default"]))
    font.set_variation_by_axes(values)
    return font


def main() -> None:
    title_font = load_font(FRAUNCES, 74, {"Optical Size": 144, "Weight": 700, "Softness": 0, "Wonky": 1})
    tag_font = load_font(OUTFIT, 36, {"Weight": 600})
    foot_font = load_font(OUTFIT, 26, {"Weight": 500})

    img = Image.new("RGBA", (1200, 630), PAPER)
    overlay = Image.new("RGBA", (1200, 630), (0, 0, 0, 0))
    draw_o = ImageDraw.Draw(overlay)
    draw_o.ellipse((-200, -260, 700, 360), fill=PEACH)
    draw_o.ellipse((700, -200, 1500, 420), fill=MINT)
    img = Image.alpha_composite(img, overlay.filter(ImageFilter.GaussianBlur(80)))
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 16, 630), fill=ACCENT)
    icon = Image.open(ICON).convert("RGBA").resize((220, 220), Image.Resampling.LANCZOS)
    img.paste(icon, (80, 205), icon)
    x, y = 340, 155
    draw.text((x, y), "Quel métier", font=title_font, fill=INK)
    draw.text((x, y + 90), "me correspond ?", font=title_font, fill=INK)
    draw.text((x, y + 210), "Trouve un métier qui te ressemble", font=tag_font, fill=ACCENT)
    draw.text((x, y + 278), "Quiz gratuit  ·  1 138 fiches Onisep  ·  sans compte", font=foot_font, fill=MUTED)
    draw.text((x, 540), "quelmetiermecorrespond.fr", font=foot_font, fill=MUTED)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
