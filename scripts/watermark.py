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
                   a_min: float = 0.06, a_max: float = 1.6, protect_vivid: bool = True) -> np.ndarray:
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

    # Solid artwork (printed logos, piping, buttons) is opaque: its blend factor towards
    # any overlay colour exceeds what a translucent watermark can produce. Protect it and its edges.
    solid = np.zeros((H, W_), bool)
    for col in colours:
        t = np.array(col, np.float32) - base
        tn2 = (t ** 2).sum(axis=2)
        a = (d * t).sum(axis=2) / np.maximum(tn2, 1.0)
        # a white logo reaches a≈1; a dark logo overshoots the grey overlay colour by far
        solid |= a > (0.92 if col == WHITE else 1.4)
    solid_px = cv2.morphologyEx(solid.astype(np.uint8), cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    # group letters into words/logos; only large groups are product artwork
    merged = cv2.dilate(solid_px, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.025),) * 2))
    n_s, lab_s, st_s, _ = cv2.connectedComponentsWithStats(merged, 8)
    big = np.zeros(n_s, bool)
    for i in range(1, n_s):
        if max(st_s[i, 2], st_s[i, 3]) >= size * 0.08:
            big[i] = True
    solid = (cv2.dilate(solid_px, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.008),) * 2)) > 0) & big[lab_s]
    mask &= ~solid
    mask &= ~protect_mask(rgb, base, protect_vivid)
    # Suppress long structures (garment outlines, seams, piping, stripes)
    m8 = mask.astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m8, 8)
    keep = np.zeros(n, bool)
    lim = size * 0.07
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
        x, y, w, h, area = st[i]
        # watermark copies are words/logos (wide clusters); buttons, labels and specks are small
        if max(w, h) >= size * 0.05:
            dense[i] = True
    m8 = m8 & dense[lab].astype(np.uint8)
    # cover each copy's soft anti-aliased fringe too, but never grow into solid artwork
    grown = cv2.dilate(m8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.006),) * 2)) > 0
    grown &= ~solid
    return grown.astype(np.uint8) * 255


def clean_backdrop(rgb: np.ndarray, gold: bool = False) -> np.ndarray:
    """Repaint the plain photographic backdrop (white or light grey) without any marks on it."""
    size = max(rgb.shape[:2])
    k = _odd(size * 0.035)
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    closed = cv2.morphologyEx(rgb, cv2.MORPH_CLOSE, se)            # removes darker marks
    gray_c = cv2.cvtColor(closed, cv2.COLOR_RGB2GRAY)
    sat = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)[..., 1]
    sat_o = cv2.morphologyEx(sat, cv2.MORPH_OPEN, se)               # removes small saturated marks
    bd = ((gray_c > 175) & (sat_o < 40)).astype(np.uint8)
    # stay clear of the garment
    bd = cv2.erode(bd, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.012),) * 2))
    bd = cv2.morphologyEx(bd, cv2.MORPH_OPEN, se)
    # only the open backdrop that reaches the photo edge (never areas enclosed by a garment)
    n, lab, st, _ = cv2.connectedComponentsWithStats(bd, 4)
    H, W = bd.shape
    edge_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bd = np.isin(lab, list(edge_ids)).astype(np.uint8)
    # only repaint pixels that are close to the backdrop colour (thin dark straps etc. stay)
    diff = np.abs(rgb.astype(np.int16) - closed.astype(np.int16)).max(axis=2)
    near = diff < 90
    if gold:
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        near |= (hsv[..., 0] >= 10) & (hsv[..., 0] <= 36) & (hsv[..., 1] >= 50)
    bd &= near.astype(np.uint8)
    fill = cv2.GaussianBlur(closed, (0, 0), size * 0.004)
    # Only repaint the marks themselves (small blobs that differ from the clean fill);
    # long structures such as folds and seams of a white garment are left untouched.
    diff_f = np.abs(rgb.astype(np.int16) - fill.astype(np.int16)).max(axis=2)
    marks = ((diff_f > 6) & (bd > 0)).astype(np.uint8)
    marks = cv2.dilate(marks, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.004),) * 2))
    n_m, lab_m, st_m, _ = cv2.connectedComponentsWithStats(marks, 8)
    small = np.zeros(n_m, bool)
    for i in range(1, n_m):
        if max(st_m[i, 2], st_m[i, 3]) <= size * 0.16:
            small[i] = True
    bd = (small[lab_m] & (bd > 0)).astype(np.uint8)
    bd = cv2.dilate(bd, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.006),) * 2))
    soft = cv2.GaussianBlur(bd.astype(np.float32), (0, 0), size * 0.002)[..., None]
    return (rgb * (1 - soft) + fill * soft).astype(np.uint8)


def gold_mask(rgb: np.ndarray) -> np.ndarray:
    """Small gold watermark pieces on fabric; large gold artwork and its surroundings are protected."""
    size = max(rgb.shape[:2])
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    g = ((h >= 12) & (h <= 34) & (s >= 60) & (v >= 70)).astype(np.uint8)
    # Group gold pieces into clusters (a watermark copy, or a product logo)
    cl = cv2.dilate(g, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.008),) * 2))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cl, 8)
    wm = np.zeros(n, bool)
    for i in range(1, n):
        dim = max(st[i, 2], st[i, 3])
        if dim <= size * 0.13:          # watermark copies are small; product logos/stripes are larger
            wm[i] = True
    m = (g > 0) & wm[lab]
    return cv2.dilate(m.astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))


def fill_from_surroundings(rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Fill masked pixels with the colour of the nearby unmasked cloth (normalised blur),
    then restore a little of the fabric's fine grain so the patch does not look flat."""
    size = max(rgb.shape[:2])
    m = (mask > 0).astype(np.float32)
    f = rgb.astype(np.float32)
    # Edge-preserving estimate of the bare cloth: a median wider than the watermark strokes.
    # Masked pixels are first replaced by a coarse median so they don't vote.
    k1 = _odd(size * 0.03)
    k2 = _odd(size * 0.05)
    pre = rgb.copy()
    coarse = cv2.medianBlur(rgb, k2)
    pre[m > 0] = coarse[m > 0]
    out = cv2.medianBlur(pre, k1).astype(np.float32)
    grain = f - cv2.GaussianBlur(f, (0, 0), 1.2)
    grain = np.clip(grain, -6, 6) * 0.5
    soft = cv2.GaussianBlur(m, (0, 0), 1.0)[..., None]
    res = f * (1 - soft) + (out + np.roll(grain, 7, axis=1)) * soft
    return np.clip(res, 0, 255).astype(np.uint8)


def remove_watermark(im: Image.Image, colours: list[tuple[int, int, int]], passes: int = 2,
                     gold: bool = False, **kw) -> Image.Image:
    rgb = np.array(im.convert("RGB"))
    size = max(rgb.shape[:2])
    r = max(3, int(size * 0.004))
    if gold:
        gm = gold_mask(rgb)
        if gm.any():
            rgb = cv2.inpaint(rgb, gm, r + 2, cv2.INPAINT_TELEA)
    for _ in range(passes):
        mask = watermark_mask(rgb, colours, protect_vivid=not gold, **kw)
        if not mask.any():
            break
        rgb = fill_from_surroundings(rgb, mask)
    rgb = clean_backdrop(rgb, gold)
    return Image.fromarray(rgb)


# ---------------------------------------------------------------------------
# Gold watermark (caps, shoulder flaps, shoulder pads): template matching
# ---------------------------------------------------------------------------

def _goldness(rgb: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    hue_w = np.clip(1 - np.abs(h - 24) / 14, 0, 1)
    return hue_w * np.clip((s - 40) / 120, 0, 1) * np.clip((v - 60) / 100, 0, 1)


def gold_template(pages: list[np.ndarray]):
    """Learn the gold watermark copy from complete copies sitting on the white backdrop."""
    cands, maps = [], []
    for pi, rgb in enumerate(pages):
        H, W = rgb.shape[:2]
        size = max(H, W)
        gm = _goldness(rgb)
        maps.append(gm)
        k = _odd(size * 0.035)
        se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        gray_c = cv2.morphologyEx(cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY), cv2.MORPH_CLOSE, se)
        bd = cv2.erode((gray_c > 200).astype(np.uint8), se)
        marks = ((gm > 0.15) & (bd > 0)).astype(np.uint8)
        merged = cv2.dilate(marks, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.012),) * 2))
        n, lab, st, _ = cv2.connectedComponentsWithStats(merged, 8)
        for i in range(1, n):
            x, y, w, h, a = st[i]
            if size * 0.04 < max(w, h) < size * 0.25 and x > 2 and y > 2 and x + w < W - 2 and y + h < H - 2:
                cands.append((pi, x, y, w, h))
    if len(cands) < 3:
        return None

    def close(a, b, tol):
        return abs(a[3] - b[3]) <= tol * b[3] and abs(a[4] - b[4]) <= tol * b[4]

    dims = np.array([max(c[3], c[4]) for c in cands], float)
    large = [c for c, d in zip(cands, dims) if d >= 0.7 * np.percentile(dims, 97)]
    _, _, ref = max(((sum(close(o, c, 0.06) for o in large), c[3] * c[4], c) for c in large), key=lambda t: (t[0], t[1]))
    good = [c for c in cands if close(c, ref, 0.08)]
    tw = int(np.median([c[3] for c in good]) * 1.06) + 4
    th = int(np.median([c[4] for c in good]) * 1.06) + 4
    crops = []
    for pi, x, y, w, h in good:
        H, W = pages[pi].shape[:2]
        x0, y0 = x + w // 2 - tw // 2, y + h // 2 - th // 2
        if x0 >= 0 and y0 >= 0 and x0 + tw <= W and y0 + th <= H:
            crops.append(maps[pi][y0:y0 + th, x0:x0 + tw])
    if len(crops) < 2:
        return None
    ref_c = crops[0]
    aligned = [ref_c]
    for c in crops[1:]:
        (dx, dy), resp = cv2.phaseCorrelate(ref_c.astype(np.float32), c.astype(np.float32))
        if resp > 0.1:
            aligned.append(cv2.warpAffine(c, np.float32([[1, 0, -dx], [0, 1, -dy]]), (tw, th), borderMode=cv2.BORDER_REPLICATE))
    t = np.median(np.stack(aligned), axis=0).astype(np.float32)
    support = cv2.dilate((t > 0.12).astype(np.uint8), np.ones((3, 3), np.uint8))
    return t, support


def _protected_art(rgb: np.ndarray) -> np.ndarray:
    """Large gold/orange product artwork (logos, stripes, SECURITY tabs) and a margin around it."""
    size = max(rgb.shape[:2])
    g = (_goldness(rgb) > 0.15).astype(np.uint8)
    cl = cv2.dilate(g, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (_odd(size * 0.006),) * 2))
    n, lab, st, _ = cv2.connectedComponentsWithStats(cl, 8)
    prot = np.zeros(rgb.shape[:2], bool)
    m = int(size * 0.05)
    H, W = prot.shape
    for i in range(1, n):
        x, y, w, h, _ = st[i]
        if max(w, h) >= size * 0.2:
            # protect the whole artwork area (letters inside a tab, the text line under a logo, ...)
            prot[max(0, y - m):min(H, y + h + m + int(h * 1.4)), max(0, x - m):min(W, x + w + m)] = True
    return prot


def _residual_gold(rgb: np.ndarray, protect: np.ndarray) -> np.ndarray:
    size = max(rgb.shape[:2])
    g = (_goldness(rgb) > 0.08).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(g, 8)
    small = np.zeros(n, bool)
    for i in range(1, n):
        if max(st[i, 2], st[i, 3]) <= size * 0.04:
            small[i] = True
    m = small[lab] & ~protect
    return cv2.dilate(m.astype(np.uint8) * 255, np.ones((5, 5), np.uint8))


def remove_gold_watermark(pages: list[np.ndarray], thr: float = 0.38, passes: int = 2) -> list[np.ndarray]:
    protects = [_protected_art(p) for p in pages]
    for _ in range(passes):
        pages = _gold_pass(pages, thr, protects)
    out = []
    for rgb, prot in zip(pages, protects):
        m = _residual_gold(rgb, prot)
        out.append(cv2.inpaint(rgb, m, max(3, int(max(rgb.shape[:2]) * 0.004)), cv2.INPAINT_TELEA) if m.any() else rgb)
    return out


def _gold_pass(pages: list[np.ndarray], thr: float, protects=None) -> list[np.ndarray]:
    learned = gold_template(pages)
    if learned is None:
        return pages
    t, support = learned
    th, tw = t.shape
    out = []
    for pi, rgb in enumerate(pages):
        protect = protects[pi] if protects is not None else None
        H, W = rgb.shape[:2]
        size = max(H, W)
        gm = _goldness(rgb)
        pad = max(tw, th)
        R = cv2.matchTemplate(cv2.copyMakeBorder(gm, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0), t, cv2.TM_CCOEFF_NORMED)
        mask = np.zeros((H, W), np.uint8)
        rx, ry = int(tw * 0.5), int(th * 0.5)
        for _ in range(600):
            _, mv, _, (x, y) = cv2.minMaxLoc(R)
            if mv < thr:
                break
            R[max(0, y - ry):y + ry, max(0, x - rx):x + rx] = -1
            x, y = x - pad, y - pad
            x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + tw), min(H, y + th)
            if x0 < x1 and y0 < y1:
                mask[y0:y1, x0:x1] |= support[y0 - y:y1 - y, x0 - x:x1 - x]
        # only the gold pixels of each matched copy (plus a fringe), never the whole box
        gold_px = (gm > 0.05).astype(np.uint8)
        m = cv2.dilate(mask & cv2.dilate(gold_px, np.ones((3, 3), np.uint8)), np.ones((5, 5), np.uint8))
        if protect is not None:
            m[protect] = 0
        out.append(cv2.inpaint(rgb, m * 255, max(3, int(size * 0.004)), cv2.INPAINT_TELEA) if m.any() else rgb)
    return out
