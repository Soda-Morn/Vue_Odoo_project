import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fuelAPI } from '@/api/fleet'

// Unwrap Odoo response — throws if server returned an error
const unwrap = ({ data }) => {
  if (data.error) throw new Error(data.error.data?.message || 'Operation failed')
  return data.result
}

export const useFuelStore = defineStore('fuel', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref('')

  async function fetchList() {
    loading.value = true
    error.value   = ''
    try   { records.value = await fuelAPI.getList().then(unwrap) || [] }
    catch (e) { error.value = e.message }
    finally   { loading.value = false }
  }

  const createRecord = (data)     => fuelAPI.create(data).then(unwrap)
  const updateRecord = (id, data) => fuelAPI.update(id, data).then(unwrap)

  async function deleteRecord(id) {
    await fuelAPI.remove(id).then(unwrap)
    records.value = records.value.filter(r => r.id !== id)
  }

  return { records, loading, error, fetchList, createRecord, updateRecord, deleteRecord }
})
