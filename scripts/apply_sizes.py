"""
Adds size ranges to the uniform products in src/data/products.json.

Sizes supplied by the owner:
  Shirt sizes: 36, 38, 40, 42, 44, 46
  Pant sizes:  28, 30, 32, 34, 36, 38, 40

A product gets shirt sizes if it includes a shirt/top, pant sizes if it includes
pants, and both when it is a full set. Ladies uniforms use the same sizes.
Run after scripts/extract_catalog.py (which calls this automatically).

Usage: python scripts/apply_sizes.py
"""
from __future__ import annotations

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS = os.path.join(ROOT, "src", "data", "products.json")

SHIRT = ["36", "38", "40", "42", "44", "46"]
PANT = ["28", "30", "32", "34", "36", "38", "40"]

# category -> which garments the product includes (checked against the catalogue photos)
GARMENTS = {
    "security-shirts": ("shirt",),                          # shirt only
    "security-uniform-sets": ("shirt", "pant"),             # shirt + trousers
    "ladies-guard-uniforms": ("shirt", "pant"),             # top + trousers
    "ladies-guard-uniforms-waistcoat": ("shirt", "pant"),   # top + trousers (+ waistcoat)
    "housekeeping-shirts": ("shirt",),
    "regular-shirts": ("shirt",),
    "safari-suits": ("shirt", "pant"),                      # shirt + trousers
}


def size_groups(category: str) -> list[dict]:
    groups = []
    for g in GARMENTS.get(category, ()):
        groups.append({"label": "Shirt" if g == "shirt" else "Pant", "sizes": SHIRT if g == "shirt" else PANT})
    return groups


def main() -> None:
    with open(PRODUCTS, encoding="utf-8") as f:
        products = json.load(f)
    n = 0
    for p in products:
        groups = size_groups(p["category"])
        p["sizeGroups"] = groups
        p["availableSizes"] = [f"{g['label']} {s}" for g in groups for s in g["sizes"]]
        n += bool(groups)
    with open(PRODUCTS, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    print(f"sizes added to {n} of {len(products)} products")


if __name__ == "__main__":
    main()
