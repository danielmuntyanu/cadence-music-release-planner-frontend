import { describe, expect, it } from 'vitest'
import { createArtistForm, toArtist, toArtistRequest } from '@/models/artist'

describe('toArtist', () => {
  it('returns null for non-object input', () => {
    expect(toArtist(null)).toBeNull()
    expect(toArtist('artist')).toBeNull()
  })

  it('fills optional fields with safe defaults', () => {
    expect(toArtist({ id: 1, name: 'Nova', releaseCount: 0 })).toEqual({
      id: 1,
      name: 'Nova',
      avatarUrl: null,
      bannerUrl: null,
      description: '',
      genre: '',
      socials: [],
      releaseCount: 0,
    })
  })

  it('uses releaseCount from the API when present', () => {
    expect(toArtist({ id: 1, name: 'Nova', releaseCount: 12 }).releaseCount).toBe(12)
  })

  it('maps unknown platforms to OTHER and drops socials without a URL', () => {
    const artist = toArtist({
      id: 1,
      name: 'Nova',
      socials: [
        { platform: 'MYSPACE', url: 'https://myspace.com/nova' },
        { platform: 'SPOTIFY', url: '' },
        null,
      ],
    })

    expect(artist.socials).toEqual([{ platform: 'OTHER', url: 'https://myspace.com/nova' }])
  })
})

describe('toArtistRequest', () => {
  it('trims text fields and sends cleared fields as empty strings', () => {
    const request = toArtistRequest({
      name: '  Nova  ',
      genre: ' ',
      description: 'Bio ',
      avatarUrl: '',
      bannerUrl: ' https://img.test/b.png ',
      socials: [],
    })

    expect(request).toEqual({
      name: 'Nova',
      genre: '',
      description: 'Bio',
      avatarUrl: '',
      bannerUrl: 'https://img.test/b.png',
      socials: [],
    })
  })

  it('drops socials without a URL and strips client-only keys', () => {
    const request = toArtistRequest({
      name: 'Nova',
      socials: [
        { key: 1, platform: 'SPOTIFY', url: ' https://open.spotify.com/artist/1 ' },
        { key: 2, platform: 'TIKTOK', url: '   ' },
      ],
    })

    expect(request.socials).toEqual([{ platform: 'SPOTIFY', url: 'https://open.spotify.com/artist/1' }])
  })
})

describe('createArtistForm', () => {
  it('returns an empty form by default', () => {
    expect(createArtistForm()).toEqual({
      name: '',
      genre: '',
      description: '',
      avatarUrl: '',
      bannerUrl: '',
      socials: [],
    })
  })

  it('prefills from an artist and gives each social a unique key', () => {
    const form = createArtistForm({
      name: 'Nova',
      genre: 'Synthwave',
      description: '',
      avatarUrl: null,
      bannerUrl: null,
      socials: [
        { platform: 'SPOTIFY', url: 'https://a.test' },
        { platform: 'INSTAGRAM', url: 'https://b.test' },
      ],
    })

    expect(form.name).toBe('Nova')
    expect(form.avatarUrl).toBe('')
    expect(new Set(form.socials.map((s) => s.key)).size).toBe(2)
  })

  it('copies socials so editing the form never mutates the source artist', () => {
    const artist = { name: 'Nova', socials: [{ platform: 'SPOTIFY', url: 'https://a.test' }] }
    const form = createArtistForm(artist)

    form.socials[0].url = 'https://changed.test'

    expect(artist.socials[0].url).toBe('https://a.test')
  })
})