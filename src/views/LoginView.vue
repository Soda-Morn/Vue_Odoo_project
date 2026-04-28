<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">

      <h1 class="text-2xl font-semibold text-center text-gray-800 mb-6">Sign In</h1>

      <form @submit.prevent="handleLogin">

        <div class="flex flex-col gap-1 mb-4">
          <label for="username" class="text-sm font-medium text-gray-600">Username</label>
          <input id="username" v-model="form.username" type="text"
                 autocomplete="username" :disabled="loading"
                 class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none
                        focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
        </div>

        <div class="flex flex-col gap-1 mb-4">
          <label for="password" class="text-sm font-medium text-gray-600">Password</label>
          <input id="password" v-model="form.password" type="password"
                 autocomplete="current-password" :disabled="loading"
                 class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none
                        focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed" />
        </div>

        <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

        <button type="submit" :disabled="!isValid || loading"
                class="w-full py-2 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";



const router = useRouter();
const auth = useAuthStore();

const form = ref({ username: "", password: ""})
const error = ref("");
const loading = ref(false);

//computed: only true when both fields are filled
const isValid = computed(() => form.value.username.trim() && form.value.password.trim())

async function handleLogin() {
    if (!isValid.value) return
    loading.value = true;
    error.value = "";
    try {
        await auth.login(form.value.username, form.value.password)
        router.push({ name: 'fuel' })
    } catch (err) {
        error.value = err.message || "Login Failed. Please try again."
    } finally {
        loading.value = false; //alwasy runs, even if error
    }
}
</script>
