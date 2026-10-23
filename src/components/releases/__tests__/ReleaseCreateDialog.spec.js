import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseCreateDialog from '@/components/releases/ReleaseCreateDialog.vue'
import ReleaseArtistsPicker from '@/components/releases/ReleaseArtistsPicker.vue'
import { releaseService } from '@/services/release.service'
import { artistService } from '@/services/artist.service'
import { findButton, findByLabel, findField, mountWithPlugins } from '@/test-utils/mount'
import { makeRelease } from '@/test-utils/fixtures/releases'
import { makeArtist } from '@/test-utils/fixtures/artists'

vi.mock('@/services/release.service', () => ({
  releaseService: { create: vi.fn() },
}))

vi.mock('@/services/artist.service', () => ({
  artistService: { getAll: vi.fn(), create: vi.fn() },
}))

const nova = makeArtist({ name: 'Nova' })

// Opened after mount, as in the app: the form is rebuilt on the closed -> open transition
async function openDialog(preset = {}) {
  const wrapper = mountWithPlugins(ReleaseCreateDialog, {
    props: { modelValue: false, preset },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return { wrapper, dialog: wrapper.findComponent({ name: 'VCard' }) }
}

async function fillRequired(dialog, name = 'Night Drive') {
  await findField(dialog, 'Name').find('input').setValue(name)
  findByLabel(dialog, 'VAutocomplete', 'Primary genre').vm.$emit('update:modelValue', 'POP')
  await flushPromises()
}

async function submit(dialog) {
  await findButton(dialog, 'Create release').trigger('click')
  await flushPromises()
}

describe('ReleaseCreateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    artistService.getAll.mockResolvedValue([nova])
  })

  it('requires a name and a primary genre', async () => {
    const { dialog } = await openDialog()

    await submit(dialog)

    expect(releaseService.create).not.toHaveBeenCalled()
    expect(dialog.text()).toContain('Name is required')
    expect(dialog.text()).toContain('Primary genre is required')
  })

  it('creates the release with defaults and the preset artist, then closes', async () => {
    const created = makeRelease({ id: 42 })
    releaseService.create.mockResolvedValue(created)
    const { wrapper, dialog } = await openDialog({ artistIds: [nova.id] })
    await fillRequired(dialog, '  Night Drive ')

    await submit(dialog)

    expect(releaseService.create).toHaveBeenCalledWith({
      name: 'Night Drive',
      type: 'SINGLE',
      phase: 'PLANNING',
      notes: '',
      primaryGenre: 'POP',
      secondaryGenre: null,
      releaseDate: null,
      originalReleaseDate: null,
      artistIds: [nova.id],
    })
    expect(wrapper.emitted('created')[0]).toEqual([created])
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('stays open and explains a duplicate name', async () => {
    releaseService.create.mockRejectedValue({ response: { status: 409 } })
    const { wrapper, dialog } = await openDialog()
    await fillRequired(dialog)

    await submit(dialog)

    expect(dialog.text()).toContain('You already have a release with this name.')
    expect(wrapper.emitted('created')).toBeUndefined()
  })

  it('clears the secondary genre when it becomes the primary one', async () => {
    const { dialog } = await openDialog()
    findByLabel(dialog, 'VAutocomplete', 'Secondary genre').vm.$emit('update:modelValue', 'ROCK')
    await flushPromises()

    findByLabel(dialog, 'VAutocomplete', 'Primary genre').vm.$emit('update:modelValue', 'ROCK')
    await flushPromises()

    expect(findByLabel(dialog, 'VAutocomplete', 'Secondary genre').props('modelValue')).toBeNull()
  })

  it('rejects an original release date after the release date', async () => {
    const { dialog } = await openDialog()
    await fillRequired(dialog)
    findByLabel(dialog, 'VDateInput', 'Release date').vm.$emit('update:modelValue', new Date(2026, 0, 1))
    findByLabel(dialog, 'VDateInput', 'Original release date').vm.$emit('update:modelValue', new Date(2026, 5, 1))
    await flushPromises()

    await submit(dialog)

    expect(releaseService.create).not.toHaveBeenCalled()
    expect(dialog.text()).toContain('Must be before the release date')
  })

  it('blocks creating while a new artist is half-filled', async () => {
    const { dialog } = await openDialog()

    dialog.findComponent(ReleaseArtistsPicker).vm.$emit('update:creatorOpen', true)
    await flushPromises()

    expect(findButton(dialog, 'Create release').attributes('disabled')).toBeDefined()
    expect(dialog.text()).toContain('Finish or cancel the new artist first')
  })

  it('starts with a fresh form every time it opens', async () => {
    const { wrapper, dialog } = await openDialog()
    await findField(dialog, 'Name').find('input').setValue('Abandoned draft')

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    const reopened = wrapper.findComponent({ name: 'VCard' })
    expect(findField(reopened, 'Name').find('input').element.value).toBe('')
  })
})