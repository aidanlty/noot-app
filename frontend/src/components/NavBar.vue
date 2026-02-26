<template>
  <nav class="navbar navbar-expand-xl" role="navigation">
    <!-- Brand/Logo -->
    <router-link to="/" class="navbar-brand d-flex align-items-center gap-2">
      <span class="fs-4">
        {{ isStaff ? '⚙️' : '🔧' }}
      </span>
      <strong>
        {{ isStaff ? 'Precision Admin' : 'Precision Auto' }}
      </strong>
    </router-link>

    <!-- BOOTSTRAP HAMBURGER -->
    <button
      class="navbar-toggler d-xl-none"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNavbar"
      aria-controls="mainNavbar"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- COLLAPSIBLE NAV -->
    <div class="collapse navbar-collapse" id="mainNavbar">
      <ul class="navbar-nav me-auto mb-2 mb-xl-0">

        <!-- 🔹 PUBLIC MENU (GUEST) -->
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">🏠 Home</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/services" class="nav-link" active-class="active">🔧 Services</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/pricing" class="nav-link" active-class="active">💰 Pricing</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/gallery" class="nav-link" active-class="active">📸 Gallery</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/about" class="nav-link" active-class="active">👥 About</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/contact" class="nav-link" active-class="active">📞 Contact</router-link>
        </li>

        <!-- 🔹 CUSTOMER MENU -->
        <li v-if="isCustomer" class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">🏠 Home</router-link>
        </li>
        <li v-if="isCustomer" class="nav-item">
          <router-link to="/services" class="nav-link" active-class="active">🔧 Services</router-link>
        </li>

        <!-- 🔹 MANAGER MENU -->
        <li v-if="isManager" class="nav-item">
          <router-link to="/manager-dashboard" class="nav-link" active-class="active">
            🛠️ Manager Dashboard
          </router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/managerAppointments" class="nav-link" active-class="active">
            📊 Appointments
          </router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/jobCards" class="nav-link" active-class="active">
            👥 Job Cards
          </router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/manager-reports" class="nav-link" active-class="active">
            📈 Reports
          </router-link>
        </li>

        <!-- 🔹 TECHNICIAN MENU -->
        <li v-if="isTechnician" class="nav-item">
          <router-link to="/technician-dashboard" class="nav-link" active-class="active">
            🔧 Technician Dashboard
          </router-link>
        </li>
        <li v-if="isTechnician" class="nav-item">
          <router-link to="/technicianJobs" class="nav-link" active-class="active">
            ⚙️ My Jobs
          </router-link>
        </li>

        <!-- 🔹 MOBILE MENU ITEMS -->
        <!-- GUEST MOBILE -->
        <li v-if="!isLoggedIn" class="nav-item d-xl-none">
          <router-link to="/login" class="nav-link">🔐 Login</router-link>
        </li>

        <!-- CUSTOMER MOBILE -->
        <li v-if="isCustomer" class="nav-item d-xl-none">
          <router-link to="/book" class="nav-link book-service-mobile">📚 Book Service</router-link>
        </li>
        <li v-if="isCustomer" class="nav-item d-xl-none">
          <router-link to="/profile" class="nav-link profile-link-mobile">
            <img :src="profileIcon" alt="Profile" class="profile-icon-mobile" />
            Profile
          </router-link>
        </li>
        <li v-if="isCustomer" class="nav-item d-xl-none">
          <button class="nav-link logout-mobile" @click="$emit('logout')">🚪 Logout</button>
        </li>

        <!-- MANAGER MOBILE -->
        <li v-if="isManager" class="nav-item d-xl-none">
          <router-link to="/manager-dashboard" class="nav-link">Manager Dashboard</router-link>
        </li>
        <li v-if="isManager" class="nav-item d-xl-none">
          <router-link to="/profile" class="nav-link profile-link-mobile">
            <img :src="profileIcon" alt="Profile" class="profile-icon-mobile" />
            Profile
          </router-link>
        </li>
        <li v-if="isManager" class="nav-item d-xl-none">
          <button class="nav-link logout-mobile" @click="$emit('logout')">🚪 Logout</button>
        </li>
        <li v-if="isAdmin" class="nav-item d-xl-none">
          <router-link to="/admin-register-user" class="nav-link">
            Register Staff Account
          </router-link>
        </li>

        <!-- TECHNICIAN MOBILE -->
        <li v-if="isTechnician" class="nav-item d-xl-none">
          <router-link to="/technician-dashboard" class="nav-link">Tech Dashboard</router-link>
        </li>
        <li v-if="isTechnician" class="nav-item d-xl-none">
          <router-link to="/profile" class="nav-link profile-link-mobile">
            <img :src="profileIcon" alt="Profile" class="profile-icon-mobile" />
            Profile
          </router-link>
        </li>
        <li v-if="isTechnician" class="nav-item d-xl-none">
          <button class="nav-link logout-mobile" @click="$emit('logout')">🚪 Logout</button>
        </li>
      </ul>

      <!-- RIGHT SIDE ACTIONS - DESKTOP ONLY -->
      <div class="d-none d-xl-flex align-items-center gap-3">
        <!-- GUEST -->
        <router-link v-if="!isLoggedIn" to="/login" class="btn btn-outline-dark">
          🔐 Login
        </router-link>

        <!-- CUSTOMER DESKTOP -->
        <div v-if="isCustomer" class="d-flex align-items-center gap-2">
          <router-link to="/book" class="btn btn-warning fw-bold book-service-btn">
            📚 Book Service
          </router-link>
          <router-link to="/profile" class="profile-btn">
            <img :src="profileIcon" alt="Profile" class="profile-icon" />
            Profile
          </router-link>
          <button class="btn btn-danger" @click="$emit('logout')">🚪 Logout</button>
        </div>

        <!-- MANAGER DESKTOP -->
        <div v-if="isManager" class="d-flex align-items-center gap-2">
          <router-link to="/profile" class="profile-btn">
            <img :src="profileIcon" alt="Profile" class="profile-icon" />
            Profile
          </router-link>
          <li v-if="isAdmin" class="nav-item">
            <router-link to="/admin-register-user" class="nav-link" active-class="active">
              👤 Register Staff Account
            </router-link>
          </li>
          <button class="btn btn-danger" @click="$emit('logout')">🚪 Logout</button>
        </div>

        <!-- TECHNICIAN DESKTOP -->
        <div v-if="isTechnician" class="d-flex align-items-center gap-2">
          <router-link to="/profile" class="profile-btn">
            <img :src="profileIcon" alt="Profile" class="profile-icon" />
            Profile
          </router-link>
          <button class="btn btn-danger" @click="$emit('logout')">🚪 Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import profileIcon from '@/assets/profile.svg'



const props = defineProps<{
  user: {
    role: 'customer' | 'manager' | 'technician' | 'administrator'
    loggedIn: boolean
  } | null
}>()

const emit = defineEmits<{ logout: [] }>()

const isOpen = ref(false)

// Computed properties
const isLoggedIn = computed(() => props.user !== null)
const isCustomer = computed(() => props.user?.role === 'customer')
const isManager = computed(() =>
  props.user?.role === 'manager' || props.user?.role === 'administrator'
)
const isTechnician = computed(() => props.user?.role === 'technician')
const isAdmin = computed(() => props.user?.role === 'administrator')
const isStaff = computed(() => isManager.value || isTechnician.value || isAdmin.value)

const route = useRoute()
watch(() => route.fullPath, () => {
  const navbar = document.getElementById('mainNavbar')
  const toggler = document.querySelector('.navbar-toggler')
  
  if (navbar && navbar.classList.contains('show')) {
    navbar.classList.remove('show')
    toggler?.setAttribute('aria-expanded', 'false')
  }
})

</script>


<style scoped>
/* ALL YOUR EXISTING STYLES + MOBILE FIXES */

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(2rem, 6vw, 4rem);
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 4vw, 3rem);
  background: linear-gradient(135deg, #fdd701 0%, #fafa00 50%, #fea500 100%);
  color: rgb(0, 0, 0);
  box-shadow: 
    0 clamp(4px, 1vw, 8px) clamp(12px, 3vw, 25px) rgba(30,60,114,0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(20px);
  border-bottom: clamp(1px, 0.3vw, 2px) solid rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 100vw;      
  overflow-x: hidden;    
  box-sizing: border-box;
  padding-left: clamp(1rem, 4vw, 2rem);
  padding-right: clamp(1rem, 4vw, 2rem);
  flex-wrap: nowrap;
}

/* Brand - Responsive */
.nav-brand {
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.25rem);
  font-weight: 800;
  font-size: clamp(1rem, 2.5vw, 1.5rem);
}

.logo-icon {
  font-size: clamp(1.25rem, 3.5vw, 1.8rem);
  animation: pulse 2s infinite;
}

.logo-text {
  background: linear-gradient(135deg, #000000, #000000);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Navigation Menu - DESKTOP */
.nav-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: clamp(0.5rem, 1.5vw, 1.25rem);
  align-items: center;
  flex-shrink: 1;
  max-width: 50%;
}

/* Navigation Links */
.nav-link {
  color: rgba(0, 0, 0, 0.95);
  text-decoration: none;
  padding: clamp(0.5rem, 1.5vw, 0.875rem) clamp(1rem, 2.5vw, 1.75rem);
  border-radius: clamp(12px, 3vw, 24px);
  font-weight: 600;
  font-size: clamp(0.75rem, 1.5vw, 0.9rem);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  border: clamp(1px, 0.2vw, 2px) solid transparent;
  white-space: nowrap;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #000000, transparent);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.nav-link:hover {
  background: rgba(255,255,255,0.15);
  color: rgb(0, 0, 0);
  transform: translateY(-2px);
  border-color: rgba(0, 0, 0, 0.4);
  box-shadow: 0 clamp(6px, 2vw, 12px) clamp(15px, 4vw, 30px) rgba(255,215,0,0.3);
}

.nav-link:hover::after {
  width: 80%;
}

.nav-link.active {
  background: rgba(255,215,0,0.2);
  color: #000000;
  border-color: #000000;
  box-shadow: 
    0 clamp(4px, 1vw, 8px) clamp(10px, 2.5vw, 20px) rgba(255,215,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.3);
}

.nav-link.active::after {
  width: 100%;
  background: #ffd700;
}

/* Book Service Button - Bold Outline Desktop */
.book-service-btn {
  display: inline-flex !important;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem !important;
  border-radius: 30px !important;
  border: 2px solid #000 !important;
  background: rgba(255, 215, 0, 0.3) !important;
  backdrop-filter: blur(10px);
  font-weight: 600 !important;
  cursor: pointer;
  transition: all 0.3s ease !important;
  text-decoration: none !important;
  color: #000000 !important;
}

.book-service-btn:hover {
  background: rgba(255, 215, 0, 0.5) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2) !important;
  border-color: #000 !important;
}

/* Book Service Button - Mobile */
.book-service-mobile {
  background: linear-gradient(135deg, #ffd700, #ffed4a) !important;
  color: #000000 !important;
  border: 3px solid #000000 !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(255,215,0,0.4) !important;
}

.book-service-mobile:hover {
  background: #ffdb4d !important;
  transform: translateY(-2px) !important;
}

/* Mobile Profile Link */
.profile-link-mobile {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem !important;
}

.profile-icon-mobile {
  width: 18px;
  height: 18px;
}

/* Mobile Logout Button */
.logout-mobile {
  color: rgba(0, 0, 0, 0.95) !important;
  background: transparent !important;
  border: none !important;
  padding: 0.5rem 1rem !important;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
}

.logout-mobile:hover {
  background: rgba(220,53,69,0.2) !important;
  color: #c82333 !important;
}

/* Login Button */
.login-button {
  background: rgba(255, 255, 255, 0.1);
  color: rgb(0, 0, 0) !important;
  font-weight: 600;
  padding: clamp(0.6rem, 1.5vw, 0.85rem) clamp(1rem, 2vw, 1.5rem) !important;
  border: clamp(1.5px, 0.3vw, 2px) solid rgba(0, 0, 0, 0.5) !important;
  box-shadow: 0 clamp(4px, 1vw, 8px) clamp(10px, 2.5vw, 20px) rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: blur(10px);
}

.login-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgb(0, 0, 0) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 clamp(6px, 1.5vw, 12px) clamp(15px, 4vw, 30px) rgba(255, 255, 255, 0.3) !important;
}

/* CTA Button */
.cta-button {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  color: #000000 !important;
  font-weight: 700;
  padding: clamp(0.6rem, 1.5vw, 0.85rem) clamp(1rem, 2vw, 1.5rem) !important;
  font-size: clamp(0.85rem, 2vw, 1rem) !important;
  white-space: nowrap !important;
  min-width: max-content;
  line-height: 1.2 !important;
  box-shadow: 0 clamp(4px, 1vw, 8px) clamp(10px, 2.5vw, 20px) rgba(255,215,0,0.4) !important;
  border-radius: clamp(12px, 3vw, 24px) !important;
  border: 2px solid #000000 !important;
  flex-shrink: 0;
  min-width: 120px;
  white-space: nowrap;
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.05) !important;
  box-shadow: 0 clamp(10px, 2.5vw, 20px) clamp(25px, 6vw, 50px) rgba(255,215,0,0.6) !important;
}

/* User Actions */
.customer-actions, .staff-actions, .user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-greeting {
  font-weight: 600;
  color: rgba(0,0,0,0.9);
  font-size: 0.9rem;
}

.logout-button {
  background: rgba(220,53,69,0.9) !important;
  color: white !important;
  border: 2px solid rgba(220,53,69,0.5) !important;
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
}

.logout-button:hover {
  background: #c82333 !important;
}

.admin-link {
  border-left: 4px solid #28a745 !important;
  background: rgba(40, 167, 74, 0.1) !important;
}

.admin-link:hover {
  border-left-color: #20c997 !important;
  background: rgba(40, 167, 74, 0.2) !important;
}

.admin-cta {
  background: linear-gradient(135deg, #28a745, #20c997) !important;
  color: white !important;
  font-weight: 700 !important;
  padding: 0.6rem 1.5rem !important;
  border-radius: 12px !important;
  border: 2px solid #28a745 !important;
  box-shadow: 0 4px 12px rgba(40, 167, 74, 0.3) !important;
  text-decoration: none !important;
}

.admin-cta:hover {
  background: #218838 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(40, 167, 74, 0.4) !important;
}

/* Staff theme */
.navbar.staff-nav {
  background: linear-gradient(135deg, #28a745, #20c997, #17a2b8) !important;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  border: 2px solid #000;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: black;
}

.profile-icon {
  width: 20px;
  height: 20px;
}

.profile-btn:hover {
  background: rgba(255,255,255,0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.2);
}

</style>
