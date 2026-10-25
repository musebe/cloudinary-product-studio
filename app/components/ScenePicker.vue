<script setup lang="ts">
import { ArrowRight, CircleCheck } from '@lucide/vue'
import { scenePresets, type SceneId } from '#shared/studio/contracts'

const selected = defineModel<SceneId>({ required: true })
defineProps<{ pending: boolean }>()
const emit = defineEmits<{ preview: [] }>()
</script>

<template>
  <section class="scene-panel" aria-labelledby="scene-heading">
    <div class="section-label">
      <span>02 / Scene direction</span><span class="muted">3 presets</span>
    </div>
    <h2 id="scene-heading" class="panel-title">Change the setting.</h2>
    <fieldset class="scene-options">
      <legend class="sr-only">Choose a scene preset</legend>
      <label
        v-for="scene in scenePresets"
        :key="scene.id"
        class="scene-option"
        :class="{ selected: selected === scene.id }"
      >
        <input v-model="selected" type="radio" name="scene" :value="scene.id" />
        <span
          class="scene-swatch"
          :style="{ backgroundColor: scene.accent }"
          aria-hidden="true"
        ></span>
        <span class="scene-copy"
          ><strong>{{ scene.name }}</strong
          ><span>{{ scene.description }}</span></span
        >
        <CircleCheck
          v-if="selected === scene.id"
          :size="17"
          class="selection-mark"
          aria-hidden="true"
        />
      </label>
    </fieldset>
    <button
      class="button primary full-width"
      type="button"
      :disabled="pending"
      @click="emit('preview')"
    >
      {{ pending ? 'Preparing plan…' : 'Preview scene request'
      }}<ArrowRight :size="16" aria-hidden="true" />
    </button>
    <p class="note">Preview builds a request, not an image. Generation is off.</p>
  </section>
</template>

<style scoped>
.scene-panel {
  padding: 1.35rem;
}
.panel-title {
  margin: 0.7rem 0 1rem;
  font-size: 1.08rem;
}
.scene-options {
  padding: 0;
  border: 0;
  display: grid;
  gap: 0.65rem;
  margin: 0 0 1.2rem;
  min-width: 0;
}
.scene-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  padding: 0.8rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  min-height: 4.2rem;
  transition: border-color 0.15s;
}
.scene-option:has(input:focus-visible) {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
.scene-option.selected {
  border-color: var(--accent);
  background: #f1f5ef;
}
.scene-option input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.scene-swatch {
  width: 2.1rem;
  height: 2.45rem;
  flex-shrink: 0;
  border-radius: 0.35rem;
  border: 1px solid #0000000d;
}
.scene-copy {
  display: grid;
  gap: 0.25rem;
}
.scene-copy strong {
  font-size: 0.8rem;
  font-weight: 600;
}
.scene-copy > span {
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.4;
}
.selection-mark {
  margin-left: auto;
  color: var(--accent);
  flex-shrink: 0;
}
.note {
  color: var(--muted);
  font-size: 0.74rem;
  line-height: 1.6;
  margin-bottom: 0;
}
</style>
