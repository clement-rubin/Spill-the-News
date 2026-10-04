import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  deleteArticle: vi.fn(),
  getArticleById: vi.fn(),
  resolveCoverField: vi.fn(),
  removeCover: vi.fn(),
  authorExists: vi.fn(),
}))

vi.mock('@/lib/session', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/lib/articles', () => ({
  createArticle: mocks.createArticle,
  updateArticle: mocks.updateArticle,
  deleteArticle: mocks.deleteArticle,
  getArticleById: mocks.getArticleById,
}))
vi.mock('@/lib/users', () => ({ authorExists: mocks.authorExists }))
vi.mock('@/lib/storage', () => ({
  resolveCoverField: mocks.resolveCoverField,
  removeCover: mocks.removeCover,
}))

import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
} from './actions'

const STORED = 'https://test.supabase.co/storage/v1/object/public/covers/articles/old.png'
const FRESH = 'https://test.supabase.co/storage/v1/object/public/covers/articles/new.webp'

const existing = {
  id: 'article-1',
  title: 'Titre',
  category: 'Culture',
  body: 'Corps',
  coverImage: STORED,
  authorId: 'author-1',
}

function form(fields) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const validFields = {
  id: 'article-1',
  title: 'Titre',
  category: 'Culture',
  body: 'Corps',
  coverImage: STORED,
}

beforeEach(() => {
  vi.clearAllMocks()
  // The real redirect() throws to unwind. A mock that merely recorded the call
  // would let execution fall through into the very write it just refused.
  mocks.redirect.mockImplementation((path) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  })
  mocks.getCurrentUser.mockResolvedValue({ id: 'author-1', email: 'author@example.com', name: 'Author' })
  mocks.getArticleById.mockResolvedValue(existing)
  mocks.resolveCoverField.mockResolvedValue({})
  // clearAllMocks leaves resolved/rejected behaviours in place, so the write
  // stubs have to be reset by hand or one test's failure bleeds into the next.
  mocks.createArticle.mockResolvedValue(undefined)
  mocks.updateArticle.mockResolvedValue(undefined)
  mocks.deleteArticle.mockResolvedValue(undefined)
  mocks.removeCover.mockResolvedValue(undefined)
  mocks.authorExists.mockResolvedValue(true)
})

/** Success paths end in redirect(), which unwinds by throwing. */
async function run(action) {
  return action.catch((error) => {
    if (String(error?.message).startsWith('NEXT_REDIRECT')) return 'redirected'
    throw error
  })
}

describe('updateArticleAction', () => {
  it('saves the text fields and leaves an untouched cover alone', async () => {
    await run(updateArticleAction({}, form(validFields)))

    expect(mocks.updateArticle).toHaveBeenCalledWith('article-1', {
      title: 'Titre',
      category: 'Culture',
      body: 'Corps',
      coverImage: undefined,
      authorId: 'author-1',
    })
    // Nothing was replaced, so the stored file must survive.
    expect(mocks.removeCover).not.toHaveBeenCalled()
  })

  it('deletes the previous file only after a successful swap', async () => {
    mocks.resolveCoverField.mockResolvedValue({ coverImage: FRESH })

    await run(updateArticleAction({}, form(validFields)))

    expect(mocks.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ coverImage: FRESH })
    )
    expect(mocks.removeCover).toHaveBeenCalledWith(STORED)
  })

  it('clears the cover when the field comes back empty', async () => {
    mocks.resolveCoverField.mockResolvedValue({ coverImage: null })

    await run(updateArticleAction({}, form({ ...validFields, coverImage: '' })))

    expect(mocks.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ coverImage: null })
    )
    expect(mocks.removeCover).toHaveBeenCalledWith(STORED)
  })

  it('writes nothing when the cover itself failed to upload', async () => {
    mocks.resolveCoverField.mockResolvedValue({ error: 'Image trop lourde (max 5 Mo).' })

    const state = await run(updateArticleAction({}, form(validFields)))

    expect(state).toEqual({ error: 'Image trop lourde (max 5 Mo).' })
    expect(mocks.updateArticle).not.toHaveBeenCalled()
    expect(mocks.removeCover).not.toHaveBeenCalled()
  })

  it('cleans up the orphaned upload when the database write fails', async () => {
    mocks.resolveCoverField.mockResolvedValue({ coverImage: FRESH })
    mocks.updateArticle.mockRejectedValue(new Error('deadlock detected'))

    const state = await run(updateArticleAction({}, form(validFields)))

    expect(state).toEqual({ error: 'deadlock detected' })
    // The new file went up but the row never changed, so it has to go back down.
    expect(mocks.removeCover).toHaveBeenCalledWith(FRESH)
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('refuses to save without a title', async () => {
    const state = await run(updateArticleAction({}, form({ ...validFields, title: '  ' })))

    expect(state).toEqual({ error: 'Le titre est obligatoire.' })
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })

  it('reports a missing article rather than creating one', async () => {
    mocks.getArticleById.mockResolvedValue(null)

    const state = await run(updateArticleAction({}, form(validFields)))

    expect(state).toEqual({ error: 'Article introuvable.' })
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })

  it('reassigns the article to the picked author', async () => {
    await run(updateArticleAction({}, form({ ...validFields, authorId: 'author-2' })))

    expect(mocks.authorExists).toHaveBeenCalledWith('author-2')
    expect(mocks.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ authorId: 'author-2' })
    )
  })

  it('refuses an author that does not exist', async () => {
    mocks.authorExists.mockResolvedValue(false)

    const state = await run(updateArticleAction({}, form({ ...validFields, authorId: 'ghost' })))

    expect(state).toEqual({ error: 'Auteur introuvable.' })
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })

  it('refreshes the pages that show the article', async () => {
    await run(updateArticleAction({}, form(validFields)))

    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/articles')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/')
  })
})

describe('createArticleAction', () => {
  const newFields = { title: 'Titre', category: 'Culture', body: 'Corps' }

  it('attaches the uploader as author', async () => {
    await run(createArticleAction({}, form(newFields)))

    expect(mocks.createArticle).toHaveBeenCalledWith({
      title: 'Titre',
      category: 'Culture',
      body: 'Corps',
      coverImage: undefined,
      authorId: 'author-1',
    })
  })

  it('signs the article with the picked author', async () => {
    await run(createArticleAction({}, form({ ...newFields, authorId: 'author-2' })))

    expect(mocks.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ authorId: 'author-2' })
    )
  })

  it('does not publish under an unknown author', async () => {
    mocks.authorExists.mockResolvedValue(false)

    const state = await run(createArticleAction({}, form({ ...newFields, authorId: 'ghost' })))

    expect(state).toEqual({ error: 'Auteur introuvable.' })
    expect(mocks.createArticle).not.toHaveBeenCalled()
  })

  it('publishes without a cover when none is given', async () => {
    mocks.resolveCoverField.mockResolvedValue({ coverImage: null })

    await run(createArticleAction({}, form(newFields)))

    expect(mocks.createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ coverImage: null })
    )
  })

  it('does not publish when the upload failed', async () => {
    mocks.resolveCoverField.mockResolvedValue({ error: 'Format d’image non supporté.' })

    const state = await run(createArticleAction({}, form(newFields)))

    expect(state).toEqual({ error: 'Format d’image non supporté.' })
    expect(mocks.createArticle).not.toHaveBeenCalled()
  })
})

describe('deleteArticleAction', () => {
  it('removes the row and the file it owned', async () => {
    await run(deleteArticleAction(form({ id: 'article-1' })))

    expect(mocks.deleteArticle).toHaveBeenCalledWith('article-1')
    expect(mocks.removeCover).toHaveBeenCalledWith(STORED)
  })

  it('still deletes when the row is already gone', async () => {
    mocks.getArticleById.mockResolvedValue(null)

    await run(deleteArticleAction(form({ id: 'article-1' })))

    expect(mocks.deleteArticle).toHaveBeenCalledWith('article-1')
    expect(mocks.removeCover).toHaveBeenCalledWith(undefined)
  })
})

describe('authentication', () => {
  it('sends an anonymous editor to the login page instead of writing', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(updateArticleAction({}, form(validFields))).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login'
    )
    expect(mocks.updateArticle).not.toHaveBeenCalled()
  })

  it('guards the delete action too', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(deleteArticleAction(form({ id: 'article-1' }))).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login'
    )
    expect(mocks.deleteArticle).not.toHaveBeenCalled()
  })

  it('guards the create action too', async () => {
    mocks.getCurrentUser.mockResolvedValue(null)

    await expect(
      createArticleAction({}, form({ title: 'T', category: 'C', body: 'B' }))
    ).rejects.toThrow('NEXT_REDIRECT:/admin/login')
    expect(mocks.createArticle).not.toHaveBeenCalled()
  })
})
