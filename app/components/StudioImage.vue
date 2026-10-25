<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Cloudinary } from '@cloudinary/url-gen'
import { AdvancedImage } from '@cloudinary/vue'
import type { ExampleAsset } from '#shared/studio/example'

const { asset, cloudinaryDelivery = false } = defineProps<{
  asset: ExampleAsset
  cloudinaryDelivery?: boolean
}>()
const failed = shallowRef(false)
const image = computed(() =>
  new Cloudinary({
    cloud: { cloudName: asset.cloudName ?? 'demo' },
    url: { secure: true, analytics: false },
  })
    .image(`${asset.publicId}.${asset.format}`)
    .setVersion(asset.version),
)
</script>

<template>
  <div class="studio-image">
    <AdvancedImage
      v-if="cloudinaryDelivery && !failed"
      :cld-img="image"
      :alt="asset.alt"
      :width="asset.width"
      :height="asset.height"
      loading="eager"
      class="product-photo"
      @error="failed = true"
    />
    <img
      v-else
      :src="asset.localPath"
      :alt="asset.alt"
      :width="asset.width"
      :height="asset.height"
      loading="eager"
      class="product-photo"
    />
    <span v-if="failed && cloudinaryDelivery" class="fallback-note" role="status"
      >Showing saved copy</span
    >
  </div>
</template>

<style scoped>
.studio-image {
  position: relative;
  display: block;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}
.product-photo {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.fallback-note {
  position: absolute;
  bottom: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  background: #fff9ef;
  font-size: 0.75rem;
}
</style>
