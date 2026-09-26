import { vi, describe, it, expect, beforeEach } from 'vitest'

const PROJECT = 'https://test.supabase.co'
const PUBLIC = `${PROJECT}/storage/v1/object/public/covers`

const { storage, bucket } = vi.hoisted(() => {
  const bucket = {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    remove: vi.fn(),
  }
  return {
    bucket,
    storage: {
      createBucket: vi.fn(),
      from: vi.fn(() => bucket),
    },
  }
})

// Must be hoisted before any import that touches lib/supabase.ts
vi.mock('./supabase', () => ({ supabase: { storage } }))

process.env.NEXT_PUBLIC_SUPABASE_URL = PROJECT

import {
  COVER_BUCKET,
  MAX_COVER_BYTES,
  coverStorageName,
  managedCoverPath,
  removeCover,
  resolveCoverField,
  uploadCover,
  validateCover,
} from './storage'

function png(name = 'cover.png') {
  return new File(['binary'], name, { type: 'image/png' })
}

beforeEach(() => {
  vi.clearAllMocks()
  storage.createBucket.mockResolvedValue({ data: null, error: null })
  bucket.upload.mockResolvedValue({ data: null, error: null })
  bucket.getPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `${PUBLIC}/${path}` },
  }))
  bucket.remove.mockResolvedValue({ data: null, error: null })
})

describe('validateCover', () => {
  it('accepts the image formats we render', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']) {
      expect(validateCover({ type, size: 1000 })).toBeNull()
    }
  })

  it('rejects anything that is not an image', () => {
    expect(validateCover({ type: 'application/pdf', size: 1000 })).toMatch(/non supporté/i)
  })

  it('rejects an empty file', () => {
    expect(validateCover({ type: 'image/png', size: 0 })).toMatch(/vide/i)
  })

  it('rejects a file over the cap', () => {
    expect(validateCover({ type: 'image/png', size: MAX_COVER_BYTES + 1 })).toMatch(/lourde/i)
  })
})

describe('coverStorageName', () => {
  it('files under the given folder with the extension matching the mime type', () => {
    const name = coverStorageName('articles', 'Ma photo.webp', 'image/webp')
    expect(name.startsWith('articles/')).toBe(true)
    expect(name.endsWith('.webp')).toBe(true)
  })

  it('slugifies the original name and caps its length', () => {
    const name = coverStorageName('episodes', 'Épisode 4 — le retour.png', 'image/png')
    expect(name).toContain('episod')
    expect(name).not.toContain('É')
  })

  it('never repeats, even for the same name twice', () => {
    const first = coverStorageName('articles', 'cover.png', 'image/png')
    const second = coverStorageName('articles', 'cover.png', 'image/png')
    expect(first).not.toBe(second)
  })
})

describe('managedCoverPath', () => {
  it('extracts the object path from one of our public URLs', () => {
    expect(managedCoverPath(`${PUBLIC}/articles/123-abc.png`)).toBe('articles/123-abc.png')
  })

  it('ignores URLs from anywhere else', () => {
    expect(managedCoverPath('https://images.google.com/photo.jpg')).toBeNull()
    expect(managedCoverPath(`${PROJECT}/storage/v1/object/public/autres/x.png`)).toBeNull()
    expect(managedCoverPath(null)).toBeNull()
    expect(managedCoverPath('')).toBeNull()
  })
})

describe('removeCover', () => {
  it('deletes a file we own', async () => {
    await removeCover(`${PUBLIC}/articles/123-abc.png`)
    expect(bucket.remove).toHaveBeenCalledWith(['articles/123-abc.png'])
  })

  it('leaves a pasted outside URL alone', async () => {
    await removeCover('https://images.google.com/photo.jpg')
    expect(bucket.remove).not.toHaveBeenCalled()
  })
})

describe('uploadCover', () => {
  it('creates the bucket once and returns the public URL', async () => {
    const url = await uploadCover(png(), 'articles')

    expect(storage.createBucket).toHaveBeenCalledWith(COVER_BUCKET, {
      public: true,
      fileSizeLimit: MAX_COVER_BYTES,
    })
    expect(bucket.upload).toHaveBeenCalledOnce()
    expect(url.startsWith(`${PUBLIC}/articles/`)).toBe(true)
  })

  it('refuses a non-image before touching the network', async () => {
    const file = new File(['x'], 'cover.pdf', { type: 'application/pdf' })
    await expect(uploadCover(file, 'articles')).rejects.toThrow(/non supporté/i)
    expect(bucket.upload).not.toHaveBeenCalled()
  })

  it('explains itself when the bucket cannot be reached', async () => {
    storage.createBucket.mockResolvedValue({ data: null, error: { message: 'nope' } })
    await expect(uploadCover(png(), 'articles')).rejects.toThrow(/Bucket/)
  })

  it('tolerates the bucket already existing', async () => {
    storage.createBucket.mockResolvedValue({
      data: null,
      error: { message: 'The resource already exists' },
    })
    await expect(uploadCover(png(), 'articles')).resolves.toContain(PUBLIC)
  })
})

describe('resolveCoverField', () => {
  it('returns the uploaded URL when a file is picked', async () => {
    const formData = new FormData()
    formData.set('coverFile', png())
    formData.set('coverImage', 'https://images.google.com/photo.jpg')

    const result = await resolveCoverField(formData, 'articles')

    // The file is the newer intent, so the stale URL box loses.
    expect(result.error).toBeUndefined()
    expect(result.coverImage).toContain(`${PUBLIC}/articles/`)
  })

  it('surfaces a validation failure as a form error', async () => {
    const formData = new FormData()
    formData.set('coverFile', new File(['x'], 'cover.pdf', { type: 'application/pdf' }))

    const result = await resolveCoverField(formData, 'articles')

    expect(result.coverImage).toBeUndefined()
    expect(result.error).toMatch(/non supporté/i)
  })

  it('leaves the column alone when nothing changed', async () => {
    const formData = new FormData()
    formData.set('coverImage', 'https://images.google.com/photo.jpg')

    const result = await resolveCoverField(formData, 'articles', 'https://images.google.com/photo.jpg')

    expect(result).toEqual({})
  })

  it('stores a pasted URL that differs from the current one', async () => {
    const formData = new FormData()
    formData.set('coverImage', 'https://images.google.com/new.jpg')

    const result = await resolveCoverField(formData, 'articles', 'https://images.google.com/old.jpg')

    expect(result).toEqual({ coverImage: 'https://images.google.com/new.jpg' })
  })

  it('clears the cover when the URL box is emptied', async () => {
    const formData = new FormData()
    formData.set('coverImage', '')

    const result = await resolveCoverField(formData, 'articles', `${PUBLIC}/articles/1-a.png`)

    expect(result).toEqual({ coverImage: null })
  })

  it('has nothing to do on a fresh form left empty', async () => {
    const result = await resolveCoverField(new FormData(), 'episodes')
    expect(result).toEqual({ coverImage: null })
  })
})
