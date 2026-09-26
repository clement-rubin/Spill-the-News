'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COVER_HEIGHT,
  COVER_RATIO,
  COVER_WIDTH,
  clampZoom,
  cropGeometry,
  type Pan,
  type Rect,
  type Size,
} from '@/lib/image'

interface Props {
  source: Size
  previewUrl: string
  originalName: string
  onCancel: () => void
  onConfirm: (rect: Rect) => void
}

const KEYBOARD_STEP = 40

export default function ImageCropper({
  source,
  previewUrl,
  originalName,
  onCancel,
  onConfirm,
}: Props) {
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; fromX: number; fromY: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 })
  const [box, setBox] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)

  // The frame is sized by CSS, so its pixel size is only knowable after layout.
  useEffect(() => {
    const element = frame.current
    if (!element) return

    const measure = () =>
      setBox({ width: element.clientWidth, height: element.clientHeight })

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { rect } = cropGeometry(source, zoom, pan)

  // Panning is expressed in output pixels, so a drag across the preview has to
  // be scaled up by however much smaller the preview is than the export.
  const toOutput = box.width ? COVER_WIDTH / box.width : 1

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerId: event.pointerId, fromX: event.clientX, fromY: event.clientY }
    setDragging(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    setPan((current) => ({
      x: current.x + (event.clientX - start.fromX) * toOutput,
      y: current.y + (event.clientY - start.fromY) * toOutput,
    }))
    drag.current = { ...start, fromX: event.clientX, fromY: event.clientY }
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    setDragging(false)
  }

  const onWheel = useCallback((event: React.WheelEvent) => {
    setZoom((current) => clampZoom(current * Math.exp(-event.deltaY * 0.0015)))
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const nudge: Record<string, Pan> = {
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
    }
    const delta = nudge[event.key]
    if (!delta) return
    event.preventDefault()
    setPan((current) => ({ x: current.x + delta.x, y: current.y + delta.y }))
  }

  // Scale so the cropped slice fills the frame exactly — the preview is then
  // the export, not an approximation of it.
  const previewScale =
    box.width && rect.width ? Math.max(box.width / rect.width, box.height / rect.height) : 0

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-label="Rogner l’image">
      <div className="crop-sheet">
        <header className="crop-head">
          <h2>Rogne l’image</h2>
          <p>
            {originalName} n&apos;est pas au format des vignettes. Choisis ce qui
            reste visible, ou zoome pour réduire la marge.
          </p>
        </header>

        <div
          ref={frame}
          className={`crop-frame${dragging ? ' crop-frame--dragging' : ''}`}
          style={{ aspectRatio: `${COVER_RATIO}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="application"
          aria-label="Zone de rognage. Glisse pour déplacer, zoome avec la molette ou les flèches."
        >
          {previewScale > 0 && (
            <img
              className="crop-img"
              src={previewUrl}
              alt=""
              style={{
                width: source.width * previewScale,
                height: source.height * previewScale,
                transform: `translate(calc(-50% + ${-rect.x * previewScale}px), calc(-50% + ${-rect.y * previewScale}px))`,
              }}
              draggable={false}
            />
          )}
          <span className="crop-grid" aria-hidden />
        </div>

        <div className="crop-zoom">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setZoom((current) => clampZoom(current - 0.25))}
            aria-label="Dézoomer"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom"
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setZoom((current) => clampZoom(current + 0.25))}
            aria-label="Zoomer"
          >
            +
          </button>
        </div>

        <p className="field-hint">
          Sortie {COVER_WIDTH}×{COVER_HEIGHT} px · le fichier sera converti et
          allégé avant l&apos;envoi.
        </p>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => onConfirm(rect)}>
            Valider le rognage
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
