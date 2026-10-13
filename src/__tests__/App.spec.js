import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import App from '../App.vue'
import AppHeader from '@/components/AppHeader.vue'

function mountApp() {
  const vuetify = createVuetify({ components, directives })

  return mount(App, {
    global: {
      plugins: [vuetify],
      stubs: {
        AppHeader: true,
        RouterView: true,
      },
    },
  })
}

describe('App', () => {
  it('renders the Vuetify application root', () => {
    const wrapper = mountApp()
    expect(wrapper.find('.v-application').exists()).toBe(true)
  })

  it('renders the header', () => {
    const wrapper = mountApp()
    expect(wrapper.findComponent(AppHeader).exists()).toBe(true)
  })

  it('renders the router view inside the main area', () => {
    const wrapper = mountApp()
    const main = wrapper.find('main.v-main')

    expect(main.exists()).toBe(true)
    expect(main.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})