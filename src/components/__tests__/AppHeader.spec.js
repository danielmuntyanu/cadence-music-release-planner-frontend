import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { VApp } from 'vuetify/components'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '../AppHeader.vue'

// Ширину экрана задаём подменой useDisplay: глобальный Vuetify из vitest.setup.js один на все тесты
vi.mock('vuetify', async (importOriginal) => ({
  ...(await importOriginal()),
  useDisplay: vi.fn(),
}))

vi.mock('@/services/auth.service', () => ({
  authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() },
}))

// Тест не зависит от реального списка ссылок в проекте
vi.mock('@/constants/navigation', () => ({
  links: [
    { title: 'Home', to: '/' },
    { title: 'Dashboard', to: '/dashboard', requiresAuth: true },
    { title: 'Admin', to: '/admin', roles: ['ADMIN'] },
  ],
}))

const USER = {
  id: 1,
  username: 'daniel',
  email: 'd@example.com',
  displayName: 'Daniel Kowalski',
  bio: '',
  avatarUrl: null,
  roles: ['USER'],
}
const ADMIN = { ...USER, roles: ['USER', 'ADMIN'] }

const stub = { render: () => null }
let wrapper

async function mountHeader({ desktop = true, user = null, ready = true, errorHandler } = {}) {
  useDisplay.mockReturnValue({ mdAndUp: ref(desktop) })
  const auth = useAuthStore()
  auth.user = user
  auth.ready = ready

  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/login', '/register', '/settings', '/dashboard', '/admin'].map((path) => ({
      path,
      component: stub,
    })),
  })
  await router.push('/')
  await router.isReady()

  // v-app-bar и v-navigation-drawer требуют layout, поэтому оборачиваем в v-app
  wrapper = mount(
    { render: () => h(VApp, null, () => h(AppHeader)) },
    {
      attachTo: document.body,
      global: { plugins: [router], config: { errorHandler } }, // Vuetify и Pinia из vitest.setup.js
    },
  )
  return { router, auth }
}

const navLinks = () => wrapper.findAll('nav[aria-label="Main"] a').map((a) => a.text())
const drawer = () => wrapper.find('.v-navigation-drawer')
const drawerIsOpen = () => drawer().classes().includes('v-navigation-drawer--active')
const byText = (root, selector, text, { exact = true } = {}) =>
  root.findAll(selector).find((el) => (exact ? el.text() === text : el.text().includes(text)))
const buttonsByText = (root, text, opts) => byText(root, 'a, button', text, opts)
const appBar = () => wrapper.find('header')

describe('AppHeader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    wrapper = null
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('десктоп, гость', () => {
    beforeEach(() => mountHeader({ user: null }))

    it('показывает логотип со ссылкой на главную', () => {
      const brand = appBar().find('a[href="/"]')
      expect(brand.text()).toBe('Cadense')
    })

    it('в навигации только публичные ссылки', () => {
      expect(navLinks()).toEqual(['Home'])
    })

    it('показывает Sign-In и Create Account со ссылками', () => {
      expect(buttonsByText(appBar(), 'Sign-In').attributes('href')).toBe('/login')
      expect(buttonsByText(appBar(), 'Create Account').attributes('href')).toBe('/register')
    })

    it('не показывает Account, Logout и бургер', () => {
      expect(buttonsByText(appBar(), 'Account', { exact: false })?.text()).toBe('Create Account')
      expect(buttonsByText(appBar(), 'Logout')).toBeUndefined()
      expect(wrapper.find('[aria-label="Open menu"]').exists()).toBe(false)
      expect(drawer().exists()).toBe(false)
    })
  })

  describe('десктоп, пока auth не готов', () => {
    it('не показывает ни гостевые, ни пользовательские кнопки (нет мигания)', async () => {
      await mountHeader({ user: null, ready: false })

      expect(buttonsByText(appBar(), 'Sign-In')).toBeUndefined()
      expect(buttonsByText(appBar(), 'Logout')).toBeUndefined()
      expect(wrapper.find('[aria-label="Toggle theme"]').exists()).toBe(true)
    })
  })

  describe('десктоп, пользователь', () => {
    beforeEach(() => mountHeader({ user: USER }))

    it('в навигации публичные и закрытые для авторизованных ссылки, но не Admin', () => {
      expect(navLinks()).toEqual(['Home', 'Dashboard'])
    })

    it('показывает Account (на /settings) с аватаром и Logout', () => {
      const account = buttonsByText(appBar(), 'Account', { exact: false })
      expect(account.attributes('href')).toBe('/settings')
      expect(account.text()).toContain('DK') // инициалы из UserAvatar
      expect(buttonsByText(appBar(), 'Logout')).toBeDefined()
    })

    it('не показывает Sign-In и Create Account', () => {
      expect(buttonsByText(appBar(), 'Sign-In')).toBeUndefined()
      expect(buttonsByText(appBar(), 'Create Account')).toBeUndefined()
    })
  })

  describe('десктоп, админ', () => {
    it('видит ссылку Admin', async () => {
      await mountHeader({ user: ADMIN })

      expect(navLinks()).toEqual(['Home', 'Dashboard', 'Admin'])
    })
  })

  describe('logout', () => {
    it('десктоп: вызывает logout, очищает пользователя и ведёт на /login', async () => {
      authService.logout.mockResolvedValue()
      const { auth, router } = await mountHeader({ user: USER })

      await buttonsByText(appBar(), 'Logout').trigger('click')
      await flushPromises()

      expect(authService.logout).toHaveBeenCalledOnce()
      expect(auth.user).toBeNull()
      expect(router.currentRoute.value.fullPath).toBe('/login')
    })

    it('ждёт завершения logout перед переходом (иначе guestOnly вернёт на главную)', async () => {
      let finish
      authService.logout.mockReturnValue(new Promise((resolve) => (finish = resolve)))
      const { router } = await mountHeader({ user: USER })

      await buttonsByText(appBar(), 'Logout').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe('/') // ещё не ушли

      finish()
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe('/login')
    })

    it('при ошибке запроса всё равно очищает пользователя и ведёт на /login', async () => {
      authService.logout.mockRejectedValue(new Error('network'))
      const errorHandler = vi.fn()
      const { auth, router } = await mountHeader({ user: USER, errorHandler })

      await buttonsByText(appBar(), 'Logout').trigger('click')
      await flushPromises()

      expect(auth.user).toBeNull()
      expect(router.currentRoute.value.fullPath).toBe('/login')
      expect(errorHandler).toHaveBeenCalled() // ошибка не проглочена
    })
  })

  describe('переключатель темы', () => {
    it('переключает тему и меняет иконку', async () => {
      await mountHeader()
      const toggle = () => wrapper.find('[aria-label="Toggle theme"]')

      expect(toggle().find('.mdi-weather-night').exists()).toBe(true) // светлая тема

      await toggle().trigger('click')
      expect(toggle().find('.mdi-white-balance-sunny').exists()).toBe(true) // тёмная

      // Vuetify общий на все тесты (vitest.setup.js): возвращаем светлую тему
      await toggle().trigger('click')
      expect(toggle().find('.mdi-weather-night').exists()).toBe(true)
    })
  })

  describe('мобильная версия', () => {
    it('скрывает навигацию и кнопки в баре, показывает бургер и переключатель темы', async () => {
      await mountHeader({ desktop: false, user: USER })

      expect(wrapper.find('nav[aria-label="Main"]').exists()).toBe(false)
      expect(buttonsByText(appBar(), 'Logout')).toBeUndefined()
      expect(wrapper.find('[aria-label="Open menu"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Toggle theme"]').exists()).toBe(true)
    })

    it('меню закрыто по умолчанию и открывается бургером', async () => {
      await mountHeader({ desktop: false })
      expect(drawerIsOpen()).toBe(false)

      await wrapper.find('[aria-label="Open menu"]').trigger('click')

      expect(drawerIsOpen()).toBe(true)
    })

    it('бургер закрывает открытое меню повторным нажатием', async () => {
      await mountHeader({ desktop: false })
      const burger = wrapper.find('[aria-label="Open menu"]')

      await burger.trigger('click')
      await burger.trigger('click')

      expect(drawerIsOpen()).toBe(false)
    })

    it('гость: ссылки и кнопки Sign-In / Create Account в меню', async () => {
      await mountHeader({ desktop: false, user: null })

      const links = drawer().findAll('.v-list-item').map((el) => el.text())
      expect(links).toEqual(['Home'])
      expect(buttonsByText(drawer(), 'Sign-In').attributes('href')).toBe('/login')
      expect(buttonsByText(drawer(), 'Create Account').attributes('href')).toBe('/register')
      expect(buttonsByText(drawer(), 'Logout')).toBeUndefined()
    })

    it('пользователь: ссылки по ролям, имя, Account и Logout', async () => {
      await mountHeader({ desktop: false, user: USER })

      const links = drawer().findAll('.v-list-item').map((el) => el.text())
      expect(links).toEqual(['Home', 'Dashboard'])
      expect(drawer().text()).toContain('Daniel Kowalski')
      expect(buttonsByText(drawer(), 'Account').attributes('href')).toBe('/settings')
      expect(buttonsByText(drawer(), 'Logout')).toBeDefined()
      expect(buttonsByText(drawer(), 'Sign-In')).toBeUndefined()
    })

    it('админ видит ссылку Admin в меню', async () => {
      await mountHeader({ desktop: false, user: ADMIN })

      const links = drawer().findAll('.v-list-item').map((el) => el.text())
      expect(links).toContain('Admin')
    })

    it('вместо displayName показывает username, если имя не пришло', async () => {
      await mountHeader({ desktop: false, user: { ...USER, displayName: undefined } })

      expect(drawer().text()).toContain('daniel')
    })

    it('не показывает кнопки в меню, пока auth не готов', async () => {
      await mountHeader({ desktop: false, user: null, ready: false })

      expect(buttonsByText(drawer(), 'Sign-In')).toBeUndefined()
    })

    it('закрывается при смене маршрута', async () => {
      const { router } = await mountHeader({ desktop: false })
      await wrapper.find('[aria-label="Open menu"]').trigger('click')
      expect(drawerIsOpen()).toBe(true)

      await router.push('/login')
      await flushPromises()

      expect(drawerIsOpen()).toBe(false)
    })

    it('logout из меню закрывает его и ведёт на /login', async () => {
      authService.logout.mockResolvedValue()
      const { auth, router } = await mountHeader({ desktop: false, user: USER })
      await wrapper.find('[aria-label="Open menu"]').trigger('click')

      await buttonsByText(drawer(), 'Logout').trigger('click')
      await flushPromises()

      expect(auth.user).toBeNull()
      expect(router.currentRoute.value.fullPath).toBe('/login')
      expect(drawerIsOpen()).toBe(false)
    })
  })
})