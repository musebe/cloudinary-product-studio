<script setup lang="ts">
import { ArrowUpRight, Expand, Info, Image as ImageIcon } from '@lucide/vue'
import { shallowRef, watch } from 'vue'
import {
  savedReference as referenceAsset,
  savedDemo,
  storedOutputUrl,
  type SavedOutput,
} from '#shared/studio/saved-data'
import StudioImage from './StudioImage.vue'

const { candidate: candidateAsset } = defineProps<{ candidate: Readonly<SavedOutput> }>()

const cloudinaryDelivery = shallowRef(false)
const expanded = shallowRef(false)
const emit = defineEmits<{ deliveryChange: [remote: boolean] }>()
watch(cloudinaryDelivery, (remote) => emit('deliveryChange', remote), { flush: 'sync' })
</script>

<template>
  <section class="comparison" aria-labelledby="comparison-heading">
    <div class="comparison-top">
      <div>
        <h2 id="comparison-heading" class="panel-title">Look closer before you accept.</h2>
        <p class="muted small">
          One reference. {{ candidateAsset.name }}. Generated once, saved for this demo.
        </p>
      </div>
      <button
        class="icon-button"
        type="button"
        :aria-pressed="expanded"
        aria-label="Enlarge image comparison"
        @click="expanded = !expanded"
      >
        <Expand :size="18" aria-hidden="true" />
      </button>
    </div>
    <div class="image-pair" :class="{ enlarged: expanded }">
      <figure class="image-card">
        <div class="image-card-heading">
          <span><ImageIcon :size="14" aria-hidden="true" />Product reference</span
          ><span class="badge neutral">Photo</span>
        </div>
        <div class="image-frame">
          <StudioImage :asset="referenceAsset" :cloudinary-delivery="cloudinaryDelivery" />
        </div>
        <figcaption class="image-caption">Original shape, color, and ceramic finish.</figcaption>
      </figure>
      <figure class="image-card">
        <div class="image-card-heading">
          <span><ImageIcon :size="14" aria-hidden="true" />Saved AI scene</span
          ><span class="badge neutral">{{ candidateAsset.name }}</span>
        </div>
        <div class="image-frame">
          <StudioImage :asset="candidateAsset" :cloudinary-delivery="cloudinaryDelivery" />
        </div>
        <figcaption class="image-caption">
          {{ candidateAsset.name }} · {{ candidateAsset.width }} × {{ candidateAsset.height }} ·
          saved PNG
        </figcaption>
      </figure>
    </div>
    <div class="example-callout">
      <Info :size="17" aria-hidden="true" />
      <p>
        These scenes were generated once with Cloudinary and saved. Switching scenes never starts
        another generation. Compare the dot pattern, handle, color, and finish before accepting a
        result.
      </p>
    </div>
    <div class="delivery-choice">
      <label><input v-model="cloudinaryDelivery" type="checkbox" />Use Cloudinary delivery</label
      ><span class="muted small">{{
        cloudinaryDelivery
          ? 'Public URLs · bytes unverified · review off'
          : 'Saved files · no external requests'
      }}</span>
    </div>
    <details class="provenance">
      <summary>Generation provenance &amp; request</summary>
      <p class="muted small">
        Generated for this project and saved {{ savedDemo.recordedOn }}. Cloudinary Admin API
        readback, delivery dimensions, byte counts, and file hashes were checked. This verifies the
        saved asset, not visual product consistency.
      </p>
      <p class="request-note">{{ candidateAsset.generation.prompt }}</p>
      <dl class="evidence-facts">
        <div>
          <dt>Actual model</dt>
          <dd>{{ candidateAsset.generation.modelUsed }}</dd>
        </div>
        <div>
          <dt>Seed used</dt>
          <dd>{{ candidateAsset.generation.seedUsed ?? 'Not provided by model' }}</dd>
        </div>
        <div>
          <dt>Cloudinary asset ID</dt>
          <dd>{{ candidateAsset.assetId }}</dd>
        </div>
        <div>
          <dt>Reference SHA-256</dt>
          <dd>{{ referenceAsset.sha256 }}</dd>
        </div>
        <div>
          <dt>Candidate SHA-256</dt>
          <dd>{{ candidateAsset.sha256 }}</dd>
        </div>
      </dl>
      <a class="text-link" :href="storedOutputUrl(candidateAsset)" target="_blank" rel="noreferrer"
        >Open saved Cloudinary image <ArrowUpRight :size="14" aria-hidden="true"
      /></a>
    </details>
  </section>
</template>

<style scoped>
.comparison {
  padding: 1.4rem;
  min-width: 0;
}
.comparison-top {
  display: flex;
  gap: 1rem;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.panel-title {
  font-size: 1.12rem;
  margin: 0 0 0.4rem;
  letter-spacing: -0.025em;
}
.image-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}
.image-card {
  margin: 0;
  min-width: 0;
}
.image-card-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  justify-content: space-between;
  font-size: 0.74rem;
  margin-bottom: 0.6rem;
}
.image-card-heading > span:first-child {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.image-frame {
  border: 1px solid var(--border);
  border-radius: 0.65rem;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0eee6;
}
.image-caption {
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.55;
  margin-top: 0.6rem;
}
.enlarged {
  grid-template-columns: 1fr;
}
.enlarged .image-frame {
  aspect-ratio: 1.4;
}
.example-callout {
  display: flex;
  gap: 0.65rem;
  background: #f8f3e9;
  border: 1px solid #e6ddc9;
  border-radius: 0.6rem;
  padding: 0.85rem;
  margin: 1.2rem 0;
  color: #5a4e34;
}
.example-callout svg {
  flex-shrink: 0;
  margin-top: 0.15rem;
}
.example-callout p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.7;
}
.delivery-choice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem 0.8rem;
}
.delivery-choice label {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.78rem;
  cursor: pointer;
}
.provenance {
  margin-top: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
}
.provenance summary {
  padding: 0.5rem 0;
  font-size: 0.78rem;
  cursor: pointer;
}
.request-note {
  font-size: 0.8rem;
  line-height: 1.7;
  background: var(--surface-soft);
  border-left: 2px solid var(--accent);
  padding: 0.7rem;
}
.evidence-facts {
  font-size: 0.72rem;
  line-height: 1.7;
}
.evidence-facts > div {
  margin-bottom: 0.5rem;
}
.evidence-facts dt {
  color: var(--muted);
}
.evidence-facts dd {
  margin: 0;
  font-family: monospace;
  overflow-wrap: anywhere;
}
@media (max-width: 540px) {
  .comparison {
    padding: 1rem;
  }
  .image-pair {
    gap: 0.55rem;
  }
  .image-card-heading .badge {
    display: none;
  }
  .image-card-heading {
    font-size: 0.68rem;
  }
}
</style>
