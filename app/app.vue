<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { Box, ArrowUpRight, Check, Sparkles } from '@lucide/vue'
import { createScenePlan, type SceneId } from '#shared/studio/contracts'
import { exampleIdentity } from '#shared/studio/example'
import { useCandidateReview } from './composables/useCandidateReview'
import { downloadEvidence } from './utils/downloadEvidence'
import ReferencePanel from './components/ReferencePanel.vue'
import ScenePicker from './components/ScenePicker.vue'
import ProductComparison from './components/ProductComparison.vue'
import ConsistencyReview from './components/ConsistencyReview.vue'
import ScenePlan from './components/ScenePlan.vue'

const selectedScene = shallowRef<SceneId>('marble')
const cloudinaryDelivery = shallowRef(false)
const hydrated = shallowRef(false)
onMounted(() => {
  hydrated.value = true
})
const plan = shallowRef<ReturnType<typeof createScenePlan> | null>(null)
const mode = shallowRef<'compare' | 'plan'>('compare')
const identity = computed(() => exampleIdentity)
const { checks, review, setCheck, decide, reset } = useCandidateReview(identity)

function preview() {
  plan.value = createScenePlan({ sceneId: selectedScene.value })
  mode.value = 'plan'
}

function changeDelivery(remote: boolean) {
  cloudinaryDelivery.value = remote
  reset()
}

function download() {
  if (!cloudinaryDelivery.value) downloadEvidence(review.value)
}
</script>

<template>
  <a class="skip-link" href="#studio">Skip to product studio</a>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/" aria-label="Product Studio home"
        ><span class="brand-mark"><Box :size="22" :stroke-width="1.6" aria-hidden="true" /></span
        ><span><strong>Product Studio</strong><span>Cloudinary × Vue</span></span></a
      >
      <div class="header-meta">
        <span class="status-dot" aria-hidden="true"></span>Saved demo · no generation cost
      </div>
    </header>
    <main>
      <section class="intro" aria-labelledby="page-heading">
        <div>
          <p class="eyebrow">
            <Sparkles :size="14" aria-hidden="true" />Reference-led product imagery
          </p>
          <h1 id="page-heading">
            New scene.<br class="mobile-break" />
            Same product.
          </h1>
          <p class="intro-copy">
            Give the setting room to change. Keep the product details under review.
          </p>
        </div>
        <div class="intro-aside">
          <span class="mini-rule"></span>
          <p>
            Keep the reference.<br />Control the request.<br /><strong>Inspect the result.</strong>
          </p>
        </div>
      </section>
      <fieldset class="studio-guard" :disabled="!hydrated" :data-studio-ready="hydrated">
        <legend class="sr-only">Interactive product studio</legend>
        <section id="studio" class="studio-layout" aria-label="Interactive product studio">
          <aside class="control-panel">
            <ReferencePanel /><ScenePicker
              v-model="selectedScene"
              :pending="false"
              @preview="preview"
            />
          </aside>
          <div class="result-panel">
            <div class="result-tabs" role="group" aria-label="Studio view">
              <button
                id="compare-tab"
                class="view-tab"
                type="button"
                :aria-pressed="mode === 'compare'"
                aria-controls="compare-panel"
                @click="mode = 'compare'"
              >
                Saved comparison</button
              ><button
                id="plan-tab"
                class="view-tab"
                type="button"
                :aria-pressed="mode === 'plan'"
                aria-controls="plan-panel"
                @click="plan ? (mode = 'plan') : preview()"
              >
                Scene plan</button
              ><span class="tab-note"
                ><Check :size="13" aria-hidden="true" />No API key needed</span
              >
            </div>
            <div v-show="mode === 'compare'" id="compare-panel" aria-labelledby="compare-tab">
              <ProductComparison @delivery-change="changeDelivery" /><ConsistencyReview
                :checks="checks"
                :review="review"
                :available="!cloudinaryDelivery"
                @check="setCheck"
                @decide="decide"
                @reset="reset"
                @download="download"
              />
            </div>
            <div v-if="mode === 'plan'" id="plan-panel" aria-labelledby="plan-tab">
              <ScenePlan
                :plan="plan ?? createScenePlan({ sceneId: selectedScene })"
                @compare="mode = 'compare'"
              />
            </div>
          </div>
        </section>
      </fieldset>
      <section id="how-it-works" class="principles" aria-label="Consistency workflow">
        <div>
          <span>01</span>
          <p><strong>Anchor</strong>A known product reference, not a fresh guess.</p>
        </div>
        <div>
          <span>02</span>
          <p><strong>Constrain</strong>Bound the scene request and keep its inputs.</p>
        </div>
        <div>
          <span>03</span>
          <p><strong>Compare</strong>Check the silhouette, palette, and fine details.</p>
        </div>
      </section>
    </main>
    <footer class="site-footer">
      <p>A reference is a starting point, not a consistency guarantee.</p>
      <a
        class="text-link"
        href="https://cloudinary.com/documentation/image_generation_addon"
        target="_blank"
        rel="noreferrer"
        >Cloudinary Image Generation <ArrowUpRight :size="13" aria-hidden="true"
      /></a>
    </footer>
  </div>
</template>
