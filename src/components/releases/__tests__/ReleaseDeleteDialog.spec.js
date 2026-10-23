import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ReleaseDeleteDialog from '@/components/releases/ReleaseDeleteDialog.vue'
import { releaseService } from '@/services/release.service'
import { findButton, mountWithPlugins } from '@/test-utils/mount'
import { makePage, makeRelease } from '@/test-utils/fixtures/releases'

vi.mock('@/services/release.service', () => ({
  releaseService: { getAll: vi.fn(), delete: vi.fn() },
}))

async function openDialog(release) {
  const wrapper = mountWithPlugins(ReleaseDeleteDialog, {
    props: { modelValue: false, release },
    attachTo: document.body,
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return { wrapper, dialog: wrapper.findComponent({ name: 'VCard' }) }
}

async function confirm(dialog) {
  await findButton(dialog, 'Delete release').trigger('click')
  await flushPromises()
}

describe('ReleaseDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    releaseService.getAll.mockResolvedValue(makePage([]))
  })

  it('names the release and reassures that artists stay', async () => {
    const { dialog } = await openDialog(makeRelease({ name: 'Night Drive' }))

    expect(dialog.text()).toContain('Delete Night Drive?')
    expect(dialog.text()).toContain('Its artists stay in your roster')
  })

  it('deletes the release, reloads the list and emits it', async () => {
    const release = makeRelease()
    releaseService.delete.mockResolvedValue()
    const { wrapper, dialog } = await openDialog(release)

    await confirm(dialog)

    expect(releaseService.delete).toHaveBeenCalledWith(release.id)
    expect(releaseService.getAll).toHaveBeenCalled()
    expect(wrapper.emitted('deleted')[0]).toEqual([release])
  })

  it('shows a message when the release was already deleted', async () => {
    releaseService.delete.mockRejectedValue({ response: { status: 404 } })
    const { wrapper, dialog } = await openDialog(makeRelease())

    await confirm(dialog)

    expect(dialog.text()).toContain('This release was already deleted.')
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })
})