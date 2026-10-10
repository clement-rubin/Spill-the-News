'use client'

import { useEffect, useRef, useState } from 'react'
import ImageCropper from './ImageCropper'
import {
  centredCrop,
  decodeCover,
  encodeCover,
  needsCrop,
  type Rect,
  type Size,
} from '@/lib/image'
import { MAX_CAPTION_LENGTH, MAX_COVERS, type Cover } from '@/lib/covers'

type Upload = (formData: FormData) => Promise<{ url?: string; error?: string }>

interface Props {
  defaultValue: Cover[]
  upload: Upload
}

interface Item extends Cover {
  key: string
}

interface Pending {
  bitmap: ImageBitmap
  file: File
  size: Size
  preview: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

function withKey(cover: Cover): Item {
  return { ...cover, key: crypto.randomUUID() }
}

/** Enter in a caption must not publish the whole article. */
function ignoreEnter(event: React.KeyboardEvent) {
  if (event.key === 'Enter') event.preventDefault()
}

export default function CoversField({ defaultValue, upload }: Props) {
  const [items, setItems] = useState<Item[]>(() => defaultValue.map(withKey))
  const [pending, setPending] = useState<Pending | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [address, setAddress] = useState('')
  // The upload loop outlives the render that started it, so it reads the list
  // through this ref rather than the stale `items` of that first render.
  const latest = useRef(items)
  // Resolves the cropper the writer is looking at; null when the dialog is closed.
  const settle = useRef<((rect: Rect | null) => void) | null>(null)
  const held = useRef<Pending | null>(null)

  useEffect(() => {
    return () => {
      held.current?.bitmap.close()
      if (held.current?.preview.startsWith('blob:')) URL.revokeObjectURL(held.current.preview)
      settle.current?.(null)
    }
  }, [])

  function update(next: Item[]) {
    latest.current = next
    setItems(next)
  }

  function askCrop(next: Pending): Promise<Rect | null> {
    return new Promise((resolve) => {
      held.current = next
      settle.current = (rect) => {
        settle.current = null
        held.current = null
        if (next.preview.startsWith('blob:')) URL.revokeObjectURL(next.preview)
        setPending(null)
        resolve(rect)
      }
      setPending(next)
    })
  }

  async function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return

    const problems: string[] = []
    setErrors([])

    for (let index = 0; index < files.length; index++) {
      const file = files[index]
      if (latest.current.length >= MAX_COVERS) {
        problems.push(`Maximum ${MAX_COVERS} photos : « ${file.name} » et les suivantes sont ignorées.`)
        break
      }
      setStatus(`Photo ${index + 1} sur ${files.length}…`)

      let bitmap: ImageBitmap
      try {
        bitmap = await decodeCover(file)
      } catch {
        problems.push(`${file.name} : fichier illisible par le navigateur.`)
        continue
      }

      try {
        const size = { width: bitmap.width, height: bitmap.height }
        const rect = needsCrop(size)
          ? await askCrop({ bitmap, file, size, preview: URL.createObjectURL(file) })
          : centredCrop(size)
        // Cancelling the cropper skips this photo only, not the rest of the batch.
        if (!rect) continue

        const { file: converted } = await encodeCover(bitmap, rect, file.name)
        const body = new FormData()
        body.append('photo', converted)
        const result = await upload(body)
        if (!result.url) throw new Error(result.error ?? 'Envoi impossible.')
        update([...latest.current, withKey({ url: result.url, caption: '' })])
      } catch (error) {
        problems.push(`${file.name} : ${error instanceof Error ? error.message : 'conversion impossible.'}`)
      } finally {
        bitmap.close()
      }
    }

    setStatus(null)
    setErrors(problems)
  }

  function addAddress() {
    const url = address.trim()
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setErrors(['Adresse d’image invalide (https://…).'])
      return
    }
    if (latest.current.length >= MAX_COVERS) {
      setErrors([`Maximum ${MAX_COVERS} photos.`])
      return
    }
    setErrors([])
    update([...items, withKey({ url, caption: '' })])
    setAddress('')
  }

  function setCaption(key: string, caption: string) {
    update(items.map((item) => (item.key === key ? { ...item, caption } : item)))
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  const value = JSON.stringify(items.map(({ url, caption }) => ({ url, caption: caption.trim() })))

  return (
    <div className="field">
      <label htmlFor="coverFiles">Photos de couverture</label>
      <input type="hidden" name="covers" value={value} />

      {items.length > 0 && (
        <ol className="covers-list">
          {items.map((item, index) => (
            <li key={item.key} className="covers-item">
              <div className="covers-thumb">
                <img src={item.url} alt="" />
              </div>
              <div className="covers-body">
                <span className="covers-rank">
                  {index === 0 ? 'Photo principale (vignettes)' : `Photo ${index + 1}`}
                </span>
                <input
                  className="input"
                  type="text"
                  value={item.caption}
                  maxLength={MAX_CAPTION_LENGTH}
                  placeholder="Légende (optionnelle)"
                  aria-label={`Légende de la photo ${index + 1}`}
                  onChange={(event) => setCaption(item.key, event.target.value)}
                  onKeyDown={ignoreEnter}
                />
                <div className="covers-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Monter la photo">
                    ↑
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Descendre la photo">
                    ↓
                  </button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => update(items.filter((other) => other.key !== item.key))}>
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="covers-add">
        <input
          id="coverFiles"
          className="input"
          type="file"
          accept={ACCEPT}
          multiple
          onChange={addFiles}
          disabled={!!status || items.length >= MAX_COVERS}
        />
        <label className="cover-or" htmlFor="coverAddress">
          ou une adresse d&apos;image
        </label>
        <div className="covers-address">
          <input
            id="coverAddress"
            className="input"
            type="url"
            placeholder="https://…"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addAddress()
              }
            }}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={addAddress}>
            Ajouter
          </button>
        </div>
      </div>

      {status && <p className="field-hint">{status}</p>}
      {errors.map((error) => (
        <p key={error} className="form-error" role="alert">
          {error}
        </p>
      ))}

      <p className="field-hint">
        Optionnel. Choisis plusieurs photos d&apos;un coup : chacune est rognée au format 4/3 puis
        allégée. La première sert de vignette ; avec plusieurs photos, l&apos;article affiche un
        diaporama avec les légendes. Pense à enregistrer l&apos;article pour valider.
      </p>

      {pending && (
        <ImageCropper
          source={pending.size}
          previewUrl={pending.preview}
          originalName={pending.file.name}
          onCancel={() => settle.current?.(null)}
          onConfirm={(rect) => settle.current?.(rect)}
        />
      )}
    </div>
  )
}
