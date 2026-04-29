<script setup>
defineProps({ message: { type: String, required: true } })
</script>

<template>
  <div class="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200
              text-red-700 text-sm rounded-xl">
    <svg class="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {{ message }}
  </div>
</template>
