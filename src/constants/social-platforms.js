/**
 * Mirrors dev.danyil.enums.SocialPlatform on the backend.
 * Keep both in sync when adding a platform.
 *
 * @typedef {'SPOTIFY' | 'APPLE_MUSIC' | 'YOUTUBE' | 'YOUTUBE_MUSIC' | 'SOUNDCLOUD'
 *   | 'BANDCAMP' | 'DEEZER' | 'TIDAL' | 'AMAZON_MUSIC' | 'BEATPORT' | 'YANDEX_MUSIC'
 *   | 'ZWOOK' | 'VK_MUSIC' | 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'X' | 'THREADS'
 *   | 'TWITCH' | 'DISCORD' | 'PATREON' | 'WEBSITE' | 'OTHER'} SocialPlatform
 *
 * @typedef {'STREAMING' | 'SOCIAL' | 'SUPPORT'} SocialPlatformGroup
 *
 * @typedef {Object} SocialPlatformOption
 * @property {SocialPlatform} value
 * @property {string} label
 * @property {SocialPlatformGroup} group
 */

/** @type {ReadonlyArray<SocialPlatformOption>} */
export const SOCIAL_PLATFORMS = Object.freeze([
  // Streaming and stores
  { value: 'SPOTIFY', label: 'Spotify', group: 'STREAMING' },
  { value: 'APPLE_MUSIC', label: 'Apple Music', group: 'STREAMING' },
  { value: 'YOUTUBE', label: 'YouTube', group: 'STREAMING' },
  { value: 'YOUTUBE_MUSIC', label: 'YouTube Music', group: 'STREAMING' },
  { value: 'SOUNDCLOUD', label: 'SoundCloud', group: 'STREAMING' },
  { value: 'BANDCAMP', label: 'Bandcamp', group: 'STREAMING' },
  { value: 'DEEZER', label: 'Deezer', group: 'STREAMING' },
  { value: 'TIDAL', label: 'TIDAL', group: 'STREAMING' },
  { value: 'AMAZON_MUSIC', label: 'Amazon Music', group: 'STREAMING' },
  { value: 'BEATPORT', label: 'Beatport', group: 'STREAMING' },
  { value: 'YANDEX_MUSIC', label: 'Yandex Music', group: 'STREAMING' },
  { value: 'ZWOOK', label: 'Zvuk', group: 'STREAMING' },
  { value: 'VK_MUSIC', label: 'VK Music', group: 'STREAMING' },

  // Social networks
  { value: 'INSTAGRAM', label: 'Instagram', group: 'SOCIAL' },
  { value: 'TIKTOK', label: 'TikTok', group: 'SOCIAL' },
  { value: 'FACEBOOK', label: 'Facebook', group: 'SOCIAL' },
  { value: 'X', label: 'X', group: 'SOCIAL' },
  { value: 'THREADS', label: 'Threads', group: 'SOCIAL' },
  { value: 'TWITCH', label: 'Twitch', group: 'SOCIAL' },
  { value: 'DISCORD', label: 'Discord', group: 'SOCIAL' },

  // Support and personal
  { value: 'PATREON', label: 'Patreon', group: 'SUPPORT' },
  { value: 'WEBSITE', label: 'Website', group: 'SUPPORT' },
  { value: 'OTHER', label: 'Other', group: 'SUPPORT' },
])

const PLATFORM_BY_VALUE = new Map(SOCIAL_PLATFORMS.map((p) => [p.value, p]))

/**
 * @param {unknown} value
 * @returns {value is SocialPlatform}
 */
export function isSocialPlatform(value) {
  return typeof value === 'string' && PLATFORM_BY_VALUE.has(value)
}

/**
 * @param {SocialPlatform} value
 * @returns {string}
 */
export function getSocialPlatformLabel(value) {
  return PLATFORM_BY_VALUE.get(value)?.label ?? 'Other'
}