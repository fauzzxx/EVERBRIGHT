"""
Watermark removal for the Everbright catalogue photographs.

Each catalogue overlays its plates with a repeated, semi-transparent watermark of a
fixed colour W (white text, a grey logo or a gold logo). Where the watermark sits,
a pixel is a blend  I = a·W + (1 − a)·B  of that colour and the fabric/backdrop B.

Detection compares every pixel with a local estimate of the unmarked surface (a
median filter wider than the watermark strokes). A pixel is treated as watermark
when its deviation points from the surface towards W (direction check) with a
small-to-moderate blend factor a. Printed product artwork — embroidered logos,
piping, buttons, seams — is opaque or a different colour, so it fails the
direction / strength test. Long edges (garment outlines, seams) are suppressed.

Marked pixels are filled with OpenCV inpainting from their surroundings.
"""
from __future__ import annotations

import cv2
import numpy as np
from PIL import Image

# Overlay colours used by the catalogues
WHITE = (255, 255, 255)
GREY = (150, 150, 150)
GOLD = (228, 172, 52)


def _odd(n: float) -> int:
    n = max(3, int(round(n)))
    return n if n % 2 else n + 1


def protect_mask(rgb: np.ndarray, base: np.ndarray, protect_vivid: bool) -> np.ndarray:
    """Pixels that must never be edited: garment outlines and (optionally) vivid printed artwork."""
    size = max(rgb.shape[:2])
    bg = cv2.cvtColor(base.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(bg, 25, 70)
    prot = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.006),) * 2)) > 0
    if protect_vivid:
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        vivid = ((hsv[..., 1] > 120) & (hsv[..., 2] > 110) & (hsv[..., 0] >= 10) & (hsv[..., 0] <= 40)).astype(np.uint8)
        vivid = cv2.morphologyEx(vivid, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        prot |= cv2.dilate(vivid, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.012),) * 2)) > 0
    return prot


def watermark_mask(rgb: np.ndarray, colours: list[tuple[int, int, int]], stroke: float = 0.024,
                   a_min: float = 0.06, a_max: float = 0.7, protect_vivid: bool = True) -> np.ndarray:
    H, W_ = rgb.shape[:2]
    size = max(H, W_)
    k = _odd(size * stroke)                      # wider than the watermark strokes / icons
    base = cv2.medianBlur(rgb, k).astype(np.float32)
    I = rgb.astype(np.float32)
    d = I - base
    dn = np.linalg.norm(d, axis=2)

    mask = np.zeros((H, W_), bool)
    for col in colours:
        t = np.array(col, np.float32) - base     # direction towards the overlay colour
        tn2 = (t ** 2).sum(axis=2)
        dot = (d * t).sum(axis=2)
        a = dot / np.maximum(tn2, 1.0)
        cos = dot / np.maximum(dn * np.sqrt(tn2), 1e-3)
        mask |= (a >= a_min) & (a <= a_max) & (cos > 0.86) & (dn > 7) & (np.sqrt(tn2) > 25)

    mask &= ~protect_mask(rgb, base, protect_vivid)
    # Suppress long structures (garment outlines, seams, piping, stripes)
    m8 = mask.astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m8, 8)
    keep = np.zeros(n, bool)
    lim = size * 0.035
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if max(w, h) <= lim and area >= 2:
            keep[i] = True
    m8 = keep[lab].astype(np.uint8)

    # Watermark strokes come in clusters (letters of a word); drop isolated specks.
    cl = cv2.dilate(m8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.012),) * 2))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cl, 8)
    dense = np.zeros(n, bool)
    for i in range(1, n):
        if st[i, 4] >= (size * 0.012) ** 2 * 3:
            dense[i] = True
    m8 = m8 & dense[lab].astype(np.uint8)
    return cv2.dilate(m8 * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))


def remove_watermark(im: Image.Image, colours: list[tuple[int, int, int]], passes: int = 2, **kw) -> Image.Image:
    rgb = np.array(im.convert("RGB"))
    size = max(rgb.shape[:2])
    for _ in range(passes):
        mask = watermark_mask(rgb, colours, **kw)
        if not mask.any():
            break
        rgb = cv2.inpaint(rgb, mask, max(3, int(size * 0.004)), cv2.INPAINT_TELEA)
    return Image.fromarray(rgb)
