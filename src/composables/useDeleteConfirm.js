import { ref } from 'vue'

// Encapsulates delete-modal state and the confirm action.
// Pass the store's delete function so the composable stays generic.
export function useDeleteConfirm(deleteFn) {
  const deleteId = ref(null)
  const deleting = ref(false)

  async function confirmDelete() {
    deleting.value = true
    try   { await deleteFn(deleteId.value); deleteId.value = null }
    catch { /* error handled by the store */ }
    finally { deleting.value = false }
  }

  return { deleteId, deleting, confirmDelete }
}
