# Meridian — System Architecture

A complete walkthrough of how the Strapi CMS + Next.js blog platform works:
every layer, every request path, and the role of each technology.

- **Live site:** https://strapi-cms-five.vercel.app
- **CMS admin:** https://strapi-cms-krxg.onrender.com/admin
- **Repository:** github.com/hrutikpujari/strapi-cms

---

## 1. High-level architecture

```mermaid
flowchart LR
    subgraph Client
        B[Browser / Reader]
        A[Browser / Admin]
    end

    subgraph Vercel
        FE["Next.js 16<br/>SSG + ISR + API proxy routes"]
    end

    subgraph Render
        BE["Strapi 5 CMS<br/>REST API + Admin panel"]
    end

    subgraph Data
        DB[(Neon<br/>PostgreSQL)]
        CDN[(Cloudinary<br/>media)]
    end

    B -->|"HTTPS"| FE
    A -->|"HTTPS"| BE
    FE -->|"REST fetch<br/>server-side, ISR"| BE
    FE -->|"next/image"| CDN
    BE -->|"SQL via Knex"| DB
    BE -->|"upload provider"| CDN
    BE -->|"POST /api/revalidate<br/>lifecycle hooks"| FE
```

One sentence: **Strapi owns content and logic, Next.js owns presentation and
caching, and env vars wire them together — nothing hardcoded.**

---

## 2. Technology roles

| Layer | Technology | Responsibility |
|---|---|---|
| Public site | Next.js 16 + React 19 + TypeScript | Server-rendered pages, ISR cache, SEO output |
| Styling | Tailwind CSS v4 | All frontend styling, zero runtime CSS-in-JS |
| CMS + API | Strapi 5 | Content modeling, admin UI, REST API, auth, uploads |
| Runtime | Node.js 24 | Runs both Strapi and Next.js |
| Production DB | Neon (Postgres) | Serverless Postgres via `DATABASE_URL` |
| Development DB | SQLite (`better-sqlite3`) | Zero-setup local DB — same config file |
| Media | Cloudinary | Image hosting + transformation in production |
| Frontend host | Vercel | SSG/ISR builds, edge-served pages, deploys on push |
| Backend host | Render | Strapi Node web service, deploys on push |
| Cache invalidation | `revalidatePath` + Strapi lifecycles | Instant publish → live |
| UI extras | Lucide React, Framer Motion | Icons and animations (client components only) |

---

## 3. Read path — a reader opens an article

```mermaid
sequenceDiagram
    participant R as Reader
    participant V as Vercel (Next.js)
    participant S as Strapi (Render)
    participant D as Neon Postgres
    participant C as Cloudinary

    R->>V: GET /blog/my-slug
    alt ISR cache HIT
        V-->>R: Prerendered HTML (instant)
    else MISS / STALE
        V->>S: GET /api/articles?filters[slug]=...&populate=*
        S->>D: SELECT article + relations
        D-->>S: rows
        S-->>V: JSON (article, author, category, tags, media URLs)
        V-->>R: Server-rendered HTML + JSON-LD + metadata
    end
    R->>V: GET /_next/image?url=<cloudinary-url>
    V->>C: fetch + optimize image
    C-->>V: image
    V-->>R: optimized WebP/PNG
```

## 4. Publish path — instant revalidation

```mermaid
sequenceDiagram
    participant Ed as Editor (admin)
    participant S as Strapi
    participant D as Neon
    participant V as Vercel

    Ed->>S: Save / publish article
    S->>S: beforeUpdate → compute readingTime,<br/>default publishedDate
    S->>D: UPDATE article
    S->>S: afterUpdate → notifyFrontend()
    S->>V: POST /api/revalidate?secret=***
    V->>V: verify secret → revalidatePath('/', 'layout')
    V-->>S: { revalidated: true }
    Note over V: All cached pages invalidated.<br/>Next request renders fresh content.
```

The same flow runs on `afterCreate` and `afterDelete`, so edits, publishes,
unpublishes, and deletions all go live within seconds — no 60-second ISR wait.

## 5. Mutation paths — browser → proxy → Strapi

Browser-side JavaScript never calls Strapi directly. Every public write goes
through a same-origin Next.js route, which validates and forwards server-side.
This eliminates CORS entirely and keeps `STRAPI_API_TOKEN` server-only.

```mermaid
flowchart LR
    subgraph Browser
        NF[NewsletterForm]
        CF[ContactForm]
        VC[ViewCounter]
    end
    subgraph "Next.js API routes"
        PN["POST /api/newsletter"]
        PC["POST /api/contact"]
        PV["POST /api/articles/:id/view"]
    end
    subgraph Strapi
        ES["/api/newsletter-subscribers/subscribe"]
        EC["/api/contact-messages/submit"]
        EV["/api/articles/:id/view"]
    end

    NF --> PN --> ES
    CF --> PC --> EC
    VC --> PV --> EV
```

| Route | Validates | Strapi side effect |
|---|---|---|
| `/api/newsletter` | email format | dedupes + stores subscriber |
| `/api/contact` | name/email/message, length caps | stores message with `status: new` |
| `/api/articles/:id/view` | documentId | `viewCount + 1` (triggers revalidate too) |

## 6. Strapi bootstrap — what runs on every boot

```mermaid
flowchart TD
    S[strapi start] --> P[configurePublicPermissions]
    P --> T[ensureFrontendToken]
    T --> AD[ensureAdminUser]
    AD --> SD[seedDemoData]

    P --- P1["Public role: read published content +<br/>subscribe / submit / incrementView only"]
    T --- T1["Scoped Content API token →<br/>.frontend-api-token (gitignored)"]
    AD --- AD1["ADMIN_EMAIL + ADMIN_PASSWORD set?<br/>→ create super-admin or reset password"]
    SD --- SD1["Settings seeded if missing;<br/>articles seeded if DB empty;<br/>EXTRA_ARTICLES upserted by slug"]
```

Files: `backend/src/bootstrap/{permissions,api-token,admin-user,seed}.ts`,
wired in `backend/src/index.ts`.

## 7. Content model

```mermaid
erDiagram
    ARTICLE }o--|| CATEGORY : "many-to-one"
    ARTICLE }o--|| AUTHOR : "many-to-one"
    ARTICLE }o--o{ TAG : "many-to-many"
    ARTICLE ||--o{ MEDIA : "featured / thumbnail / ogImage"

    ARTICLE {
        string title
        string slug
        string excerpt
        blocks content
        string seoTitle
        string seoDescription
        string canonicalUrl
        bool featured
        datetime publishedDate
        int readingTime
        int viewCount
    }
    CATEGORY {
        string name
        string slug
        string description
        media image
    }
    AUTHOR {
        string name
        string slug
        media avatar
        text biography
        component socialLinks
    }
    TAG {
        string name
        string slug
    }
```

Plus three standalone types:

- **Website Setting** (single type) — site name, logo, favicon, social links,
  contact email, footer content, default SEO
- **Newsletter Subscriber** — email, status, subscribedAt
- **Contact Message** — name, email, subject, message, status, submittedAt

## 8. SEO pipeline (all server-rendered)

```mermaid
flowchart LR
    CMS["Strapi fields<br/>seoTitle, seoDescription,<br/>canonicalUrl, ogImage"] --> GM["generateMetadata<br/>per page"]
    GM --> OUT["<title>, meta, OG,<br/>Twitter cards, canonical"]
    SL["all slugs + dates"] --> SM["/sitemap.xml"]
    CFG["robots.ts"] --> RB["/robots.txt"]
    ARTS["published articles"] --> RSS["/feed.xml"]
    SEO["lib/seo.ts"] --> JLD["JSON-LD: Article, Breadcrumb,<br/>Organization, WebSite"]
```

## 9. Dev vs production — same code, env-driven

| Concern | Local | Production |
|---|---|---|
| Database | SQLite `.tmp/data.db` | `DATABASE_CLIENT=postgres` + `DATABASE_URL` → Neon |
| Media | `public/uploads` (or Cloudinary when env set) | Cloudinary |
| Frontend | `npm run dev/start` → :3000 | Vercel, auto-deploy on push |
| Backend | `strapi develop` → :1337 | Render, auto-deploy on push |
| Secrets | `.env`, `.env.local` (gitignored) | Render / Vercel env dashboards |

## 10. Deploy pipeline

```mermaid
flowchart LR
    G["git push → main"] --> R["Render<br/>npm install && build && start<br/>bootstrap runs: perms, token,<br/>admin, seed"]
    G --> V["Vercel<br/>next build<br/>build-time fetches hit live Strapi<br/>→ static + ISR pages on the edge"]
    R -.->|"revalidate webhooks"| V
```

## 11. Security model

- Public role = **read-only published content** + three controlled mutations
  (`subscribe`, `contact submit`, `view increment`). Everything else requires
  the admin session or a scoped API token.
- `STRAPI_API_TOKEN` lives only in server-side env — never `NEXT_PUBLIC_*`.
- Browser writes always go through Next.js proxy routes that validate first.
- In-memory rate limiting on `/api/*` (per IP; replace with CDN/edge limits
  at scale).
- CORS locked to the site origin.
- Upload provider has an allowlist/denylist of MIME types.
- Secrets rotated for production (fresh `APP_KEYS`, JWT secrets, revalidate
  secret) — dev secrets never shipped.
