import { readImageInfo, sniffFormat } from './image-info.ts'

function bytes(...parts: (number[] | string)[]): Uint8Array {
  return Uint8Array.from(
    parts.flatMap((part) =>
      typeof part === 'string' ? [...part].map((c) => c.charCodeAt(0)) : part,
    ),
  )
}
const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const u16be = (n: number) => [(n >>> 8) & 255, n & 255]
const u16le = (n: number) => [n & 255, (n >>> 8) & 255]
const u24le = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255]

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

describe('readImageInfo', () => {
  it('reads PNG size from IHDR', () => {
    const png = bytes(PNG_SIG, u32be(13), 'IHDR', u32be(1536), u32be(1024), [8, 6, 0, 0, 0])
    expect(readImageInfo(png)).toEqual({ format: 'png', width: 1536, height: 1024 })
  })

  it('skips JPEG segments (APP0, EXIF, DHT) until the frame header', () => {
    const jpeg = bytes(
      [0xff, 0xd8],
      [0xff, 0xe0, ...u16be(16)],
      'JFIF',
      [0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
      [0xff, 0xe1, ...u16be(8), 1, 2, 3, 4, 5, 6],
      [0xff, 0xc4, ...u16be(4), 0, 0],
      [0xff, 0xc2, ...u16be(17), 8, ...u16be(800), ...u16be(1200), 3],
    )
    expect(readImageInfo(jpeg)).toEqual({ format: 'jpeg', width: 1200, height: 800 })
  })

  it('reads lossy WebP', () => {
    const vp8 = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBP',
      'VP8 ',
      [0, 0, 0, 0],
      [0, 0, 0, 0x9d, 0x01, 0x2a],
      u16le(600),
      u16le(400),
    )
    expect(readImageInfo(vp8)).toEqual({ format: 'webp', width: 600, height: 400 })
  })

  it('reads lossless WebP', () => {
    const bits = ((300 - 1) | ((200 - 1) << 14)) >>> 0
    const vp8l = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBP',
      'VP8L',
      [0, 0, 0, 0, 0x2f],
      u32be(bits).reverse(),
      [0, 0, 0, 0, 0],
    )
    expect(readImageInfo(vp8l)).toEqual({ format: 'webp', width: 300, height: 200 })
  })

  it('reads extended WebP', () => {
    const vp8x = bytes(
      'RIFF',
      [0, 0, 0, 0],
      'WEBP',
      'VP8X',
      [10, 0, 0, 0, 0x10, 0, 0, 0],
      u24le(1599),
      u24le(1065),
    )
    expect(readImageInfo(vp8x)).toEqual({ format: 'webp', width: 1600, height: 1066 })
  })

  it('returns nulls for unknown or truncated data', () => {
    expect(sniffFormat(bytes('hello world!'))).toBeNull()
    expect(readImageInfo(bytes('hello world!'))).toEqual({
      format: null,
      width: null,
      height: null,
    })
    expect(readImageInfo(bytes(PNG_SIG))).toEqual({ format: 'png', width: null, height: null })
    expect(readImageInfo(bytes([0xff, 0xd8, 0xff, 0xe0]))).toEqual({
      format: 'jpeg',
      width: null,
      height: null,
    })
  })
})
