import { describe, expect, it } from 'vitest'
import { toUser } from '../user'

describe('toUser', () => {
  it('маппит поля ответа', () => {
    const dto = { id: 1, username: 'daniel', email: 'd@example.com', displayName: 'Daniel', bio: 'Hi', avatarUrl: 'http://x/a.png', roles: ['USER'] }
    expect(toUser(dto)).toEqual(dto)
  })

  it('подставляет значения по умолчанию', () => {
    expect(toUser({ id: 1, username: 'd', email: 'd@e.com' })).toMatchObject({
      displayName: '', bio: '', avatarUrl: null, roles: [],
    })
  })

  it('отбрасывает лишние поля', () => {
    expect(toUser({ id: 1, username: 'd', email: 'd@e.com', passwordHash: 'x' })).not.toHaveProperty('passwordHash')
  })

  it('возвращает null для пустого ответа', () => {
    expect(toUser(null)).toBeNull()
    expect(toUser('oops')).toBeNull()
  })
})