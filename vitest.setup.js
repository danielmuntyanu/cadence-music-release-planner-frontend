import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { setActivePinia, createPinia } from 'pinia'
import { config, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach } from 'vitest'


globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has no VisualViewport; Vuetify overlays (v-dialog, v-menu) read it when they open
globalThis.visualViewport ??= {
  get width() { return window.innerWidth },
  get height() { return window.innerHeight },
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  scale: 1,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return false },
}

config.global.plugins = [createVuetify({ components, directives })]

setActivePinia(createPinia())

beforeEach(() => {
  setActivePinia(createPinia())
})

// jsdom does not implement scrolling; ArtistsView scrolls to top on page change
window.scrollTo = () => {}

// Unmounting removes teleported overlay content from document.body between tests
enableAutoUnmount(afterEach)