import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { VApp } from 'vuetify/components'
import { createRouter, createMemoryHistory } from 'vue-router'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import { useAuthStore } from '@/stores/auth'

const Stub = { render: () => null }

async function mountFooter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      { path: '/login', name: 'login', component: Stub },
      { path: '/register', name: 'register', component: Stub },
      { path: '/dashboard', name: 'dashboard', component: Stub },
      { path: '/settings', name: 'settings', component: Stub },
    ],
  })
  router.push('/')
  await router.isReady()

  const wrapper = mount(
    { render: () => h(VApp, null, { default: () => h(LandingFooter) }) },
    { global: { plugins: [router] } },
  )
  await flushPromises()
  return wrapper
}

const hrefs = (wrapper, label) =>
  wrapper.findAll(`nav[aria-label="${label}"] a`).map((a) => a.attributes('href'))

const linkTexts = (wrapper, label) =>
  wrapper.findAll(`nav[aria-label="${label}"] a`).map((a) => a.text())

describe('LandingFooter', () => {
  it('renders the brand linking to the home page', async () => {
    const wrapper = await mountFooter()
    const brand = wrapper.findAll('a').find((a) => a.text() === 'Cadence')

    expect(brand).toBeDefined()
    expect(brand.attributes('href')).toBe('/')
  })

  it('renders the tagline', async () => {
    const wrapper = await mountFooter()

    expect(wrapper.text()).toContain('The timeline-driven planner for music releases')
  })

  it('renders the product column with in-page hash links', async () => {
    const wrapper = await mountFooter()

    expect(linkTexts(wrapper, 'Product')).toEqual(['Features', 'Pricing'])
    expect(hrefs(wrapper, 'Product')).toEqual(['/#features', '/#pricing'])
  })

  describe('account column', () => {
    it('offers sign in and registration to guests', async () => {
      const wrapper = await mountFooter()

      expect(linkTexts(wrapper, 'Account')).toEqual(['Sign in', 'Create account'])
      expect(hrefs(wrapper, 'Account')).toEqual(['/login', '/register'])
    })

    it('offers dashboard and settings to authenticated users', async () => {
      useAuthStore().user = { id: 1, username: 'daniel', roles: ['USER'] }
      const wrapper = await mountFooter()

      expect(linkTexts(wrapper, 'Account')).toEqual(['Dashboard', 'Settings'])
      expect(hrefs(wrapper, 'Account')).toEqual(['/dashboard', '/settings'])
    })

    it('does not show guest links to authenticated users', async () => {
      useAuthStore().user = { id: 1, username: 'daniel', roles: ['USER'] }
      const wrapper = await mountFooter()

      expect(wrapper.text()).not.toContain('Sign in')
      expect(wrapper.text()).not.toContain('Create account')
    })
  })

  it('shows the copyright line with the current year', async () => {
    const wrapper = await mountFooter()
    const year = new Date().getFullYear()

    expect(wrapper.text()).toContain(`© ${year} Cadence. All rights reserved.`)
  })

  it('uses headings for column titles', async () => {
    const wrapper = await mountFooter()
    const titles = wrapper.findAll('h2').map((h) => h.text())

    expect(titles).toEqual(['Product', 'Account'])
  })
})