/**
 * Sort options offered in the UI. Values are Spring "property,direction" strings
 * and must stay within the backend SORTABLE_FIELDS whitelist.
 */
export const RELEASE_SORTS = Object.freeze([
  { value: 'createdAt,desc', label: 'Recently added' },
  { value: 'releaseDate,asc', label: 'Release date: soonest' },
  { value: 'releaseDate,desc', label: 'Release date: latest' },
  { value: 'name,asc', label: 'Name A–Z' },
])

export const DEFAULT_RELEASE_SORT = 'createdAt,desc'

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isReleaseSort = (value) => RELEASE_SORTS.some((sort) => sort.value === value)