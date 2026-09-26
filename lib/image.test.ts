import { describe, it, expect } from 'vitest'

import {
  COVER_HEIGHT,
  COVER_RATIO,
  COVER_WIDTH,
  centredCrop,
  clampZoom,
  cropGeometry,
  formatBytes,
  needsCrop,
} from './image'

const RATIO_TOLERANCE = 0.02

describe('cover output size', () => {
  it('is 4/3, the ratio the cards are laid out for', () => {
    expect(COVER_WIDTH / COVER_HEIGHT).toBeCloseTo(COVER_RATIO, 5)
    expect(COVER_RATIO).toBeCloseTo(4 / 3, 5)
  })
})

describe('needsCrop', () => {
  it('leaves an already 4/3 image alone', () => {
    expect(needsCrop({ width: 1200, height: 900 })).toBe(false)
    expect(needsCrop({ width: 1600, height: 1200 })).toBe(false)
  })

  it('asks for a crop on the usual photo ratios', () => {
    // 16/9, 3/2, 9/16 phone portrait, 1/1
    expect(needsCrop({ width: 1920, height: 1080 })).toBe(true)
    expect(needsCrop({ width: 3000, height: 2000 })).toBe(true)
    expect(needsCrop({ width: 1080, height: 1920 })).toBe(true)
    expect(needsCrop({ width: 1000, height: 1000 })).toBe(true)
  })

  it('tolerates a couple of percent of drift', () => {
    expect(needsCrop({ width: 1200, height: 900 }, RATIO_TOLERANCE)).toBe(false)
    expect(needsCrop({ width: 1000, height: 745 }, RATIO_TOLERANCE)).toBe(false)
    expect(needsCrop({ width: 1000, height: 700 }, RATIO_TOLERANCE)).toBe(true)
  })

  it('has no opinion on a zero-sized image', () => {
    expect(needsCrop({ width: 0, height: 0 })).toBe(false)
  })
})

describe('cropGeometry', () => {
  const square = { width: 1000, height: 1000 }

  it('takes a centred 4/3 slice by default', () => {
    const { rect } = cropGeometry(square, 1, { x: 0, y: 0 })
    expect(rect.width / rect.height).toBeCloseTo(COVER_RATIO, 5)
    expect(rect.x).toBeCloseTo((1000 - rect.width) / 2, 5)
    expect(rect.y).toBeCloseTo((1000 - rect.height) / 2, 5)
  })

  it('never reaches outside the source', () => {
    const { rect } = cropGeometry(square, 1, { x: 99999, y: -99999 })
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(1000 + 0.001)
    expect(rect.y + rect.height).toBeLessThanOrEqual(1000 + 0.001)
  })

  it('cuts away less as the zoom grows', () => {
    const wide = cropGeometry(square, 1, { x: 0, y: 0 }).rect
    const tight = cropGeometry(square, 2, { x: 0, y: 0 }).rect
    expect(tight.width).toBeLessThan(wide.width)
    expect(tight.height).toBeLessThan(wide.height)
  })

  it('moves the window the opposite way to the pan', () => {
    const centred = cropGeometry(square, 2, { x: 0, y: 0 }).rect
    const panned = cropGeometry(square, 2, { x: 120, y: 0 }).rect
    expect(panned.x).toBeLessThan(centred.x)
    expect(panned.width).toBeCloseTo(centred.width, 5)
  })

  it('returns the clamped pan, not the one it was handed', () => {
    const square = cropGeometry({ width: 1000, height: 1000 }, 1, { x: 5000, y: -5000 })
    // The square's width already fills the frame, so only y has slack.
    expect(square.pan.x).toBe(0)
    expect(square.pan.y).toBe(-150)

    const wide = cropGeometry({ width: 1920, height: 1080 }, 1, { x: 5000, y: 5000 })
    expect(wide.pan.x).toBeGreaterThan(0)
    expect(wide.pan.y).toBe(0)
  })

  it('has no room to pan on an image that already fits', () => {
    const exact = { width: COVER_WIDTH, height: COVER_HEIGHT }
    const { rect, pan } = cropGeometry(exact, 1, { x: 90, y: 90 })
    expect(pan).toEqual({ x: 0, y: 0 })
    expect(rect).toEqual({ x: 0, y: 0, width: COVER_WIDTH, height: COVER_HEIGHT })
  })
})

describe('centredCrop', () => {
  it('ignores any prior pan state', () => {
    expect(centredCrop({ width: 1920, height: 1080 })).toEqual(
      cropGeometry({ width: 1920, height: 1080 }, 1, { x: 0, y: 0 }).rect
    )
  })
})

describe('clampZoom', () => {
  it('holds the zoom between 1x and 4x', () => {
    expect(clampZoom(0.2)).toBe(1)
    expect(clampZoom(9)).toBe(4)
    expect(clampZoom(2.5)).toBe(2.5)
  })
})

describe('formatBytes', () => {
  it('reads the way the upload hint does', () => {
    expect(formatBytes(512)).toBe('512 o')
    expect(formatBytes(2048)).toBe('2 Ko')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 Mo')
    expect(formatBytes(1024 * 1024 * 1.5)).toBe('1,5 Mo')
  })
})
