/**
 * @typedef {'USER' | 'ADMIN'} Role
 *
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} displayName
 * @property {string} bio
 * @property {string | null} avatarUrl
 * @property {Role[]} roles
 */

/**
 * @param {unknown} dto
 * @returns {User | null}
 */
export function toUser(dto) {
  if (!dto || typeof dto !== 'object') return null

  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    displayName: dto.displayName ?? '',
    bio: dto.bio ?? '',
    avatarUrl: dto.avatarUrl ?? null,
    roles: Array.isArray(dto.roles) ? dto.roles : [],
  }
}