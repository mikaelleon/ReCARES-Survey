# Site images

Photographs and optional brand files for the **running website**. For why the site looks the way it does, see [docs/design.md](../../docs/design.md).

Drop final image files here. Next.js serves anything under `public/` at the site root, so a file at:

`public/images/hero-perimeter.jpg`

is available in the app as:

`/images/hero-perimeter.jpg`

## In use

| File | Used for | Notes |
| --- | --- | --- |
| `hero/day-*`, `hero/dusk-*`, `hero/night-*`, `hero/dawn-*` (`.avif`, `.webp`) | Landing page backdrop | Four shots of the same court at 640, 1024, 1536 and 2048 px wide, from `h3.png` (day), `h4.png` (dusk), `h2.png` (night) and `h5.png` (dawn). Light theme shows day, dark shows night; a theme change plays dusk or dawn between them. Loaded through `<picture>` in `components/home/HomePage.tsx`. |
| `hero/board.avif`, `hero/board.webp` | Backdrop of the board under the hero | The lower part of the same photo, blurred and darkened (sharp `blur(16)`, brightness 0.6), 900 px wide, 3 to 5 KB. The CSS scales it to cover. |
| `h1.png` | Not used | An earlier day photo. Kept as a source file; not referenced from code. |

## Optional

| File | Used for | Notes |
| --- | --- | --- |
| `favicon.ico` or `og-image.png` | Browser tab / social share | Place favicon in `public/` (not this folder) if you add one. OG image can live here. |
| Camella / partner logos | Branding moments only | Not used in UI chrome per the design brief. Keep originals here if you need them later. |

## Not image assets

- **ReCARES wordmark** — rendered in type (Poppins 700, one color) on the hero notice, not a logo file.
- **Icons** — Lucide React in code; no icon PNGs needed.

## Naming

Use lowercase kebab-case. Keep originals + a web-optimized copy if helpful:

```
hero-perimeter.jpg          ← served on the site
hero-perimeter-source.psd   ← optional working file (do not reference from code)
```
