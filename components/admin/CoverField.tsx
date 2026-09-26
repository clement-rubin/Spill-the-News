'use client'

import { useEffect, useRef, useState } from 'react'
import ImageCropper from './ImageCropper'
import {
  centredCrop,
  decodeCover,
  encodeCover,
  formatBytes,
  needsCrop,
  type Rect,
  type Size,
} from '@/lib/image'

interface Props {
  defaultValue: string | null
  hint?: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

interface Pending {
  bitmap: ImageBitmap
  file: File
  size: Size
  preview: string
}

export default function CoverField({ defaultValue, hint }: Props) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [preview, setPreview] = useState<string | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Object URLs live until revoked, so every preview has to be released or the
  // tab leaks a copy of each image the editor ever opened.
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  useEffect(() => {
    return () => {
      pending?.bitmap.close()
      if (pending?.preview.startsWith('blob:')) URL.revokeObjectURL(pending.preview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = preview ?? url

  /** Hands the re-encoded file to the real input so the form posts it as usual. */
  function store(file: File) {
    const input = fileInput.current
    if (input) {
      const transfer = new DataTransfer()
      transfer.items.add(file)
      input.files = transfer.files
    }
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
  }

  function reset() {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(null)
    setReport(null)
    setError(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function process(bitmap: ImageBitmap, rect: Rect, file: File) {
    setBusy(true)
    setError(null)
    try {
      const { file: converted, originalName } = await encodeCover(bitmap, rect, file.name)
      store(converted)
      setReport(
        `${originalName} (${formatBytes(file.size)}) → ${converted.name} (${formatBytes(converted.size)})`
      )
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : 'Image impossible à convertir.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setReport(null)

    let bitmap: ImageBitmap
    try {
      bitmap = await decodeCover(file)
    } catch {
      setError('Ce fichier n’est pas une image lisible par le navigateur.')
      if (fileInput.current) fileInput.current.value = ''
      return
    }

    const size = { width: bitmap.width, height: bitmap.height }

    // A 4/3 source has nothing to decide, so it is resized straight away.
    if (!needsCrop(size)) {
      await process(bitmap, centredCrop(size), file)
      bitmap.close()
      return
    }

    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPending({ bitmap, file, size, preview: URL.createObjectURL(file) })
  }

  function closeCropper() {
    pending?.bitmap.close()
    if (pending?.preview.startsWith('blob:')) URL.revokeObjectURL(pending.preview)
    setPending(null)
    // Cancelling drops the selection too, so nothing silently ships uncropped.
    reset()
  }

  async function confirmCrop(rect: Rect) {
    if (!pending) return
    const { bitmap, file, preview: cropPreview } = pending
    setPending(null)
    if (cropPreview.startsWith('blob:')) URL.revokeObjectURL(cropPreview)
    // The bitmap has to outlive process() — the canvas draws from it.
    await process(bitmap, rect, file)
    bitmap.close()
  }

  return (
    <div className="field">
      <label htmlFor="coverFile">Image de couverture</label>

      <div className="cover">
        <div className="cover-preview">
          {shown ? (
            <img src={shown} alt="" />
          ) : (
            <span className="cover-empty">Aucune image</span>
          )}
        </div>

        <div className="cover-controls">
          <input
            ref={fileInput}
            id="coverFile"
            name="coverFile"
            className="input"
            type="file"
            accept={ACCEPT}
            onChange={onPick}
            disabled={busy}
          />

          {busy && <p className="field-hint">Conversion en cours…</p>}
          {report && <p className="field-hint">{report}</p>}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <label className="cover-or" htmlFor="coverImage">
            ou une adresse d&apos;image
          </label>
          <input
            id="coverImage"
            name="coverImage"
            className="input"
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />

          {shown && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
              Retirer l&apos;image
            </button>
          )}

          <p className="field-hint">
            {hint ??
              'Optionnel. L’image est rognée au format 4/3 des vignettes puis allégée automatiquement.'}
          </p>
        </div>
      </div>

      {pending && (
        <ImageCropper
          source={pending.size}
          previewUrl={pending.preview}
          originalName={pending.file.name}
          onCancel={closeCropper}
          onConfirm={confirmCrop}
        />
      )}
    </div>
  )
}
