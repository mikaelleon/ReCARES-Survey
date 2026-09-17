# Site images

Drop final image files here. Next.js serves anything under `public/` at the site root, so a file at:

`public/images/hero-perimeter.jpg`

is available in the app as:

`/images/hero-perimeter.jpg`

## In use

| File | Used for | Notes |
| --- | --- | --- |
| `h1.png` | Homepage hero background | Community court / grounds photo. Served behind the dark hero overlay. |

## Optional

| File | Used for | Notes |
| --- | --- | --- |
| `favicon.ico` or `og-image.png` | Browser tab / social share | Place favicon in `public/` (not this folder) if you add one. OG image can live here. |
| Camella / partner logos | Branding moments only | Not used in UI chrome per the design brief. Keep originals here if you need them later. |

## Not image assets

- **ReCARES wordmark** — rendered in type (multi-color letters), not a logo file.
- **Icons** — Lucide React in code; no icon PNGs needed.

## Naming

Use lowercase kebab-case. Keep originals + a web-optimized copy if helpful:

```
hero-perimeter.jpg          ← served on the site
hero-perimeter-source.psd   ← optional working file (do not reference from code)
```
