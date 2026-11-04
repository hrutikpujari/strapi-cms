# Meridian — Full-Stack Blog Platform (Next.js + Strapi)

A production-ready editorial blog: **Strapi 5** CMS powering a **Next.js 16** (App Router, TypeScript, Tailwind v4) frontend. Admins manage all content — articles, categories, authors, tags, SEO fields, site settings — through the Strapi panel; the site renders via ISR and updates automatically.

## Architecture

```
Browser ──► Next.js (SSR/ISR, Server Components) ──► Strapi REST API (/api/*) ──► SQLite (dev) / PostgreSQL (prod)
                │                                        │
                ├─ generateMetadata ─► SEO tags          ├─ Public role: read-only + subscribe + view++
                ├─ sitemap.xml / robots.txt / feed.xml   ├─ Admin panel: full CRUD at /admin
                └─ ISR revalidate (60s)                  └─ Scoped API token (optional, server-side only)
```

- **Backend** (`backend/`): Strapi 5 content types (`article`, `category`, `author`, `tag`, `newsletter-subscriber`, `website-setting` single type). Bootstrap auto-configures Public-role permissions, creates a scoped Content API token, and seeds demo content on an empty DB.
- **Frontend** (`frontend/`): Server Components fetch Strapi via `src/services/api.ts` → `src/lib/strapi.ts` (typed wrapper, ISR revalidate, Bearer token). Rich text uses a safe typed `BlocksRenderer` (no `dangerouslySetInnerHTML`). Browser mutations go through same-origin Next route handlers (`POST /api/newsletter`, `POST /api/articles/:id/view`) that proxy to Strapi — no CORS, no Strapi URL exposed to clients.

## Folder structure

```
blog-project/
├── backend/                        # Strapi 5 CMS
│   ├── config/                     # database.ts (sqlite/postgres/mysql via env), middlewares.ts (CORS + rate limit)
│   ├── src/
│   │   ├── api/
│   │   │   ├── article/            # schema, controller (+POST /view), routes, service, lifecycles (reading time)
│   │   │   ├── category/  author/  tag/  newsletter-subscriber/  website-setting/
│   │   ├── bootstrap/              # permissions.ts, api-token.ts, seed.ts (demo data + PNG generation)
│   │   ├── components/shared/      # social-links component
│   │   ├── middlewares/            # api-rate-limit.ts
│   │   └── index.ts                # bootstrap wiring
│   └── .env
└── frontend/                       # Next.js 16
    ├── src/
    │   ├── app/                    # /, /blog, /blog/[slug], /category/[slug], /author/[slug],
    │   │                           # /search, /about, /contact, /privacy, /terms,
    │   │                           # sitemap.ts, robots.ts, feed.xml, loading/error/not-found
    │   ├── components/             # layout/, article/, home/, ui/
    │   ├── services/api.ts         # all Strapi queries (populate/filters/pagination)
    │   ├── lib/                    # config.ts, strapi.ts (fetch wrapper), seo.ts (JSON-LD), utils.ts
    │   └── types/strapi.ts
    └── .env.local
```

## Run locally

```bash
# Backend (terminal 1)
cd backend
npm install
npm run develop          # http://localhost:1337/admin — create admin on first run

# Frontend (terminal 2)
cd frontend
npm install
npm run dev              # http://localhost:3000
```

On first boot Strapi migrates the DB, grants Public permissions, writes a scoped token to
`backend/.frontend-api-token`, and seeds 9 articles, 4 categories, 8 tags, 3 authors,
and Website Settings.

## Environment variables

### backend/.env
| Var | Purpose |
|---|---|
| `DATABASE_CLIENT` | `sqlite` (default) or `postgres` |
| `DATABASE_URL` / `DATABASE_HOST`/`PORT`/`NAME`/`USERNAME`/`PASSWORD`/`SSL` | Postgres connection (prod) |
| `DATABASE_FILENAME` | SQLite file path (dev) |
| `CORS_ORIGIN` | Comma-separated allowed browser origins |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Public `/api/*` rate limit (default 120/min/IP) |

### frontend/.env.local
| Var | Purpose |
|---|---|
| `STRAPI_URL` | Server-side Strapi base URL |
| `NEXT_PUBLIC_STRAPI_URL` | Public Strapi URL (media URLs, client-side subscribe/view calls) |
| `STRAPI_API_TOKEN` | Scoped token from `backend/.frontend-api-token` (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (sitemap, OG, RSS) |
| `REVALIDATE_SECONDS` | ISR revalidate interval (default 60) |

## Admin panel

`http://localhost:1337/admin` — articles support draft/publish, featured flag, thumbnail +
featured image, author/category/tag relations, SEO title/description/canonical/OG image.
Reading time and published date are auto-computed by lifecycle hooks. Newsletter
subscribers and Website Settings are managed under their own collection/single types.

Public API surface (everything else requires admin/token):
`GET` articles/categories/authors/tags/website-setting (published only),
`POST /api/articles/:documentId/view`, `POST /api/newsletter-subscribers/subscribe`.

## Deployment

### Strapi → Railway / Render
1. Provision PostgreSQL; set `DATABASE_CLIENT=postgres` + `DATABASE_URL` (or host/name/user/pass) and `DATABASE_SSL=true`.
2. Set all `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` to fresh random values.
3. `npm run build` then `npm run start` as the start command.
4. For media, add `@strapi/provider-upload-cloudinary` (or AWS S3 provider) and configure it in `config/plugins.ts` with credentials from env — local `/uploads` is ephemeral on most hosts.
5. Set `CORS_ORIGIN=https://your-frontend-domain`.

### Next.js → Vercel
1. Import `frontend/` as the root directory.
2. Set env vars: `STRAPI_URL`, `NEXT_PUBLIC_STRAPI_URL`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy — articles prerender with ISR; new Strapi content appears within the revalidate window (60s) or instantly via an on-demand revalidate webhook.

## Notes

- **PostgreSQL**: fully configured — set `DATABASE_CLIENT=postgres` + credentials. SQLite is the local default for zero-setup dev.
- **Rate limiting**: in-memory per-instance at the Strapi layer; enforce stricter limits at your CDN/edge in production.
- **Security**: private token never ships to the browser; public role is read-only; newsletter input validated server-side; uploads restricted by MIME type with SVG/executable denial.
