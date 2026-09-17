import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-articles.db')

// IMPORTANT: `import` statements are hoisted to the top of the module by the
// ESM spec, so a static `import { prisma } from './db'` would run — and
// construct the PrismaClient against whatever DATABASE_URL is set at process
// start — BEFORE this beforeAll() callback ever executes, regardless of
// where the import appears in file source order. That previously caused the
// test suite to silently operate against the real prisma/dev.db instead of
// the temp test DB. To guarantee correct ordering, set DATABASE_URL first
// and only then dynamically import the modules that construct PrismaClient.
let prisma: typeof import('./db').prisma
let createArticle: typeof import('./articles').createArticle
let getArticles: typeof import('./articles').getArticles
let getArticleBySlug: typeof import('./articles').getArticleBySlug
let updateArticle: typeof import('./articles').updateArticle
let deleteArticle: typeof import('./articles').deleteArticle

beforeAll(async () => {
  process.env.DATABASE_URL = `file:${TEST_DB}`
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
    stdio: 'inherit',
  })

  const db = await import('./db')
  const articles = await import('./articles')
  prisma = db.prisma
  createArticle = articles.createArticle
  getArticles = articles.getArticles
  getArticleBySlug = articles.getArticleBySlug
  updateArticle = articles.updateArticle
  deleteArticle = articles.deleteArticle
})

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

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
