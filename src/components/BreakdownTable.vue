<script setup>
defineProps({
  title:      { type: String, required: true },
  labelCol:   { type: String, default: 'Name' },
  rows:        { type: Array,  required: true },
  total:      { type: Number, required: true },
  valueColor: { type: String, default: 'text-blue-600' },
})

const num = (n) => n.toFixed(2)
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="px-5 py-3.5 border-b border-gray-100">
      <h2 class="text-sm font-semibold text-gray-700">{{ title }}</h2>
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
          <th class="px-5 py-3 text-left font-medium">{{ labelCol }}</th>
          <th class="px-5 py-3 text-right font-medium">Total Fuel (L)</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr v-for="r in rows" :key="r.label" class="hover:bg-gray-50 transition-colors">
          <td class="px-5 py-3 text-gray-700">{{ r.label }}</td>
          <td class="px-5 py-3 text-right tabular-nums font-medium" :class="valueColor">
            {{ num(r.total) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
          <td class="px-5 py-3 text-xs text-gray-400 uppercase tracking-wide text-right">Total</td>
          <td class="px-5 py-3 text-right tabular-nums" :class="valueColor">{{ num(total) }}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
