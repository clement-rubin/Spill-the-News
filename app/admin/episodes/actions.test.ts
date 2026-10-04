import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  createEpisode: vi.fn(),
  updateEpisode: vi.fn(),
  deleteEpisode: vi.fn(),
  getEpisodeById: vi.fn(),
  resolveCoverField: vi.fn(),
  removeCover: vi.fn(),
  authorExists: vi.fn(),
}))

vi.mock('@/lib/session', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/lib/episodes', () => ({
  createEpisode: mocks.createEpisode,
  updateEpisode: mocks.updateEpisode,
  deleteEpisode: mocks.deleteEpisode,
  getEpisodeById: mocks.getEpisodeById,
}))
vi.mock('@/lib/users', () => ({ authorExists: mocks.authorExists }))
vi.mock('@/lib/storage', () => ({
  resolveCoverField: mocks.resolveCoverField,
  removeCover: mocks.removeCover,
}))

import { createEpisodeAction, updateEpisodeAction } from './actions'

const existing = {
  id: 'episode-1',
  title: 'Épisode',
  description: 'Desc',
  externalLink: 'https://open.spotify.com/episode/xyz',
  coverImage: null,
  authorId: 'author-1',
}

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const fields = {
  title: 'Épisode',
  description: 'Desc',
  externalLink: 'https://open.spotify.com/episode/xyz',
}

beforeEach(() => {
  vi.clearAllMocks()
  // The real redirect() throws to unwind, so the mock does too.
  mocks.redirect.mockImplementation((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  })
  mocks.getCurrentUser.mockResolvedValue({ id: 'author-1', email: 'a@example.com', name: 'A' })
  mocks.getEpisodeById.mockResolvedValue(existing)
  mocks.resolveCoverField.mockResolvedValue({})
  mocks.createEpisode.mockResolvedValue(undefined)
  mocks.updateEpisode.mockResolvedValue(undefined)
  mocks.removeCover.mockResolvedValue(undefined)
  mocks.authorExists.mockResolvedValue(true)
})

/** Success paths end in redirect(), which unwinds by throwing. */
async function run(action: Promise<unknown>) {
  return action.catch((error) => {
    if (String(error?.message).startsWith('NEXT_REDIRECT')) return 'redirected'
    throw error
  })
}

describe('createEpisodeAction', () => {
  it('defaults to the current user when no author is picked', async () => {
    await run(createEpisodeAction({}, form(fields)))

    expect(mocks.createEpisode).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'author-1' })
    )
  })

  it('signs the episode with the picked author', async () => {
    await run(createEpisodeAction({}, form({ ...fields, authorId: 'author-2' })))

    expect(mocks.authorExists).toHaveBeenCalledWith('author-2')
    expect(mocks.createEpisode).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'author-2' })
    )
  })

  it('does not publish under an unknown author', async () => {
    mocks.authorExists.mockResolvedValue(false)

    const state = await run(createEpisodeAction({}, form({ ...fields, authorId: 'ghost' })))

    expect(state).toEqual({ error: 'Auteur introuvable.' })
    expect(mocks.createEpisode).not.toHaveBeenCalled()
  })
})

describe('updateEpisodeAction', () => {
  it('reassigns the episode to the picked author', async () => {
    await run(updateEpisodeAction({}, form({ ...fields, id: 'episode-1', authorId: 'author-2' })))

    expect(mocks.updateEpisode).toHaveBeenCalledWith(
      'episode-1',
      expect.objectContaining({ authorId: 'author-2' })
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/podcast/episode-1')
  })

  it('keeps the current author when the field is absent', async () => {
    await run(updateEpisodeAction({}, form({ ...fields, id: 'episode-1' })))

    expect(mocks.updateEpisode).toHaveBeenCalledWith(
      'episode-1',
      expect.objectContaining({ authorId: 'author-1' })
    )
  })

  it('refuses an author that does not exist', async () => {
    mocks.authorExists.mockResolvedValue(false)

    const state = await run(
      updateEpisodeAction({}, form({ ...fields, id: 'episode-1', authorId: 'ghost' }))
    )

    expect(state).toEqual({ error: 'Auteur introuvable.' })
    expect(mocks.updateEpisode).not.toHaveBeenCalled()
  })
})
