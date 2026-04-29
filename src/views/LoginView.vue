<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router   = useRouter()
const auth     = useAuthStore()

const form     = ref({ username: '', password: '' })
const error    = ref('')
const loading  = ref(false)
const showPass = ref(false)

const isValid = computed(() => form.value.username.trim() && form.value.password.trim())

async function handleLogin() {
  if (!isValid.value) return
  loading.value = true
  error.value   = ''
  try {
    await auth.login(form.value.username, form.value.password)
    router.push({ name: 'fuel' })
  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">

    <!-- ── Left panel (brand) ───────────────────────────────────────────── -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950
                flex-col items-center justify-center p-12 overflow-hidden">

      <!-- Decorative circles -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full"></div>
      <div class="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-white/5 rounded-full"></div>
      <div class="absolute top-1/2 left-1/3 w-40 h-40 bg-blue-600/40 rounded-full blur-2xl"></div>

      <!-- Brand content -->
      <div class="relative z-10 max-w-sm text-center">

        <!-- Icon -->
        <div class="w-20 h-20 bg-white/10 border border-white/20 rounded-3xl flex items-center
                    justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm">
          <svg class="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <h1 class="text-3xl font-bold text-white mb-3 tracking-tight">Fleet Manager</h1>
        <p class="text-blue-200 text-base leading-relaxed">
          Manage fuel requests, track vehicles,<br>and monitor fleet operations — all in one place.
        </p>

        <!-- Feature pills -->
        <div class="flex flex-wrap justify-center gap-2 mt-10">
          <span v-for="f in ['Fuel Tracking', 'Vehicle Reports', 'Request Management']" :key="f"
                class="px-3.5 py-1.5 bg-white/10 border border-white/15 text-white/80 text-xs
                       font-medium rounded-full backdrop-blur-sm">
            {{ f }}
          </span>
        </div>
      </div>

    </div>

    <!-- ── Right panel (form) ───────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6">

      <div class="w-full max-w-sm">

        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center justify-center gap-2.5 mb-10">
          <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span class="text-base font-bold text-gray-800">Fleet Manager</span>
        </div>

        <!-- Heading -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p class="text-sm text-gray-500 mt-1">Sign in to your account to continue</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="Enter your username"
                autocomplete="username"
                :disabled="loading"
                class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm
                       text-gray-800 placeholder:text-gray-400 outline-none transition-all
                       focus:border-blue-500 focus:ring-3 focus:ring-blue-100
                       disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div class="relative">
              <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
                class="w-full pl-10 pr-11 py-2.5 bg-white border border-gray-200 rounded-xl text-sm
                       text-gray-800 placeholder:text-gray-400 outline-none transition-all
                       focus:border-blue-500 focus:ring-3 focus:ring-blue-100
                       disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <!-- Show / hide password -->
              <button
                type="button"
                @click="showPass = !showPass"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400
                       hover:text-gray-600 transition-colors"
              >
                <!-- Eye open -->
                <svg v-if="!showPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                           -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye closed -->
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
                           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
                           M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29
                           M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7
                           a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error -->
          <Transition name="shake">
            <div v-if="error"
                 class="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200
                        text-red-700 text-sm rounded-xl">
              <svg class="w-4 h-4 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ error }}
            </div>
          </Transition>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="!isValid || loading"
            class="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white
                   text-sm font-semibold rounded-xl shadow-sm transition-all
                   hover:bg-blue-700 active:scale-[0.98]
                   disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>

        </form>

        <!-- Footer -->
        <p class="text-center text-xs text-gray-400 mt-10">
          &copy; {{ new Date().getFullYear() }} Fleet Manager. All rights reserved.
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
.shake-enter-active { animation: shake 0.35s ease; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}
</style>
