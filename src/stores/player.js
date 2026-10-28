import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { songService } from '@/services/song.service'

/**
 * @typedef {Object} PlayerTrack
 * @property {number} releaseId
 * @property {number} songId
 * @property {number} fileId
 * @property {string} title       Song title
 * @property {string} subtitle    "File name · Release name"
 * @property {string | null} artworkUrl
 * @property {string} url         Signed and short-lived
 */

/**
 * One player for the whole app. The <audio> element lives in PlayerBar, which attaches it here;
 * this store drives it and mirrors its state, so any page can start or pause playback.
 */
export const usePlayerStore = defineStore('player', () => {
  /** @type {import('vue').Ref<PlayerTrack | null>} */
  const track = ref(null)
  const playing = ref(false)
  const buffering = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const error = ref(null)
  // The song whose files are being fetched before it can start
  const loadingSongId = ref(null)

  const isActive = computed(() => track.value !== null)

  /** @type {HTMLAudioElement | null} */
  let audio = null
  // A signed URL can expire mid-session: it is renewed once per track, then the error is shown
  let urlRenewed = false

  const handlers = {
    play: () => { playing.value = true },
    pause: () => { playing.value = false },
    ended: () => { playing.value = false },
    timeupdate: () => { currentTime.value = audio.currentTime },
    durationchange: () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 },
    waiting: () => { buffering.value = true },
    playing: () => { buffering.value = false },
    error: () => { renewOrFail() },
  }

  function attach(element) {
    detach()
    audio = element
    for (const [event, handler] of Object.entries(handlers)) audio.addEventListener(event, handler)
  }

  function detach() {
    if (!audio) return
    for (const [event, handler] of Object.entries(handlers)) audio.removeEventListener(event, handler)
    audio = null
  }

  const isCurrentSong = (songId) => track.value?.songId === songId
  const isCurrentFile = (fileId) => track.value?.fileId === fileId

  const toTrack = (release, song, file) => ({
    releaseId: release.id,
    songId: song.id,
    fileId: file.id,
    title: song.title,
    subtitle: `${file.displayName} · ${release.name}`,
    artworkUrl: release.artworkUrl ?? null,
    url: file.url,
  })

  async function load(next, startAt = 0) {
    track.value = next
    error.value = null
    currentTime.value = startAt
    duration.value = 0
    if (!audio) return

    audio.src = next.url
    if (startAt > 0) {
      // Seeking before the metadata is known would be ignored
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = startAt }, { once: true })
    }
    await resume()
  }

  async function resume() {
    if (!audio) return
    try {
      await audio.play()
    } catch (e) {
      // AbortError: a newer source replaced this one before it started; nothing went wrong
      if (e?.name === 'AbortError') return
      playing.value = false
      error.value = 'Playback was blocked. Press play to start.'
    }
  }

  async function toggle() {
    if (!audio || !track.value) return
    if (audio.paused) await resume()
    else audio.pause()
  }

  /** Plays one specific file, or pauses and resumes it when it is already loaded */
  async function playFile(release, song, file) {
    if (isCurrentFile(file.id)) return toggle()
    urlRenewed = false
    await load(toTrack(release, song, file))
  }

  /**
   * Plays the song's file with the heart, or its newest one. Pauses and resumes when the song
   * is already loaded. Returns an error message, or null when playback started.
   */
  async function playSong(release, song) {
    if (isCurrentSong(song.id)) {
      await toggle()
      return null
    }

    loadingSongId.value = song.id
    try {
      const files = await songService.getFiles(release.id, song.id)
      const file = files.find((candidate) => candidate.primary) ?? files[0]
      if (!file) return `“${song.title}” has no audio yet.`

      urlRenewed = false
      await load(toTrack(release, song, file))
      return null
    } catch (e) {
      console.error('### player/playSong failed:\n', e)
      return 'Could not load this song. Try again.'
    } finally {
      loadingSongId.value = null
    }
  }

  function seek(seconds) {
    if (!audio || !track.value) return
    audio.currentTime = seconds
    currentTime.value = seconds
  }

  /** Closes the player; also used on logout, so no audio keeps playing for the next user */
  function stop() {
    track.value = null
    playing.value = false
    buffering.value = false
    currentTime.value = 0
    duration.value = 0
    error.value = null
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }

  /** The signed URL probably expired: fetch a fresh one and continue where playback stopped */
  async function renewOrFail() {
    if (!track.value) return

    const fail = () => {
      playing.value = false
      buffering.value = false
      error.value = 'Could not play this file.'
    }
    if (urlRenewed) return fail()

    urlRenewed = true
    try {
      const { releaseId, songId, fileId } = track.value
      const fresh = (await songService.getFiles(releaseId, songId)).find((file) => file.id === fileId)
      if (!fresh) return fail()
      await load({ ...track.value, url: fresh.url }, currentTime.value)
    } catch (e) {
      console.error('### player/renew failed:\n', e)
      fail()
    }
  }

  return {
    track, playing, buffering, currentTime, duration, error, loadingSongId, isActive,
    attach, detach, isCurrentSong, isCurrentFile, playFile, playSong, toggle, seek, stop,
  }
})