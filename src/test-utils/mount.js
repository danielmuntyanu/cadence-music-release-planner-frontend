import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const RouteStub = { template: '<div />' }

const routes = [
  { path: '/artists', name: 'artists', component: RouteStub },
  { path: '/artists/:id', name: 'artist-detail', component: RouteStub },
]

export function mountWithPlugins(component, { global = {}, ...options } = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes })

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

export const findButton = (wrapper, text) =>
  wrapper.findAll('button').find((button) => button.text().includes(text))