/**
 * Cover geometry and encoding. Everything that touches canvas or File lives
 * here so CoverField and the cropper agree on one source of truth — and so the
 * numbers can be unit tested without a DOM.
 */

/** The ratio every card and the article hero are laid out for. */
export const COVER_RATIO = 4 / 3

export const COVER_WIDTH = 1200
export const COVER_HEIGHT = Math.round(COVER_WIDTH / COVER_RATIO)

/** 2% — close enough that a 1600x1200 photo is never sent to the cropper. */
const RATIO_TOLERANCE = 0.02

export interface Size {
  width: number
  height: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Pan {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** True when the image would lose real content to a 4/3 crop. */
export function needsCrop(size: Size, tolerance = RATIO_TOLERANCE): boolean {
  if (!size.width || !size.height) return false
  return Math.abs(size.width / size.height - COVER_RATIO) / COVER_RATIO > tolerance
}

/**
 * Which slice of the source lands in the 4/3 frame, plus the pan actually used
 * after clamping — the caller needs the clamped pair so the preview cannot sit
 * somewhere the exported file will not.
 */
export function cropGeometry(
  source: Size,
  zoom: number,
  pan: Pan
): { rect: Rect; pan: Pan } {
  const scale = Math.max(COVER_WIDTH / source.width, COVER_HEIGHT / source.height) * zoom

  const width = Math.min(source.width, COVER_WIDTH / scale)
  const height = Math.min(source.height, COVER_HEIGHT / scale)

  // Half the leftover on each side: past that the frame would show empty space.
  const limitX = Math.max(0, ((source.width - width) * scale) / 2)
  const limitY = Math.max(0, ((source.height - height) * scale) / 2)

  const x = clamp(pan.x, -limitX, limitX)
  const y = clamp(pan.y, -limitY, limitY)

  return {
    rect: {
      x: (source.width - width) / 2 - x / scale,
      y: (source.height - height) / 2 - y / scale,
      width,
      height,
    },
    pan: { x, y },
  }
}

/** The same slice, centred — what a correctly proportioned image gets. */
export function centredCrop(source: Size): Rect {
  return cropGeometry(source, 1, { x: 0, y: 0 }).rect
}

export function clampZoom(zoom: number): number {
  return clamp(zoom, 1, 4)
}

export function decodeCover(file: Blob): Promise<ImageBitmap> {
  // imageOrientation matters: phone photos are stored sideways with an EXIF
  // flag, and without this the crop lands on the wrong part of the photo.
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

function supportsWebp(): boolean {
  const probe = document.createElement('canvas')
  probe.width = 1
  probe.height = 1
  return probe.toDataURL('image/webp').startsWith('data:image/webp')
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Encodage impossible.'))),
      type,
      quality
    )
  })
}

export interface EncodedCover {
  file: File
  originalName: string
}

/**
 * Draws the slice at full output size and re-encodes it. WebP first — a 4:3
 * cover of this size lands around 150 KB against 600 KB for the same JPEG.
 */
export async function encodeCover(
  source: ImageBitmap,
  rect: Rect,
  originalName: string
): Promise<EncodedCover> {
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Rognage impossible sur ce navigateur.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    source,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    COVER_WIDTH,
    COVER_HEIGHT
  )

  const webp = supportsWebp()
  const type = webp ? 'image/webp' : 'image/jpeg'
  const blob = await toBlob(canvas, type, 0.82)

  const base = originalName.replace(/\.[^.]+$/, '').trim() || 'cover'
  return {
    file: new File([blob], `${base}.${webp ? 'webp' : 'jpg'}`, { type }),
    originalName,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  // toFixed alone would render a clean 5 MB as "5,0 Mo".
  const megabytes = Number((bytes / 1024 / 1024).toFixed(1))
  return `${String(megabytes).replace('.', ',')} Mo`
}
