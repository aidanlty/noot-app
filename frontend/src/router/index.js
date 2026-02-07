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
  { path: '/services', name: 'services', component: () => import('../views/ServicesView.vue') },
  { path: '/pricing', name: 'pricing', component: () => import('../views/PricingView.vue') },
  { path: '/gallery', name: 'gallery', component: () => import('../views/GalleryView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
  { path: '/book', name: 'book', component: () => import('../views/BookingView.vue') },
  { path: '/myBookings', name: 'customerBookings', component: () => import('../views/customerBookings.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
