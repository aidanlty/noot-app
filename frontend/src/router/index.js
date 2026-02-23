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
  { path: '/profile', name: 'profile', component: () => import('../views/Profile.vue') },
  // 🔹 MANAGER ROUTES
  {
    path: '/manager-dashboard',
    name: 'managerDashboard',
    meta: { requiresAuth: true, roles: ['manager'] },
    component: () => import('../views/ManagerDashboard.vue'), // CREATE THIS
  },
  {
    path: '/manager-customers',
    name: 'managerCustomers',
    meta: { requiresAuth: true, roles: ['manager'] },
    component: () => import('../views/ManagerCustomers.vue'), // CREATE THIS
  },
  {
    path: '/manager-reports',
    name: 'managerReports',
    meta: { requiresAuth: true, roles: ['manager'] },
    component: () => import('../views/ManagerReports.vue'), // CREATE THIS
  },

  // 🔹 TECHNICIAN ROUTES
  {
    path: '/technician-dashboard',
    name: 'technicianDashboard',
    meta: { requiresAuth: true, roles: ['technician'] },
    component: () => import('../views/TechnicianDashboard.vue'), // CREATE THIS
  },
  {
    path: '/technician-jobs',
    name: 'technicianJobs',
    meta: { requiresAuth: true, roles: ['technician'] },
    component: () => import('../views/TechnicianJobs.vue'), // CREATE THIS
  },
  // 🔹 SHARED STAFF ROUTES (manager + technician)
  {
    path: '/staffAppointments',
    name: 'staffAppointments',
    meta: { requiresAuth: true, roles: ['manager', 'technician'] },
    component: () => import('../views/StaffAppointments.vue'),
  },
  {
    path: '/jobCards',
    name: 'jobCards',
    meta: { requiresAuth: true, roles: ['manager', 'technician'] },
    component: () => import('../views/JobCards.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 🔹 GLOBAL ROUTE GUARDS
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')

  // Public routes: always allow
  if (!to.meta.requiresAuth) {
    return next()
  }

  // No token? Redirect to login
  if (!token) {
    return next('/login')
  }

  // Verify token + role with backend
  try {
    const res = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ path: to.path }),
    })

    if (!res.ok) {
      localStorage.removeItem('token')
      return next('/login')
    }

    const data = await res.json()
    const userRole = data.role // 'customer' | 'manager' | 'technician'

    // Check if user has required role for this route
    if (to.meta.roles && !to.meta.roles.includes(userRole)) {
      return next('/unauthorized') // or '/login'
    }

    // Success: let them through
    next()
  } catch (error) {
    console.error('Auth check failed:', error)
    localStorage.removeItem('token')
    next('/login')
  }
})

export default router
