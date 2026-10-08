// Reads an image's real format and pixel size from its first bytes, so the
// backup manifest can record them without an image library (sharp arrives in
// Phase 35). Covers what the buckets can hold: PNG, JPEG, WebP (+ GIF).

export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif'

export interface ImageInfo {
  format: ImageFormat | null
  width: number | null
  height: number | null
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length))
}

export function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === 'PNG') return 'png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpeg'
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP')
    return 'webp'
  if (bytes.length >= 6 && ascii(bytes, 0, 4) === 'GIF8') return 'gif'
  return null
}

function pngSize(bytes: Uint8Array, view: DataView): [number, number] | null {
  // Signature (8) + IHDR length (4) + "IHDR" (4), then width, height (big-endian).
  if (bytes.length < 24 || ascii(bytes, 12, 4) !== 'IHDR') return null
  return [view.getUint32(16), view.getUint32(20)]
}

// SOFn markers carry the frame size; C4 (DHT), C8 (JPG) and CC (DAC) share the
// range but aren't frames.
function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
}

function jpegSize(bytes: Uint8Array, view: DataView): [number, number] | null {
  let offset = 2
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    // Fill bytes and standalone markers (RSTn, TEM) have no length field.
    if (marker === 0xff) {
      offset++
      continue
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      offset += 2
      continue
    }
    if (marker === 0xd9 || marker === 0xda) return null
    const length = view.getUint16(offset + 2)
    if (isStartOfFrame(marker)) {
      if (offset + 9 > bytes.length) return null
      return [view.getUint16(offset + 7), view.getUint16(offset + 5)]
    }
    offset += 2 + length
  }
  return null
}

function webpSize(bytes: Uint8Array, view: DataView): [number, number] | null {
  if (bytes.length < 30) return null
  const chunk = ascii(bytes, 12, 4)
  if (chunk === 'VP8 ') {
    // Frame tag (3) + start code (3), then 14-bit width/height (little-endian).
    return [view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff]
  }
  if (chunk === 'VP8L') {
    // Signature byte 0x2f, then 14 bits width-1 and 14 bits height-1.
    const bits = view.getUint32(21, true)
    return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1]
  }
  if (chunk === 'VP8X') {
    // 24-bit canvas width-1 and height-1 (little-endian).
    const width = bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)
    const height = bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)
    return [width + 1, height + 1]
  }
  return null
}

function gifSize(bytes: Uint8Array, view: DataView): [number, number] | null {
  if (bytes.length < 10) return null
  return [view.getUint16(6, true), view.getUint16(8, true)]
}

export function readImageInfo(bytes: Uint8Array): ImageInfo {
  const format = sniffFormat(bytes)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const size =
    format === 'png'
      ? pngSize(bytes, view)
      : format === 'jpeg'
        ? jpegSize(bytes, view)
        : format === 'webp'
          ? webpSize(bytes, view)
          : format === 'gif'
            ? gifSize(bytes, view)
            : null
  return { format, width: size?.[0] ?? null, height: size?.[1] ?? null }
}

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}
