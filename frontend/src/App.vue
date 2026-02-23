<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import NavBar from './components/NavBar.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 🔹 GLOBAL AUTH STATE (App.vue manages this)
const user = ref<{
  email: string
  role: 'customer' | 'manager' | 'technician'
  loggedIn: boolean
} | null>(null)

const router = useRouter()
const showLogoutConfirm = ref(false)

// 🔹 CHECK PERSISTED TOKEN ON LOAD
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      // Verify token with backend
      const res = await fetch('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        user.value = {
          email: data.email,
          role: data.role,
          loggedIn: true
        }
      } else {
        localStorage.removeItem('token')
      }
    } catch {
      localStorage.removeItem('token')
    }
  }
})

// 🔹 LOGIN HANDLER (called by LoginView.vue via emit)
const handleLogin = (userData: { email: string; role: 'customer' | 'manager' | 'technician'; loggedIn: boolean }) => {
  user.value = userData
  // Token already saved by LoginView.vue
  console.log('✅ Global login state updated:', user.value)
}

// 🔹 REGISTER HANDLER (LoginView.vue emits this after successful register)
const handleRegister = (userData: { email: string; role: 'customer' | 'manager' | 'technician'; loggedIn: boolean }) => {
  user.value = userData
  console.log('✅ Global register state updated:', user.value)
}

// 🔹 LOGOUT (called by NavBar.vue)
const logout = async () => {
  const token = localStorage.getItem('token')
  
  if (token) {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (e) {
      console.log('Logout API failed (ok for demo)')
    }
  }
  
  // Clear everything
  localStorage.removeItem('token')
  user.value = null
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <!-- Navbar ALWAYS visible -->
    <NavBar 
      :user="user"
      :class="{ 'staff-nav': user?.role === 'manager' || user?.role === 'technician' }"
      @logout="logout"
    />
    
    <!-- RouterView shows LoginView.vue, dashboards, etc. -->
    <main class="main-content">
      <RouterView 
        @login="handleLogin"
        @register="handleRegister"
      />
    </main>
  </div>
</template>


<style scoped>
/* Your existing styles - unchanged */
.page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
  color: #1e3c72;
}

.app-container {
  max-width: 100vw !important;
  width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  left: 0 !important;
  background-color: grey;
}

.main-content {
  padding: clamp(1.5rem, 4vw, 3rem);
  margin: 0 auto;
  max-width: 1400px;
  min-height: calc(100vh - 80px);
}
</style>
