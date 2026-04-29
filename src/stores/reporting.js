import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fuelAPI } from '@/api/fleet'

const unwrap = ({ data }) => {
  if (data.error) throw new Error(data.error.data?.message || 'Operation failed')
  return data.result
}

const m2o   = (f) => (Array.isArray(f) ? f[1] : f) || 'Unknown'
const m2oId = (f) => (Array.isArray(f) ? f[0] : f)

const groupFuel = (records, keyFn) =>
  Object.entries(
    records.reduce((acc, r) => {
      const key = keyFn(r)
      acc[key] = (acc[key] || 0) + (r.total_fuel || 0)
      return acc
    }, {}),
  )
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total)

export const useReportingStore = defineStore('reporting', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref('')

  async function fetchData() {
    loading.value = true
    error.value   = ''
    try   { records.value = await fuelAPI.getList().then(unwrap) || [] }
    catch (e) { error.value = e.message }
    finally   { loading.value = false }
  }

  const byRequester = computed(() => groupFuel(records.value, r => m2o(r.request_by_id)))
  const byVehicle   = computed(() => groupFuel(records.value, r => m2o(r.vehicle_id)))

  const summary = computed(() => ({
    totalRequests:   records.value.length,
    totalFuel:       records.value.reduce((s, r) => s + (r.total_fuel || 0), 0),
    totalVehicles:   new Set(records.value.map(r => m2oId(r.vehicle_id))).size,
    totalRequesters: new Set(records.value.map(r => m2oId(r.request_by_id))).size,
  }))

  return { records, loading, error, fetchData, byRequester, byVehicle, summary }
})
