<script setup lang="ts">
import { ArrowUpRight, Expand, Info, Image as ImageIcon } from '@lucide/vue'
import { shallowRef, watch } from 'vue'
import { candidateAsset, exampleProvenance, referenceAsset } from '#shared/studio/example'
import StudioImage from './StudioImage.vue'

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
        <p class="muted small">One reference. A result worth inspecting.</p>
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
          <span><ImageIcon :size="14" aria-hidden="true" />Saved AI example</span
          ><span class="badge amber">Restyled</span>
        </div>
        <div class="image-frame">
          <StudioImage :asset="candidateAsset" :cloudinary-delivery="cloudinaryDelivery" />
        </div>
        <figcaption class="image-caption">Reference-guided watercolor, not a new scene.</figcaption>
      </figure>
    </div>
    <div class="example-callout">
      <Info :size="17" aria-hidden="true" />
      <p>
        A reference can guide an image without preserving every detail. This published Cloudinary
        example changes the style; inspect it against the product-photo brief rather than assuming
        it passes.
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
      <summary>Example provenance &amp; request</summary>
      <p class="muted small">
        {{ exampleProvenance.verification }} Downloaded {{ exampleProvenance.recordedOn }}. These
        are Cloudinary documentation examples, not generations from your account.
      </p>
      <p class="request-note">{{ exampleProvenance.prompt }}</p>
      <dl class="evidence-facts">
        <div>
          <dt>Reference SHA-256</dt>
          <dd>{{ referenceAsset.sha256 }}</dd>
        </div>
        <div>
          <dt>Candidate SHA-256</dt>
          <dd>{{ candidateAsset.sha256 }}</dd>
        </div>
      </dl>
      <a class="text-link" :href="exampleProvenance.source" target="_blank" rel="noreferrer"
        >Published source <ArrowUpRight :size="14" aria-hidden="true"
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
