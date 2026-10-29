import { describe, expect, it } from 'vitest'
import ReleaseProgress from '@/components/releases/ReleaseProgress.vue'
import { mountWithPlugins } from '@/test-utils/mount'

const mountProgress = (props) => mountWithPlugins(ReleaseProgress, { props })

describe('ReleaseProgress', () => {
  it('shows done songs and the percentage', () => {
    const wrapper = mountProgress({ percent: 50, done: 1, total: 5 })

    expect(wrapper.text()).toContain('1 of 5 songs done')
    expect(wrapper.text()).toContain('50%')
    expect(wrapper.findComponent({ name: 'VProgressLinear' }).props('modelValue')).toBe(50)
  })

  it('says so when there are no songs, without a percentage', () => {
    const wrapper = mountProgress({ percent: 0, done: 0, total: 0 })

    expect(wrapper.text()).toContain('No songs yet')
    expect(wrapper.text()).not.toContain('%')
  })

  it('turns green when everything is done', () => {
    const wrapper = mountProgress({ percent: 100, done: 3, total: 3 })

    expect(wrapper.findComponent({ name: 'VProgressLinear' }).props('color')).toBe('success')
  })
})