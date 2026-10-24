import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES, formatBytes, validateImageFile } from '@/utils/image-file'

const fileOf = (type, size = 1000) => {
  const file = new File(['x'], 'picture', { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateImageFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts %s', (type) => {
    expect(validateImageFile(fileOf(type))).toBeNull()
  })

  it.each(['image/gif', 'image/svg+xml', 'application/pdf', ''])('rejects "%s"', (type) => {
    expect(validateImageFile(fileOf(type))).toBe('Use a JPEG, PNG or WebP image.')
  })

  it('rejects files over the limit and names the limit', () => {
    expect(validateImageFile(fileOf('image/png', MAX_IMAGE_BYTES + 1))).toBe('The image is larger than 10 MB.')
  })

  it('accepts a file exactly at the limit', () => {
    expect(validateImageFile(fileOf('image/png', MAX_IMAGE_BYTES))).toBeNull()
  })

  it('honours a custom limit', () => {
    expect(validateImageFile(fileOf('image/png', 3 * 1024 * 1024), 2 * 1024 * 1024)).toBe('The image is larger than 2 MB.')
  })

  it('asks for a file when there is none', () => {
    expect(validateImageFile(null)).toBe('Choose an image first.')
  })
})

describe('formatBytes', () => {
  it.each([
    [512 * 1024, '512 KB'],
    [2.5 * 1024 * 1024, '2.5 MB'],
    [10 * 1024 * 1024, '10 MB'],
  ])('%i bytes is "%s"', (bytes, label) => {
    expect(formatBytes(bytes)).toBe(label)
  })
})