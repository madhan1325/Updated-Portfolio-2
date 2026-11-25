#!/usr/bin/env python3
"""
Replace a temporary cover with your real artwork.

    python3 tools/add-cover.py <image> <item-id> [--alt "Short description of the artwork"]

Example:
    python3 tools/add-cover.py ~/Desktop/diwali-poster.png tevatel-poster-01 \
        --alt "Tevatel festive poster with gold type on deep green"

What it does
  1. Writes assets/covers/<item-id>-{360,720,1080}.{avif,webp} (never upscales,
     never crops: the artwork keeps its own aspect ratio).
  2. Updates that item in js/projects.js: width, height, palette tone, tiny blur
     preview, alt text, and marks it as no longer temporary.
  3. Rebuilds the first-artwork block in index.html (the server-rendered first
     Tevatel poster), so the first image is always correct in the initial HTML.

Needs Python 3 and Pillow 11+ (pip install pillow). Item ids are listed in
js/projects.js and in COVERS-NEEDED.md.
"""
import argparse, base64, io, json, re, sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "assets" / "covers"
WIDTHS = (360, 720, 1080)


def variants(im, slug):
    """Write responsive AVIF + WebP files. Returns (w, h, tone, lqip)."""
    im = ImageOps.exif_transpose(im).convert("RGB")
    COVERS.mkdir(parents=True, exist_ok=True)
    for w in WIDTHS:
        tw = min(w, im.width)
        r = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
        r.save(COVERS / f"{slug}-{w}.webp", quality=80, method=6)
        r.save(COVERS / f"{slug}-{w}.avif", quality=58)
    # palette: average colour of the artwork, used for the matte and backdrop
    avg = im.resize((1, 1), Image.BOX).getpixel((0, 0))
    tone = "#%02x%02x%02x" % avg
    # 24px preview, blurred by the browser into the stage backdrop
    tiny = im.resize((24, max(1, round(im.height * 24 / im.width))), Image.BOX)
    buf = io.BytesIO(); tiny.save(buf, "WEBP", quality=50)
    lqip = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    ref = min(1080, im.width)
    return ref, round(im.height * ref / im.width), tone, lqip


def set_field(line, key, value):
    js = json.dumps(value, ensure_ascii=False)
    pat = re.compile(r"(\b%s:\s*)(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|true|false|\d+)" % key)
    if pat.search(line):
        return pat.sub(lambda m: m.group(1) + js, line, count=1)
    return line.replace(" }", ", %s: %s }" % (key, js), 1)


def first_block():
    """Server-render the first Tevatel poster into index.html between markers."""
    src = (ROOT / "js" / "projects.js").read_text(encoding="utf-8")
    m = re.search(r"\{ id: [\"']tevatel-poster-01[\"'].*?\}", src)
    if not m:
        return
    line = m.group(0)
    get = lambda k: re.search(r"\b%s:\s*(\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|\d+)" % k, line).group(1).strip("'\"")
    slug, w, h, alt = get("cover"), get("w"), get("h"), get("alt")
    html = (
        '<picture class="fp"><source type="image/avif" srcset="{s}-360.avif 360w, {s}-720.avif 720w, {s}-1080.avif 1080w" sizes="{z}">'
        '<img class="fi" style="--ar:{w}/{h}" src="{s}-720.webp" srcset="{s}-360.webp 360w, {s}-720.webp 720w, {s}-1080.webp 1080w" sizes="{z}" '
        'width="{w}" height="{h}" alt="{a}" fetchpriority="high" decoding="async"></picture>'
    ).format(s=slug, w=w, h=h, a=alt.replace('"', "&quot;"), z="(max-width: 760px) 88vw, (max-width: 1100px) 62vw, 40vw")
    idx = ROOT / "index.html"
    page = idx.read_text(encoding="utf-8")
    page = re.sub(r"<!--FIRST-->.*?<!--/FIRST-->", "<!--FIRST-->" + html + "<!--/FIRST-->", page, flags=re.S)
    idx.write_text(page, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image"); ap.add_argument("id"); ap.add_argument("--alt", default=None)
    a = ap.parse_args()
    pj = ROOT / "js" / "projects.js"
    lines = pj.read_text(encoding="utf-8").split("\n")
    hit = [i for i, l in enumerate(lines) if ("id: '%s'" % a.id) in l or ('id: "%s"' % a.id) in l]
    if not hit:
        sys.exit("No item with id '%s' in js/projects.js" % a.id)
    w, h, tone, lqip = variants(Image.open(a.image), a.id)
    i = hit[0]
    for k, v in (("w", w), ("h", h), ("tone", tone), ("lqip", lqip), ("temp", False)):
        lines[i] = set_field(lines[i], k, v)
    if a.alt:
        lines[i] = set_field(lines[i], "alt", a.alt)
    pj.write_text("\n".join(lines), encoding="utf-8")
    first_block()
    print("Updated %s: %dx%d, tone %s%s" % (a.id, w, h, tone, "" if a.alt else "  (tip: add --alt to describe the artwork)"))


if __name__ == "__main__":
    main()
