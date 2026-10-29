import { describe, expect, it } from 'vitest'
import ArtistCard from '@/components/artists/ArtistCard.vue'
import ArtistActionsMenu from '@/components/artists/ArtistActionsMenu.vue'
import { mountWithPlugins } from '@/test-utils/mount'
import { makeArtist } from '@/test-utils/fixtures/artists'

const mountCard = (overrides = {}) => mountWithPlugins(ArtistCard, { props: { artist: makeArtist(overrides) } })

describe('ArtistCard', () => {
  it('links the name to the artist page', () => {
    const wrapper = mountCard({ id: 7, name: 'Nova' })
    const nameLink = wrapper.findAll('a').find((a) => a.text() === 'Nova')

    expect(nameLink.attributes('href')).toBe('/artists/7')
  })

  it.each([
    [0, '0 releases'],
    [1, '1 release'],
    [3, '3 releases'],
  ])('shows %i releases as "%s"', (releaseCount, label) => {
    expect(mountCard({ releaseCount }).text()).toContain(label)
  })

  it('shows up to three socials and a counter for the rest', () => {
    const socials = ['SPOTIFY', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'X'].map((platform, i) => ({
      platform,
      url: `https://link.test/${i}`,
    }))
    const wrapper = mountCard({ socials })

    expect(wrapper.findAll('a[target="_blank"]')).toHaveLength(3)
    expect(wrapper.text()).toContain('+2')
  })

  it('re-emits menu actions with the artist', () => {
    const artist = makeArtist()
    const wrapper = mountWithPlugins(ArtistCard, { props: { artist } })
    const menu = wrapper.findComponent(ArtistActionsMenu)

    menu.vm.$emit('edit')
    menu.vm.$emit('delete')

    expect(wrapper.emitted('edit')[0]).toEqual([artist])
    expect(wrapper.emitted('delete')[0]).toEqual([artist])
  })
})