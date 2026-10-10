import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  deleteArticle: vi.fn(),
  getArticleById: vi.fn(),
  removeCovers: vi.fn(),
  removeDroppedImages: vi.fn(),
  uploadCover: vi.fn(),
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
  removeCovers: mocks.removeCovers,
  removeDroppedImages: mocks.removeDroppedImages,
  uploadCover: mocks.uploadCover,
}))

import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  uploadArticlePhotoAction,
} from './actions'

const STORED = 'https://test.supabase.co/storage/v1/object/public/covers/articles/old.png'
const FRESH = 'https://test.supabase.co/storage/v1/object/public/covers/articles/new.webp'

const existing = {
  id: 'article-1',
  title: 'Titre',
  category: 'Culture',
  body: 'Corps',
  coverImage: STORED,
  covers: [{ url: STORED, caption: '' }],
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
  // clearAllMocks leaves resolved/rejected behaviours in place, so the write
  // stubs have to be reset by hand or one test's failure bleeds into the next.
  mocks.createArticle.mockResolvedValue(undefined)
  mocks.updateArticle.mockResolvedValue(undefined)
  mocks.deleteArticle.mockResolvedValue(undefined)
  mocks.removeCovers.mockResolvedValue(undefined)
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
  it('saves the text fields and leaves the covers alone when the form has none', async () => {
    await run(updateArticleAction({}, form(validFields)))

    expect(mocks.updateArticle).toHaveBeenCalledWith('article-1', {
      title: 'Titre',
      category: 'Culture',
      body: 'Corps',
      covers: undefined,
      authorId: 'author-1',
    })
    // Nothing was replaced, so the stored file must survive.
    expect(mocks.removeCovers).not.toHaveBeenCalled()
  })

  it('saves several covers with their captions', async () => {
    const covers = [
      { url: STORED, caption: 'Un' },
      { url: FRESH, caption: 'Deux' },
    ]

    await run(updateArticleAction({}, form({ ...validFields, covers: JSON.stringify(covers) })))

    expect(mocks.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ covers })
    )
    expect(mocks.removeCovers).toHaveBeenCalledWith([])
  })

  it('deletes the files that dropped out of the list, after the save', async () => {
    const covers = JSON.stringify([{ url: FRESH, caption: '' }])

    await run(updateArticleAction({}, form({ ...validFields, covers })))

    expect(mocks.removeCovers).toHaveBeenCalledWith([STORED])
  })

  it('clears every cover when the list comes back empty', async () => {
    await run(updateArticleAction({}, form({ ...validFields, covers: '[]' })))

    expect(mocks.updateArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({ covers: [] })
    )
    expect(mocks.removeCovers).toHaveBeenCalledWith([STORED])
  })

  it('writes nothing when the covers field is unreadable', async () => {
    const state = await run(updateArticleAction({}, form({ ...validFields, covers: 'oups' })))

    expect(state).toHaveProperty('error')
    expect(mocks.updateArticle).not.toHaveBeenCalled()
    expect(mocks.removeCovers).not.toHaveBeenCalled()
  })

  it('keeps the old files when the database write fails', async () => {
    const covers = JSON.stringify([{ url: FRESH, caption: '' }])
    mocks.updateArticle.mockRejectedValue(new Error('deadlock detected'))

    const state = await run(updateArticleAction({}, form({ ...validFields, covers })))

    expect(state).toEqual({ error: 'deadlock detected' })
    expect(mocks.removeCovers).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it('drops the body photos the new text no longer uses', async () => {
    await run(updateArticleAction({}, form(validFields)))

    expect(mocks.removeDroppedImages).toHaveBeenCalledWith('Corps', validFields.body)
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
      covers: undefined,
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

  it('publishes with the covers and captions given', async () => {
    const covers = [{ url: FRESH, caption: 'Légende' }]

    await run(createArticleAction({}, form({ ...newFields, covers: JSON.stringify(covers) })))

    expect(mocks.createArticle).toHaveBeenCalledWith(expect.objectContaining({ covers }))
  })

  it('does not publish when the covers field is unreadable', async () => {
    const state = await run(createArticleAction({}, form({ ...newFields, covers: '{' })))

    expect(state).toHaveProperty('error')
    expect(mocks.createArticle).not.toHaveBeenCalled()
  })
})

describe('deleteArticleAction', () => {
  it('removes the row and the file it owned', async () => {
    await run(deleteArticleAction(form({ id: 'article-1' })))

    expect(mocks.deleteArticle).toHaveBeenCalledWith('article-1')
    expect(mocks.removeCovers).toHaveBeenCalledWith([STORED])
    expect(mocks.removeDroppedImages).toHaveBeenCalledWith('Corps')
  })

  it('still deletes when the row is already gone', async () => {
    mocks.getArticleById.mockResolvedValue(null)

    await run(deleteArticleAction(form({ id: 'article-1' })))

    expect(mocks.deleteArticle).toHaveBeenCalledWith('article-1')
    expect(mocks.removeCovers).not.toHaveBeenCalled()
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

describe('uploadArticlePhotoAction', () => {
  function photoForm(file?: File) {
    const formData = new FormData()
    if (file) formData.append('photo', file)
    return formData
  }

  it('returns the public URL of the uploaded photo', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.uploadCover.mockResolvedValue(FRESH)
    const file = new File(['x'], 'photo.webp', { type: 'image/webp' })

    await expect(uploadArticlePhotoAction(photoForm(file))).resolves.toEqual({ url: FRESH })
    expect(mocks.uploadCover).toHaveBeenCalledWith(file, 'articles')
  })

  it('reports an upload failure instead of throwing', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    mocks.uploadCover.mockRejectedValue(new Error('Image trop lourde (max 5 Mo).'))
    const file = new File(['x'], 'photo.webp', { type: 'image/webp' })

    await expect(uploadArticlePhotoAction(photoForm(file))).resolves.toEqual({
      error: 'Image trop lourde (max 5 Mo).',
    })
  })

  it('refuses an empty request', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1' })
    await expect(uploadArticlePhotoAction(photoForm())).resolves.toEqual({
      error: 'Aucune photo reçue.',
    })
    expect(mocks.uploadCover).not.toHaveBeenCalled()
  })
})
