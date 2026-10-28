import { describe, expect, it } from 'vitest'
import { createSongForm, toSong, toSongFile, toSongFiles, toSongRequest, toSongs } from '@/models/song'

describe('toSong', () => {
  it('returns null for non-object input', () => {
    expect(toSong(null)).toBeNull()
  })

  it('fills optional fields with safe defaults', () => {
    expect(toSong({ id: 1, trackNumber: 2, title: 'Intro', status: 'RECORDING' })).toEqual({
      id: 1,
      trackNumber: 2,
      title: 'Intro',
      durationSeconds: null,
      isrc: null,
      status: 'RECORDING',
      lyrics: '',
      explicit: false,
      primaryFileId: null,
      fileCount: 0,
      createdAt: null,
    })
  })

  it('falls back to WRITING for an unknown status', () => {
    expect(toSong({ id: 1, status: 'MASTERED' }).status).toBe('WRITING')
  })

  it('treats only a real true as explicit', () => {
    expect(toSong({ id: 1, explicit: true }).explicit).toBe(true)
    expect(toSong({ id: 1, explicit: 'true' }).explicit).toBe(false)
  })

  it('knows its main file and how many files it has', () => {
    expect(toSong({ id: 1, primaryFileId: 81, fileCount: 3 })).toMatchObject({ primaryFileId: 81, fileCount: 3 })
  })
})

describe('toSongs', () => {
  it('maps a list and drops invalid entries', () => {
    expect(toSongs([{ id: 1 }, null, { id: 2 }]).map((song) => song.id)).toEqual([1, 2])
  })

  it('returns an empty list for anything else', () => {
    expect(toSongs(undefined)).toEqual([])
  })
})

describe('toSongFile', () => {
  it('returns null for non-object input', () => {
    expect(toSongFile(null)).toBeNull()
  })

  it('maps a file with safe defaults', () => {
    expect(toSongFile({ id: 81 })).toEqual({
      id: 81,
      displayName: '',
      originalFilename: '',
      contentType: '',
      sizeBytes: 0,
      uploadedAt: null,
      primary: false,
      url: null,
    })
  })

  it('treats only a real true as the main file', () => {
    expect(toSongFile({ id: 81, primary: true }).primary).toBe(true)
    expect(toSongFile({ id: 81, primary: 'true' }).primary).toBe(false)
  })

  it('toSongFiles maps a list and drops invalid entries', () => {
    expect(toSongFiles([{ id: 81 }, null, { id: 82 }]).map((file) => file.id)).toEqual([81, 82])
    expect(toSongFiles('nope')).toEqual([])
  })
})

describe('createSongForm', () => {
  it('starts empty for a new song', () => {
    expect(createSongForm()).toEqual({
      title: '', duration: '', isrc: '', status: 'WRITING', explicit: false, lyrics: '',
    })
  })

  it('shows length and ISRC as people write them', () => {
    const form = createSongForm(toSong({ id: 1, title: 'Intro', durationSeconds: 215, isrc: 'USABC2600001', status: 'DONE' }))

    expect(form.duration).toBe('3:35')
    expect(form.isrc).toBe('US-ABC-26-00001')
    expect(form.status).toBe('DONE')
  })
})

describe('toSongRequest', () => {
  it('converts the form into the API body', () => {
    expect(toSongRequest({
      title: '  Night Drive ', duration: '3:35', isrc: ' US-ABC-26-00001 ', status: 'RECORDING', explicit: true, lyrics: ' Neon ',
    })).toEqual({
      title: 'Night Drive', durationSeconds: 215, isrc: 'US-ABC-26-00001', status: 'RECORDING', lyrics: 'Neon', explicit: true,
    })
  })

  it('sends null for empty optional fields, which clears them on PUT', () => {
    const body = toSongRequest({ title: 'Intro', duration: '', isrc: '  ', status: 'WRITING', explicit: false, lyrics: '' })

    expect(body).toMatchObject({ durationSeconds: null, isrc: null, lyrics: null })
  })
})