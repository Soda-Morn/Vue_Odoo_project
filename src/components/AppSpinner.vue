<script setup>
defineProps({ text: { type: String, default: '' } })
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24 gap-3">
    <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    <p v-if="text" class="text-sm text-gray-400">{{ text }}</p>
  </div>
</template>
