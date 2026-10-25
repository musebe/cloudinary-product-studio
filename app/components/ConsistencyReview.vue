<script setup lang="ts">
import { Check, Download, RotateCcw, X } from '@lucide/vue'
import { computed } from 'vue'
import {
  reviewChecks,
  type CandidateReview,
  type ReviewCheckId,
  type ReviewChecks,
  type ReviewDecision,
} from '#shared/studio/contracts'

const {
  checks,
  review,
  available = true,
} = defineProps<{
  checks: Readonly<ReviewChecks>
  review: CandidateReview | null
  available?: boolean
}>()
const emit = defineEmits<{
  check: [id: ReviewCheckId, checked: boolean]
  decide: [decision: ReviewDecision]
  reset: []
  download: []
}>()
const complete = computed(() => available && Object.values(checks).every(Boolean))
const status = computed(() =>
  !available
    ? 'Saved files required'
    : review
      ? review.decision === 'approved'
        ? 'Accepted in this review'
        : 'Changes needed'
      : 'Not reviewed',
)

function updateCheck(id: ReviewCheckId, event: Event) {
  emit('check', id, (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <section class="review-panel" aria-labelledby="review-heading">
    <div class="review-heading">
      <div>
        <div class="section-label">03 / Consistency review</div>
        <h2 id="review-heading" class="panel-title">Would you use this as a product photo?</h2>
      </div>
      <span
        class="badge"
        :class="review ? (review.decision === 'approved' ? 'green' : 'amber') : 'neutral'"
        role="status"
        >{{ status }}</span
      >
    </div>
    <p class="muted small">
      Check the actual image, not just the prompt. Accept only if all three are true.
    </p>
    <p v-if="!available" class="review-limit">
      Remote bytes have not been verified. Switch off Cloudinary delivery to review the hash-checked
      saved files.
    </p>
    <fieldset class="review-checks" :disabled="!available">
      <legend class="sr-only">Product consistency checks</legend>
      <label v-for="item in reviewChecks" :key="item.id" class="review-check"
        ><input
          type="checkbox"
          :checked="checks[item.id]"
          @change="updateCheck(item.id, $event)"
        /><span
          ><strong>{{ item.label }}</strong
          ><span>{{ item.description }}</span></span
        ></label
      >
    </fieldset>
    <div class="review-actions">
      <button
        class="button primary"
        type="button"
        :disabled="!complete"
        @click="emit('decide', 'approved')"
      >
        <Check :size="16" aria-hidden="true" />Accept candidate</button
      ><button
        class="button secondary"
        type="button"
        :disabled="!available"
        @click="emit('decide', 'rejected')"
      >
        <X :size="16" aria-hidden="true" />Needs changes</button
      ><button class="button ghost" type="button" :disabled="!available" @click="emit('reset')">
        <RotateCcw :size="14" aria-hidden="true" />Reset</button
      ><button
        class="button ghost download-button"
        type="button"
        :disabled="!available"
        @click="emit('download')"
      >
        <Download :size="15" aria-hidden="true" />Download evidence
      </button>
    </div>
    <p class="review-limit">
      This decision is local to this page and clears on refresh. It is a human attestation, not an
      automated score or a publication gate.
    </p>
  </section>
</template>

<style scoped>
.review-panel {
  border-top: 1px solid var(--border);
  padding: 1.4rem;
}
.review-heading {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.panel-title {
  margin: 0.65rem 0 0.3rem;
  font-size: 1.03rem;
}
.review-heading > .badge {
  margin-top: 0.3rem;
}
.review-checks {
  border: 0;
  padding: 0;
  margin: 1.25rem 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}
.review-check {
  display: flex;
  gap: 0.6rem;
  align-items: start;
  cursor: pointer;
  padding: 0.8rem;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
}
.review-check input {
  margin-top: 0.15rem;
}
.review-check > span {
  display: grid;
  gap: 0.3rem;
}
.review-check strong {
  font-size: 0.78rem;
  font-weight: 600;
}
.review-check > span > span {
  font-size: 0.72rem;
  line-height: 1.6;
  color: var(--muted);
}
.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.download-button {
  margin-left: auto;
}
.review-limit {
  margin: 1rem 0 0;
  color: var(--muted);
  font-size: 0.73rem;
  line-height: 1.65;
}
@media (max-width: 700px) {
  .review-checks {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
  .download-button {
    margin-left: 0;
  }
}
@media (max-width: 540px) {
  .review-panel {
    padding: 1rem;
  }
}
</style>
