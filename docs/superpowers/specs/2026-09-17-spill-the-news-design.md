# Spill the News — Design Spec

Date: 2026-09-17

## Context

Replaces the earlier "OndeÉtu" placeholder project (fictional demo, never launched). "Spill the News" is the real project: a student newsletter/media outlet publishing written articles and podcast episodes.

## Brand Commitments (from logo + palette provided)

- **Colours:** magenta/hot pink (~#FF1493 range) as primary background/brand colour, mustard yellow (~#F2A900 range) as accent/text-on-pink. Palette swatch supplied shows a pink→red→orange gradient family; pink+yellow is the confirmed pairing from the logo itself.
- **Typography:** logo uses a custom bold, rounded, "melty/drip" display lettering ("SPILL") paired with a thinner hand-drawn outline style ("THE") and line-art illustrations (newspaper, stacked coffee cups). No font file provided — approximate the display feel with a bold rounded Google Font (e.g. Fredoka, Baloo 2, or Bagel Fat One) for headings; a clean simple sans for body copy (legibility over mimicry).
- **Voice/assets:** logo image itself is used as the site's primary visual mark (header/hero), not redrawn.

## Product

- **Name:** Spill the News
- **Format:** written articles + podcast episodes, equal standing
- **Language:** French
- **Socials:** Instagram @spill.thenews
- **Contact:** spillthenews7@gmail.com

## Stack

- Next.js (App Router), full-stack JS
- SQLite via Prisma ORM — file-based DB, no external service dependency
- NextAuth (credentials provider) for admin auth
- Deploy target: Vercel (or any Node host with persistent volume for the SQLite file)

## Data Model

```
User
  id            String  @id @default(cuid())
  email         String  @unique
  passwordHash  String
  name          String

Article
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  coverImage    String?
  body          String   // markdown
  category      String
  publishedAt   DateTime @default(now())
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])

Episode
  id            String   @id @default(cuid())
  title         String
  description   String
  externalLink  String   // Spotify/Apple/YouTube URL
  coverImage    String?
  publishedAt   DateTime @default(now())
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
```

## Pages

**Public**
- `/` — hero (logo, tagline), latest articles grid, latest episodes strip
- `/articles` — full list, filterable by category
- `/articles/[slug]` — article detail (cover image, body rendered from markdown, author, date)
- `/podcast` — full episode list
- `/podcast/[id]` — episode detail, embed/link to external platform
- Footer (site-wide) — Instagram link, contact email, nav

**Admin** (auth-gated via NextAuth session)
- `/admin/login` — email + password form
- `/admin` — dashboard: list of articles + episodes belonging to any contributor, edit/delete actions
- `/admin/articles/new`, `/admin/articles/[id]/edit` — article form (title, category, cover image upload or URL, markdown body)
- `/admin/episodes/new`, `/admin/episodes/[id]/edit` — episode form (title, description, external link, cover image)

## Auth

- NextAuth credentials provider, password hashed with bcrypt
- Session-based, middleware protects all `/admin/*` routes except `/admin/login`
- No self-registration UI — contributor accounts seeded via a script/seed file (small team, low churn)

## Out of Scope (YAGNI)

- Comments
- Newsletter email signup/mailing list integration
- Search
- Multi-language
- Rich WYSIWYG editor (markdown textarea is enough for v1)
- Image hosting service — cover images stored as URL string (either external link or a simple local `/public/uploads` file save)

## Open Items

None blocking — all confirmed via clarifying questions.
