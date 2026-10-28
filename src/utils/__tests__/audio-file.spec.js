import { describe, expect, it } from 'vitest'
import {
  AUDIO_ACCEPT,
  MAX_AUDIO_BYTES,
  audioExtension,
  nameWithoutExtension,
  validateAudioFile,
} from '@/utils/audio-file'

const fileOf = (name, size = 1000) => {
  const file = new File(['x'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('audioExtension', () => {
  it.each([
    ['mix3.wav', 'wav'],
    ['MASTER.WAV', 'wav'],
    ['take.Aiff', 'aiff'],
    ['song.flac', 'flac'],
    ['demo.mp3', 'mp3'],
    ['voice.m4a', 'm4a'],
  ])('%s -> %s', (name, expected) => {
    expect(audioExtension(name)).toBe(expected)
  })

  it.each(['cover.png', 'notes.txt', 'no-extension', 'trailing-dot.', 'archive.wav.zip', '', null])(
    'rejects "%s"',
    (name) => {
      expect(audioExtension(name)).toBeNull()
    },
  )
})

describe('AUDIO_ACCEPT', () => {
  it('lists extensions for the file picker', () => {
    expect(AUDIO_ACCEPT.split(',')).toContain('.wav')
    expect(AUDIO_ACCEPT.split(',')).toContain('.flac')
  })
})

describe('nameWithoutExtension', () => {
  it.each([
    ['I Belong To You mix3.wav', 'I Belong To You mix3'],
    ['master_v_5.final.wav', 'master_v_5.final'],
    ['no-extension', 'no-extension'],
    ['.hidden', '.hidden'],
  ])('"%s" -> "%s"', (name, expected) => {
    expect(nameWithoutExtension(name)).toBe(expected)
  })
})

describe('validateAudioFile', () => {
  it('accepts an audio file', () => {
    expect(validateAudioFile(fileOf('mix3.wav'))).toBeNull()
  })

  it('asks for a file when there is none', () => {
    expect(validateAudioFile(null)).toBe('Choose an audio file first.')
  })

  it('rejects anything that is not audio', () => {
    expect(validateAudioFile(fileOf('cover.png'))).toBe('Use WAV, AIFF, FLAC, MP3, M4A, AAC or OGG audio.')
  })

  it('rejects an empty file', () => {
    expect(validateAudioFile(fileOf('mix3.wav', 0))).toBe('The file is empty.')
  })

  it('rejects files over the limit and names the limit', () => {
    expect(validateAudioFile(fileOf('mix3.wav', MAX_AUDIO_BYTES + 1))).toBe('The file is larger than 500 MB.')
  })

  it('accepts a file exactly at the limit', () => {
    expect(validateAudioFile(fileOf('mix3.wav', MAX_AUDIO_BYTES))).toBeNull()
  })
})