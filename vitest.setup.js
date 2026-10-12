import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

config.global.plugins = [createVuetify({ components, directives })]

setActivePinia(createPinia())

beforeEach(() => {
  setActivePinia(createPinia())
})