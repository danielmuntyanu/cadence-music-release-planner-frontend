<script setup>
import { nextTick, ref } from 'vue'
import { useInlineEdit } from '@/composables/useInlineEdit'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: null, default: null },
  save: { type: Function, required: true },
  editable: { type: Boolean, default: true },
  // 'row': label left, value right (spec sheet). 'block': full-width content, e.g. notes
  layout: { type: String, default: 'row', validator: (v) => ['row', 'block'].includes(v) },
  // Lets the editor block saving, e.g. while a nested "create artist" form is open
  saveDisabled: { type: Boolean, default: false },
  errorMessages: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['saved'])

const root = ref(null)
const form = ref(null)

const { editing, draft, saving, error, start, cancel, commit } = useInlineEdit({
  value: () => props.value,
  save: (value) => props.save(value),
  errorMessages: props.errorMessages,
})

const set = (value) => { draft.value = value }

async function onStart() {
  start()
  await nextTick()
  root.value?.querySelector('input, textarea')?.focus()
}

async function onSubmit() {
  const { valid } = await form.value.validate()
  if (!valid || props.saveDisabled) return
  if (await commit()) emit('saved')
}
</script>

<template>
  <div ref="root" @keydown.esc.stop="cancel">
    <!-- View -->
    <div
      v-if="!editing"
      class="group flex gap-4 py-3"
      :class="layout === 'row' ? 'items-baseline justify-between' : 'items-start'"
    >
      <span v-if="layout === 'row'" class="shrink-0 text-sm text-on-surface-variant">{{ label }}</span>
      <div class="flex min-w-0 items-start gap-1" :class="layout === 'block' && 'flex-1'">
        <div class="min-w-0" :class="layout === 'row' ? 'text-end' : 'flex-1'">
          <slot name="display" :value="value">{{ value }}</slot>
        </div>
        <v-btn
          v-if="editable"
          icon="mdi-pencil-outline"
          size="x-small"
          variant="text"
          class="-my-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
          :aria-label="`Edit ${label.toLowerCase()}`"
          @click="onStart"
        />
      </div>
    </div>

    <!-- Edit -->
    <v-form v-else ref="form" class="py-3" @submit.prevent="onSubmit">
      <p v-if="layout === 'row'" class="mb-2 text-sm text-on-surface-variant">{{ label }}</p>
      <slot name="editor" :draft="draft" :set="set" />
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2" :text="error" />
      <div class="mt-2 flex justify-end gap-2">
        <v-btn variant="text" size="small" :disabled="saving" text="Cancel" @click="cancel" />
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-check"
          :loading="saving"
          :disabled="saveDisabled"
          text="Save"
        />
      </div>
    </v-form>
  </div>
</template>