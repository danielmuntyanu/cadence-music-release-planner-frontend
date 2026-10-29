import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ExpandableText from '@/components/common/ExpandableText.vue'
import { findButton, mountWithPlugins } from '@/test-utils/mount'

// jsdom has no layout: the content height is simulated. 4 lines at the default 20px = 80px
function mockContentHeight(height) {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(height)
}

async function mountText(props) {
  const wrapper = mountWithPlugins(ExpandableText, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const content = (wrapper) => wrapper.find('.expandable')

describe('ExpandableText', () => {
  afterEach(() => vi.restoreAllMocks())

  describe('content', () => {
    it('shows the placeholder for empty text', async () => {
      const wrapper = await mountText({ text: '', placeholder: 'No notes yet.' })

      expect(wrapper.text()).toContain('No notes yet.')
    })

    it('turns URLs into safe external links', async () => {
      const wrapper = await mountText({ text: 'Mix notes: https://drive.test/mix-v3, check it.' })

      const link = wrapper.find('a')
      // The trailing comma stays text, not part of the link
      expect(link.attributes('href')).toBe('https://drive.test/mix-v3')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(wrapper.text()).toContain('Mix notes:')
    })

    it('never renders user text as HTML', async () => {
      const wrapper = await mountText({ text: '<img src=x onerror="alert(1)">' })

      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('<img src=x onerror="alert(1)">')
    })
  })

  describe('short text', () => {
    it('shows everything without a toggle or fade', async () => {
      mockContentHeight(60)
      const wrapper = await mountText({ text: 'Short note' })

      expect(findButton(wrapper, 'Show more')).toBeUndefined()
      expect(content(wrapper).classes()).not.toContain('is-collapsed')
    })
  })

  describe('long text', () => {
    it('is collapsed to the requested number of lines', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'Long text', lines: 4 })

      expect(content(wrapper).classes()).toContain('is-collapsed')
      expect(content(wrapper).attributes('style')).toContain('max-height: 80px')
      expect(findButton(wrapper, 'Show more').attributes('aria-expanded')).toBe('false')
    })

    it('expands when the text is clicked', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'Long text' })

      await content(wrapper).trigger('click')

      expect(content(wrapper).attributes('style')).toContain('max-height: 400px')
      expect(findButton(wrapper, 'Show less')).toBeDefined()
    })

    it('does not toggle while the user is selecting text', async () => {
      mockContentHeight(400)
      vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'part of the text' })
      const wrapper = await mountText({ text: 'Long text' })

      await content(wrapper).trigger('click')

      expect(content(wrapper).classes()).toContain('is-collapsed')
    })

    it('does not toggle when a link inside is clicked', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'See https://drive.test/file for the stems' })

      await wrapper.find('a').trigger('click')

      expect(content(wrapper).classes()).toContain('is-collapsed')
    })

    it('does not collapse when expanded text is clicked: only the button collapses', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'Long text' })
      await content(wrapper).trigger('click')

      await content(wrapper).trigger('click')
      expect(findButton(wrapper, 'Show less')).toBeDefined()

      await findButton(wrapper, 'Show less').trigger('click')
      expect(content(wrapper).classes()).toContain('is-collapsed')
    })

    it('links the toggle to the content for assistive technology', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'Long text' })

      const toggle = findButton(wrapper, 'Show more')
      expect(toggle.attributes('aria-controls')).toBe(content(wrapper).attributes('id'))
    })

    it('collapses again when the text changes', async () => {
      mockContentHeight(400)
      const wrapper = await mountText({ text: 'Long text' })
      await content(wrapper).trigger('click')

      await wrapper.setProps({ text: 'Another long text' })
      await flushPromises()

      expect(content(wrapper).classes()).toContain('is-collapsed')
    })
  })
})