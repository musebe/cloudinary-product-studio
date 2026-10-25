<script setup lang="ts">
import { LockKeyhole, ArrowUpRight } from '@lucide/vue'
import { savedReference as referenceAsset } from '#shared/studio/saved-data'
import StudioImage from './StudioImage.vue'
</script>

<template>
  <section class="reference-panel" aria-labelledby="reference-heading">
    <div class="section-label">
      <span>01 / Reference</span><LockKeyhole :size="14" aria-hidden="true" />
    </div>
    <h2 id="reference-heading" class="panel-title">Start with the real product.</h2>
    <div class="reference-thumbnail"><StudioImage :asset="referenceAsset" /></div>
    <div class="reference-info">
      <div>
        <h3 class="product-name">Terracotta dot teapot</h3>
        <p class="muted small">Cloudinary documentation sample</p>
      </div>
      <span class="badge neutral">Reference</span>
    </div>
    <dl class="reference-facts">
      <div>
        <dt>Source</dt>
        <dd>1920 × 1314 · JPEG</dd>
      </div>
      <div>
        <dt>Version</dt>
        <dd>{{ referenceAsset.version }}</dd>
      </div>
      <div>
        <dt>Protect</dt>
        <dd>Shape, palette &amp; details</dd>
      </div>
    </dl>
    <a
      class="text-link"
      href="https://cloudinary.com/documentation/image_generation_addon#generate_an_image_from_reference_images"
      target="_blank"
      rel="noreferrer"
      >See the original example <ArrowUpRight :size="14" aria-hidden="true"
    /></a>
    <p class="note">Both saved scenes use this reference. Browsing the demo needs no API keys.</p>
  </section>
</template>

<style scoped>
.reference-panel {
  padding: 1.35rem;
  border-bottom: 1px solid var(--border);
}
.panel-title {
  font-size: 1.08rem;
  line-height: 1.45;
  margin: 0.75rem 0 1rem;
}
.reference-thumbnail {
  aspect-ratio: 2.25;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  background: #eeede7;
}
.reference-info {
  display: flex;
  gap: 0.6rem;
  align-items: start;
  justify-content: space-between;
  margin-top: 1rem;
}
.product-name {
  font-size: 0.88rem;
  margin: 0 0 0.3rem;
}
.reference-facts {
  margin: 1rem 0;
}
.reference-facts > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  font-size: 0.78rem;
}
.reference-facts dt {
  color: var(--muted);
}
.reference-facts dd {
  margin: 0;
  text-align: right;
}
.note {
  margin: 1rem 0 0;
  font-size: 0.76rem;
  color: var(--muted);
  line-height: 1.65;
}
</style>
