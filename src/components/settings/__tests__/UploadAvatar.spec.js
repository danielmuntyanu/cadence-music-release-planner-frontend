import { beforeEach, describe, expect, it, vi } from 'vitest'
import UploadAvatar from '@/components/settings/UploadAvatar.vue'
import ImageInput from '@/components/media/ImageInput.vue'
import { userService } from '@/services/user.service'
import { useAuthStore } from '@/stores/auth'
import { mountWithPlugins } from '@/test-utils/mount'

vi.mock('@/services/user.service', () => ({
  userService: { uploadAvatar: vi.fn(), removeAvatar: vi.fn(), setAvatarLink: vi.fn() },
}))

const USER = { id: 1, username: 'daniel', displayName: 'Daniel', avatarUrl: null, roles: ['USER'] }

function mountAvatar(user = USER) {
  useAuthStore().setUser(user)
  const wrapper = mountWithPlugins(UploadAvatar)
  return { wrapper, input: wrapper.findComponent(ImageInput) }
}

describe('UploadAvatar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the initial when there is no avatar', () => {
    const { wrapper, input } = mountAvatar()

    expect(input.props('src')).toBeNull()
    expect(wrapper.text()).toContain('D')
  })

  it('shows the current avatar', () => {
    const { input } = mountAvatar({ ...USER, avatarUrl: 'https://signed.test/me.jpg' })

    expect(input.props('src')).toBe('https://signed.test/me.jpg')
  })

  it('stores the user returned by the upload', async () => {
    const updated = { ...USER, avatarUrl: 'https://signed.test/new.jpg' }
    userService.uploadAvatar.mockResolvedValue(updated)
    const { input } = mountAvatar()
    const file = new File(['x'], 'me.png', { type: 'image/png' })
    const onProgress = vi.fn()

    await input.props('upload')(file, onProgress)

    expect(userService.uploadAvatar).toHaveBeenCalledWith(file, onProgress)
    expect(useAuthStore().user).toEqual(updated)
  })

  it('saves a link and removes the avatar through the user service', async () => {
    userService.setAvatarLink.mockResolvedValue({ ...USER, avatarUrl: 'https://img.test/me.jpg' })
    userService.removeAvatar.mockResolvedValue(USER)
    const { input } = mountAvatar()

    await input.props('saveLink')('https://img.test/me.jpg')
    expect(useAuthStore().user.avatarUrl).toBe('https://img.test/me.jpg')

    await input.props('remove')()
    expect(useAuthStore().user.avatarUrl).toBeNull()
  })

  it('confirms a saved change', async () => {
    const { wrapper, input } = mountAvatar()

    await input.vm.$emit('uploaded')

    expect(wrapper.text()).toContain('Avatar updated')
  })
})