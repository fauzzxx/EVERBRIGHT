"""
Everbright Uniforms — catalogue extraction pipeline.

Reads the supplied catalogue PDFs (never modified), extracts the embedded
product photograph from every page, removes printed banners/labels by crop,
splits front/back views where the catalogue shows both, and writes:

  public/catalog/<division>/<category>/<product-id>/<product-id>-NN.webp
  src/data/products.json
  reports/image-manifest.json
  reports/extraction-stats.json
  reports/contact-sheets/*.jpg

All product names come from the labels printed on the catalogue pages
(transcribed below in CATALOGUE). Where a page carries no printed name the
product is flagged `reviewRequired`.

Usage:  python scripts/extract_catalog.py
Requires: pymupdf, pillow
"""
from __future__ import annotations

import io
import json
import os
import re
import statistics
from dataclasses import dataclass, field

import pymupdf
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, "reference pdfs")
OUT_IMG = os.path.join(ROOT, "public", "catalog")
OUT_JSON = os.path.join(ROOT, "src", "data", "products.json")
REPORTS = os.path.join(ROOT, "reports")
MAX_SIDE = 1200
WEBP_QUALITY = 84

# --------------------------------------------------------------------------
# Layout rules (fractions of the embedded page image)
# --------------------------------------------------------------------------


@dataclass
class Layout:
    mode: str  # pair | single | views2 | multi
    y0: float = 0.0
    y1: float = 1.0
    x0: float = 0.0
    x1: float = 1.0
    band: tuple[float, float] = (0.44, 0.58)  # where to search the front/back split
    details: tuple[float, float, float, float] | None = None  # multi: detail column box


@dataclass
class Item:
    page: int
    name: str
    category: str
    source_label: str
    catalogue_no: str | None = None
    colourway: str | None = None
    series: str | None = None
    features: list[str] = field(default_factory=list)
    name_source: str = "catalogue-label"
    review: list[str] = field(default_factory=list)
    layout: Layout | None = None  # per-item override


@dataclass
class Pdf:
    file: str
    division: str
    layout: Layout
    items: list[Item]
    note: str = ""


def L(*a, **k):
    return Layout(*a, **k)


SPELLING = [
    (r"\bCoffe\b", "Coffee"),
    (r"\bAppolo\b", "Apollo"),
    (r"\bWase Coat\b", "Waistcoat"),
    (r"\bStrips\b", "Stripes"),
]


def fix(s: str) -> str:
    for a, b in SPELLING:
        s = re.sub(a, b, s, flags=re.I)
    return s


def tc(s: str) -> str:
    small = {"with", "and", "of"}
    words = s.lower().split()
    out = []
    for i, w in enumerate(words):
        if i and w in small:
            out.append(w)
        elif w == "&" or w == "/":
            out.append(w)
        else:
            out.append("-".join(p[:1].upper() + p[1:] for p in w.split("-")))
    return " ".join(out)


# --------------------------------------------------------------------------
# Catalogue transcription (labels as printed on each page)
# --------------------------------------------------------------------------

CATALOGUE: list[Pdf] = []

# ---- Police division ------------------------------------------------------

sec_shirts = [
    (1, "01", "SHEMRAY SECURITY SHIRT"), (2, "02", "FILA-FIL SECURITY SHIRT"),
    (3, "03", "SKY BLUE SECURITY SHIRT"), (4, "04", "ROYAL BLUE SECURITY SHIRT"),
    (5, "05", "AIR FORCE BLUE SECURITY SHIRT"), (6, "06", "APPOLO BLUE SECURITY SHIRT"),
    (7, "07", "PEACOCK BLUE SECURITY SHIRT"), (8, "08", "DARK BLUE SECURITY UNIFORM"),
    (9, "09", "JET BLACK SECURITY UNIFORM"), (10, "10", "WHITE SECURITY SHIRT"),
    (11, "11", "BLUE LINING SECURITY SHIRT"), (12, "12", "LIGHT GREY SECURITY SHIRT"),
    (13, "13", "DARK GREY SECURITY SHIRT"), (14, "14", "BEIGE SECURITY SHIRT"),
    (15, "15", "BISCUIT SECURITY SHIRT"), (16, "16", "LIGHT GREEN SECURITY SHIRT"),
    (17, "17", "BOTTLE GREEN SECURITY SHIRT"),
]
items = []
for p, no, lab in sec_shirts:
    is_set = "UNIFORM" in lab
    lay = None
    if is_set:
        lay = L("pair", 0.0, 0.925)
    elif p == 10:
        lay = L("pair", 0.0, 0.885)
    elif p >= 11:
        lay = L("pair", 0.0, 0.9)
    items.append(Item(p, tc(fix(lab)), "security-uniform-sets" if is_set else "security-shirts",
                      f"{no} | {lab}", no, tc(fix(lab.replace(' SECURITY SHIRT', '').replace(' SECURITY UNIFORM', ''))),
                      layout=lay))
CATALOGUE.append(Pdf("EVERBRIGHT POLICE STORE SECURITY SHIRT'S.pdf", "police", L("pair", 0.0, 0.88), items))

guard_colours = ["SHEMRAY & DARK BLUE", "FILA-FIL & BLACK", "BISCUIT & COFFE", "DARK BLUE & RED",
                 "AIR FORCE BLUE & DARK BLUE", "MAROON & BLACK", "CYAN & DARK BLUE",
                 "GREY WITH CYAN & BLACK", "BLUE LINING & DARK BLUE", "BLUE CHECKS & BLACK"]
CATALOGUE.append(Pdf(
    "EVERBRIGHT POLICE STORE LADY GUARD UNIFORM'S.pdf", "police", L("pair", 0.055, 0.895, x0=0.012, x1=0.988, band=(0.45, 0.55)),
    [Item(i + 1, f"{tc(fix(c))} Guard Uniform", "ladies-guard-uniforms",
          f"LADIES SECURITY GUARD UNIFORM | {c}", f"{i + 1:02d}", tc(fix(c)), name_source="catalogue-label")
     for i, c in enumerate(guard_colours)]))
CATALOGUE.append(Pdf(
    "EVERBRIGHT POLICE STORE LADY GUARD UNIFORM'S WITH WASE COAT.pdf", "police",
    L("pair", 0.065, 0.9, x0=0.012, x1=0.988, band=(0.45, 0.55)),
    [Item(i + 1, f"{tc(fix(c))} Guard Uniform with Waistcoat", "ladies-guard-uniforms-waistcoat",
          f"LADIES SECURITY GUARD UNIFORM | {c}", f"{i + 1:02d}", tc(fix(c)))
     for i, c in enumerate(guard_colours)]))

caps = []
for p in range(1, 15):
    if p <= 4:
        lay = L("single", 0.0, 0.83)
    elif p == 5:
        lay = L("single", 0.0, 0.905)
    elif p in (10, 12):
        lay = L("single", 0.0, 0.89)
    elif p in (13, 14):
        lay = L("single", 0.0, 0.865)
    else:
        lay = L("single", 0.0, 0.91)
    caps.append(Item(p, f"Security Cap No. {p:02d}", "caps-berets",
                     f"{p:02d}" if p <= 4 else f"NO. {p:02d}", f"{p:02d}", layout=lay,
                     name_source="catalogue-number"))
CATALOGUE.append(Pdf("EVERBRIGHT POLICE STORE SECURITY CAP'S.pdf", "police", L("single"), caps))

flap_labels = {11: "Black with Golden", 12: "Dark Blue with Golden", 13: "Red with Golden",
               14: "Black with Red", 15: "Black with White", 16: "Black with Orange (Radium)",
               17: "Black with Yellow (Radium)"}
flaps = []
for p in range(1, 18):
    if p in flap_labels:
        lab = flap_labels[p]
        flaps.append(Item(p, f"{lab} Shoulder Flap", "shoulder-flaps", lab, None, lab,
                          layout=L("single", 0.0, 0.95 if p == 17 else 0.935)))
    else:
        flaps.append(Item(p, f"Security Shoulder Flap — Design {p:02d}", "shoulder-flaps",
                          "(no printed label)", None, layout=L("single"), name_source="catalogue-order",
                          review=["No printed product name or colour on the catalogue page; "
                                  "name assigned from page order."]))
CATALOGUE.append(Pdf("EVERBRIGHT POLICE STORE SECURITY SHOULDER FLAPS.pdf", "police", L("single"), flaps))

CATALOGUE.append(Pdf(
    "EVERBRIGHT POLICE STORE SECURITY SHOULDER PAD'S.pdf", "police", L("single"),
    [Item(p, f"Security Shoulder Pads — Design {p:02d}", "shoulder-pads", "(no printed label)", None,
          name_source="catalogue-order",
          review=["No printed product name or colour on the catalogue page; name assigned from page order."])
     for p in range(1, 10)]))

# ---- Uniform division -----------------------------------------------------

hk = ["DARK BLUE & MAROON", "JET BLACK & MAROON", "RED & BEIGE", "BEIGE & MAROON", "LIGHT GREY & MAROON",
      "PINK & DARK BLUE", "PALE PINK & DARK BLUE", "COFFE & BEIGE", "BEIGE & NAVY", "NAVY & ORANGE",
      "PURPLE & ORANGE", "ROYAL BLUE & ORANGE", "PURPLE & RED", "CYAN & DARK BLUE", "NAVY BLUE & CYAN",
      "GREY & CYAN", "DARK BLUE & LINING"]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS H.K SHIRTS.pdf", "uniform", L("pair", 0.098, 0.9, x0=0.012, x1=0.988),
    [Item(i + 1, f"{tc(fix(c))} Housekeeping Shirt", "housekeeping-shirts", f"{i + 1:02d} | {c}",
          f"{i + 1:02d}", tc(fix(c))) for i, c in enumerate(hk)]))

eps_review = ("Filename 'E P S House Keeping Shirt's' may refer to the Police Store, but the pages show "
              "unbranded housekeeping shirts with no police/security reference. Shown under EVERBRIGHT "
              "UNIFORM — please confirm the division.")
eps_a = {1: ("2", "Red / Beige"), 2: ("1", "Charcoal / Maroon"), 3: ("3", "Brown / Beige"),
         4: ("4", "Beige / Maroon"), 5: ("5", "Navy / Blue"), 6: ("6", "Navy / Orange"),
         7: ("7", "Purple / Orange"), 8: ("8", "Royal Blue / Orange"), 9: ("9", "Purple / Red"),
         10: ("10", "Cyan Blue / Navy")}
eps_b = {11: ("1", "Light Grey / Maroon"), 12: ("2", "Beige / Navy"), 13: ("3", "Pink / Black"),
         14: ("4", "Charcoal Grey / Cyan Blue"), 15: ("5", "Black / Blue Striped"),
         16: ("6", "Pale Pink / Black"), 17: ("7", "Dark Navy / Maroon — Previous Design")}
eps = []
for p, (no, lab) in {**eps_a, **eps_b}.items():
    series = "EPS Series A" if p <= 10 else "EPS Series B"
    colour = lab.replace(" — Previous Design", "")
    if p <= 10:
        lay = L("pair", 0.012, 0.81 if p >= 9 else 0.9, x0=0.01, x1=0.96, band=(0.47, 0.58))
    elif p <= 16:
        lay = L("pair", 0.125, 0.875, x0=0.015, x1=0.985, band=(0.45, 0.58))
    else:
        lay = L("pair", 0.085, 0.845, x0=0.2, x1=0.8, band=(0.45, 0.55))
    eps.append(Item(p, f"{colour} Housekeeping Shirt", "housekeeping-shirts", f"{no}. {lab}", f"{int(no):02d}",
                    colour, series, ["Marked 'Previous Design' in the catalogue"] if "Previous" in lab else [],
                    review=[eps_review] + (["Low-resolution source image (768 px wide page)."] if p <= 10 else []),
                    layout=lay))
CATALOGUE.append(Pdf("E P S House Keeping Shirt's.pdf", "uniform", L("pair"), eps,
                     note="Classification ambiguous — see review report."))

CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS CHEF COAT'S.pdf", "uniform", L("pair", 0.125, 1.0, band=(0.45, 0.56)),
    [Item(i + 1, f"{n} Chef Coat Set", "chef-coat-sets", f"SERIAL NO {i + 1} | {n.upper()} CHEF COAT SET",
          f"{i + 1:02d}", n)
     for i, n in enumerate(["Black & Red", "Red & Black", "Maroon and Black", "White and Black", "White and Red"])]))

cafe = ["GREEN", "NAVY BLUE", "COFFEE", "MAROON", "PINK"]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS CAFE APRON'S.pdf", "uniform", L("pair", 0.152, 1.0, band=(0.46, 0.56)),
    [Item(i + 1, f"{tc(c)} Cafe Apron", "cafe-aprons", f"CAFE APRON'S No {i + 1:02d} | {c}", f"{i + 1:02d}", tc(c),
          layout=L("pair", 0.165, 0.9, band=(0.46, 0.57)) if i == 0 else None) for i, c in enumerate(cafe)]))

multi = ["Cyan Color", "Appolo Blue", "Burgundy", "Khaki", "Beige"]
detail_feats = ["Neck strap & eyelet", "Shoulder pad", "Upper pocket", "Lower pocket with flap",
                "Side eyelet & tie strap"]
kitchen = []
for i, c in enumerate(multi):
    colour = fix(c).replace(" Color", "")
    kitchen.append(Item(i + 1, f"{colour} Multi-Purpose Apron", "multi-purpose-aprons",
                        f"{c} Multi Purpose Apron", None, colour,
                        features=detail_feats[:4] if i == 0 else detail_feats,
                        layout=L("multi", 0.0, 0.875, x0=0.0, x1=0.715, band=(0.52, 0.66),
                                 details=(0.715, 0.0, 1.0, 0.935))))
k1 = ["Brown with Dark Blue", "Burgundy with Dark Blue", "Brown with Beige", "Beige with Brown",
      "Brown with Beige", "Beige with Brown"]
for i, c in enumerate(k1):
    kitchen.append(Item(6 + i, f"{c} Kitchen Apron", "kitchen-aprons", f"No. {i + 1:02d} | {c} Kitchen Apron",
                        f"{i + 1:02d}", c, "Series I", layout=L("pair", 0.0, 0.815, x0=0.0, x1=1.0, band=(0.45, 0.56))))
k2 = ["Jet Black", "Black with Red", "Red with Black", "Maroon with Red", "Coffee with Red", "Coffee with Beige",
      "Navy Blue with Red", "Navy Blue with Cyan"]
for i, c in enumerate(k2):
    kitchen.append(Item(12 + i, f"{c} Kitchen Apron", "kitchen-aprons", f"No. {i + 1:02d} | {c} Kitchen Apron",
                        f"{i + 1:02d}", c, "Series II", layout=L("single", 0.0, 0.885)))
CATALOGUE.append(Pdf("EVERBRIGHT UNIFORMS KITCHEN APRON'S.pdf", "uniform", L("single"), kitchen))

wpa = [("WPA-01", "Maroon with Black Dots"), ("WPA-02", "Jet Black"), ("WPA-03", "Golden")]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS WATER PROOF APRON'S.pdf", "uniform", L("single", 0.0, 0.895),
    [Item(i + 1, f"{c} Waterproof Apron", "waterproof-aprons", f"{no} | Water Proof Apron ({c})", no, c,
          features=["Water proof material"]) for i, (no, c) in enumerate(wpa)]))

reg = ["SHEMRAY", "FILA-FIL", "WHITE", "OFF-WHITE", "PURPLE", "SHEMRAY", "FILA-FIL"]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS REGULAR SHIRT'S.pdf", "uniform", L("pair", 0.0, 0.885),
    [Item(i + 1, f"{tc(c)} Shirt No. {i + 1:02d}", "regular-shirts",
          f"REGULAR SHIRT NO. {i + 1:02d} | {c} SHIRT", f"{i + 1:02d}", tc(c)) for i, c in enumerate(reg)]))

saf = ["DARK BLUE", "JET BLACK", "CHARCOAL GREY", "NAVY BLUE"]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS SAFARI SUIT'S.pdf", "uniform", L("pair", 0.0, 0.895),
    [Item(i + 1, f"{tc(c)} Safari Suit", "safari-suits", f"{c} SAFARI SUIT", None, tc(c)) for i, c in enumerate(saf)]))

wc = [("Jet Black Wase Coat", "Jet Black"), ("Dark Blue Wase Coat", "Dark Blue"), ("Maroon Wase Coat", "Maroon"),
      ("Beige Wase Coat", "Beige"), ("Coffe Colour Wase Coat", "Coffee"),
      ("Maroon Black Stripe Wase Coat", "Maroon Black Stripe"),
      ("Dark Blue Wase Coat with Strips (Reversible - Same Design on Both Sides)", "Dark Blue Stripe")]
CATALOGUE.append(Pdf(
    "EVERBRIGHT UNIFORMS WASE COAT'S.pdf", "uniform", L("pair", 0.105, 0.925),
    [Item(i + 1, ("Dark Blue Striped Waistcoat" if i == 6 else fix(lab).replace("Colour ", "")), "waistcoats",
          lab, None, col, features=["Reversible — same design on both sides"] if i == 6 else [])
     for i, (lab, col) in enumerate(wc)]))

# --------------------------------------------------------------------------
# Image helpers
# --------------------------------------------------------------------------


def slug(s: str) -> str:
    s = s.lower().replace("&", " ").replace("'", "")
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s)).strip("-")


def ink_mask(im: Image.Image):
    """Return (w, h, col_profile, row_profile) of 'ink' relative to the border background."""
    small = im.copy()
    small.thumbnail((400, 400))
    w, h = small.size
    px = small.load()
    border = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] + \
             [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
    bg = tuple(statistics.median(c[i] for c in border) for i in range(3))
    cols = [0] * w
    rows = [0] * h
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2])) > 48:
                cols[x] += 1
                rows[y] += 1
    return w, h, [c / h for c in cols], [r / w for r in rows]


def find_split(im: Image.Image, band) -> float:
    w, h, cols, _ = ink_mask(im)
    a, b = int(band[0] * w), int(band[1] * w)
    sm = [sum(cols[max(0, i - 2):i + 3]) / len(cols[max(0, i - 2):i + 3]) for i in range(w)]
    best = min(range(a, b), key=lambda i: (round(sm[i], 3), abs(i - w / 2)))
    return best / w


def trim(im: Image.Image, margin=0.045, thr=0.02) -> Image.Image:
    w, h, cols, rows = ink_mask(im)
    xs = [i for i, v in enumerate(cols) if v > thr]
    ys = [i for i, v in enumerate(rows) if v > thr]
    if not xs or not ys:
        return im
    W, H = im.size
    sx, sy = W / w, H / h
    x0, x1 = xs[0] * sx, (xs[-1] + 1) * sx
    y0, y1 = ys[0] * sy, (ys[-1] + 1) * sy
    m = margin * max(x1 - x0, y1 - y0)
    box = (max(0, int(x0 - m)), max(0, int(y0 - m)), min(W, int(x1 + m)), min(H, int(y1 + m)))
    return im.crop(box)


def erase_label(im: Image.Image) -> None:
    """Remove the solid colour name tag printed in the top-left corner (EPS series A pages).

    The tag is a filled rectangle: find the first row with a long non-white run that starts near
    the left edge, follow it down while the left edge stays filled, then paint that box white.
    """
    W, H = im.size
    px = im.load()

    def ink(x, y):
        r, g, b = px[x, y]
        return min(r, g, b) < 200

    for y in range(int(0.01 * H), int(0.12 * H)):
        start = next((x for x in range(max(3, int(0.006 * W)), int(0.08 * W)) if ink(x, y) and ink(x + 3, y) and ink(x + 6, y)), None)
        if start is None:
            continue
        end = start
        while end + 1 < W and (ink(end + 1, y) or (end + 3 < W and ink(end + 3, y))):
            end += 1
        if end - start < 0.08 * W:
            continue
        bottom = y
        probe = min(start + 3, W - 1)
        while bottom + 1 < H and ink(probe + 3, bottom + 1):
            bottom += 1
        ImageDraw.Draw(im).rectangle((0, 0, end + 3, bottom + 3), fill=(255, 255, 255))
        return


def save(im: Image.Image, path: str) -> tuple[int, int]:
    im = im.copy()
    if max(im.size) > MAX_SIDE:
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    return im.size


def frac_box(im, x0, y0, x1, y1):
    W, H = im.size
    return im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main():
    products, manifest, stats = [], [], []
    sheets: dict[str, list[tuple[Image.Image, str]]] = {}
    for pdf in CATALOGUE:
        path = os.path.join(PDF_DIR, pdf.file)
        doc = pymupdf.open(path)
        pdf_stats = {"pdf": pdf.file, "pages": len(doc), "products": 0, "images": 0, "division": pdf.division,
                     "note": pdf.note}
        assert len(doc) == len(pdf.items), (pdf.file, len(doc), len(pdf.items))
        for it in pdf.items:
            page = doc[it.page - 1]
            xref = page.get_images(full=True)[0][0]
            raw = Image.open(io.BytesIO(doc.extract_image(xref)["image"])).convert("RGB")
            lay = it.layout or pdf.layout
            if pdf.file.startswith("E P S") and it.page <= 10:
                erase_label(raw)
            base = frac_box(raw, lay.x0, lay.y0, lay.x1, lay.y1)
            pid = slug(f"{it.category}-{it.series or ''}-{it.catalogue_no or f'{it.page:02d}'}-{it.colourway or ''}")
            if it.category in ("caps-berets",):
                pid = slug(f"security-cap-{it.catalogue_no}")
            if it.category in ("shoulder-flaps", "shoulder-pads") and not it.colourway:
                pid = slug(f"{it.category}-design-{it.page:02d}")
            folder = os.path.join(OUT_IMG, pdf.division, it.category, pid)
            views: list[tuple[str, Image.Image, str]] = []
            if lay.mode == "single":
                views.append(("main", base, "Product view"))
            else:
                region = base
                split = find_split(region, lay.band)
                W, H = region.size
                left = trim(region.crop((0, 0, int(split * W), H)))
                right = trim(region.crop((int(split * W), 0, W, H)))
                if lay.mode == "views2":
                    views += [("front", left, "Front view"), ("side", right, "Side view"),
                              ("both", trim(region), "Both views")]
                else:
                    views += [("front", left, "Front view"), ("back", right, "Back view"),
                              ("front-back", trim(region), "Front and back views")]
                if lay.details:
                    views.append(("detail", frac_box(raw, *lay.details), "Detail views"))
            images = []
            for n, (view, im, caption) in enumerate(views, 1):
                fname = f"{pid}-{n:02d}.webp"
                fpath = os.path.join(folder, fname)
                w, h = save(im, fpath)
                rel = "/" + os.path.relpath(fpath, os.path.join(ROOT, "public")).replace(os.sep, "/")
                images.append({"src": rel, "view": view, "caption": caption, "width": w, "height": h,
                               "alt": f"{it.name} — {caption.lower()}"})
                manifest.append({"file": rel, "productId": pid, "view": view, "width": w, "height": h,
                                 "sourcePdf": pdf.file, "sourcePage": it.page, "layout": lay.mode,
                                 "cropFractions": [lay.x0, lay.y0, lay.x1, lay.y1]})
                sheets.setdefault(pdf.file, []).append((im, f"p{it.page} {view}"))
            pdf_stats["images"] += len(images)
            pdf_stats["products"] += 1
            products.append({
                "id": pid,
                "name": it.name,
                "division": pdf.division,
                "category": it.category,
                "catalogueNo": it.catalogue_no,
                "series": it.series,
                "colourway": it.colourway,
                "description": "",
                "features": it.features,
                "images": images,
                "availableSizes": [],
                "availableColours": [],
                "sourcePdf": pdf.file,
                "sourcePage": [it.page],
                "sourceLabel": it.source_label,
                "nameSource": it.name_source,
                "reviewRequired": bool(it.review),
                "reviewNotes": it.review,
            })
        stats.append(pdf_stats)

    ids = [p["id"] for p in products]
    dupes = {i for i in ids if ids.count(i) > 1}
    assert not dupes, dupes

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    os.makedirs(REPORTS, exist_ok=True)
    with open(os.path.join(REPORTS, "image-manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(os.path.join(REPORTS, "extraction-stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)

    # Contact sheets for quick visual review
    cs_dir = os.path.join(REPORTS, "contact-sheets")
    os.makedirs(cs_dir, exist_ok=True)
    for file, tiles in sheets.items():
        cell = 220
        cols = 8
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell, rows * (cell + 16)), (245, 241, 232))
        d = ImageDraw.Draw(sheet)
        for k, (im, label) in enumerate(tiles):
            t = im.copy()
            t.thumbnail((cell - 8, cell - 8))
            x, y = (k % cols) * cell, (k // cols) * (cell + 16)
            sheet.paste(t, (x + (cell - t.width) // 2, y + 4 + (cell - 8 - t.height) // 2))
            d.text((x + 4, y + cell), label, fill=(9, 45, 38))
        sheet.save(os.path.join(cs_dir, slug(file[:-4]) + ".jpg"), quality=82)

    print(f"products={len(products)} images={len(manifest)}")
    for s in stats:
        print(f"  {s['pdf']}: pages={s['pages']} products={s['products']} images={s['images']}")


if __name__ == "__main__":
    main()
