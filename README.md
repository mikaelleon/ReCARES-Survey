# ReCARES Survey

Community needs assessment survey for residents of Camella Homes Tibig, Lipa City.

## Stack

- Next.js 14 (App Router)
- React 18
- TypeScript (strict)
- Firebase SDK (scaffolded; not wired yet)

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` and fill in Firebase values when you are ready to connect a project. The app builds and runs without `.env.local`.

## Routes

| Route | Description |
| --- | --- |
| `/` | Resident homepage |
| `/survey` | Multi-section survey flow |
| `/survey/thank-you` | Post-submit confirmation |
| `/admin/login` | Proponent login |
| `/admin/signup` | Proponent signup |
| `/admin/dashboard` | Response management (auth stub) |

The static design export remains in `/layout` as the visual source of truth.

## Images

Put site photos and other raster assets in [`public/images/`](public/images/). See that folder’s README for the checklist (hero photograph first). Files there are served from `/images/...`.

Favicons live in [`public/favicon_io/`](public/favicon_io/) and are linked from the root layout metadata.
