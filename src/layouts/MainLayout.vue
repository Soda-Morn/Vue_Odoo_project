<script setup>
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth  = useAuthStore()
const route = useRoute()

const navItems = [
  {
    name:  'fuel',
    label: 'Fuel Request',
    to:    '/fuel',
    icon:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

const isActive = (item) => route.name?.startsWith(item.name)
</script>

<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">

    <!-- Sidebar -->
    <aside class="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">

      <!-- Brand -->
      <div class="px-5 h-14 flex items-center border-b border-gray-100">
        <span class="text-sm font-bold text-gray-800 tracking-tight">Fleet Manager</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item)
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User + Logout -->
      <div class="px-3 py-3 border-t border-gray-100 space-y-1">
        <div class="px-3 py-1.5 text-xs text-gray-400 truncate">{{ auth.user?.name }}</div>
        <button
          @click="auth.logout()"
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium
                 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

    </aside>

    <!-- Page content -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>

  </div>
</template>
