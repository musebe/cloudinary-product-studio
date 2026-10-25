import { computed, readonly, shallowRef, watch, type Ref } from 'vue'
import {
  createLocalReview,
  emptyReviewChecks,
  isReviewCurrent,
  type CandidateReview,
  type ReviewCheckId,
  type ReviewDecision,
} from '#shared/studio/contracts'

interface ReviewIdentity {
  readonly referenceId: string
  readonly candidateId: string
  readonly candidateSha256: string
}

export function useCandidateReview(identity: Readonly<Ref<ReviewIdentity>>) {
  const checks = shallowRef(emptyReviewChecks())
  const review = shallowRef<CandidateReview | null>(null)
  const allChecked = computed(() => Object.values(checks.value).every(Boolean))
  const currentReview = computed(() =>
    isReviewCurrent(review.value, identity.value) ? review.value : null,
  )

  function reset() {
    checks.value = emptyReviewChecks()
    review.value = null
  }

  watch(
    [
      () => identity.value.referenceId,
      () => identity.value.candidateId,
      () => identity.value.candidateSha256,
    ],
    reset,
    { flush: 'sync' },
  )

  function setCheck(id: ReviewCheckId, checked: boolean) {
    checks.value = { ...checks.value, [id]: checked }
    review.value = null
  }

  function decide(decision: ReviewDecision) {
    review.value = createLocalReview({ decision, checks: checks.value }, identity.value)
  }

  return {
    checks: readonly(checks),
    review: currentReview,
    allChecked,
    setCheck,
    decide,
    reset,
  }
}
