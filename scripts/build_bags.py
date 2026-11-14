"""
Everbright Fire and Safety — bag catalogue builder.

Source photographs (supplied by the owner) live in `reference images/bags/`, and the
material specifications in `reference pdfs/EVERBRIGHT Material Specifications.pdf`.
This script writes optimised WebP images to public/catalog/bags/... and the product
records to src/data/bags.json.

Product ↔ specification matching was done by product type (laptop bag, shoulder-strap
document bag, case, vertical document bag, box) and is flagged for owner confirmation.

Usage: python scripts/build_bags.py
"""
from __future__ import annotations

import json
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "reference images", "bags")
OUT = os.path.join(ROOT, "public", "catalog", "bags")
JSON_OUT = os.path.join(ROOT, "src", "data", "bags.json")
SPEC_PDF = "EVERBRIGHT Material Specifications.pdf"
MAX_SIDE = 1400

FIRE_ZIPPER = {
    "name": "Fire-retardant zipper",
    "material": "Flame-retardant fabric tape",
    "points": [
        "Removes the weak point at the opening, so the bag stays fire-resistant without gaps",
        "Built for frequent daily opening and closing",
    ],
    "standards": ["UL94 V0", "RoHS"],
}
FOIL_LINING = {
    "name": "Inner layer",
    "material": "Aluminium foil fiberglass cloth (hot-pressed composite)",
    "points": [
        "Long-term operating temperature range −40 °C to 250 °C",
        "Thermal insulation that keeps internal temperature stable",
        "Aluminium layer isolates moisture and resists mildew",
        "Electromagnetic shielding",
        "Combines flexibility and rigidity to resist compression",
    ],
    "standards": ["UL94 5VA", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                  "Glowing Wire Test", "Explosion-proof Test"],
}

PRODUCTS = [
    {
        "id": "fire-laptop-bag-carbon-fiber",
        "name": "Carbon Fiber Laptop Top Bag",
        "category": "fire-laptop-bags",
        "modelNo": "08.03.0670",
        "specTitle": "EVA Laptop Bag",
        "specPages": [1],
        "dimensions": "38.5 × 28.7 × 7.5 cm (W × H × D)",
        "description": "A slim, hard-shell laptop bag with a carbon-fiber finish, combination code lock and fireproof "
                       "zipper. Inside, a 14-section expandable document organizer (A–N), mesh pockets and card and "
                       "ID slots keep a laptop, files and essentials in order.",
        "features": ["Combination code lock", "Fireproof zipper", "Carbon-fiber finish", "Water resistant",
                     "14 expandable document sections (A–N)", "Card & ID slots, mesh pockets",
                     "Laptop & document compartment"],
        "images": [("3.jpeg", "main", "Product view"), ("2.jpeg", "front-back", "Front and back views"),
                   ("WhatsApp Image 2026-11-14 at 4.05.19 PM.jpeg", "detail", "Key features"),
                   ("5.jpeg", "detail", "Features & dimensions"), ("4.jpeg", "detail", "Document organizer"),
                   ("6.jpeg", "detail", "Card & ID organizer")],
        "layers": [
            {"name": "Outer fabric", "material": "0.5 mm single-sided black dustproof silicone fiberglass cloth",
             "points": ["Fire retardant — no open-flame propagation", "Smooth dustproof surface, easy to clean",
                        "Wear and scratch resistant", "Uniform thickness (tolerance ≤ ±0.05 mm)"],
             "standards": ["UL94 V0", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                           "Glowing Wire Test", "Explosion-proof Test"]},
            {"name": "Middle layer", "material": "EVA foam",
             "points": ["Cushions and absorbs impact from knocks and drops (e.g. 1.2 m)",
                        "Foam pores slow heat transfer and add temperature insulation"],
             "standards": []},
            {**FIRE_ZIPPER, "name": "Zipper", "material": "Fire-retardant metal zipper"},
        ],
    },
    {
        "id": "fire-security-bag-shoulder-strap",
        "name": "Multipurpose Security Bag — Shoulder Strap",
        "category": "fire-security-bags",
        "modelNo": "08.05.0223",
        "specTitle": "Fireproof document bag (shoulder strap version)",
        "specPages": [2],
        "dimensions": "36 × 27 × 10 cm",
        "description": "Carry cash, mobile phones, jewellery, documents and cards safely. A code lock, carry handle "
                       "and padded, adjustable shoulder strap; inside, card slots, mesh pockets and a zipped mesh "
                       "pocket around a spacious main compartment.",
        "features": ["Code lock", "Carry handle + adjustable shoulder strap", "Padded shoulder support",
                     "8 card slots", "3 mesh pockets", "Zipped mesh pocket", "Spacious main compartment"],
        "images": [("8.jpeg", "main", "Product view"), ("7.jpeg", "front-back", "Front and back views"),
                   ("9.jpeg", "detail", "Features & dimensions"), ("10.jpeg", "detail", "Features overview"),
                   ("11.jpeg", "detail", "Interior & details")],
        "layers": [
            {"name": "Outer layer", "material": "Liquid silicone fiberglass cloth (silicone coating + fiberglass base)",
             "points": ["Fire retardant, waterproof and moisture-proof", "Wear and scratch resistant",
                        "Flexible and conforming — avoids scratching what is inside"],
             "standards": ["UL94 5VA", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                           "Glowing Wire Test"]},
            {"name": "Middle spacer", "material": "PP board",
             "points": ["Lightweight and high-strength", "Compression and impact resistant",
                        "Gives the bag its structure and keeps its shape"],
             "standards": ["GB/T 1041-2008 (compression)"]},
            FIRE_ZIPPER,
        ],
    },
    {
        "id": "fire-safety-case",
        "name": "Fire & Waterproof Safety Case",
        "category": "fire-security-bags",
        "modelNo": "08.05.0224",
        "specTitle": "Hardware Safe Case",
        "specPages": [3, 4],
        "dimensions": "39 × 30 × 14 cm (L × H × D)",
        "description": "Protects valuables from fire, water and heat. Built-in code lock and fireproof zipper; a lid "
                       "organizer with a large document pocket, mesh pockets and 16 card slots, plus cash pockets "
                       "and a spacious main storage compartment.",
        "features": ["Built-in code lock", "Fireproof zipper", "Fireproof stitching thread", "Extra reinforced stitching",
                     "Large document pocket", "16 card slots", "Cash & essentials pockets", "Strong carry handle"],
        "images": [("16.jpeg", "main", "Product view"), ("13.jpeg", "detail", "Fireproof & waterproof"),
                   ("14.jpeg", "detail", "Features & product views"), ("15.jpeg", "detail", "Interior organizer"),
                   ("12.jpeg", "detail", "Details & dimensions")],
        "layers": [
            {"name": "Outer layer", "material": "0.5 mm single-sided black liquid silicone fiberglass cloth",
             "points": ["Excellent fire resistance and flame retardancy", "Tough, wear-resistant, anti-ageing surface",
                        "Waterproof and moisture-proof", "Holds its shape — resists deformation"],
             "standards": ["UL94 V0", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                           "Glowing Wire Test", "IPX5"]},
            {"name": "Middle layer", "material": "15 mm flame-retardant fiberglass insulation",
             "points": ["Blocks high and low outside temperatures", "Light, soft and elastic — cushions impacts"],
             "standards": ["GB/T 10294-2008 (thermal)", "UL94 V0 and above"]},
            FOIL_LINING,
            FIRE_ZIPPER,
        ],
    },
    {
        "id": "fire-document-bag-vertical",
        "name": "Fire-Resistant Document Bag",
        "category": "fire-document-bags",
        "modelNo": "08.03.0671",
        "specTitle": "Fireproof vertical document bag",
        "specPages": [5],
        "dimensions": "38 × 20.5 × 6.5 cm (W × H × D)",
        "description": "Secure storage for your most important documents — bonds, registrations, property papers and "
                       "certificates. Fire-resistant zipper and edging, a silver heat-resistant inner lining and a "
                       "carry handle, in a slim, lightweight envelope.",
        "features": ["Fire-resistant zipper", "Fire-resistant edging", "Silver heat-resistant inner lining",
                     "Carry handle", "Lightweight & portable"],
        "images": [("19.jpeg", "main", "Product view"), ("17.jpeg", "main", "With handle"),
                   ("20.jpeg", "detail", "Features & dimensions"), ("18.jpeg", "detail", "For important documents"),
                   ("21.jpeg", "detail", "Inner lining")],
        "layers": [
            {"name": "Outer layer", "material": "Liquid silicone fiberglass cloth (silicone coating + fiberglass base)",
             "points": ["Long-term operating range −40 °C to 200 °C; instantaneous up to 800 °C",
                        "Delays the spread of fire", "Waterproof and dustproof (IPX5)",
                        "Abrasion and tear resistant", "Resistant to acid, alkali and oil"],
             "standards": ["UL94 V-0", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                           "Glowing Wire Test"]},
            FOIL_LINING,
            FIRE_ZIPPER,
        ],
    },
    {
        "id": "fire-battery-box",
        "name": "Fireproof Battery Box",
        "category": "fire-boxes",
        "modelNo": "08.06.0169",
        "specTitle": "Fireproof Document Box",
        "specPages": [6, 7],
        "dimensions": "39.5 × 31 × 25.5 cm (L × H × D)",
        "description": "A rigid fireproof box for batteries and flammable equipment such as lithium-ion batteries, "
                       "battery packs, power tools and drones. Combination code lock, fireproof zipper, reflective "
                       "tape, adjustable carry strap, side pockets, a name-card holder and anti-slip feet.",
        "features": ["Combination code lock", "Fireproof zipper", "Fireproof heat-resistant lining",
                     "Two side pockets", "Zippered mesh pocket inside lid", "Reflective (radium) tape",
                     "Adjustable carrying handle", "Anti-slip feet"],
        "images": [("24.jpeg", "main", "Product view"), ("23.jpeg", "detail", "Interior"),
                   ("25.jpeg", "detail", "Features & dimensions"), ("26.jpeg", "detail", "Multiple views"),
                   ("22.jpeg", "detail", "Back & bottom")],
        "layers": [
            {"name": "Outer layer", "material": "0.5 mm single-sided black liquid silicone fiberglass cloth",
             "points": ["Excellent fire resistance and flame retardancy", "Wear-resistant, anti-ageing surface",
                        "Waterproof and moisture-proof", "Holds its shape — resists deformation"],
             "standards": ["UL94 V0", "RoHS IEC 62321", "CE", "REACH", "PFAS Test", "Prop 65 Test",
                           "Glowing Wire Test"]},
            {"name": "Middle layer 1", "material": "4 mm honeycomb board (polypropylene honeycomb core)",
             "points": ["Lightweight yet strong", "Stable pressure and impact resistance",
                        "Keeps the box rigid and spreads outside forces"],
             "standards": []},
            {"name": "Middle layer 2", "material": "5 mm flame-retardant thermal insulation cotton (top and sides)",
             "points": ["Blocks high and low outside temperatures", "Cushions and absorbs impacts"],
             "standards": ["GB/T 10294-2008 (thermal)", "UL94 V0 and above"]},
            FOIL_LINING,
            FIRE_ZIPPER,
        ],
    },
]


def main() -> None:
    products = []
    for p in PRODUCTS:
        folder = os.path.join(OUT, p["category"], p["id"])
        os.makedirs(folder, exist_ok=True)
        images = []
        for n, (src, view, caption) in enumerate(p["images"], 1):
            im = Image.open(os.path.join(SRC, src)).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            name = f"{p['id']}-{n:02d}.webp"
            im.save(os.path.join(folder, name), "WEBP", quality=84, method=6)
            images.append({"src": f"/catalog/bags/{p['category']}/{p['id']}/{name}", "view": view,
                           "caption": caption, "width": im.width, "height": im.height,
                           "alt": f"{p['name']} — {caption.lower()}"})
        products.append({
            "id": p["id"], "name": p["name"], "division": "bags", "category": p["category"],
            "catalogueNo": None, "series": None, "colourway": "Black",
            "description": p["description"], "features": p["features"], "images": images,
            "availableSizes": [], "availableColours": [],
            "sourcePdf": SPEC_PDF, "sourcePage": p["specPages"],
            "sourceLabel": f"{p['specTitle']} ({p['modelNo']})", "nameSource": "product-photo",
            "reviewRequired": True,
            "reviewNotes": [f"Specification matched by product type to '{p['specTitle']}' ({p['modelNo']}); "
                            "please confirm."],
            "modelNo": p["modelNo"], "dimensions": p["dimensions"], "layers": p["layers"],
            "sourcePhotos": [s for s, _, _ in p["images"]],
        })
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    print(f"bags: {len(products)} products, {sum(len(p['images']) for p in products)} images")


if __name__ == "__main__":
    main()
