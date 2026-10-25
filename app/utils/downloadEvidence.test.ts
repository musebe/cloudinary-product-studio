import { describe, expect, it } from 'vitest'
import { createSavedEvidence } from './downloadEvidence'
import { savedOutputs, savedReference } from '#shared/studio/saved-data'
import { createLocalReview } from '#shared/studio/contracts'

describe('saved candidate evidence', () => {
  const marble = savedOutputs[0]!
  const botanical = savedOutputs[1]!
  const identity = {
    referenceId: savedReference.id,
    candidateId: marble.id,
    candidateSha256: marble.sha256,
  }
  it('exports an unreviewed snapshot without inventing a decision', () => {
    const evidence = createSavedEvidence(marble, null)
    expect(evidence.review).toBeNull()
    expect(evidence.candidate).toBe(marble)
    expect(evidence.provenance.origin).toBe('generated-for-this-project')
    expect(evidence.provenance.providerCallsForThisView).toBe(0)
    expect(evidence.authority).toBe('browser-only-attestation')
  })
  it('exports a matching rejection, but rejects stale reviews for another candidate', () => {
    const review = createLocalReview(
      { decision: 'rejected', checks: { shape: false, color: false, details: false } },
      identity,
    )
    expect(createSavedEvidence(marble, review).review).toBe(review)
    expect(() => createSavedEvidence(botanical, review)).toThrow('different saved image')
  })
})
