import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageContainer from '@/components/PageContainer.vue'

const mountContainer = (props = {}, slot = '<p data-test="content">Hello</p>') =>
  mount(PageContainer, { props, slots: { default: slot } })

// Classes of the element that directly wraps the slot content
const innerClasses = (wrapper) =>
  Array.from(wrapper.get('[data-test="content"]').element.parentElement.classList)

describe('PageContainer', () => {
  it('renders slot content', () => {
    const wrapper = mountContainer()

    expect(wrapper.get('[data-test="content"]').text()).toBe('Hello')
  })

  it.each([
    ['sm', 'max-w-lg'],
    ['md', 'max-w-3xl'],
    ['lg', 'max-w-5xl'],
    ['xl', 'max-w-7xl'],
    ['full', 'max-w-none'],
  ])('maps size "%s" to %s', (size, expected) => {
    const wrapper = mountContainer({ size })

    expect(innerClasses(wrapper)).toContain(expected)
  })

  it('has horizontally centered, full-width content', () => {
    const classes = innerClasses(mountContainer())

    expect(classes).toEqual(expect.arrayContaining(['mx-auto', 'w-full']))
  })

  it('applies the texture background by default', () => {
    const wrapper = mountContainer()

    expect(wrapper.classes()).toContain('bg-texture')
  })

  it('omits the texture background when texture is false', () => {
    const wrapper = mountContainer({ texture: false })

    expect(wrapper.classes()).not.toContain('bg-texture')
  })

  it('applies vertical padding by default', () => {
    const classes = innerClasses(mountContainer())

    expect(classes).toContain('py-6')
    expect(classes).toContain('md:py-10')
  })

  it('omits vertical padding when padded is false', () => {
    const classes = innerClasses(mountContainer({ padded: false }))

    expect(classes).not.toContain('py-6')
    expect(classes).not.toContain('md:py-10')
  })
})