'use client'

import { useRef, useState } from 'react'
import { decodeCover, encodePhoto } from '@/lib/image'

const FONTS = [
  { label: 'Police…', value: '' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

const ALIGNMENTS = [
  { value: 'left', title: 'Aligner à gauche' },
  { value: 'center', title: 'Centrer' },
  { value: 'right', title: 'Aligner à droite' },
  { value: 'justify', title: 'Justifier' },
]

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

type PhotoUpload = (formData: FormData) => Promise<{ url?: string; error?: string }>

interface Props {
  id: string
  name: string
  defaultValue?: string
  /** Shows the photo button; omitted where photos make no sense (emails). */
  uploadPhoto?: PhotoUpload
}

export default function RichTextField({ id, name, defaultValue, uploadPhoto }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  // Where the cursor was when the photo button was pressed: the file picker
  // and the uploads take the focus away, and the photos must land there.
  const photoAnchor = useRef(0)
  const [photoStatus, setPhotoStatus] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = ref.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const raw = el.value.slice(start, end)
    // A double-click also selects the trailing space, and `**mot **` is not
    // bold for marked — so the spaces stay outside the markers.
    const lead = raw.match(/^\s*/)?.[0] ?? ''
    const trail = raw.slice(lead.length).match(/\s*$/)?.[0] ?? ''
    const selected = raw.slice(lead.length, raw.length - trail.length) || placeholder

    const inserted = lead + before + selected + after + trail
    el.value = el.value.slice(0, start) + inserted + el.value.slice(end)
    el.focus()
    const cursor = start + inserted.length
    el.setSelectionRange(cursor, cursor)
  }

  function insertBlock(block: string, at = ref.current?.selectionStart ?? 0, until = at) {
    const el = ref.current
    if (!el) return
    const text = `\n\n${block}\n\n`
    el.value = el.value.slice(0, at) + text + el.value.slice(until)
    el.focus()
    const cursor = at + text.length
    el.setSelectionRange(cursor, cursor)
  }

  function heading() {
    const el = ref.current
    if (!el) return
    const selected = el.value
      .slice(el.selectionStart, el.selectionEnd)
      .replace(/\s+/g, ' ')
      .replace(/^[\s#*]+|[\s*]+$/g, '')
    insertBlock(`## ${selected || 'Titre de partie'}`, el.selectionStart, el.selectionEnd)
  }

  function pickPhotos() {
    photoAnchor.current = ref.current?.selectionEnd ?? ref.current?.value.length ?? 0
    setPhotoError(null)
    photoInput.current?.click()
  }

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length || !uploadPhoto) return

    // Captions are asked first so the writer is not left waiting between uploads.
    const queued: { file: File; caption: string }[] = []
    for (const file of files) {
      const caption = window.prompt(
        `Légende sous la photo « ${file.name} » (laisser vide pour aucune) :`,
        ''
      )
      if (caption === null) continue
      queued.push({ file, caption: caption.replace(/[[\]\r\n]+/g, ' ').trim() })
    }
    if (!queued.length) return

    const lines: string[] = []
    const failures: string[] = []
    for (let index = 0; index < queued.length; index++) {
      const { file, caption } = queued[index]
      setPhotoStatus(`Envoi de la photo ${index + 1} sur ${queued.length}…`)
      try {
        const bitmap = await decodeCover(file)
        const photo = await encodePhoto(bitmap, file.name)
        bitmap.close()
        const formData = new FormData()
        formData.append('photo', photo)
        const result = await uploadPhoto(formData)
        if (!result.url) throw new Error(result.error ?? 'Envoi impossible.')
        lines.push(`![${caption}](${result.url})`)
      } catch (error) {
        failures.push(`${file.name} : ${error instanceof Error ? error.message : 'illisible.'}`)
      }
    }
    setPhotoStatus(null)
    if (failures.length) setPhotoError(failures.join(' — '))
    if (lines.length) insertBlock(lines.join('\n'), photoAnchor.current)
  }

  function insertLink() {
    const url = window.prompt('Adresse du lien (https://…) :')
    if (!url) return
    wrapSelection('[', `](${url})`, 'texte du lien')
  }

  // Blank lines around the content let marked keep parsing the Markdown inside the div.
  function align(value: string) {
    const el = ref.current
    if (!el) return

    // Trim the blank lines a quote leaves behind so they don't pile up.
    const selected = el.value.slice(el.selectionStart, el.selectionEnd).trim()
    el.setRangeText(selected, el.selectionStart, el.selectionEnd, 'select')
    wrapSelection(`\n\n<div style="text-align: ${value}">\n\n`, '\n\n</div>\n\n', 'texte aligné')
  }

  function quote() {
    const el = ref.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = el.value.slice(start, end) || 'citation'
    const quoted = selected
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')

    el.value = el.value.slice(0, start) + '\n\n' + quoted + '\n\n' + el.value.slice(end)
    el.focus()
    const cursor = start + quoted.length + 4
    el.setSelectionRange(cursor, cursor)
  }

  function applyFont(fontFamily: string) {
    if (!fontFamily) return
    wrapSelection(`<span style="font-family: ${fontFamily}">`, '</span>', 'texte')
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Mise en forme du texte">
        <button type="button" className="rte-btn rte-btn--wide" title="Titre de partie" onMouseDown={(e) => e.preventDefault()} onClick={heading}>
          Titre
        </button>
        <button type="button" className="rte-btn" title="Gras" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('**', '**', 'texte en gras')}>
          <strong>G</strong>
        </button>
        <button type="button" className="rte-btn" title="Italique" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('*', '*', 'texte en italique')}>
          <em>I</em>
        </button>
        <button type="button" className="rte-btn" title="Souligné" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('<u>', '</u>', 'texte souligné')}>
          <span style={{ textDecoration: 'underline' }}>S</span>
        </button>
        <button type="button" className="rte-btn" title="Lien" onMouseDown={(e) => e.preventDefault()} onClick={insertLink}>
          🔗
        </button>
        <button type="button" className="rte-btn" title="Citation" onMouseDown={(e) => e.preventDefault()} onClick={quote}>
          ❝
        </button>
        {uploadPhoto && (
          <button type="button" className="rte-btn rte-btn--wide" title="Ajouter une ou plusieurs photos avec légende" onMouseDown={(e) => e.preventDefault()} onClick={pickPhotos} disabled={!!photoStatus}>
            📷 Photos
          </button>
        )}
        {ALIGNMENTS.map((a) => (
          <button key={a.value} type="button" className="rte-btn" title={a.title} aria-label={a.title} onMouseDown={(e) => e.preventDefault()} onClick={() => align(a.value)}>
            <AlignIcon value={a.value} />
          </button>
        ))}
        <select
          className="rte-font"
          aria-label="Police d'écriture"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            applyFont(e.target.value)
            e.target.value = ''
          }}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      {uploadPhoto && (
        <input ref={photoInput} type="file" accept={PHOTO_TYPES} multiple hidden onChange={addPhotos} />
      )}
      {photoStatus && <p className="field-hint">{photoStatus}</p>}
      {photoError && (
        <p className="form-error" role="alert">
          {photoError}
        </p>
      )}
      <textarea ref={ref} id={id} name={name} className="textarea" defaultValue={defaultValue} required />
    </div>
  )
}

/** Four lines whose lengths and offsets mimic each alignment. */
function AlignIcon({ value }: { value: string }) {
  const widths = value === 'justify' ? [14, 14, 14, 14] : [14, 9, 12, 8]
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      {widths.map((w, i) => {
        const x = value === 'center' ? (16 - w) / 2 : value === 'right' ? 15 - w : 1
        return <rect key={i} x={x} y={1 + i * 3.5} width={w} height="1.6" rx="0.8" fill="currentColor" />
      })}
    </svg>
  )
}
