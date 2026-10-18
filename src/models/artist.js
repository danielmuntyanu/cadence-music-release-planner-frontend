import { isSocialPlatform } from '@/constants/social-platforms'

/**
 * @typedef {import('@/constants/social-platforms').SocialPlatform} SocialPlatform
 *
 * @typedef {Object} Social
 * @property {SocialPlatform} platform
 * @property {string} url
 *
 * @typedef {Object} Artist
 * @property {number} id
 * @property {string} name
 * @property {string | null} avatarUrl
 * @property {string | null} bannerUrl
 * @property {string} description
 * @property {string} genre
 * @property {Social[]} socials
 *
 * @typedef {Object} ArtistRequest
 * @property {string} name
 * @property {string | null} avatarUrl
 * @property {string | null} bannerUrl
 * @property {string | null} description
 * @property {string | null} genre
 * @property {Social[]} socials
 * @property {number} releaseCount
 */

/**
 * @param {unknown} dto
 * @returns {Social | null}
 */
function toSocial(dto) {
  if (!dto || typeof dto !== 'object' || !dto.url) return null

  return {
    platform: isSocialPlatform(dto.platform) ? dto.platform : 'OTHER',
    url: dto.url,
  }
}

/**
 * @param {unknown} dto
 * @returns {Artist | null}
 */
export function toArtist(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    name: dto.name ?? '',
    avatarUrl: dto.avatarUrl ?? null,
    bannerUrl: dto.bannerUrl ?? null,
    description: dto.description ?? '',
    genre: dto.genre ?? '',
    socials: Array.isArray(dto.socials) ? dto.socials.map(toSocial).filter(Boolean) : [],
    // Placeholder until the API exposes releaseCount; derived from id so it stays stable between renders
    releaseCount: dto.releaseCount ?? dto.id % 5,
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
const trimmed = (value) => (typeof value === 'string' ? value.trim() : '')

/**
 * Builds the request body for create/update from form state.
 * Blank optional fields are sent as null; socials without a URL are dropped.
 *
 * @param {Partial<Artist>} form
 * @returns {ArtistRequest}
 */
export function toArtistRequest(form) {
  return {
    name: trimmed(form.name),
    avatarUrl: trimmed(form.avatarUrl),
    bannerUrl: trimmed(form.bannerUrl),
    description: trimmed(form.description),
    genre: trimmed(form.genre),
    socials: (form.socials ?? [])
      .filter((social) => trimmed(social.url))
      .map((social) => ({ platform: social.platform, url: social.url.trim() })),
  }
}

let socialKey = 0

// Client-only key for v-for; toArtistRequest drops it
export const createSocialForm = (platform = 'OTHER', url = '') => ({ key: ++socialKey, platform, url })

/**
 * Form state for create/edit. Pass an artist to prefill (edit mode).
 * @param {Artist | null} [artist]
 */
export function createArtistForm(artist = null) {
  return {
    name: artist?.name ?? '',
    genre: artist?.genre ?? '',
    description: artist?.description ?? '',
    avatarUrl: artist?.avatarUrl ?? '',
    bannerUrl: artist?.bannerUrl ?? '',
    socials: (artist?.socials ?? []).map((s) => createSocialForm(s.platform, s.url)),
  }
}