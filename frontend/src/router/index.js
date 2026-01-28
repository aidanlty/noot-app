import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// Keep your existing routes + add Dashboard
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/about',
    name: 'about',
    // Keep your code-splitting
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    // Lazy-loaded Dashboard (create when needed)
    component: () => import('../views/DashboardView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
