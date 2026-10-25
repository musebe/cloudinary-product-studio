import { afterEach, describe, expect, it } from 'vitest'
import { effectScope, isReadonly, nextTick, shallowRef, type EffectScope } from 'vue'
import {
  emptyReviewChecks,
  type ReviewCheckId,
  type ReviewIdentity,
} from '../../shared/studio/contracts'
import { useCandidateReview } from './useCandidateReview'

const baseIdentity: ReviewIdentity = {
  referenceId: 'teapot-reference',
  candidateId: 'teapot-example',
  candidateSha256: 'a'.repeat(64),
}

const scopes: EffectScope[] = []

afterEach(() => {
  scopes.splice(0).forEach((scope) => scope.stop())
})

function createReviewState(initialIdentity: ReviewIdentity = baseIdentity) {
  const identity = shallowRef<ReviewIdentity>({ ...initialIdentity })
  const scope = effectScope()
  scopes.push(scope)
  const state = scope.run(() => useCandidateReview(identity))

  if (!state) throw new Error('Review state could not be created.')

  return { identity, state }
}

function completeChecks(state: ReturnType<typeof useCandidateReview>) {
  for (const id of ['shape', 'color', 'details'] as const) {
    state.setCheck(id, true)
  }
}

describe('useCandidateReview', () => {
  it('starts with unchecked readonly state and no review', () => {
    const { state } = createReviewState()

    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(isReadonly(state.checks)).toBe(true)
    expect(isReadonly(state.checks.value)).toBe(true)
    expect(state.allChecked.value).toBe(false)
    expect(state.review.value).toBeNull()
  })

  it('replaces check state without changing earlier snapshots', () => {
    const { state } = createReviewState()
    const initialChecks = state.checks.value

    state.setCheck('shape', true)
    const shapeChecked = state.checks.value
    state.setCheck('color', true)

    expect(initialChecks).toEqual(emptyReviewChecks())
    expect(shapeChecked).toEqual({ shape: true, color: false, details: false })
    expect(state.checks.value).toEqual({ shape: true, color: true, details: false })
    expect(state.checks.value).not.toBe(shapeChecked)
    expect(state.allChecked.value).toBe(false)
  })

  it('requires every check and reacts when a completed check is cleared', () => {
    const { state } = createReviewState()

    state.setCheck('shape', true)
    state.setCheck('color', true)
    expect(state.allChecked.value).toBe(false)
    state.setCheck('details', true)
    expect(state.allChecked.value).toBe(true)
    state.setCheck('shape', false)
    expect(state.allChecked.value).toBe(false)
  })

  it.each(['shape', 'color', 'details'] as const)(
    'does not approve when the %s check is missing',
    (unchecked: ReviewCheckId) => {
      const { state } = createReviewState()
      completeChecks(state)
      state.setCheck(unchecked, false)

      expect(() => state.decide('approved')).toThrow(
        'Approval requires all three human review checks.',
      )
      expect(state.review.value).toBeNull()
      expect(state.allChecked.value).toBe(false)
    },
  )

  it('records a completed approval for the exact current identity', () => {
    const { state } = createReviewState()
    completeChecks(state)

    state.decide('approved')

    expect(state.review.value).toEqual({
      ...baseIdentity,
      decision: 'approved',
      checks: { shape: true, color: true, details: true },
      reviewedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    })
    expect(state.review.value?.checks).not.toBe(state.checks.value)
  })

  it('allows rejection without checking or automatically passing any criteria', () => {
    const { state } = createReviewState()

    state.decide('rejected')

    expect(state.review.value?.decision).toBe('rejected')
    expect(state.review.value?.checks).toEqual(emptyReviewChecks())
    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(state.allChecked.value).toBe(false)
  })

  it('invalidates an existing review when a check changes and preserves its old record', () => {
    const { state } = createReviewState()
    completeChecks(state)
    state.decide('approved')
    const approvedReview = state.review.value

    state.setCheck('color', false)

    expect(state.review.value).toBeNull()
    expect(state.checks.value).toEqual({ shape: true, color: false, details: true })
    expect(approvedReview?.checks).toEqual({ shape: true, color: true, details: true })
    expect(approvedReview?.decision).toBe('approved')
  })

  it.each(['approved', 'rejected'] as const)('reset clears a previous %s decision', (decision) => {
    const { state } = createReviewState()
    completeChecks(state)
    state.decide(decision)
    const previousChecks = state.checks.value

    state.reset()

    expect(state.review.value).toBeNull()
    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(state.checks.value).not.toBe(previousChecks)
    expect(state.allChecked.value).toBe(false)
  })

  it.each([
    { field: 'reference', replacement: { ...baseIdentity, referenceId: 'another-reference' } },
    { field: 'candidate', replacement: { ...baseIdentity, candidateId: 'another-candidate' } },
    { field: 'hash', replacement: { ...baseIdentity, candidateSha256: 'b'.repeat(64) } },
  ])('clears checks and review when the $field identity changes', async ({ replacement }) => {
    const { identity, state } = createReviewState()
    completeChecks(state)
    state.decide('approved')

    identity.value = replacement

    expect(state.review.value).toBeNull()
    await nextTick()
    expect(state.review.value).toBeNull()
    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(state.allChecked.value).toBe(false)

    identity.value = { ...baseIdentity }
    await nextTick()
    expect(state.review.value).toBeNull()
  })

  it('clears checks when distinct reference and candidate IDs contain delimiters', async () => {
    const { identity, state } = createReviewState({
      ...baseIdentity,
      referenceId: 'reference:variant',
      candidateId: 'candidate',
    })
    completeChecks(state)
    state.decide('approved')

    identity.value = {
      ...baseIdentity,
      referenceId: 'reference',
      candidateId: 'variant:candidate',
    }
    await nextTick()

    expect(state.review.value).toBeNull()
    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(state.allChecked.value).toBe(false)
  })

  it('keeps a review when only the identity object is replaced with equal values', async () => {
    const { identity, state } = createReviewState()
    completeChecks(state)
    state.decide('approved')
    const existingReview = state.review.value

    identity.value = { ...baseIdentity }
    await nextTick()

    expect(state.review.value).toBe(existingReview)
    expect(state.allChecked.value).toBe(true)
  })

  it('does not reuse checks or revive approval after rapid candidate changes', async () => {
    const { identity, state } = createReviewState()
    completeChecks(state)
    state.decide('approved')

    identity.value = { ...baseIdentity, candidateId: 'another-candidate' }

    expect(state.review.value).toBeNull()
    expect(state.checks.value).toEqual(emptyReviewChecks())
    expect(() => state.decide('approved')).toThrow(
      'Approval requires all three human review checks.',
    )

    identity.value = { ...baseIdentity }
    await nextTick()

    expect(state.review.value).toBeNull()
    expect(state.allChecked.value).toBe(false)
  })

  it('keeps independently created review state separate', () => {
    const first = createReviewState().state
    const second = createReviewState().state

    completeChecks(first)
    first.decide('approved')

    expect(second.checks.value).toEqual(emptyReviewChecks())
    expect(second.review.value).toBeNull()
    expect(second.allChecked.value).toBe(false)
    expect(first.review.value?.decision).toBe('approved')
  })
})
