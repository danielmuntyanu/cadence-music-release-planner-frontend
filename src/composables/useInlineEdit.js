import { inject, provide, ref, toRaw, watch } from 'vue'
import { useSubmit } from '@/composables/useSubmit'

export const INLINE_EDIT_GROUP = Symbol('inline-edit-group')

/**
 * Call in a parent component: among its descendants only one editor can be open.
 * Starting another one cancels the first without saving.
 */
export function provideInlineEditGroup() {
  const active = ref(null)
  provide(INLINE_EDIT_GROUP, active)
  return active
}

/**
 * State of one inline editor: a private draft copy, saving, errors.
 * @param {Object} options
 * @param {() => unknown} options.value  current saved value
 * @param {(draft: unknown) => Promise<unknown>} options.save
 * @param {Record<number, string>} [options.errorMessages]
 */
export function useInlineEdit({ value, save, errorMessages = {} }) {
  const editing = ref(false)
  const draft = ref(null)
  const { loading: saving, error, submit } = useSubmit({ errorMessages })

  const group = inject(INLINE_EDIT_GROUP, null)
  const id = Symbol('inline-edit')

  // The draft is a deep copy: editing it must never touch the displayed value
  const copy = (source) => (source == null ? source : structuredClone(toRaw(source)))

  function start() {
    draft.value = copy(value())
    error.value = null
    editing.value = true
    if (group) group.value = id
  }

  function cancel() {
    editing.value = false
    error.value = null
    if (group?.value === id) group.value = null
  }

  /** Saves the draft; resolves to true when the editor closed */
  async function commit() {
    // Nothing changed: close without sending a request
    if (JSON.stringify(draft.value) === JSON.stringify(value())) {
      cancel()
      return true
    }
    const ok = await submit(() => save(draft.value))
    if (ok) cancel()
    return ok
  }

  if (group) {
    watch(group, (active) => {
      if (editing.value && active !== id) cancel()
    })
  }

  return { editing, draft, saving, error, start, cancel, commit }
}