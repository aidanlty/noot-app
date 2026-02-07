<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Auth state
const user = ref<{
  email: string
  role: 'customer' | 'staff'
  loggedIn: boolean
} | null>(null)

const showLogoutConfirm = ref(false)  // 👈 NEW: Confirmation dialog

onMounted(() => {
  const storedUser = localStorage.getItem('currentUser')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  }
})

const handleLogin = (formData: { role: string; email: string; password: string }) => {
  setTimeout(() => {
    user.value = {
      email: formData.email,
      role: formData.role as 'customer' | 'staff',
      loggedIn: true
    }
    localStorage.setItem('currentUser', JSON.stringify(user.value))
    console.log('Login successful:', user.value)
  }, 1500)
}

const handleRegister = (formData: { email: string; password: string; confirmPassword: string }) => {
  setTimeout(() => {
    console.log('Registration successful:', formData.email)
  }, 1500)
}

// 👈 NEW: Logout with confirmation
const confirmLogout = () => {
  user.value = null
  localStorage.removeItem('currentUser')
  showLogoutConfirm.value = false
  console.log('Logged out successfully')
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const requestLogout = () => {
  showLogoutConfirm.value = true  // Show confirmation dialog
}
const logout = () => {
  user.value = null
  localStorage.removeItem('currentUser')
}

</script>

<template>
  <div class="app-container">
    <!-- Navbar ALWAYS shows -->
    <NavBar 
      :user="user"
      :class="{ 'staff-nav': user?.role === 'staff' }"
      @logout="logout"
    />
    
    <!-- 👈 FIXED: RouterView ALWAYS shows, LoginView is a ROUTE -->
    <main class="main-content">
      <RouterView 
        @login="handleLogin"
        @register="handleRegister" />
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
