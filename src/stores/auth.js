import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authAPI } from "@/api/odoo";

const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
    //ref() = reactive variable (re-render when changed)
    const user = ref(JSON.parse(localStorage.getItem(USER_KEY)) || null)

    //computed() = auto-recalculate when user changes
    const isAuthenticated = computed(() => !!user.value?.uid)

    async function login(username, password){
        const { data } = await authAPI.login(import.meta.env.VITE_ODOO_DB, username, password)
        if (!data.result?.uid) throw new Error('Invalid username or password')

        user.value = { uid: data.result.uid, name: data.result.name}
        localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    }

    async function logout(){
        await authAPI.logout()
        user.value = null
        localStorage.removeItem(USER_KEY)
    }

    //must return everything the component needs
    return {user, isAuthenticated, login, logout}
})