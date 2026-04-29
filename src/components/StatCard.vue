<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  color: { type: String, default: 'text-gray-800' },
})
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
    <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">{{ label }}</p>
    <p class="text-2xl font-bold tabular-nums" :class="color">{{ value }}</p>
  </div>
</template>
