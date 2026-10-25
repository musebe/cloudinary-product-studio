import { savedReference, savedDemo, type SavedOutput } from '#shared/studio/saved-data'
import { isReviewCurrent, type CandidateReview } from '#shared/studio/contracts'

export function createSavedEvidence(
  candidate: Readonly<SavedOutput>,
  review: CandidateReview | null,
) {
  const identity = {
    referenceId: savedReference.id,
    candidateId: candidate.id,
    candidateSha256: candidate.sha256,
  }
  if (review && !isReviewCurrent(review, identity))
    throw new Error('The review belongs to a different saved image.')
  return {
    schemaVersion: 'product-studio.saved-review.v1',
    generatedAt: new Date().toISOString(),
    reference: savedReference,
    candidate,
    provenance: {
      origin: 'generated-for-this-project',
      recordedOn: savedDemo.recordedOn,
      generationRequestsInSavedRun: 2,
      providerCallsForThisView: 0,
    },
    review,
    authority: 'browser-only-attestation',
    disclaimer:
      'This is a saved Cloudinary generation. File verification is not a product-consistency judgment. A local human review is not server authorization, legal clearance, or an automatic score.',
  }
}

export function downloadEvidence(candidate: Readonly<SavedOutput>, review: CandidateReview | null) {
  const evidence = createSavedEvidence(candidate, review)
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `product-studio-${candidate.sceneId}-evidence.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
