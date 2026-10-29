<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  // Visible lines while collapsed
  lines: { type: Number, default: 4 },
  placeholder: { type: String, default: '' },
})

const contentId = useId()
const content = ref(null)
const expanded = ref(false)
const overflowing = ref(false)
const collapsedHeight = ref(0)
const fullHeight = ref(0)

// Plain text is split into text and link parts and rendered as nodes, never as HTML,
// so user content cannot inject markup
const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/g

const parts = computed(() =>
  (props.text ?? '')
    .split(URL_PATTERN)
    .filter(Boolean)
    .map((value) => ({ value, link: /^https?:\/\//.test(value) })),
)

// Pixel heights so the max-height transition can animate in both directions
const maxHeight = computed(() => {
  if (!overflowing.value) return 'none'
  return `${expanded.value ? fullHeight.value : collapsedHeight.value}px`
})

function measure() {
  const element = content.value
  if (!element) return
  const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20
  collapsedHeight.value = Math.round(lineHeight * props.lines)
  // scrollHeight reports the full content height even while max-height clips it
  fullHeight.value = element.scrollHeight
  overflowing.value = fullHeight.value > collapsedHeight.value + 1
}

/**
 * Clicking the text expands it, unless the user is selecting text or following a link.
 * Collapsing is left to the button, so reading or selecting never folds the text away.
 */
function onTextClick(event) {
  if (!overflowing.value || expanded.value) return
  if (event.target.closest('a')) return
  if (window.getSelection?.()?.toString()) return
  expanded.value = true
}

let observer = null

onMounted(async () => {
  await nextTick()
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(content.value)
})

onBeforeUnmount(() => observer?.disconnect())

watch(() => props.text, async () => {
  expanded.value = false
  await nextTick()
  measure()
})
</script>

<template>
  <div>
    <div
      :id="contentId"
      ref="content"
      class="expandable whitespace-pre-line break-words"
      :class="{ 'is-collapsed': overflowing && !expanded, 'cursor-pointer': overflowing && !expanded }"
      :style="{ maxHeight }"
      @click="onTextClick"
    >
      <template v-if="parts.length">
        <template v-for="(part, index) in parts" :key="index">
          <a
            v-if="part.link"
            :href="part.value"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline underline-offset-2"
          >{{ part.value }}</a>
          <template v-else>{{ part.value }}</template>
        </template>
      </template>
      <span v-else class="text-on-surface-variant">{{ placeholder }}</span>
    </div>

    <v-btn
      v-if="overflowing"
      variant="text"
      size="small"
      density="comfortable"
      class="-ms-2 mt-1"
      :aria-expanded="expanded"
      :aria-controls="contentId"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Show more' }}
      <v-icon icon="mdi-chevron-down" end class="transition-transform duration-200" :class="expanded && 'rotate-180'" />
    </v-btn>
  </div>
</template>

<style scoped>
.expandable {
  overflow: hidden;
  transition: max-height 250ms ease;
}

/* A mask fades the text itself, so it works on any background color */
.expandable.is-collapsed {
  mask-image: linear-gradient(to bottom, black 55%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .expandable {
    transition: none;
  }
}
</style>