<script setup>
defineProps({
  message: { type: String, default: 'No records found.' },
  icon:    {
    type:    String,
    default: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
})
</script>

<template>
  <div class="flex flex-col items-center py-24 text-gray-400">
    <svg class="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icon" />
    </svg>
    <p class="text-sm">{{ message }}</p>
  </div>
</template>
