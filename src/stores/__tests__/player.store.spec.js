import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayerStore } from '@/stores/player'
import { songService } from '@/services/song.service'

vi.mock('@/services/song.service', () => ({
  songService: { getFiles: vi.fn() },
}))

/** Behaves like <audio> where the store can see it: methods are spies, events are fired by hand */
function fakeAudio() {
  const listeners = {}
  return {
    paused: true,
    loop: false,
    currentTime: 0,
    duration: Number.NaN,
    src: '',
    addEventListener: vi.fn((event, handler, options) => {
      ;(listeners[event] ??= []).push({ handler, once: options?.once })
    }),
    removeEventListener: vi.fn((event, handler) => {
      listeners[event] = (listeners[event] ?? []).filter((entry) => entry.handler !== handler)
    }),
    play: vi.fn(function play() {
      this.paused = false
      this.fire('play')
      return Promise.resolve()
    }),
    pause: vi.fn(function pause() {
      this.paused = true
      this.fire('pause')
    }),
    load: vi.fn(),
    removeAttribute: vi.fn(function removeAttribute(name) {
      if (name === 'src') this.src = ''
    }),
    fire(event) {
      const entries = listeners[event] ?? []
      listeners[event] = entries.filter((entry) => !entry.once)
      entries.forEach((entry) => entry.handler())
    },
  }
}

const RELEASE = { id: 42, name: 'Neon Siesta', artworkUrl: 'https://signed.test/cover.jpg' }
const SONG = { id: 71, title: 'Siesta Lights', primaryFileId: 82 }
const MIX = { id: 81, displayName: 'mix3', primary: false, url: 'https://signed.test/mix3.wav' }
const MASTER = { id: 82, displayName: 'master', primary: true, url: 'https://signed.test/master.wav' }

// A tracklist: two songs with a main file around one without audio
const INTRO = { id: 70, title: 'Intro', primaryFileId: 90 }
const DEMO_ONLY = { id: 72, title: 'Coral Static', primaryFileId: null }
const OUTRO = { id: 73, title: 'Outro', primaryFileId: 93 }
const TRACKLIST = [INTRO, SONG, DEMO_ONLY, OUTRO]
const mainFileOf = (songId) => ({ id: songId + 20, displayName: `main of ${songId}`, primary: true, url: `https://signed.test/${songId}.wav` })

describe('player store', () => {
  let player
  let audio

  beforeEach(() => {
    vi.clearAllMocks()
    player = usePlayerStore()
    audio = fakeAudio()
    player.attach(audio)
  })

  describe('playing a file', () => {
    it('loads the signed URL and starts playback', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      expect(audio.src).toBe('https://signed.test/mix3.wav')
      expect(audio.play).toHaveBeenCalled()
      expect(player.playing).toBe(true)
      expect(player.track).toEqual({
        releaseId: 42,
        songId: 71,
        fileId: 81,
        title: 'Siesta Lights',
        subtitle: 'mix3 · Neon Siesta',
        artworkUrl: 'https://signed.test/cover.jpg',
        url: 'https://signed.test/mix3.wav',
      })
    })

    it('pauses and resumes the file that is already loaded', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      await player.playFile(RELEASE, SONG, MIX)
      expect(player.playing).toBe(false)

      await player.playFile(RELEASE, SONG, MIX)
      expect(player.playing).toBe(true)
      expect(audio.play).toHaveBeenCalledTimes(2)
    })

    it('knows which song and file are loaded', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      expect(player.isCurrentSong(71)).toBe(true)
      expect(player.isCurrentFile(81)).toBe(true)
      expect(player.isCurrentFile(82)).toBe(false)
    })
  })

  describe('playing a song', () => {
    it('plays the file with the heart', async () => {
      songService.getFiles.mockResolvedValue([MIX, MASTER])

      const problem = await player.playSong(RELEASE, SONG)

      expect(problem).toBeNull()
      expect(songService.getFiles).toHaveBeenCalledWith(42, 71)
      expect(player.track.fileId).toBe(82)
    })

    it('falls back to the newest file without a heart', async () => {
      songService.getFiles.mockResolvedValue([MIX, { ...MASTER, primary: false }])

      await player.playSong(RELEASE, SONG)

      expect(player.track.fileId).toBe(81)
    })

    it('reports a song without audio and leaves the player alone', async () => {
      songService.getFiles.mockResolvedValue([])

      const problem = await player.playSong(RELEASE, SONG)

      expect(problem).toBe('“Siesta Lights” has no audio yet.')
      expect(player.track).toBeNull()
    })

    it('reports a failed request', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      songService.getFiles.mockRejectedValue(new Error('Network'))

      expect(await player.playSong(RELEASE, SONG)).toBe('Could not load this song. Try again.')
    })

    it('marks the song as loading while its files are fetched', async () => {
      let resolve
      songService.getFiles.mockReturnValue(new Promise((done) => { resolve = done }))

      const pending = player.playSong(RELEASE, SONG)
      expect(player.loadingSongId).toBe(71)

      resolve([MASTER])
      await pending
      expect(player.loadingSongId).toBeNull()
    })

    it('pauses the song that is already loaded, without fetching again', async () => {
      songService.getFiles.mockResolvedValue([MASTER])
      await player.playSong(RELEASE, SONG)

      await player.playSong(RELEASE, SONG)

      expect(player.playing).toBe(false)
      expect(songService.getFiles).toHaveBeenCalledTimes(1)
    })
  })

  describe('queue from a tracklist', () => {
    beforeEach(() => {
      songService.getFiles.mockImplementation(async (releaseId, songId) => [mainFileOf(songId)])
    })

    it('queues the songs that have a main file, in tracklist order', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)

      expect(player.queue.map((entry) => entry.song.id)).toEqual([70, 71, 73])
      expect(player.queueIndex).toBe(1)
      expect(player.hasPrevious).toBe(true)
      expect(player.hasNext).toBe(true)
    })

    it('next skips songs without a main file and fetches the link only then', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)
      expect(songService.getFiles).toHaveBeenCalledTimes(1)

      await player.next()

      expect(player.track.songId).toBe(73)
      expect(songService.getFiles).toHaveBeenLastCalledWith(42, 73)
      expect(player.hasNext).toBe(false)
    })

    it('moves on by itself when a track ends', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)

      audio.fire('ended')

      await vi.waitFor(() => expect(player.track.songId).toBe(73))
    })

    it('stops after the last track', async () => {
      await player.playSong(RELEASE, OUTRO, TRACKLIST)

      audio.fire('ended')

      expect(player.playing).toBe(false)
      expect(player.track.songId).toBe(73)
    })

    it('previous goes back one track early in the song', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)

      await player.previous()

      expect(player.track.songId).toBe(70)
    })

    it('previous restarts the track after its first seconds', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)
      audio.currentTime = 30
      audio.fire('timeupdate')

      await player.previous()

      expect(player.track.songId).toBe(71)
      expect(audio.currentTime).toBe(0)
    })

    it('previous on the first track restarts it', async () => {
      await player.playSong(RELEASE, INTRO, TRACKLIST)

      await player.previous()

      expect(player.track.songId).toBe(70)
      expect(audio.currentTime).toBe(0)
    })

    it('a failed start keeps the previous queue', async () => {
      await player.playSong(RELEASE, SONG, TRACKLIST)
      songService.getFiles.mockResolvedValueOnce([])

      const problem = await player.playSong(RELEASE, OUTRO, [OUTRO])

      expect(problem).toBe('“Outro” has no audio yet.')
      expect(player.queue.map((entry) => entry.song.id)).toEqual([70, 71, 73])
      expect(player.track.songId).toBe(71)
    })

    it('shows the problem when the next track cannot load', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      await player.playSong(RELEASE, SONG, TRACKLIST)
      songService.getFiles.mockRejectedValueOnce(new Error('Network'))

      await player.next()

      expect(player.error).toBe('Could not load this song. Try again.')
      expect(player.track.songId).toBe(71)
    })
  })

  describe('queue from a song\'s files', () => {
    it('queues the versions in list order, without fetching', async () => {
      await player.playFile(RELEASE, SONG, MASTER, [MASTER, MIX])

      await player.next()

      expect(player.track.fileId).toBe(81)
      expect(songService.getFiles).not.toHaveBeenCalled()
      expect(player.hasNext).toBe(false)
    })
  })

  describe('repeat', () => {
    it('loops the current track', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      player.toggleRepeat()

      expect(player.repeat).toBe(true)
      expect(audio.loop).toBe(true)
    })

    it('stays on for the next track until switched off', async () => {
      await player.playFile(RELEASE, SONG, MASTER, [MASTER, MIX])
      player.toggleRepeat()

      await player.next()
      expect(audio.loop).toBe(true)

      player.toggleRepeat()
      expect(audio.loop).toBe(false)
    })
  })

  describe('following the audio element', () => {
    it('mirrors time, duration and buffering', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      audio.duration = 204
      audio.fire('durationchange')
      audio.currentTime = 12.5
      audio.fire('timeupdate')
      audio.fire('waiting')

      expect(player.duration).toBe(204)
      expect(player.currentTime).toBe(12.5)
      expect(player.buffering).toBe(true)

      audio.fire('playing')
      expect(player.buffering).toBe(false)
    })

    it('treats an unknown duration as zero', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      audio.duration = Number.POSITIVE_INFINITY
      audio.fire('durationchange')

      expect(player.duration).toBe(0)
    })

    it('seeks the element and the shown position', async () => {
      await player.playFile(RELEASE, SONG, MIX)

      player.seek(42)

      expect(audio.currentTime).toBe(42)
      expect(player.currentTime).toBe(42)
    })

    it('stops listening when detached', () => {
      player.detach()

      expect(audio.removeEventListener).toHaveBeenCalledWith('play', expect.any(Function))
      expect(audio.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function))
    })
  })

  describe('problems', () => {
    it('explains a blocked start', async () => {
      audio.play.mockRejectedValueOnce(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }))

      await player.playFile(RELEASE, SONG, MIX)

      expect(player.error).toBe('Playback was blocked. Press play to start.')
      expect(player.playing).toBe(false)
    })

    it('ignores an aborted start: a newer source took its place', async () => {
      audio.play.mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' }))

      await player.playFile(RELEASE, SONG, MIX)

      expect(player.error).toBeNull()
    })

    it('renews an expired link once and continues where it stopped', async () => {
      await player.playFile(RELEASE, SONG, MIX)
      audio.currentTime = 95
      audio.fire('timeupdate')
      songService.getFiles.mockResolvedValue([{ ...MIX, url: 'https://signed.test/mix3-fresh.wav' }])

      audio.fire('error')
      await vi.waitFor(() => expect(audio.src).toBe('https://signed.test/mix3-fresh.wav'))
      audio.fire('loadedmetadata')

      expect(audio.currentTime).toBe(95)
      expect(player.error).toBeNull()
    })

    it('shows the error when the renewed link fails too', async () => {
      await player.playFile(RELEASE, SONG, MIX)
      songService.getFiles.mockResolvedValue([MIX])
      audio.fire('error')
      await vi.waitFor(() => expect(songService.getFiles).toHaveBeenCalled())

      audio.fire('error')

      expect(player.error).toBe('Could not play this file.')
      expect(songService.getFiles).toHaveBeenCalledTimes(1)
    })

    it('shows the error when the file was deleted meanwhile', async () => {
      await player.playFile(RELEASE, SONG, MIX)
      songService.getFiles.mockResolvedValue([MASTER])

      audio.fire('error')

      await vi.waitFor(() => expect(player.error).toBe('Could not play this file.'))
    })
  })

  it('stop closes the player, forgets the queue and releases the audio', async () => {
    await player.playFile(RELEASE, SONG, MASTER, [MASTER, MIX])
    player.toggleRepeat()

    player.stop()

    expect(player.track).toBeNull()
    expect(player.isActive).toBe(false)
    expect(player.playing).toBe(false)
    expect(player.queue).toEqual([])
    expect(player.hasNext).toBe(false)
    expect(player.repeat).toBe(false)
    expect(audio.loop).toBe(false)
    expect(audio.src).toBe('')
    expect(audio.load).toHaveBeenCalled()
  })
})