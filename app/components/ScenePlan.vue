<script setup lang="ts">
import { FileCode2, LockKeyhole } from '@lucide/vue'
import type { createScenePlan } from '#shared/studio/contracts'
import { referenceAsset } from '#shared/studio/example'
import StudioImage from './StudioImage.vue'

defineProps<{ plan: ReturnType<typeof createScenePlan> }>()
const emit = defineEmits<{ compare: [] }>()
</script>

<template>
  <section class="plan-panel" aria-labelledby="plan-heading">
    <div class="plan-top">
      <span class="section-label">Scene request</span
      ><span class="badge neutral">Not generated</span>
    </div>
    <h2 id="plan-heading" class="plan-title">{{ plan.scene.name }}</h2>
    <div class="plan-reference">
      <StudioImage :asset="referenceAsset" /><span class="badge reference-label"
        >Reference [1] stays attached</span
      >
    </div>
    <p class="muted small">This is a request preview. The reference above has not been edited.</p>
    <div class="request-box">
      <FileCode2 :size="18" aria-hidden="true" />
      <p>{{ plan.scene.prompt }}</p>
    </div>
    <dl class="plan-facts">
      <div>
        <dt>Operation</dt>
        <dd>Reference-guided image edit</dd>
      </div>
      <div>
        <dt>Planned model</dt>
        <dd>{{ plan.modelId }}</dd>
      </div>
      <div>
        <dt>Fixed seed</dt>
        <dd>{{ plan.scene.seed }}</dd>
      </div>
      <div>
        <dt>Provider calls</dt>
        <dd>{{ plan.providerCalls }}</dd>
      </div>
    </dl>
    <div class="locked-note">
      <LockKeyhole :size="17" aria-hidden="true" />
      <p>
        Live generation is not connected yet. A generation budget and account capability check come
        before the first request.
      </p>
    </div>
    <button class="button secondary" type="button" @click="emit('compare')">
      Back to saved comparison
    </button>
  </section>
</template>

<style scoped>
.plan-panel {
  padding: 1.4rem;
}
.plan-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.plan-title {
  margin: 1rem 0;
  font-size: 1.35rem;
  letter-spacing: -0.03em;
}
.plan-reference {
  position: relative;
  height: 15rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  overflow: hidden;
  background: #eeede7;
}
.reference-label {
  position: absolute;
  bottom: 0.7rem;
  left: 0.7rem;
  background: var(--surface);
}
.request-box {
  display: flex;
  gap: 0.7rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  margin-top: 1.2rem;
}
.request-box svg {
  flex-shrink: 0;
  color: var(--accent);
  margin-top: 0.25rem;
}
.request-box p {
  margin: 0;
  line-height: 1.8;
  font-size: 0.8rem;
}
.plan-facts {
  font-size: 0.78rem;
  line-height: 1.6;
  margin: 1rem 0;
}
.plan-facts > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0;
}
.plan-facts dt {
  color: var(--muted);
}
.plan-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
  text-align: right;
}
.locked-note {
  display: flex;
  gap: 0.7rem;
  align-items: start;
  padding: 0.8rem;
  border-radius: 0.5rem;
  background: var(--surface-soft);
  margin: 1rem 0;
}
.locked-note svg {
  flex-shrink: 0;
  margin-top: 0.2rem;
}
.locked-note p {
  margin: 0;
  line-height: 1.7;
  font-size: 0.76rem;
  color: var(--muted);
}
</style>
