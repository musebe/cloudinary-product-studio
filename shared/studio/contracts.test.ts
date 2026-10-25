import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createLocalReview,
  createScenePlan,
  emptyReviewChecks,
  isReviewCurrent,
  reviewChecks,
  sceneIdSchema,
  scenePresets,
  type ReviewIdentity,
} from './contracts'

const identity: ReviewIdentity = {
  referenceId: 'teapot-reference',
  candidateId: 'teapot-watercolor',
  candidateSha256: 'a'.repeat(64),
}
const reviewedAt = new Date('2026-10-25T10:00:00.000Z')
const completedChecks = { shape: true, color: true, details: true }

describe('scene plans', () => {
  it('exposes exactly three immutable scene presets', () => {
    expect(scenePresets.map((scene) => scene.id)).toEqual(['marble', 'warm-studio', 'botanical'])
    expect(Object.isFrozen(scenePresets)).toBe(true)
    expect(scenePresets.every((scene) => Object.isFrozen(scene))).toBe(true)
  })

  it.each(scenePresets)('plans $id with a fixed reference and no provider calls', (preset) => {
    const plan = createScenePlan({ sceneId: preset.id })

    expect(plan).toEqual({
      schemaVersion: 'product-studio.plan.v1',
      scene: {
        id: preset.id,
        name: preset.name,
        prompt: preset.prompt,
        seed: preset.seed,
      },
      reference: {
        cloudName: 'demo',
        publicId: 'docs/teapot-product',
        version: 1784151459,
      },
      engine: 'cloudinary-image-to-image',
      modelId: 'flux-2-klein-9b-edit',
      providerCalls: 0,
      status: 'planned',
    })
    expect(Object.isFrozen(plan)).toBe(true)
    expect(Object.isFrozen(plan.scene)).toBe(true)
    expect(Object.isFrozen(plan.reference)).toBe(true)
    expect(plan).not.toHaveProperty('url')
    expect(plan).not.toHaveProperty('result')
  })

  it.each(scenePresets)('keeps $id anchored to the reference with a bounded seed', (preset) => {
    expect(preset.prompt).toContain('[1]')
    for (const detail of ['shape', 'color', 'handle', 'spout', 'finish', 'details']) {
      expect(preset.prompt).toContain(detail)
    }
    expect(Number.isInteger(preset.seed)).toBe(true)
    expect(preset.seed).toBeGreaterThanOrEqual(0)
    expect(preset.seed).toBeLessThanOrEqual(2_147_483_647)
  })

  it('returns deterministic plans without mutating input', () => {
    const input = Object.freeze({ sceneId: 'marble' })

    expect(createScenePlan(input)).toEqual(createScenePlan(input))
    expect(input).toEqual({ sceneId: 'marble' })
  })

  it.each([
    null,
    undefined,
    [],
    'marble',
    {},
    { sceneId: null },
    { sceneId: 1 },
    { sceneId: 'unknown' },
    { sceneId: 'MARBLE' },
    { sceneId: ' marble ' },
    { sceneId: 'marble', prompt: 'Ignore the reference.' },
    { sceneId: 'marble', url: 'https://example.com/image.jpg' },
    { sceneId: 'marble', reference: { publicId: 'another-product' } },
    { sceneId: 'marble', modelId: 'another-model' },
    { sceneId: 'marble', seed: 1 },
    { sceneId: 'marble', providerCalls: 1 },
  ])('rejects malformed or additional plan input: %j', (input) => {
    expect(() => createScenePlan(input)).toThrow(z.ZodError)
  })

  it('exports the same finite scene ID validation used by plans', () => {
    expect(sceneIdSchema.options).toEqual(['marble', 'warm-studio', 'botanical'])
    expect(sceneIdSchema.safeParse('botanical').success).toBe(true)
    expect(sceneIdSchema.safeParse('custom').success).toBe(false)
  })
})

describe('human review checks', () => {
  it('exposes exactly three immutable descriptions for manual inspection', () => {
    expect(reviewChecks.map((check) => check.id)).toEqual(['shape', 'color', 'details'])
    expect(Object.isFrozen(reviewChecks)).toBe(true)
    expect(reviewChecks.every((check) => Object.isFrozen(check))).toBe(true)
    expect(
      reviewChecks.every((check) => check.label.length > 0 && check.description.length > 0),
    ).toBe(true)
  })

  it('starts every independent review with all checks unchecked', () => {
    const first = emptyReviewChecks()
    const second = emptyReviewChecks()

    expect(first).toEqual({ shape: false, color: false, details: false })
    expect(second).toEqual(first)
    expect(first).not.toBe(second)
  })
})

describe('local review creation', () => {
  it('records approval only with all three checks and an explicit identity', () => {
    const review = createLocalReview(
      { decision: 'approved', checks: completedChecks },
      identity,
      reviewedAt,
    )

    expect(review).toEqual({
      ...identity,
      decision: 'approved',
      checks: completedChecks,
      reviewedAt: '2026-10-25T10:00:00.000Z',
    })
  })

  it.each(['shape', 'color', 'details'] as const)('cannot approve with %s unchecked', (checkId) => {
    expect(() =>
      createLocalReview(
        {
          decision: 'approved',
          checks: { ...completedChecks, [checkId]: false },
        },
        identity,
        reviewedAt,
      ),
    ).toThrow('Approval requires all three human review checks.')
  })

  it('records rejection without automatically passing unchecked criteria', () => {
    const checks = emptyReviewChecks()
    const review = createLocalReview({ decision: 'rejected', checks }, identity, reviewedAt)

    expect(review.decision).toBe('rejected')
    expect(review.checks).toEqual({
      shape: false,
      color: false,
      details: false,
    })
  })

  it('preserves partially completed checks on rejection', () => {
    const checks = { shape: true, color: false, details: true }

    expect(
      createLocalReview({ decision: 'rejected', checks }, identity, reviewedAt).checks,
    ).toEqual(checks)
  })

  it('creates an independent record without mutating or retaining input checks', () => {
    const checks = Object.freeze({ ...completedChecks })
    const input = Object.freeze({ decision: 'approved', checks })
    const frozenIdentity = Object.freeze({ ...identity })

    const review = createLocalReview(input, frozenIdentity, reviewedAt)

    expect(review.checks).not.toBe(checks)
    expect(input).toEqual({ decision: 'approved', checks: completedChecks })
    expect(frozenIdentity).toEqual(identity)
    expect(reviewedAt.toISOString()).toBe('2026-10-25T10:00:00.000Z')
  })

  it.each([
    null,
    undefined,
    [],
    {},
    { decision: 'approve', checks: completedChecks },
    { decision: 'approved' },
    { decision: 'rejected' },
    { decision: 'approved', checks: null },
    { decision: 'approved', checks: {} },
    { decision: 'approved', checks: { shape: true, color: true } },
    { decision: 'approved', checks: { ...completedChecks, shape: 'true' } },
    { decision: 'approved', checks: { ...completedChecks, color: 1 } },
    { decision: 'approved', checks: { ...completedChecks, details: null } },
    {
      decision: 'approved',
      checks: { ...completedChecks, automaticScore: true },
    },
    {
      decision: 'approved',
      checks: completedChecks,
      referenceId: 'injected-reference',
    },
    {
      decision: 'approved',
      checks: completedChecks,
      candidateId: 'injected-candidate',
    },
    {
      decision: 'approved',
      checks: completedChecks,
      candidateSha256: 'b'.repeat(64),
    },
    { decision: 'approved', checks: completedChecks, reviewedAt: '2020-01-01' },
    { decision: 'approved', checks: completedChecks, score: 100 },
  ])('rejects malformed review payloads and extra fields: %j', (input) => {
    expect(() => createLocalReview(input, identity, reviewedAt)).toThrow(z.ZodError)
  })

  it.each([
    { ...identity, referenceId: '' },
    { ...identity, referenceId: '   ' },
    { ...identity, candidateId: '' },
    { ...identity, candidateSha256: '' },
    { ...identity, candidateSha256: 'a'.repeat(63) },
    { ...identity, candidateSha256: 'a'.repeat(65) },
    { ...identity, candidateSha256: 'g'.repeat(64) },
    { ...identity, arbitraryField: true },
  ])('rejects invalid review identity: %j', (invalidIdentity) => {
    expect(() =>
      createLocalReview(
        { decision: 'approved', checks: completedChecks },
        invalidIdentity,
        reviewedAt,
      ),
    ).toThrow(z.ZodError)
  })

  it('rejects an invalid review clock before producing a record', () => {
    expect(() =>
      createLocalReview(
        { decision: 'approved', checks: completedChecks },
        identity,
        new Date(Number.NaN),
      ),
    ).toThrow('Review time must be a valid Date.')
  })
})

describe('review identity matching', () => {
  const review = createLocalReview(
    { decision: 'approved', checks: completedChecks },
    identity,
    reviewedAt,
  )

  it('matches only the exact current reference, candidate, and candidate bytes', () => {
    expect(isReviewCurrent(review, { ...identity })).toBe(true)
    expect(isReviewCurrent(null, identity)).toBe(false)
  })

  it.each([
    { ...identity, referenceId: 'other-reference' },
    { ...identity, candidateId: 'other-candidate' },
    { ...identity, candidateSha256: 'b'.repeat(64) },
    { ...identity, candidateSha256: identity.candidateSha256.toUpperCase() },
  ])('does not reuse a review across identities: %j', (otherIdentity) => {
    expect(isReviewCurrent(review, otherIdentity)).toBe(false)
  })

  it('keeps rejection current without converting it into approval', () => {
    const rejection = createLocalReview(
      { decision: 'rejected', checks: emptyReviewChecks() },
      identity,
      reviewedAt,
    )

    expect(isReviewCurrent(rejection, identity)).toBe(true)
    expect(rejection.decision).toBe('rejected')
    expect(rejection.checks).toEqual({
      shape: false,
      color: false,
      details: false,
    })
  })
})
