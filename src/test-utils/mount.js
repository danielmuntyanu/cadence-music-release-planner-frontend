import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const RouteStub = { template: '<div />' }

const routes = [
  { path: '/artists', name: 'artists', component: RouteStub },
  { path: '/artists/:id', name: 'artist-detail', component: RouteStub },
  { path: '/releases', name: 'releases', component: RouteStub },
  {
    path: '/releases/:id',
    component: RouteStub,
    children: [
      { path: '', name: 'release-detail', component: RouteStub },
      { path: 'tracklist', name: 'release-tracklist', component: RouteStub },
    ],
  },
]

export const createTestRouter = () => createRouter({ history: createMemoryHistory(), routes })

/**
 * Vuetify comes from vitest.setup.js (config.global.plugins); this adds a router.
 * Pass `router` to start the component on a specific URL.
 */
export function mountWithPlugins(component, { router = createTestRouter(), global = {}, ...options } = {}) {
  return mount(component, {
    ...options,
    global: {
      ...global,
      plugins: [router, ...(global.plugins ?? [])],
    },
  })
}

export const findField = (wrapper, label) =>
  wrapper.findAllComponents({ name: 'VTextField' }).find((field) => field.props('label') === label)

/** Finds any Vuetify input (VTextField, VSelect, VAutocomplete, VDateInput…) by its label */
export const findByLabel = (wrapper, componentName, label) =>
  wrapper.findAllComponents({ name: componentName }).find((field) => field.props('label') === label)

export const findButton = (wrapper, text) =>
  wrapper.findAll('button').find((button) => button.text().includes(text))