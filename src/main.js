import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { api } from './api/odoo'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const USER_KEY = 'auth_user'

api.interceptors.response.use(
    (response) => {
        const error = response.data?.error
        const isSessionExpired =
            error?.data?.name === 'odoo.http.SessionExpiredException' ||
            error?.message === 'Odoo Session Expired' ||
            error?.code === 100
        if (isSessionExpired) {
            localStorage.removeItem(USER_KEY)
            router.push({ name: 'login' })
        }
        return response
    },
    (networkError) => {
        if (networkError.response?.status === 401) {
            localStorage.removeItem(USER_KEY)
            router.push({ name: 'login' })
        }
        return Promise.reject(networkError)
    }
)

app.mount('#app')
