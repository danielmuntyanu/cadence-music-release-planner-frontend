import { describe, expect, it } from 'vitest'
import { toPage } from '@/models/page'

const double = (value) => (typeof value === 'number' ? value * 2 : null)

describe('toPage', () => {
  it('reads the legacy PageImpl shape with meta at the root', () => {
    const result = toPage({ content: [1, 2], number: 1, size: 2, totalElements: 5, totalPages: 3 }, double)

    expect(result).toEqual({ items: [2, 4], page: { number: 1, size: 2, totalElements: 5, totalPages: 3 } })
  })

  it('reads the VIA_DTO shape with meta under page', () => {
    const result = toPage({ content: [1], page: { number: 0, size: 24, totalElements: 1, totalPages: 1 } }, double)

    expect(result.page).toEqual({ number: 0, size: 24, totalElements: 1, totalPages: 1 })
  })

  it('drops items the mapper rejects', () => {
    expect(toPage({ content: [1, 'x', 3] }, double).items).toEqual([2, 6])
  })

  it('returns an empty page for a missing body', () => {
    expect(toPage(undefined, double)).toEqual({ items: [], page: { number: 0, size: 0, totalElements: 0, totalPages: 1 } })
  })
})