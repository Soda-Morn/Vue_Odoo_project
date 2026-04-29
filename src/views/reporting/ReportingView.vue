<script setup>
import { computed, onMounted, nextTick } from 'vue'
import { useReportingStore } from '@/stores/reporting'
import AppSpinner    from '@/components/AppSpinner.vue'
import AppError      from '@/components/AppError.vue'
import AppEmpty      from '@/components/AppEmpty.vue'
import StatCard      from '@/components/StatCard.vue'
import BarChart      from '@/components/BarChart.vue'
import BreakdownTable from '@/components/BreakdownTable.vue'

const store = useReportingStore()

onMounted(async () => {
  await store.fetchData()
  await nextTick()
})

const summaryCards = computed(() => [
  { label: 'Total Requests', value: store.summary.totalRequests,        color: 'text-gray-800' },
  { label: 'Total Fuel (L)', value: store.summary.totalFuel.toFixed(2), color: 'text-blue-600' },
  { label: 'Vehicles',       value: store.summary.totalVehicles,        color: 'text-emerald-600' },
  { label: 'Requesters',     value: store.summary.totalRequesters,      color: 'text-violet-600' },
])

const EMPTY_ICON = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-gray-800">Fuel Report</h1>
      <p class="text-sm text-gray-500 mt-0.5">Fuel usage breakdown by requester and vehicle</p>
    </div>

    <AppSpinner v-if="store.loading" />
    <AppError   v-else-if="store.error"          :message="store.error" />
    <AppEmpty   v-else-if="!store.records.length" message="No fuel data available." :icon="EMPTY_ICON" />

    <template v-else>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          v-for="card in summaryCards" :key="card.label"
          :label="card.label" :value="card.value" :color="card.color"
        />
      </div>

      <!-- Bar charts -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <BarChart
          title="Fuel by Requester"
          :items="store.byRequester"
          bg="rgba(59,130,246,0.75)"
          border="rgb(59,130,246)"
        />
        <BarChart
          title="Fuel by Vehicle"
          :items="store.byVehicle"
          bg="rgba(16,185,129,0.75)"
          border="rgb(16,185,129)"
        />
      </div>

      <!-- Breakdown tables -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BreakdownTable
          title="Requester Breakdown"
          labelCol="Requester"
          :rows="store.byRequester"
          :total="store.summary.totalFuel"
          valueColor="text-blue-600"
        />
        <BreakdownTable
          title="Vehicle Breakdown"
          labelCol="Vehicle"
          :rows="store.byVehicle"
          :total="store.summary.totalFuel"
          valueColor="text-emerald-600"
        />
      </div>

    </template>

  </div>
</template>
