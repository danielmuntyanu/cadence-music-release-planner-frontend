import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '../UserAvatar.vue'

let wrapper

function mountAvatar({ user = null, props = {} } = {}) {
  useAuthStore().user = user // Pinia и Vuetify подключены в vitest.setup.js

  wrapper = mount(UserAvatar, { props })
  return wrapper
}

const userWith = (overrides = {}) => ({
  id: 1,
  username: 'daniel',
  email: 'd@example.com',
  displayName: '',
  bio: '',
  avatarUrl: null,
  roles: ['USER'],
  ...overrides,
})

const avatar = () => wrapper.findComponent({ name: 'VAvatar' })

describe('UserAvatar', () => {
  beforeEach(() => {
    wrapper = null
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('инициалы', () => {
    it.each([
      ['Daniel Kowalski', 'DK'],
      ['daniel kowalski', 'DK'],
      ['Daniel', 'D'],
      ['  Daniel   Kowalski  ', 'DK'],
      ['Ana María García', 'AM'], // максимум два слова
    ])('displayName "%s" → "%s"', (displayName, expected) => {
      mountAvatar({ user: userWith({ displayName }) })

      expect(wrapper.text()).toBe(expected)
      expect(wrapper.find('.mdi-account').exists()).toBe(false)
    })
  })

  describe('запасной вариант (иконка)', () => {
    it('показывает иконку, если пользователя нет', () => {
      mountAvatar({ user: null })

      expect(wrapper.find('.mdi-account').exists()).toBe(true)
      expect(wrapper.text()).toBe('')
    })

    it.each([[''], ['   ']])('показывает иконку при пустом displayName (%j)', (displayName) => {
      mountAvatar({ user: userWith({ displayName }) })

      expect(wrapper.find('.mdi-account').exists()).toBe(true)
    })
  })

  describe('аватар-картинка', () => {
    it('передаёт avatarUrl в v-avatar и не рисует инициалы', () => {
      mountAvatar({ user: userWith({ displayName: 'Daniel Kowalski', avatarUrl: 'https://cdn.test/a.png' }) })

      expect(avatar().props('image')).toBe('https://cdn.test/a.png')
      expect(wrapper.text()).toBe('')
      expect(wrapper.find('.mdi-account').exists()).toBe(false)
    })

    it('без avatarUrl image не задан', () => {
      mountAvatar({ user: userWith({ displayName: 'Daniel' }) })

      expect(avatar().props('image')).toBeUndefined()
    })
  })

  describe('размер', () => {
    it('по умолчанию 32', () => {
      mountAvatar()

      expect(avatar().props('size')).toBe(32)
    })

    it('масштабирует шрифт инициалов (40% от размера)', () => {
      mountAvatar({ user: userWith({ displayName: 'Daniel' }), props: { size: 50 } })

      expect(avatar().props('size')).toBe(50)
      expect(wrapper.find('span').attributes('style')).toContain('font-size: 20px')
    })

    it('масштабирует иконку (60% от размера)', () => {
      mountAvatar({ user: null, props: { size: 50 } })

      expect(wrapper.findComponent({ name: 'VIcon' }).props('size')).toBe(30)
    })
  })

  it('реагирует на смену пользователя', async () => {
    mountAvatar({ user: null })
    expect(wrapper.find('.mdi-account').exists()).toBe(true)

    useAuthStore().user = userWith({ displayName: 'Daniel Kowalski' })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toBe('DK')
  })
})