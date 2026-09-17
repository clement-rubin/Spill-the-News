import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(__dirname, 'test-episodes.db')

// IMPORTANT: `import` statements are hoisted to the top of the module by the
// ESM spec, so a static `import { prisma } from './db'` would run — and
// construct the PrismaClient against whatever DATABASE_URL is set at process
// start — BEFORE this beforeAll() callback ever executes, regardless of
// where the import appears in file source order. That previously caused the
// articles test suite to silently operate against the real prisma/dev.db
// instead of the temp test DB. To guarantee correct ordering, set
// DATABASE_URL first and only then dynamically import the modules that
// construct PrismaClient.
let prisma: typeof import('./db').prisma
let createEpisode: typeof import('./episodes').createEpisode
let getEpisodes: typeof import('./episodes').getEpisodes
let getEpisodeById: typeof import('./episodes').getEpisodeById
let updateEpisode: typeof import('./episodes').updateEpisode
let deleteEpisode: typeof import('./episodes').deleteEpisode

beforeAll(async () => {
  process.env.DATABASE_URL = `file:${TEST_DB}`
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: `file:${TEST_DB}` },
    stdio: 'inherit',
  })

  const db = await import('./db')
  const episodes = await import('./episodes')
  prisma = db.prisma
  createEpisode = episodes.createEpisode
  getEpisodes = episodes.getEpisodes
  getEpisodeById = episodes.getEpisodeById
  updateEpisode = episodes.updateEpisode
  deleteEpisode = episodes.deleteEpisode
})

afterAll(async () => {
  await prisma?.$disconnect()
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

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
