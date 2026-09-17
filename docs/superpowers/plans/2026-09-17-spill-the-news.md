# Spill the News Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Spill the News site — Next.js + SQLite full-stack app with public article/podcast pages and a password-protected admin area for posting content.

**Architecture:** Next.js 14 App Router + TypeScript. Prisma ORM over a SQLite file DB. NextAuth (credentials provider) gates `/admin/*` via middleware. Data access lives in plain `lib/*.ts` modules called directly from Server Components and Server Actions — no separate REST API layer.

**Tech Stack:** Next.js 14, TypeScript, Prisma + SQLite, NextAuth v4, bcryptjs, marked (markdown → HTML), Vitest (unit tests for `lib/`).

---

## Spec reference

See `docs/superpowers/specs/2026-09-17-spill-the-news-design.md` for full brand/data-model/page rationale. This plan implements it end to end.

## File Structure

```
package.json
tsconfig.json
next.config.js
vitest.config.ts
.env
prisma/schema.prisma
prisma/seed.ts
lib/db.ts              # Prisma client singleton
lib/slugify.ts
lib/slugify.test.ts
lib/password.ts
lib/password.test.ts
lib/articles.ts        # CRUD for Article
lib/articles.test.ts
lib/episodes.ts        # CRUD for Episode
lib/episodes.test.ts
lib/auth.ts             # NextAuth config (authOptions)
middleware.ts
app/layout.tsx
app/globals.css
app/page.tsx                          # home
app/articles/page.tsx                 # article list
app/articles/[slug]/page.tsx          # article detail
app/podcast/page.tsx                  # episode list
app/podcast/[id]/page.tsx             # episode detail
app/api/auth/[...nextauth]/route.ts
app/admin/login/page.tsx
app/admin/page.tsx                    # dashboard
app/admin/articles/new/page.tsx
app/admin/articles/[id]/edit/page.tsx
app/admin/articles/actions.ts         # Server Actions: create/update/delete article
app/admin/episodes/new/page.tsx
app/admin/episodes/[id]/edit/page.tsx
app/admin/episodes/actions.ts         # Server Actions: create/update/delete episode
components/Header.tsx
components/Footer.tsx
components/ArticleCard.tsx
components/EpisodeCard.tsx
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `.env`, `.gitignore`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (placeholder)

- [ ] **Step 1: Scaffold Next.js app**

```bash
npx create-next-app@14 . --typescript --eslint --app --src-dir=false --import-alias "@/*" --tailwind=false --use-npm
```

Answer prompts: no to Tailwind (we hand-write CSS to match brand), yes to App Router, yes to `@/*` import alias. If the directory already has files (`PRODUCT.md`, old `index.html`, `about.html`, `style.css`, `script.js`), move the old OndeÉtu files aside first:

```bash
mkdir -p _archive-ondeetu
mv index.html about.html style.css script.js _archive-ondeetu/ 2>/dev/null || true
```

- [ ] **Step 2: Install project dependencies**

```bash
npm install prisma @prisma/client next-auth bcryptjs marked
npm install -D vitest @types/bcryptjs tsx
```

- [ ] **Step 3: Add `.env`**

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="replace-with-a-random-32-byte-string-before-deploy"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 4: Add `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 5: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run"
```

- [ ] **Step 6: Verify scaffold runs**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, default Next.js page loads. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project, archive OndeÉtu placeholder"
```

---

### Task 2: Prisma schema, migration, seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db.ts`

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  articles     Article[]
  episodes     Episode[]
}

model Article {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  coverImage  String?
  body        String
  category    String
  publishedAt DateTime @default(now())
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
}

model Episode {
  id           String   @id @default(cuid())
  title        String
  description  String
  externalLink String
  coverImage   String?
  publishedAt  DateTime @default(now())
  authorId     String
  author       User     @relation(fields: [authorId], references: [id])
}
```

- [ ] **Step 2: Write `lib/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- [ ] **Step 3: Run initial migration**

Run: `npx prisma migrate dev --name init`
Expected: creates `prisma/migrations/<timestamp>_init/`, `dev.db` file appears, output ends with "Your database is now in sync with your schema."

- [ ] **Step 4: Write `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('changeme123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'spillthenews7@gmail.com' },
    update: {},
    create: {
      email: 'spillthenews7@gmail.com',
      passwordHash,
      name: 'Équipe Spill the News',
    },
  })

  await prisma.article.upsert({
    where: { slug: 'bienvenue-sur-spill-the-news' },
    update: {},
    create: {
      title: 'Bienvenue sur Spill the News',
      slug: 'bienvenue-sur-spill-the-news',
      body: 'Premier article de démonstration. Remplace-moi par du vrai contenu depuis /admin.',
      category: 'Édito',
      authorId: user.id,
    },
  })

  await prisma.episode.upsert({
    where: { id: 'seed-episode-1' },
    update: {},
    create: {
      id: 'seed-episode-1',
      title: 'Épisode 1 — Le lancement',
      description: 'Épisode de démonstration. Remplace-moi par un vrai épisode depuis /admin.',
      externalLink: 'https://open.spotify.com',
      authorId: user.id,
    },
  })

  console.log('Seed complete. Login: spillthenews7@gmail.com / changeme123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 5: Add seed config to `package.json`**

In `package.json`, add a top-level key:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 6: Run the seed**

Run: `npx prisma db seed`
Expected: prints `Seed complete. Login: spillthenews7@gmail.com / changeme123`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Prisma schema, migration, seed data"
```

---

### Task 3: `lib/slugify.ts`

**Files:**
- Create: `lib/slugify.ts`
- Test: `lib/slugify.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/slugify.test.ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Bienvenue Sur Spill The News')).toBe('bienvenue-sur-spill-the-news')
  })

  it('strips accents', () => {
    expect(slugify('Étudiant à Paris')).toBe('etudiant-a-paris')
  })

  it('strips punctuation', () => {
    expect(slugify("L'université: c'est fini !")).toBe('luniversite-cest-fini')
  })

  it('collapses repeated whitespace', () => {
    expect(slugify('trop   d\'espaces')).toBe('trop-despaces')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/slugify.test.ts`
Expected: FAIL — `Cannot find module './slugify'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/slugify.ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/slugify.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/slugify.ts lib/slugify.test.ts
git commit -m "feat: slugify utility for article slugs"
```

---

### Task 4: `lib/password.ts`

**Files:**
- Create: `lib/password.ts`
- Test: `lib/password.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/password.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('hashes and verifies a matching password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('correct-horse-battery-staple', hash)).toBe(true)
  })

  it('rejects a non-matching password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/password.test.ts`
Expected: FAIL — `Cannot find module './password'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/password.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/password.ts lib/password.test.ts
git commit -m "feat: password hash/verify utility"
```

---

### Task 5: `lib/articles.ts` data layer

**Files:**
- Create: `lib/articles.ts`
- Test: `lib/articles.test.ts`

Tests hit a real SQLite file so they exercise actual Prisma behavior (unique slug constraint, ordering). Each test run uses its own temp DB file via `DATABASE_URL` override, migrated fresh, then deleted.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/articles.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-articles.db')

beforeAll(() => {
  process.env.DATABASE_URL = `file:${TEST_DB}`
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
    stdio: 'inherit',
  })
})

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

import { prisma } from './db'
import { createArticle, getArticles, getArticleBySlug, updateArticle, deleteArticle } from './articles'

beforeEach(async () => {
  await prisma.article.deleteMany()
  await prisma.user.deleteMany()
})

async function seedUser() {
  return prisma.user.create({
    data: { email: `u-${Date.now()}@test.com`, passwordHash: 'x', name: 'Test User' },
  })
}

describe('articles data layer', () => {
  it('creates an article with a generated unique slug', async () => {
    const user = await seedUser()
    const article = await createArticle({
      title: 'Mon Premier Article',
      body: 'Contenu',
      category: 'Édito',
      authorId: user.id,
    })
    expect(article.slug).toBe('mon-premier-article')
  })

  it('lists articles newest first', async () => {
    const user = await seedUser()
    const a = await createArticle({ title: 'A', body: 'x', category: 'c', authorId: user.id })
    await new Promise((r) => setTimeout(r, 5))
    const b = await createArticle({ title: 'B', body: 'x', category: 'c', authorId: user.id })
    const list = await getArticles()
    expect(list.map((a) => a.id)).toEqual([b.id, a.id])
  })

  it('fetches an article by slug', async () => {
    const user = await seedUser()
    await createArticle({ title: 'Findable', body: 'x', category: 'c', authorId: user.id })
    const found = await getArticleBySlug('findable')
    expect(found?.title).toBe('Findable')
  })

  it('returns null for an unknown slug', async () => {
    const found = await getArticleBySlug('does-not-exist')
    expect(found).toBeNull()
  })

  it('updates an article', async () => {
    const user = await seedUser()
    const article = await createArticle({ title: 'Old Title', body: 'x', category: 'c', authorId: user.id })
    const updated = await updateArticle(article.id, { title: 'New Title' })
    expect(updated.title).toBe('New Title')
  })

  it('deletes an article', async () => {
    const user = await seedUser()
    const article = await createArticle({ title: 'To Delete', body: 'x', category: 'c', authorId: user.id })
    await deleteArticle(article.id)
    expect(await getArticleBySlug('to-delete')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/articles.test.ts`
Expected: FAIL — `Cannot find module './articles'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/articles.ts
import { prisma } from './db'
import { slugify } from './slugify'

export interface CreateArticleInput {
  title: string
  body: string
  category: string
  coverImage?: string
  authorId: string
}

export async function createArticle(input: CreateArticleInput) {
  const baseSlug = slugify(input.title)
  let slug = baseSlug
  let suffix = 1
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`
  }
  return prisma.article.create({
    data: { ...input, slug },
  })
}

export async function getArticles() {
  return prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { author: true },
  })
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: { author: true },
  })
}

export interface UpdateArticleInput {
  title?: string
  body?: string
  category?: string
  coverImage?: string
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  return prisma.article.update({ where: { id }, data: input })
}

export async function deleteArticle(id: string) {
  return prisma.article.delete({ where: { id } })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/articles.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/articles.ts lib/articles.test.ts
git commit -m "feat: articles data layer with unique-slug generation"
```

---

### Task 6: `lib/episodes.ts` data layer

**Files:**
- Create: `lib/episodes.ts`
- Test: `lib/episodes.test.ts`

Same temp-DB pattern as Task 5. No slug needed — episodes are addressed by `id`.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/episodes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-episodes.db')

beforeAll(() => {
  process.env.DATABASE_URL = `file:${TEST_DB}`
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
    stdio: 'inherit',
  })
})

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

import { prisma } from './db'
import { createEpisode, getEpisodes, getEpisodeById, updateEpisode, deleteEpisode } from './episodes'

beforeEach(async () => {
  await prisma.episode.deleteMany()
  await prisma.user.deleteMany()
})

async function seedUser() {
  return prisma.user.create({
    data: { email: `u-${Date.now()}@test.com`, passwordHash: 'x', name: 'Test User' },
  })
}

describe('episodes data layer', () => {
  it('creates an episode', async () => {
    const user = await seedUser()
    const ep = await createEpisode({
      title: 'Épisode 1',
      description: 'Desc',
      externalLink: 'https://open.spotify.com/x',
      authorId: user.id,
    })
    expect(ep.title).toBe('Épisode 1')
  })

  it('lists episodes newest first', async () => {
    const user = await seedUser()
    const a = await createEpisode({ title: 'A', description: 'x', externalLink: 'https://x', authorId: user.id })
    await new Promise((r) => setTimeout(r, 5))
    const b = await createEpisode({ title: 'B', description: 'x', externalLink: 'https://x', authorId: user.id })
    const list = await getEpisodes()
    expect(list.map((e) => e.id)).toEqual([b.id, a.id])
  })

  it('fetches an episode by id', async () => {
    const user = await seedUser()
    const ep = await createEpisode({ title: 'Findable', description: 'x', externalLink: 'https://x', authorId: user.id })
    const found = await getEpisodeById(ep.id)
    expect(found?.title).toBe('Findable')
  })

  it('returns null for an unknown id', async () => {
    expect(await getEpisodeById('does-not-exist')).toBeNull()
  })

  it('updates an episode', async () => {
    const user = await seedUser()
    const ep = await createEpisode({ title: 'Old', description: 'x', externalLink: 'https://x', authorId: user.id })
    const updated = await updateEpisode(ep.id, { title: 'New' })
    expect(updated.title).toBe('New')
  })

  it('deletes an episode', async () => {
    const user = await seedUser()
    const ep = await createEpisode({ title: 'ToDelete', description: 'x', externalLink: 'https://x', authorId: user.id })
    await deleteEpisode(ep.id)
    expect(await getEpisodeById(ep.id)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/episodes.test.ts`
Expected: FAIL — `Cannot find module './episodes'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/episodes.ts
import { prisma } from './db'

export interface CreateEpisodeInput {
  title: string
  description: string
  externalLink: string
  coverImage?: string
  authorId: string
}

export async function createEpisode(input: CreateEpisodeInput) {
  return prisma.episode.create({ data: input })
}

export async function getEpisodes() {
  return prisma.episode.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { author: true },
  })
}

export async function getEpisodeById(id: string) {
  return prisma.episode.findUnique({ where: { id }, include: { author: true } })
}

export interface UpdateEpisodeInput {
  title?: string
  description?: string
  externalLink?: string
  coverImage?: string
}

export async function updateEpisode(id: string, input: UpdateEpisodeInput) {
  return prisma.episode.update({ where: { id }, data: input })
}

export async function deleteEpisode(id: string) {
  return prisma.episode.delete({ where: { id } })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/episodes.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/episodes.ts lib/episodes.test.ts
git commit -m "feat: episodes data layer"
```

---

### Task 7: NextAuth configuration + middleware

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts`

No unit test here — NextAuth's request/session plumbing is framework-owned; correctness is verified manually in Task 10 (login flow) per `superpowers:test-driven-development` guidance that integration-only surfaces are checked by running them, not by testing the framework itself.

- [ ] **Step 1: Write `lib/auth.ts`**

```typescript
// lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { verifyPassword } from './password'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await verifyPassword(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string
      return session
    },
  },
}
```

- [ ] **Step 2: Write `app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Write `middleware.ts`**

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/admin/((?!login).*)'],
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/auth.ts`, `middleware.ts`, or the auth route.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts app/api/auth middleware.ts
git commit -m "feat: NextAuth credentials auth + admin route protection"
```

---

### Task 8: Brand styles and shared layout

**Files:**
- Modify: `app/globals.css`
- Create: `components/Header.tsx`
- Create: `components/Footer.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write `app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito+Sans:wght@400;600&display=swap');

:root {
  --pink: #ff1493;
  --pink-dark: #d10f78;
  --yellow: #f2a900;
  --ink: #1a0a12;
  --paper: #fff6ea;
  --font-display: 'Baloo 2', system-ui, sans-serif;
  --font-body: 'Nunito Sans', system-ui, sans-serif;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  line-height: 1.6;
}

h1, h2, h3, .display {
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--pink);
  line-height: 1.1;
}

a { color: var(--pink-dark); }

.site-header {
  background: var(--pink);
  color: var(--yellow);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.site-header a { color: var(--yellow); text-decoration: none; }

.site-header .brand {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.5rem;
}

.site-header nav { display: flex; gap: 1.25rem; }

.site-footer {
  background: var(--ink);
  color: var(--paper);
  padding: 2rem 1.5rem;
  margin-top: 3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.site-footer a { color: var(--yellow); }

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
}

.card {
  background: white;
  border: 3px solid var(--pink);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.card img {
  width: 100%;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  display: inline-block;
  background: var(--yellow);
  color: var(--ink);
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Write `components/Header.tsx`**

```tsx
import Link from 'next/link'

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">Spill the News</Link>
      <nav>
        <Link href="/articles">Articles</Link>
        <Link href="/podcast">Podcast</Link>
      </nav>
    </header>
  )
}
```

- [ ] **Step 3: Write `components/Footer.tsx`**

```tsx
export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} Spill the News</span>
      <a href="https://instagram.com/spill.thenews" target="_blank" rel="noopener noreferrer">
        Instagram @spill.thenews
      </a>
      <a href="mailto:spillthenews7@gmail.com">spillthenews7@gmail.com</a>
    </footer>
  )
}
```

- [ ] **Step 4: Write `app/layout.tsx`**

```tsx
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Spill the News',
  description: 'Newsletter étudiante — articles et podcast.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify dev server renders layout**

Run: `npm run dev`, open `http://localhost:3000`
Expected: pink header with "Spill the News" brand + nav links, dark footer with Instagram/email links. Stop server once confirmed.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/Header.tsx components/Footer.tsx
git commit -m "feat: brand styling, header, footer, root layout"
```

---

### Task 9: Public pages — home, articles, podcast

**Files:**
- Create: `components/ArticleCard.tsx`
- Create: `components/EpisodeCard.tsx`
- Modify: `app/page.tsx`
- Create: `app/articles/page.tsx`
- Create: `app/articles/[slug]/page.tsx`
- Create: `app/podcast/page.tsx`
- Create: `app/podcast/[id]/page.tsx`

- [ ] **Step 1: Write `components/ArticleCard.tsx`**

```tsx
import Link from 'next/link'

interface Props {
  article: { slug: string; title: string; category: string; coverImage: string | null; publishedAt: Date }
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {article.coverImage && <img src={article.coverImage} alt="" />}
      <span className="tag">{article.category}</span>
      <h3>{article.title}</h3>
      <small>{article.publishedAt.toLocaleDateString('fr-FR')}</small>
    </Link>
  )
}
```

- [ ] **Step 2: Write `components/EpisodeCard.tsx`**

```tsx
import Link from 'next/link'

interface Props {
  episode: { id: string; title: string; description: string; coverImage: string | null; publishedAt: Date }
}

export default function EpisodeCard({ episode }: Props) {
  return (
    <Link href={`/podcast/${episode.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {episode.coverImage && <img src={episode.coverImage} alt="" />}
      <h3>{episode.title}</h3>
      <p>{episode.description}</p>
      <small>{episode.publishedAt.toLocaleDateString('fr-FR')}</small>
    </Link>
  )
}
```

- [ ] **Step 3: Write `app/page.tsx` (home)**

```tsx
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'
import ArticleCard from '@/components/ArticleCard'
import EpisodeCard from '@/components/EpisodeCard'

export default async function HomePage() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])
  const latestArticles = articles.slice(0, 3)
  const latestEpisodes = episodes.slice(0, 2)

  return (
    <>
      <h1>Spill the News</h1>
      <p>Newsletter étudiante — culture, arts et société, racontées par des étudiants.</p>

      <h2>Derniers articles</h2>
      {latestArticles.map((a) => <ArticleCard key={a.id} article={a} />)}

      <h2>Derniers épisodes</h2>
      {latestEpisodes.map((e) => <EpisodeCard key={e.id} episode={e} />)}
    </>
  )
}
```

- [ ] **Step 4: Write `app/articles/page.tsx`**

```tsx
import { getArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'

export default async function ArticlesPage() {
  const articles = await getArticles()
  return (
    <>
      <h1>Articles</h1>
      {articles.length === 0 && <p>Aucun article pour l'instant.</p>}
      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
    </>
  )
}
```

- [ ] **Step 5: Write `app/articles/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { getArticleBySlug } from '@/lib/articles'

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()

  return (
    <article>
      {article.coverImage && <img src={article.coverImage} alt="" style={{ width: '100%', borderRadius: '1rem' }} />}
      <span className="tag">{article.category}</span>
      <h1>{article.title}</h1>
      <small>Par {article.author.name} — {article.publishedAt.toLocaleDateString('fr-FR')}</small>
      <div dangerouslySetInnerHTML={{ __html: marked.parse(article.body) }} />
    </article>
  )
}
```

- [ ] **Step 6: Write `app/podcast/page.tsx`**

```tsx
import { getEpisodes } from '@/lib/episodes'
import EpisodeCard from '@/components/EpisodeCard'

export default async function PodcastPage() {
  const episodes = await getEpisodes()
  return (
    <>
      <h1>Podcast</h1>
      {episodes.length === 0 && <p>Aucun épisode pour l'instant.</p>}
      {episodes.map((e) => <EpisodeCard key={e.id} episode={e} />)}
    </>
  )
}
```

- [ ] **Step 7: Write `app/podcast/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getEpisodeById } from '@/lib/episodes'

export default async function EpisodeDetailPage({ params }: { params: { id: string } }) {
  const episode = await getEpisodeById(params.id)
  if (!episode) notFound()

  return (
    <article>
      {episode.coverImage && <img src={episode.coverImage} alt="" style={{ width: '100%', borderRadius: '1rem' }} />}
      <h1>{episode.title}</h1>
      <small>Par {episode.author.name} — {episode.publishedAt.toLocaleDateString('fr-FR')}</small>
      <p>{episode.description}</p>
      <a href={episode.externalLink} target="_blank" rel="noopener noreferrer" className="tag">
        Écouter l'épisode →
      </a>
    </article>
  )
}
```

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, visit `/`, `/articles`, `/articles/bienvenue-sur-spill-the-news`, `/podcast`, `/podcast/seed-episode-1`
Expected: seed article and episode render correctly on every page, no console errors. Stop server once confirmed.

- [ ] **Step 9: Commit**

```bash
git add components/ArticleCard.tsx components/EpisodeCard.tsx app/page.tsx app/articles app/podcast
git commit -m "feat: public home, articles, and podcast pages"
```

---

### Task 10: Admin — login and dashboard

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Write `app/admin/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await signIn('credentials', { redirect: false, email, password })
    if (res?.error) {
      setError('Email ou mot de passe incorrect.')
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h1>Connexion admin</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: '1rem' }} />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ display: 'block', width: '100%', marginBottom: '1rem' }} />
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" className="tag" style={{ border: 'none', cursor: 'pointer' }}>Se connecter</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/admin/page.tsx`**

```tsx
import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'

export default async function AdminDashboard() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])

  return (
    <>
      <h1>Tableau de bord</h1>

      <h2>Articles <Link href="/admin/articles/new" className="tag">+ Nouveau</Link></h2>
      <ul>
        {articles.map((a) => (
          <li key={a.id}>
            {a.title} — <Link href={`/admin/articles/${a.id}/edit`}>Éditer</Link>
          </li>
        ))}
      </ul>

      <h2>Épisodes <Link href="/admin/episodes/new" className="tag">+ Nouveau</Link></h2>
      <ul>
        {episodes.map((e) => (
          <li key={e.id}>
            {e.title} — <Link href={`/admin/episodes/${e.id}/edit`}>Éditer</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
```

- [ ] **Step 3: Manual verification of auth gate**

Run: `npm run dev`, visit `/admin` while logged out
Expected: redirected to `/admin/login`. Log in with `spillthenews7@gmail.com` / `changeme123` from the seed. Expected: redirected to `/admin`, dashboard lists the seed article and episode. Stop server once confirmed.

- [ ] **Step 4: Commit**

```bash
git add app/admin/login app/admin/page.tsx
git commit -m "feat: admin login page and dashboard"
```

---

### Task 11: Admin — article create/edit/delete

**Files:**
- Create: `app/admin/articles/actions.ts`
- Create: `app/admin/articles/new/page.tsx`
- Create: `app/admin/articles/[id]/edit/page.tsx`

- [ ] **Step 1: Write `app/admin/articles/actions.ts`**

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { createArticle, updateArticle, deleteArticle } from '@/lib/articles'

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string } | undefined)?.id
  if (!id) redirect('/admin/login')
  return id
}

export async function createArticleAction(formData: FormData) {
  const authorId = await requireUserId()
  await createArticle({
    title: String(formData.get('title')),
    body: String(formData.get('body')),
    category: String(formData.get('category')),
    coverImage: String(formData.get('coverImage') || '') || undefined,
    authorId,
  })
  revalidatePath('/admin')
  revalidatePath('/articles')
  redirect('/admin')
}

export async function updateArticleAction(id: string, formData: FormData) {
  await requireUserId()
  await updateArticle(id, {
    title: String(formData.get('title')),
    body: String(formData.get('body')),
    category: String(formData.get('category')),
    coverImage: String(formData.get('coverImage') || '') || undefined,
  })
  revalidatePath('/admin')
  revalidatePath('/articles')
  redirect('/admin')
}

export async function deleteArticleAction(id: string) {
  await requireUserId()
  await deleteArticle(id)
  revalidatePath('/admin')
  revalidatePath('/articles')
  redirect('/admin')
}
```

- [ ] **Step 2: Write `app/admin/articles/new/page.tsx`**

```tsx
import { createArticleAction } from '../actions'

export default function NewArticlePage() {
  return (
    <>
      <h1>Nouvel article</h1>
      <form action={createArticleAction}>
        <label>Titre<input name="title" required style={{ display: 'block', width: '100%' }} /></label>
        <label>Catégorie<input name="category" required style={{ display: 'block', width: '100%' }} /></label>
        <label>Image de couverture (URL)<input name="coverImage" style={{ display: 'block', width: '100%' }} /></label>
        <label>Contenu (markdown)<textarea name="body" required rows={12} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" className="tag" style={{ border: 'none', cursor: 'pointer' }}>Publier</button>
      </form>
    </>
  )
}
```

- [ ] **Step 3: Write `app/admin/articles/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { updateArticleAction, deleteArticleAction } from '../../actions'

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: params.id } })
  if (!article) notFound()

  const updateWithId = updateArticleAction.bind(null, article.id)
  const deleteWithId = deleteArticleAction.bind(null, article.id)

  return (
    <>
      <h1>Éditer l'article</h1>
      <form action={updateWithId}>
        <label>Titre<input name="title" defaultValue={article.title} required style={{ display: 'block', width: '100%' }} /></label>
        <label>Catégorie<input name="category" defaultValue={article.category} required style={{ display: 'block', width: '100%' }} /></label>
        <label>Image de couverture (URL)<input name="coverImage" defaultValue={article.coverImage ?? ''} style={{ display: 'block', width: '100%' }} /></label>
        <label>Contenu (markdown)<textarea name="body" defaultValue={article.body} required rows={12} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" className="tag" style={{ border: 'none', cursor: 'pointer' }}>Enregistrer</button>
      </form>
      <form action={deleteWithId}>
        <button type="submit" style={{ marginTop: '1rem', background: 'none', border: '1px solid red', color: 'red', cursor: 'pointer' }}>
          Supprimer
        </button>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in, go to `/admin/articles/new`, submit an article
Expected: redirected to `/admin`, new article listed, visible on `/articles`. Edit it via "Éditer", change the title, save — title updates. Delete it — disappears from `/admin` and `/articles`. Stop server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add app/admin/articles
git commit -m "feat: admin article create/edit/delete via server actions"
```

---

### Task 12: Admin — episode create/edit/delete

**Files:**
- Create: `app/admin/episodes/actions.ts`
- Create: `app/admin/episodes/new/page.tsx`
- Create: `app/admin/episodes/[id]/edit/page.tsx`

- [ ] **Step 1: Write `app/admin/episodes/actions.ts`**

```typescript
'use server'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { createEpisode, updateEpisode, deleteEpisode } from '@/lib/episodes'

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions)
  const id = (session?.user as { id?: string } | undefined)?.id
  if (!id) redirect('/admin/login')
  return id
}

export async function createEpisodeAction(formData: FormData) {
  const authorId = await requireUserId()
  await createEpisode({
    title: String(formData.get('title')),
    description: String(formData.get('description')),
    externalLink: String(formData.get('externalLink')),
    coverImage: String(formData.get('coverImage') || '') || undefined,
    authorId,
  })
  revalidatePath('/admin')
  revalidatePath('/podcast')
  redirect('/admin')
}

export async function updateEpisodeAction(id: string, formData: FormData) {
  await requireUserId()
  await updateEpisode(id, {
    title: String(formData.get('title')),
    description: String(formData.get('description')),
    externalLink: String(formData.get('externalLink')),
    coverImage: String(formData.get('coverImage') || '') || undefined,
  })
  revalidatePath('/admin')
  revalidatePath('/podcast')
  redirect('/admin')
}

export async function deleteEpisodeAction(id: string) {
  await requireUserId()
  await deleteEpisode(id)
  revalidatePath('/admin')
  revalidatePath('/podcast')
  redirect('/admin')
}
```

- [ ] **Step 2: Write `app/admin/episodes/new/page.tsx`**

```tsx
import { createEpisodeAction } from '../actions'

export default function NewEpisodePage() {
  return (
    <>
      <h1>Nouvel épisode</h1>
      <form action={createEpisodeAction}>
        <label>Titre<input name="title" required style={{ display: 'block', width: '100%' }} /></label>
        <label>Description<textarea name="description" required rows={4} style={{ display: 'block', width: '100%' }} /></label>
        <label>Lien externe (Spotify/Apple/YouTube)<input name="externalLink" type="url" required style={{ display: 'block', width: '100%' }} /></label>
        <label>Image de couverture (URL)<input name="coverImage" style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" className="tag" style={{ border: 'none', cursor: 'pointer' }}>Publier</button>
      </form>
    </>
  )
}
```

- [ ] **Step 3: Write `app/admin/episodes/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { updateEpisodeAction, deleteEpisodeAction } from '../../actions'

export default async function EditEpisodePage({ params }: { params: { id: string } }) {
  const episode = await prisma.episode.findUnique({ where: { id: params.id } })
  if (!episode) notFound()

  const updateWithId = updateEpisodeAction.bind(null, episode.id)
  const deleteWithId = deleteEpisodeAction.bind(null, episode.id)

  return (
    <>
      <h1>Éditer l'épisode</h1>
      <form action={updateWithId}>
        <label>Titre<input name="title" defaultValue={episode.title} required style={{ display: 'block', width: '100%' }} /></label>
        <label>Description<textarea name="description" defaultValue={episode.description} required rows={4} style={{ display: 'block', width: '100%' }} /></label>
        <label>Lien externe<input name="externalLink" type="url" defaultValue={episode.externalLink} required style={{ display: 'block', width: '100%' }} /></label>
        <label>Image de couverture (URL)<input name="coverImage" defaultValue={episode.coverImage ?? ''} style={{ display: 'block', width: '100%' }} /></label>
        <button type="submit" className="tag" style={{ border: 'none', cursor: 'pointer' }}>Enregistrer</button>
      </form>
      <form action={deleteWithId}>
        <button type="submit" style={{ marginTop: '1rem', background: 'none', border: '1px solid red', color: 'red', cursor: 'pointer' }}>
          Supprimer
        </button>
      </form>
    </>
  )
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in, create an episode via `/admin/episodes/new`
Expected: appears on `/admin` and `/podcast`. Edit and delete it — updates/disappears correctly. Stop server once confirmed.

- [ ] **Step 5: Commit**

```bash
git add app/admin/episodes
git commit -m "feat: admin episode create/edit/delete via server actions"
```

---

### Task 13: Full test suite + typecheck pass, update PRODUCT.md

**Files:**
- Modify: `PRODUCT.md`

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: all suites pass (slugify, password, articles, episodes — 18 tests total).

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Update `PRODUCT.md`**

Replace the file's content to reflect the real project (no longer a fictional demo): update `Stack` section to describe Next.js + Prisma + SQLite + NextAuth, replace the "Evidence on Hand" fabrication warning with a note that seed content (`Bienvenue sur Spill the News` article, `Épisode 1` episode) is placeholder to be replaced via `/admin`, and update `Brand Commitments` to magenta/yellow per the supplied logo instead of "pink family, unconfirmed tint."

- [ ] **Step 4: Commit**

```bash
git add PRODUCT.md
git commit -m "docs: update PRODUCT.md for Spill the News real launch"
```

---

## Deployment note (manual, not automated by this plan)

Before going live: generate a real `NEXTAUTH_SECRET` (`openssl rand -base64 32`), change the seed password via the admin UI or a fresh `prisma db seed` with a real password, and confirm the hosting target persists the SQLite file across deploys (a serverless platform without a persistent volume will lose data — Vercel needs an attached volume or a swap to hosted Postgres via `DATABASE_URL`).
