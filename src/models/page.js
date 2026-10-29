/**
 * @typedef {Object} PageMeta
 * @property {number} number      Zero-based page index
 * @property {number} size
 * @property {number} totalElements
 * @property {number} totalPages
 */

/**
 * @template T
 * @typedef {Object} PageResult
 * @property {T[]} items
 * @property {PageMeta} page
 */

/**
 * Normalizes a Spring Data page. Supports both the legacy PageImpl shape
 * (meta fields at the root) and the VIA_DTO shape (meta nested under `page`).
 *
 * @template T
 * @param {unknown} dto
 * @param {(item: unknown) => T | null} mapItem
 * @returns {PageResult<T>}
 */
export function toPage(dto, mapItem) {
  const content = Array.isArray(dto?.content) ? dto.content : []
  const meta = dto?.page ?? dto ?? {}

  return {
    items: content.map(mapItem).filter(Boolean),
    page: {
      number: meta.number ?? 0,
      size: meta.size ?? content.length,
      totalElements: meta.totalElements ?? content.length,
      totalPages: meta.totalPages ?? 1,
    },
  }
}