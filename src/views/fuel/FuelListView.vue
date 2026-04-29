<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFuelStore }       from '@/stores/fuel'
import { useFormatters }      from '@/composables/useFormatters'
import { useDeleteConfirm }   from '@/composables/useDeleteConfirm'
import AppSpinner from '@/components/AppSpinner.vue'
import AppError   from '@/components/AppError.vue'
import AppEmpty   from '@/components/AppEmpty.vue'

const router = useRouter()
const store  = useFuelStore()

const { fmt, m2o, num }                    = useFormatters()
const { deleteId, deleting, confirmDelete } = useDeleteConfirm(store.deleteRecord)

onMounted(() => store.fetchList())

const EMPTY_ICON = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">

    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-gray-800">Fuel Request</h1>
      <button @click="router.push({ name: 'fuel-create' })"
              class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium
                     rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
        <span class="text-base leading-none font-light">+</span> New
      </button>
    </div>

    <AppSpinner v-if="store.loading" />
    <AppError   v-else-if="store.error"   :message="store.error" />
    <AppEmpty   v-else-if="!store.records.length" message="No fuel requests found." :icon="EMPTY_ICON" />

    <!-- Data table -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th class="px-5 py-3 text-left font-medium">Request Name</th>
            <th class="px-5 py-3 text-left font-medium">Date</th>
            <th class="px-5 py-3 text-left font-medium">Requested By</th>
            <th class="px-5 py-3 text-left font-medium">Vehicle</th>
            <th class="px-5 py-3 text-left font-medium">Vehicle Type</th>
            <th class="px-5 py-3 text-left font-medium">Code</th>
            <th class="px-5 py-3 text-right font-medium">Beg. Fuel</th>
            <th class="px-5 py-3 text-right font-medium">Total Fuel</th>
            <th class="px-5 py-3 text-center font-medium">Actions</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <tr v-for="row in store.records" :key="row.id"
              class="hover:bg-gray-50 transition-colors">
            <td class="px-5 py-3.5 font-medium text-blue-600">{{ row.name }}</td>
            <td class="px-5 py-3.5 text-gray-600">{{ fmt(row.request_date) }}</td>
            <td class="px-5 py-3.5">{{ m2o(row.request_by_id) }}</td>
            <td class="px-5 py-3.5">{{ m2o(row.vehicle_id) }}</td>
            <td class="px-5 py-3.5">{{ m2o(row.vehicle_type_id) }}</td>
            <td class="px-5 py-3.5 text-gray-500">{{ row.vehicle_code || '-' }}</td>
            <td class="px-5 py-3.5 text-right tabular-nums">{{ num(row.beginning_fuel) }}</td>
            <td class="px-5 py-3.5 text-right tabular-nums font-medium">{{ num(row.total_fuel) }}</td>
            <td class="px-5 py-3.5">
              <div class="flex items-center justify-center gap-2">
                <button @click="router.push({ name: 'fuel-edit', params: { id: row.id } })"
                        class="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600
                               rounded-md hover:bg-blue-100 transition-colors">
                  Edit
                </button>
                <button @click="deleteId = row.id"
                        class="px-3 py-1 text-xs font-medium bg-red-50 text-red-500
                               rounded-md hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr class="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-700 text-sm">
            <td colspan="6" class="px-5 py-3 text-right text-xs text-gray-400 uppercase tracking-wide">Total</td>
            <td class="px-5 py-3 text-right tabular-nums">
              {{ store.records.reduce((s, r) => s + (r.beginning_fuel || 0), 0).toFixed(2) }}
            </td>
            <td class="px-5 py-3 text-right tabular-nums">
              {{ store.records.reduce((s, r) => s + (r.total_fuel || 0), 0).toFixed(2) }}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Delete confirm modal -->
    <Transition name="fade">
      <div v-if="deleteId"
           class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
           @click.self="deleteId = null">
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl mx-4">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-gray-800">Delete Record?</p>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="deleteId = null"
                    class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button @click="confirmDelete" :disabled="deleting"
                    class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700
                           disabled:opacity-50 transition-colors">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
