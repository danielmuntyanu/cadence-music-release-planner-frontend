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
 *
 * @typedef {Object} QueueEntry
 * @property {Object} song
 * @property {Object | null} file  null: the song's main file, fetched when its turn comes
 */

// "Previous" restarts the track instead when it has played longer than this
const RESTART_THRESHOLD_SECONDS = 3

/**
 * One player for the whole app. The <audio> element lives in PlayerBar, which attaches it here;
 * this store drives it and mirrors its state, so any page can start or pause playback.
 *
 * The queue depends on where playback started: a release's songs (their main files, in tracklist
 * order) or one song's files (its versions, in list order).
 */
export const usePlayerStore = defineStore('player', () => {
  /** @type {import('vue').Ref<PlayerTrack | null>} */
  const track = ref(null)
  const playing = ref(false)
  const buffering = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const error = ref(null)
  const repeat = ref(false)
  // The song whose files are being fetched before it can start
  const loadingSongId = ref(null)

  /** @type {import('vue').Ref<QueueEntry[]>} */
  const queue = ref([])
  const queueIndex = ref(-1)
  // The release the queue belongs to: its name and cover are shown for every track
  let queueRelease = null

  const isActive = computed(() => track.value !== null)
  const hasNext = computed(() => queueIndex.value >= 0 && queueIndex.value < queue.value.length - 1)
  const hasPrevious = computed(() => queueIndex.value > 0)

  /** @type {HTMLAudioElement | null} */
  let audio = null
  // A signed URL can expire mid-session: it is renewed once per track, then the error is shown
  let urlRenewed = false

  const handlers = {
    play: () => { playing.value = true },
    pause: () => { playing.value = false },
    // With repeat on, the element loops by itself and never fires "ended"
    ended: () => {
      playing.value = false
      if (hasNext.value) next()
    },
    timeupdate: () => { currentTime.value = audio.currentTime },
    durationchange: () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0 },
    waiting: () => { buffering.value = true },
    playing: () => { buffering.value = false },
    error: () => { renewOrFail() },
  }

  function attach(element) {
    detach()
    audio = element
    audio.loop = repeat.value
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
    audio.loop = repeat.value
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

  // ---------- Queue ----------

  /**
   * Plays one entry of the queue. A song entry fetches its files now, not earlier:
   * signed URLs expire, so a link fetched at the start of an album would be stale by its end.
   * Returns an error message, or null when playback started.
   */
  async function playAt(index) {
    const entry = queue.value[index]
    if (!entry) return null

    urlRenewed = false
    if (entry.file) {
      queueIndex.value = index
      await load(toTrack(queueRelease, entry.song, entry.file))
      return null
    }

    loadingSongId.value = entry.song.id
    try {
      const files = await songService.getFiles(queueRelease.id, entry.song.id)
      const file = files.find((candidate) => candidate.primary) ?? files[0]
      if (!file) return `“${entry.song.title}” has no audio yet.`

      queueIndex.value = index
      await load(toTrack(queueRelease, entry.song, file))
      return null
    } catch (e) {
      console.error('### player/playAt failed:\n', e)
      return 'Could not load this song. Try again.'
    } finally {
      loadingSongId.value = null
    }
  }

  /** Swaps in a new queue and starts it; on failure the previous queue and track stay as they were */
  async function startQueue(release, entries, index) {
    const previous = { entries: queue.value, index: queueIndex.value, release: queueRelease }
    queue.value = entries
    queueRelease = release

    const problem = await playAt(index)
    if (problem) {
      queue.value = previous.entries
      queueIndex.value = previous.index
      queueRelease = previous.release
    }
    return problem
  }

  /**
   * From a release's tracklist: plays this song, then the next songs that have a main file.
   * Pauses and resumes when the song is already loaded.
   * Returns an error message, or null when playback started.
   */
  async function playSong(release, song, songs = [song]) {
    if (isCurrentSong(song.id)) {
      await toggle()
      return null
    }

    const entries = songs
      .filter((candidate) => candidate.id === song.id || candidate.primaryFileId != null)
      .map((candidate) => ({ song: candidate, file: null }))
    return startQueue(release, entries, entries.findIndex((entry) => entry.song.id === song.id))
  }

  /**
   * From one song's file list: plays this file, then the other versions in list order.
   * Pauses and resumes when the file is already loaded.
   */
  async function playFile(release, song, file, files = [file]) {
    if (isCurrentFile(file.id)) return toggle()

    const entries = files.map((candidate) => ({ song, file: candidate }))
    await startQueue(release, entries, entries.findIndex((entry) => entry.file.id === file.id))
  }

  async function next() {
    if (!hasNext.value) return
    const problem = await playAt(queueIndex.value + 1)
    if (problem) error.value = problem
  }

  /** Restarts the track after its first seconds, as music players do; otherwise goes back one */
  async function previous() {
    if (!track.value) return
    if (currentTime.value > RESTART_THRESHOLD_SECONDS || !hasPrevious.value) {
      seek(0)
      return
    }
    const problem = await playAt(queueIndex.value - 1)
    if (problem) error.value = problem
  }

  /** Repeats the current track until switched off; stays on when moving to another track */
  function toggleRepeat() {
    repeat.value = !repeat.value
    if (audio) audio.loop = repeat.value
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
    repeat.value = false
    queue.value = []
    queueIndex.value = -1
    queueRelease = null
    if (!audio) return
    audio.loop = false
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
    track, playing, buffering, currentTime, duration, error, repeat, loadingSongId,
    queue, queueIndex, isActive, hasNext, hasPrevious,
    attach, detach, isCurrentSong, isCurrentFile, playSong, playFile, toggle,
    next, previous, toggleRepeat, seek, stop,
  }
})