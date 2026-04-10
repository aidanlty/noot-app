<template>
  <nav
    class="navbar navbar-expand-xl"
    :class="{ 'navbar-scrolled': scrolled }"
    role="navigation"
  >
    <!-- Brand/Logo -->
    <router-link :to="brandLink" class="navbar-brand">
      <strong>{{ isStaff ? 'PORSCHIFY ADMIN' : 'PORSCHIFY' }}</strong>
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
      <span class="toggler-bar"></span>
      <span class="toggler-bar"></span>
      <span class="toggler-bar"></span>
    </button>

    <!-- COLLAPSIBLE NAV -->
    <div class="collapse navbar-collapse" id="mainNavbar">
      <ul class="navbar-nav me-auto mb-2 mb-xl-0">

        <!-- PUBLIC MENU (GUEST) -->
        <!-- <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">Home</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/services" class="nav-link" active-class="active">Services</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/pricing" class="nav-link" active-class="active">Pricing</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/gallery" class="nav-link" active-class="active">Gallery</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/about" class="nav-link" active-class="active">About</router-link>
        </li>
        <li v-if="!isLoggedIn" class="nav-item">
          <router-link to="/contact" class="nav-link" active-class="active">Contact</router-link>
        </li> -->

        <!-- CUSTOMER MENU -->
        <li v-if="isCustomer" class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">Home</router-link>
        </li>
        <li v-if="isCustomer" class="nav-item">
          <router-link to="/services" class="nav-link" active-class="active">Services</router-link>
        </li>
        <li v-if="isCustomer" class="nav-item">
          <router-link to="/myBookings" class="nav-link" active-class="active">My Bookings</router-link>
        </li>

        <!-- MANAGER MENU -->
        <li v-if="isManager" class="nav-item">
          <router-link to="/manager-dashboard" class="nav-link" active-class="active">Manager Dashboard</router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/managerAppointments" class="nav-link" active-class="active">Appointments</router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/jobCards" class="nav-link" active-class="active">Job Cards</router-link>
        </li>
        <li v-if="isManager" class="nav-item">
          <router-link to="/managerRecords" class="nav-link" active-class="active">Records</router-link>
        </li>

        <!-- TECHNICIAN MENU -->
        <li v-if="isTechnician" class="nav-item">
          <router-link to="/technician-dashboard" class="nav-link" active-class="active">Technician Dashboard</router-link>
        </li>
        <li v-if="isTechnician" class="nav-item">
          <router-link to="/technicianJobs" class="nav-link" active-class="active">My Jobs</router-link>
        </li>

        <!-- ── MOBILE-ONLY ITEMS ── -->

        <!-- Guest mobile -->
        <li v-if="!isLoggedIn" class="nav-item d-xl-none mobile-divider">
          <router-link to="/login" class="nav-link mobile-link">Login</router-link>
        </li>

        <!-- Customer mobile -->
        <li v-if="isCustomer" class="nav-item d-xl-none mobile-divider">
          <router-link to="/book" class="nav-link mobile-book-btn">Book Service</router-link>
        </li>
        <li v-if="isCustomer" class="nav-item d-xl-none">
          <router-link to="/profile" class="nav-link mobile-link">
            <img :src="profileIcon" alt="Profile" class="mobile-profile-icon" /> Profile
          </router-link>
        </li>
        <li v-if="isCustomer" class="nav-item d-xl-none">
          <button class="nav-link mobile-logout" @click="$emit('logout')">Logout</button>
        </li>

        <!-- Manager mobile -->
        <li v-if="isManager" class="nav-item d-xl-none mobile-divider">
          <router-link to="/profile" class="nav-link mobile-link">
            <img :src="profileIcon" alt="Profile" class="mobile-profile-icon" /> Profile
          </router-link>
        </li>
        <li v-if="isAdmin" class="nav-item d-xl-none">
          <router-link to="/admin-register-user" class="nav-link mobile-link">Register Staff Account</router-link>
        </li>
        <li v-if="isManager" class="nav-item d-xl-none">
          <button class="nav-link mobile-logout" @click="$emit('logout')">Logout</button>
        </li>

        <!-- Technician mobile -->
        <li v-if="isTechnician" class="nav-item d-xl-none mobile-divider">
          <router-link to="/profile" class="nav-link mobile-link">
            <img :src="profileIcon" alt="Profile" class="mobile-profile-icon" /> Profile
          </router-link>
        </li>
        <li v-if="isTechnician" class="nav-item d-xl-none">
          <button class="nav-link mobile-logout" @click="$emit('logout')">Logout</button>
        </li>
      </ul>

      <!-- RIGHT SIDE ACTIONS — DESKTOP ONLY -->
      <div class="d-none d-xl-flex align-items-center gap-3">
        <!-- Guest -->
        <router-link v-if="!isLoggedIn" to="/login" class="btn-login">Login</router-link>

        <!-- Customer -->
        <template v-if="isCustomer">
          <router-link to="/book" class="btn-book">Book Service</router-link>
          <router-link to="/profile" class="btn-profile">
            <img :src="profileIcon" alt="Profile" class="profile-icon" /> Profile
          </router-link>
          <button class="btn-logout" @click="$emit('logout')">Logout</button>
        </template>

        <!-- Manager -->
        <template v-if="isManager">
          <router-link to="/profile" class="btn-profile">
            <img :src="profileIcon" alt="Profile" class="profile-icon" /> Profile
          </router-link>
          <router-link v-if="isAdmin" to="/admin-register-user" class="btn-login">Register Staff</router-link>
          <button class="btn-logout" @click="$emit('logout')">Logout</button>
        </template>

        <!-- Technician -->
        <template v-if="isTechnician">
          <router-link to="/profile" class="btn-profile">
            <img :src="profileIcon" alt="Profile" class="profile-icon" /> Profile
          </router-link>
          <button class="btn-logout" @click="$emit('logout')">Logout</button>
        </template>
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

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const isLoggedIn  = computed(() => props.user !== null)
const isCustomer  = computed(() => props.user?.role === 'customer')
const isManager   = computed(() => props.user?.role === 'manager' || props.user?.role === 'administrator')
const isTechnician = computed(() => props.user?.role === 'technician')
const isAdmin     = computed(() => props.user?.role === 'administrator')
const isStaff     = computed(() => isManager.value || isTechnician.value || isAdmin.value)

const brandLink = computed(() => {
  if (props.user?.role === 'manager' || props.user?.role === 'administrator') return '/manager-dashboard'
  if (props.user?.role === 'technician') return '/technician-dashboard'
  return '/'
})

const route = useRoute()
watch(() => route.fullPath, () => {
  const navbar  = document.getElementById('mainNavbar')
  const toggler = document.querySelector('.navbar-toggler')
  if (navbar?.classList.contains('show')) {
    navbar.classList.remove('show')
    toggler?.setAttribute('aria-expanded', 'false')
  }
})
</script>

<style scoped>
/* ─── BASE NAVBAR ─────────────────────────────────────────── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  padding: 0 clamp(1rem, 4vw, 3rem);
  height: 80px;

 
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.5s ease, border-color 0.5s ease, backdrop-filter 0.5s ease;
}


.navbar.navbar-scrolled {
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: rgba(0, 0, 0, 0.25);
}


.navbar-brand {
  font-size: clamp(1.3rem, 2.5vw, 1.75rem);
  font-weight: 800;
  font-family:Georgia, 'Times New Roman', Times, serif;
  color: #eec10e !important;
  text-decoration: none !important;
  flex-shrink: 0;
}

.navbar-brand:hover {
  color: #ffffff !important;
  background-color:transparent;
}


.nav-link {
  color: rgba(255, 255, 255, 0.7) !important;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  border: none;
  background: transparent;
  transition: color 0.3s ease;
  white-space: nowrap;
  position: relative;
}

/* underline-grow effect */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background:#fdc601;
  transition: width 0.3s ease;
}

.nav-link:hover {
  color:#fdc601 !important;
  background: transparent;
  transform: none;
  box-shadow: none;
}

.nav-link:hover::after {
  width: 80%;
}

.nav-link.active {
  color:#eec10e !important;
  background: transparent;
}

.nav-link.active::after {
  width: 100%;
}

/* ─── HAMBURGER ───────────────────────────────────────────── */
.navbar-toggler {
  background: transparent;
  border: 2px solid #000;
  border-radius: 6px;
  padding: 6px 9px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggler-bar {
  display: block;
  width: 20px;
  height: 2px;
  background: #000;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* ─── DESKTOP CTA BUTTONS ─────────────────────────────────── */
.btn-book {
  padding: 0.55rem 1.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: #000;
  color: #fdc601 !important;
  border: 2px solid #000;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease;
  border-radius: 0;
  white-space: nowrap;
}

.btn-book:hover {
  background: #222;
  color: #fdc601 !important;
  text-decoration: none;
}

.btn-login {
  padding: 0.55rem 1.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background:#eec10e;
  color:#000 !important;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 0;
  white-space: nowrap;
}

.btn-login:hover {
  background:#ffffff;
  text-decoration: none;
  color:#000 !important;
}

.btn-logout {
  padding: 0.55rem 1.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background:#fdc601;
  color: rgba(0,0,0,0.7) !important;
  border: 2px solid rgba(0,0,0,0.4);
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 0;
  white-space: nowrap;
}

.btn-logout:hover {
  background: rgba(220, 53, 69, 0.12);
  border-color: #c82333;
  color: #c82333 !important;
}

.btn-profile {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.5rem 1.1rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background:#fdc601;
  color: #000 !important;
  border: 2px solid rgba(0,0,0,0.5);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.25s ease;
  border-radius: 0;
  white-space: nowrap;
}

.btn-profile:hover {
  background: transparent;
  border-color:#fdc601;
  text-decoration: none;
  color:#fdc601 !important;
}

.profile-icon {
  width: 18px;
  height: 18px;
}

/* ─── MOBILE MENU (collapsed panel) ──────────────────────── */
.navbar-collapse {
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.5s ease, border-color 0.5s ease, backdrop-filter 0.5s ease;
  font-family:Georgia, 'Times New Roman', Times, serif;

}


.navbar-collapse-scrolled {
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: rgba(0, 0, 0, 0.25);
}

/* push mobile items down from the desktop row */
@media (max-width: 1199px) {
  .navbar-nav {
    padding: 0.5rem 0 1rem;
  }
}

.mobile-divider {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.mobile-link {
  font-size: 0.82rem !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  color: rgba(0,0,0,0.75) !important;
  padding: 0.65rem 1rem !important;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-profile-icon {
  width: 18px;
  height: 18px;
}

.mobile-book-btn {
  display: inline-block;
  margin: 0.5rem 1rem !important;
  padding: 0.65rem 1.5rem !important;
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.15em !important;
  text-transform: uppercase !important;
  text-align: center;
  background: #000 !important;
  color: #fdc601 !important;
  border: 2px solid #000 !important;
  text-decoration: none;
}

.mobile-logout {
  width: 100%;
  text-align: left;
  background: transparent !important;
  border: none !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.12em !important;
  text-transform: uppercase !important;
  color: rgba(0,0,0,0.65) !important;
  padding: 0.65rem 1rem !important;
  cursor: pointer;
  transition: color 0.2s ease;
}

.mobile-logout:hover {
  color: #c82333 !important;
}
</style>