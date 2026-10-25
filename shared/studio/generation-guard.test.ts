// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reserveAttempt } from '../../scripts/generate-saved-demos.mjs'

const firstPublicId = 'product-studio/approved-run/marble'
const secondPublicId = 'product-studio/approved-run/botanical'

function emptyLedger() {
  return {
    schemaVersion: 'product-studio.authoring.v1',
    maxRequests: 2,
    cloudName: 'example',
    runId: 'approved-run',
    attempts: [],
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('approved generation reservation guard', () => {
  it('reserves a permitted scene without modifying the input ledger', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-25T12:00:00.000Z'))
    const ledger = emptyLedger()
    Object.freeze(ledger.attempts)
    Object.freeze(ledger)

    const reserved = reserveAttempt(ledger, 'marble', firstPublicId)

    expect(ledger.attempts).toEqual([])
    expect(reserved).not.toBe(ledger)
    expect(reserved.attempts).toEqual([
      {
        sceneId: 'marble',
        publicId: firstPublicId,
        status: 'reserved',
        reservedAt: '2026-10-25T12:00:00.000Z',
      },
    ])
    expect(reserved.maxRequests).toBe(2)
    expect(reserved.runId).toBe(ledger.runId)
  })

  it('permits exactly the two approved scenes and never a third request', () => {
    const first = reserveAttempt(emptyLedger(), 'marble', firstPublicId)
    const second = reserveAttempt(first, 'botanical', secondPublicId)

    expect(second.attempts).toHaveLength(2)
    expect(second.attempts.map((attempt: { sceneId: string }) => attempt.sceneId)).toEqual([
      'marble',
      'botanical',
    ])
    expect(() => reserveAttempt(second, 'marble', 'product-studio/new-run/marble')).toThrow(
      'The two-request generation budget is closed.',
    )
  })

  it('can reserve the approved scenes in either order without expanding the budget', () => {
    const first = reserveAttempt(emptyLedger(), 'botanical', secondPublicId)
    const second = reserveAttempt(first, 'marble', firstPublicId)

    expect(second.attempts).toHaveLength(2)
    expect(() => reserveAttempt(second, 'botanical', secondPublicId)).toThrow(
      'The two-request generation budget is closed.',
    )
  })

  it.each(['reserved', 'pending', 'failed', 'generated', 'saved-and-verified'])(
    'does not retry a scene whose prior attempt is %s',
    (status) => {
      const ledger = {
        ...emptyLedger(),
        attempts: [{ sceneId: 'marble', publicId: firstPublicId, status }],
      }

      expect(() => reserveAttempt(ledger, 'marble', 'product-studio/another-id/marble')).toThrow(
        'This scene is not eligible for another generation request.',
      )
      expect(ledger.attempts).toHaveLength(1)
    },
  )

  it.each(['warm-studio', 'custom', '', 'MARBLE', ' marble ', null, undefined, 1, {}, []])(
    'rejects an unapproved or malformed scene: %j',
    (sceneId) => {
      const ledger = emptyLedger()

      expect(() => reserveAttempt(ledger, sceneId, firstPublicId)).toThrow(
        'This scene is not eligible for another generation request.',
      )
      expect(ledger.attempts).toEqual([])
    },
  )

  it.each([0, 1, 3, -1, 2.5, '2', null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects any budget other than the exact approved two requests: %j',
    (maxRequests) => {
      expect(() =>
        reserveAttempt({ ...emptyLedger(), maxRequests }, 'marble', firstPublicId),
      ).toThrow('The two-request generation budget is closed.')
    },
  )

  it.each([null, undefined, {}, '[]', 0])('rejects a non-array attempts ledger: %j', (attempts) => {
    expect(() => reserveAttempt({ ...emptyLedger(), attempts }, 'marble', firstPublicId)).toThrow(
      'The two-request generation budget is closed.',
    )
  })

  it('rejects an already over-budget ledger without mutating its history', () => {
    const attempts = [
      { sceneId: 'marble', status: 'failed' },
      { sceneId: 'botanical', status: 'pending' },
      { sceneId: 'unexpected', status: 'reserved' },
    ]

    expect(() => reserveAttempt({ ...emptyLedger(), attempts }, 'marble', firstPublicId)).toThrow(
      'The two-request generation budget is closed.',
    )
    expect(attempts).toHaveLength(3)
  })
})
