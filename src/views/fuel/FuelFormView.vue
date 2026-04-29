<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFuelStore } from '@/stores/fuel'
import { fuelAPI } from '@/api/fleet'
import AppSpinner from '@/components/AppSpinner.vue'
import AppError   from '@/components/AppError.vue'

const route  = useRoute()
const router = useRouter()
const store  = useFuelStore()

const isEdit = computed(() => !!route.params.id)

const loading = ref(false)
const saving  = ref(false)
const error   = ref('')

const vehicles        = ref([])
const employees       = ref([])
const fuelTypeOptions = ref([])

const vehicleDisplay = ref({ type: '', code: '' })
const qtyField       = ref('fuel_qty')

const form = ref({
  name:           '',
  request_date:   '',
  request_by_id:  '',
  vehicle_id:     '',
  beginning_fuel: '',
  request_reason: '',
})

const lines = ref([{ fuel_type: '', fuel_qty: '' }])

const totalFuel = computed(() =>
  lines.value.reduce((sum, l) => sum + (parseFloat(l.fuel_qty) || 0), 0)
)

const validLineCount = computed(() =>
  lines.value.filter(l => l.fuel_type && l.fuel_qty).length
)

let suppressWatch = false

watch(() => form.value.vehicle_id, async (id) => {
  if (suppressWatch) return
  vehicleDisplay.value = { type: '', code: '' }
  if (!id) return
  try {
    const res = await fuelAPI.vehicleOnchange(Number(id))
    const val = res.data.result?.value || {}
    vehicleDisplay.value = {
      type: Array.isArray(val.vehicle_type_id) ? val.vehicle_type_id[1] : (val.vehicle_type_id || ''),
      code: val.vehicle_code || '',
    }
  } catch { /* non-critical */ }
})

onMounted(async () => {
  loading.value = true
  try {
    const [lineFieldsRes, reqFieldsRes] = await Promise.all([
      fuelAPI.discoverLineFields(),
      fuelAPI.discoverRequestFields(),
    ])

    const lineFields  = lineFieldsRes.data.result || {}
    const SYSTEM_SKIP = new Set(['id', 'create_uid', 'create_date', 'write_uid', 'write_date',
                                  'display_name', '__last_update', 'fuel_request_id'])
    const isNumeric    = (t) => t === 'float' || t === 'integer'
    const looksLikeQty = (name, info) => {
      const n = name.toLowerCase(), s = (info.string || '').toLowerCase()
      return n.includes('qty') || n.includes('quantity') || s.includes('qty') || s.includes('quantity')
    }
    const allNumeric = Object.entries(lineFields).filter(([n, i]) => !SYSTEM_SKIP.has(n) && isNumeric(i.type))
    const qtyEntry   = allNumeric.find(([n, i]) => looksLikeQty(n, i)) || allNumeric[0]
    if (qtyEntry) qtyField.value = qtyEntry[0]

    const relation    = reqFieldsRes.data.result?.request_by_id?.relation || 'res.users'
    const fetchPeople = relation === 'res.users' ? fuelAPI.getUsers() : fuelAPI.getEmployees()

    const [v, e, ftRes] = await Promise.all([
      fuelAPI.getVehicles(),
      fetchPeople,
      fuelAPI.getFuelTypeOptions(),
    ])
    vehicles.value        = v.data.result || []
    employees.value       = e.data.result || []
    fuelTypeOptions.value = ftRes.data.result?.fuel_type?.selection || []

    if (isEdit.value) await loadRecord()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function loadRecord() {
  suppressWatch = true
  try {
    const id = Number(route.params.id)
    const [recRes, lineRes] = await Promise.all([
      fuelAPI.getOne(id),
      fuelAPI.getLines(id, qtyField.value),
    ])

    const rec = recRes.data.result?.[0]
    if (!rec) throw new Error('Record not found')

    form.value = {
      name:           rec.name           || '',
      request_date:   rec.request_date   || '',
      request_by_id:  Array.isArray(rec.request_by_id) ? rec.request_by_id[0] : '',
      vehicle_id:     Array.isArray(rec.vehicle_id)    ? rec.vehicle_id[0]    : '',
      beginning_fuel: rec.beginning_fuel ?? '',
      request_reason: rec.request_reason || '',
    }

    vehicleDisplay.value = {
      type: Array.isArray(rec.vehicle_type_id) ? rec.vehicle_type_id[1] : '',
      code: rec.vehicle_code || '',
    }

    const existing = lineRes.data.result || []
    lines.value = existing.length
      ? existing.map(l => ({ id: l.id, fuel_type: l.fuel_type || '', fuel_qty: l[qtyField.value] || '' }))
      : [{ fuel_type: '', fuel_qty: '' }]
  } finally {
    await nextTick()
    suppressWatch = false
  }
}

const addLine    = ()  => lines.value.push({ fuel_type: '', fuel_qty: '' })
const removeLine = (i) => lines.value.splice(i, 1)

async function handleSave() {
  saving.value = true
  error.value  = ''
  try {
    const validLines = lines.value.filter(l => l.fuel_type && l.fuel_qty)

    const lineCommands = [
      ...(isEdit.value ? [[5, 0, 0]] : []),
      ...validLines.map(l => [0, 0, { fuel_type: l.fuel_type, [qtyField.value]: parseFloat(l.fuel_qty) }]),
    ]

    const payload = {
      ...(form.value.name ? { name: form.value.name } : {}),
      request_date:   form.value.request_date,
      request_by_id:  Number(form.value.request_by_id) || false,
      vehicle_id:     Number(form.value.vehicle_id)    || false,
      beginning_fuel: parseFloat(form.value.beginning_fuel) || 0,
      request_reason: form.value.request_reason || false,
      ...(lineCommands.length ? { fuel_request_line_ids: lineCommands } : {}),
    }

    if (isEdit.value) {
      await store.updateRecord(Number(route.params.id), payload)
    } else {
      await store.createRecord(payload)
    }

    router.push({ name: 'fuel' })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <!-- ── Sticky header ─────────────────────────────────── -->
    <header class="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200
                   px-6 h-14 flex items-center justify-between shadow-sm">

      <!-- Breadcrumb -->
      <div class="flex items-center gap-2.5 min-w-0">
        <button @click="router.push({ name: 'fuel' })"
                class="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="flex items-center gap-1.5 text-sm min-w-0">
          <span class="text-gray-400 shrink-0">Fuel Request</span>
          <svg class="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="font-semibold text-gray-800 truncate">
            {{ isEdit ? (form.name || 'Edit Record') : 'New Fuel Request' }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <button @click="router.push({ name: 'fuel' })"
                class="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg
                       hover:bg-gray-100 hover:text-gray-800 transition-colors">
          Cancel
        </button>
        <button @click="handleSave" :disabled="saving"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium
                       rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </header>

    <!-- ── Page content ──────────────────────────────────── -->
    <div class="max-w-4xl mx-auto px-6 py-7">

      <!-- Loading -->
      <AppSpinner v-if="loading" text="Loading form data…" />

      <template v-else>

        <!-- Error banner -->
        <AppError v-if="error" :message="error" class="mb-5" />

        <!-- ── Main form card ─────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">

          <!-- Card top: name + status badge -->
          <div class="px-8 pt-7 pb-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
            <input v-model="form.name" type="text"
                   :placeholder="isEdit ? 'Fuel request name' : 'New Fuel Request'"
                   class="w-full text-2xl font-bold text-gray-900 bg-transparent border-none
                          outline-none placeholder:text-gray-300 placeholder:font-normal" />
            <div class="flex items-center gap-2.5 mt-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    :class="isEdit
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'">
                <span class="w-1.5 h-1.5 rounded-full"
                      :class="isEdit ? 'bg-amber-500' : 'bg-emerald-500'"></span>
                {{ isEdit ? 'Editing' : 'New' }}
              </span>
              <span v-if="form.request_date" class="text-xs text-gray-400">{{ form.request_date }}</span>
            </div>
          </div>

          <!-- Fields grid -->
          <div class="px-8 py-7">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">

              <!-- ── Left column ──────────────────────────── -->
              <div class="space-y-5">

                <!-- Request Date -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Request Date
                  </label>
                  <input v-model="form.request_date" type="date" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                </div>

                <!-- Request By -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Request By
                  </label>
                  <select v-model="form.request_by_id" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                    <option value="">Select person</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.name }}</option>
                  </select>
                </div>

                <!-- Beginning Fuel -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                    </svg>
                    Beginning Fuel
                  </label>
                  <div class="relative">
                    <input v-model="form.beginning_fuel" type="number" min="0" step="0.01"
                           placeholder="0.00" class="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">L</span>
                  </div>
                </div>

                <!-- Request Reason -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Request Reason
                  </label>
                  <textarea v-model="form.request_reason" rows="3"
                            placeholder="Enter reason…" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
                </div>

              </div>

              <!-- ── Right column ─────────────────────────── -->
              <div class="space-y-5 lg:border-l lg:border-gray-100 lg:pl-10">

                <!-- Vehicle -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                    Vehicle
                  </label>
                  <select v-model="form.vehicle_id" class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                    <option value="">Select vehicle</option>
                    <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.name }}</option>
                  </select>
                </div>

                <!-- Vehicle Type (readonly) -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    Vehicle Type
                    <span class="ml-auto text-gray-300 text-xs font-normal normal-case tracking-normal">auto</span>
                  </label>
                  <div class="flex items-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[42px]">
                    <span v-if="vehicleDisplay.type" class="text-gray-700">{{ vehicleDisplay.type }}</span>
                    <span v-else class="text-gray-300">—</span>
                  </div>
                </div>

                <!-- Vehicle Code (readonly) -->
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                    </svg>
                    Vehicle Code
                    <span class="ml-auto text-gray-300 text-xs font-normal normal-case tracking-normal">auto</span>
                  </label>
                  <div class="flex items-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[42px]">
                    <span v-if="vehicleDisplay.code"
                          class="font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100
                                 px-2.5 py-0.5 rounded-lg text-sm tracking-wider">
                      {{ vehicleDisplay.code }}
                    </span>
                    <span v-else class="text-gray-300">—</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- ── Lines card ─────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <!-- Lines header -->
          <div class="px-7 py-4 border-b border-gray-100 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h7"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold text-gray-800">Fuel Request Lines</h2>
            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
              {{ validLineCount }}
            </span>
          </div>

          <!-- Table -->
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Fuel Type
                </th>
                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-44">
                  Fuel QTY (L)
                </th>
                <th class="w-16"></th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-50">
              <tr v-for="(line, i) in lines" :key="i"
                  class="hover:bg-blue-50/30 transition-colors group">
                <td class="px-5 py-3">
                  <select v-model="line.fuel_type" class="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all">
                    <option value="">Select fuel type</option>
                    <option v-for="[val, label] in fuelTypeOptions" :key="val" :value="val">
                      {{ label }}
                    </option>
                  </select>
                </td>
                <td class="px-5 py-3">
                  <input v-model="line.fuel_qty" type="number" min="0" step="0.01"
                         placeholder="0.00" class="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-right tabular-nums" />
                </td>
                <td class="px-4 py-3 text-center">
                  <button @click="removeLine(i)" :disabled="lines.length === 1"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300
                                 hover:text-red-500 hover:bg-red-50 transition-colors
                                 disabled:opacity-20 disabled:cursor-not-allowed
                                 opacity-0 group-hover:opacity-100">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>

            <tfoot>
              <tr class="border-t-2 border-gray-100">
                <td class="px-6 py-4">
                  <button @click="addLine"
                          class="flex items-center gap-1.5 text-sm font-semibold text-blue-600
                                 hover:text-blue-700 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                            d="M12 4v16m8-8H4"/>
                    </svg>
                    Add a line
                  </button>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-end gap-2">
                    <span class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total</span>
                    <span class="text-lg font-extrabold text-gray-900 tabular-nums">
                      {{ totalFuel.toFixed(2) }}
                      <span class="text-xs font-normal text-gray-400 ml-0.5">L</span>
                    </span>
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

        </div>

      </template>
    </div>
  </div>
</template>
