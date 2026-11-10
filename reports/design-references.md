# Design reference study

Visited in the built-in browser before implementation. Several sites are WebGL-heavy and the browser pane could
not always capture screenshots while they rendered; in those cases the live DOM was inspected instead (fonts,
canvases, smooth-scroll library, layout).

| Reference | Accessible | What was observed | Principle taken for Everbright |
|---|---|---|---|
| landonorris.com | Yes (partial screenshots) | Lenis smooth scroll, ~20 canvases, dark olive base (`rgb(40,44,32)`), contour-line background behind the portrait, giant uppercase kinetic words mixing a display face with a variable sans, tight negative tracking. | A full-screen signature background that is *textural*, not decorative; one display face + one sans; scroll-driven reveals. |
| siena.film | Yes | Black screen, centred wordmark "SIENA" with a widely tracked "FILM FOUNDATION" sub-line, ivory text (`#FAF7EF`), restrained ENTER control, Lenis. | The centred two-line lockup: large serif word above a hairline, widely tracked second word beneath. Ivory-on-dark palette. |
| lusion.co | Yes | Numeric preloader, then a framed WebGL scene; Aeonik sans; minimal header with a single CTA. | Real-time GPU rendering for the hero; keep surrounding UI minimal so the visual carries the page. |
| activetheory.net | Yes (loader + scene) | Long loader, then a dark teal cinematic WebGL environment with a glowing object reacting to scroll/cursor. | Cursor-reactive lighting and a dark, teal-green ambient light; motion that responds rather than loops. |
| maxmara.com | Yes (US store) | Full-bleed editorial hero with serif title and rectangular outlined CTA; category tiles; product grid of isolated garments on light grey at 3:4, small uppercase labels, generous whitespace, no rounded cards or pills. | Product photography on a quiet ivory field, 4:5 frames, tiny tracked labels, rectangular buttons, catalogue index typography. |
| awwwards.com | Not visited | — | Optional reference; skipped to keep time on implementation. |

## Resulting Everbright identity

- **Signature**: procedural midnight-green satin (WebGL) with fine woven threads catching the light and
  champagne-gold glints on the folds; the light follows the cursor. The brand lockup is EVERBRIGHT (Cormorant
  Garamond 300) / gold seam / UNIFORM (tracked caps in champagne gold).
- **Intro**: threads sweep in on a flat midnight field → satin emerges → the gold seam draws across the centre →
  EVERBRIGHT rises out of the seam → UNIFORM descends from it → tagline, navigation, scroll cue. ~3.5 s; replays at
  2.4× speed later in the same session and never on route changes.
- **Chapters**: each division opens like a curtain (clip-path scrub), with a giant drifting index numeral and
  masked headline reveal. Police = graphite, Uniform = paper ivory, Bags = midnight with a woven texture.
- **Catalogue**: sticky catalogue index with dotted leaders and counts; 4:5 ivory "prints" with multiply-blended
  photographs; hover swaps to the back view; gold cursor disc labelled "View".
- No copied layouts, assets, text or code from the references.
