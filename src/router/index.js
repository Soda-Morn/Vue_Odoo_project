import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path:      '/login',
      name:      'login',
      component: () => import('@/views/LoginView.vue'),
      meta:      { guestOnly: true },
    },

    // Authenticated pages — wrapped in sidebar layout
    {
      path:      '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta:      { requiresAuth: true },
      redirect:  '/fuel',
      children: [
        // Fuel Request
        { path: 'fuel',          name: 'fuel',        component: () => import('@/views/fuel/FuelListView.vue') },
        { path: 'fuel/new',      name: 'fuel-create', component: () => import('@/views/fuel/FuelFormView.vue') },
        { path: 'fuel/:id/edit', name: 'fuel-edit',   component: () => import('@/views/fuel/FuelFormView.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
  const guestOnly    = to.matched.some(r => r.meta.guestOnly)
  if (requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (guestOnly    && auth.isAuthenticated)  return { name: 'fuel' }
})

export default router
