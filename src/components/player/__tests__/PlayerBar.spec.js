import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { VLayout } from 'vuetify/components'
import PlayerBar from '@/components/player/PlayerBar.vue'
import { usePlayerStore } from '@/stores/player'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeSong } from '@/test-utils/fixtures/songs'

vi.mock('@/services/song.service', () => ({
  songService: { getFiles: vi.fn() },
}))

// v-footer with `app` takes part in Vuetify's layout, which needs a layout around it
const Host = defineComponent({ render: () => h(VLayout, () => h(PlayerBar)) })

const RELEASE = { id: 42, name: 'Neon Siesta', artworkUrl: 'https://signed.test/cover.jpg' }
const SONG = makeSong({ id: 71, title: 'Siesta Lights' })
const MASTER = { id: 82, displayName: 'master', primary: true, url: 'https://signed.test/master.wav' }
const MIX = { id: 81, displayName: 'mix3', primary: false, url: 'https://signed.test/mix3.wav' }

async function mountBar({ files = [MIX] } = {}) {
  const wrapper = mountWithPlugins(Host, { attachTo: document.body })
  const player = usePlayerStore()
  if (files.length) {
    await player.playFile(RELEASE, SONG, files[0], files)
    await flushPromises()
  }
  return { wrapper, player }
}

const button = (wrapper, label) => wrapper.find(`button[aria-label="${label}"]`)

describe('PlayerBar', () => {
  it('keeps only the hidden audio element while nothing is loaded', async () => {
    const { wrapper } = await mountBar({ files: [] })

    expect(wrapper.find('audio').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'VFooter' }).exists()).toBe(false)
  })

  it('plays through its own audio element', async () => {
    const { wrapper } = await mountBar()

    expect(wrapper.find('audio').element.src).toBe('https://signed.test/mix3.wav')
  })

  it('shows what is playing and links back to the tracklist', async () => {
    const { wrapper } = await mountBar()

    expect(wrapper.text()).toContain('Siesta Lights')
    expect(wrapper.text()).toContain('mix3 · Neon Siesta')
    expect(wrapper.find('a[href="/releases/42/tracklist"]').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://signed.test/cover.jpg')
  })

  describe('controls', () => {
    it('pauses and resumes', async () => {
      const { wrapper, player } = await mountBar()

      await button(wrapper, 'Pause').trigger('click')
      await flushPromises()
      expect(player.playing).toBe(false)

      await button(wrapper, 'Play').trigger('click')
      await flushPromises()
      expect(player.playing).toBe(true)
    })

    it('goes to the next track', async () => {
      const { wrapper, player } = await mountBar({ files: [MASTER, MIX] })

      await button(wrapper, 'Next track').trigger('click')
      await flushPromises()

      expect(player.track.fileId).toBe(81)
    })

    it('disables Next on the last track', async () => {
      const { wrapper } = await mountBar({ files: [MIX] })

      expect(button(wrapper, 'Next track').attributes('disabled')).toBeDefined()
    })

    it('goes back or restarts', async () => {
      const { wrapper, player } = await mountBar()
      const previous = vi.spyOn(player, 'previous')

      await button(wrapper, 'Previous track or restart').trigger('click')

      expect(previous).toHaveBeenCalled()
    })

    it('switches repeat on and off, and says so', async () => {
      const { wrapper, player } = await mountBar()

      await button(wrapper, 'Repeat this track').trigger('click')
      expect(player.repeat).toBe(true)
      expect(button(wrapper, 'Repeat this track').attributes('aria-pressed')).toBe('true')

      await button(wrapper, 'Repeat this track').trigger('click')
      expect(player.repeat).toBe(false)
    })

    it('closes', async () => {
      const { wrapper, player } = await mountBar()

      await button(wrapper, 'Close player').trigger('click')

      expect(player.track).toBeNull()
      expect(wrapper.findComponent({ name: 'VFooter' }).exists()).toBe(false)
    })
  })

  it('shows a playback problem in place of the subtitle', async () => {
    const { wrapper, player } = await mountBar()

    player.error = 'Could not play this file.'
    await flushPromises()

    expect(wrapper.text()).toContain('Could not play this file.')
    expect(wrapper.text()).not.toContain('mix3 · Neon Siesta')
  })

  describe('seeking', () => {
    it('seeks right away on keyboard changes', async () => {
      const { wrapper, player } = await mountBar()
      const seek = vi.spyOn(player, 'seek')

      wrapper.findComponent({ name: 'VSlider' }).vm.$emit('update:modelValue', 30)

      expect(seek).toHaveBeenCalledWith(30)
    })

    it('seeks only when a drag is released', async () => {
      const { wrapper, player } = await mountBar()
      const seek = vi.spyOn(player, 'seek')
      const slider = wrapper.findComponent({ name: 'VSlider' })

      slider.vm.$emit('start', 10)
      slider.vm.$emit('update:modelValue', 20)
      await flushPromises()
      expect(seek).not.toHaveBeenCalled()
      expect(slider.props('modelValue')).toBe(20)

      slider.vm.$emit('end', 25)
      expect(seek).toHaveBeenCalledWith(25)
    })
  })

  it('lets go of the audio element when unmounted', async () => {
    const { wrapper, player } = await mountBar()
    const detach = vi.spyOn(player, 'detach')

    wrapper.unmount()

    expect(detach).toHaveBeenCalled()
  })
})