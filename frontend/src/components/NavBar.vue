<template>
  <nav class="navbar" role="navigation">
    <!-- Brand/Logo -->
    <div class="nav-brand">
      <div class="logo-container">
        <span class="logo-icon">{{ isStaff ? '⚙️' : '🔧' }}</span>
        <span class="logo-text">
          {{ isStaff ? 'Precision Admin' : 'Precision Auto' }}
        </span>
      </div>
    </div>
    
    <!-- SINGLE MENU - Desktop + Mobile (handles ALL links + actions) -->
    <ul class="nav-menu" :class="{ open: isOpen }">
      <!-- PUBLIC MENU (Guest/Customer) -->
      <li v-if="!isStaff">
        <router-link to="/" class="nav-link" active-class="active">🏠 Home</router-link>
      </li>
      <li v-if="!isStaff">
        <router-link to="/services" class="nav-link" active-class="active">🔧 Services</router-link>
      </li>
      <li v-if="!isStaff">
        <router-link to="/pricing" class="nav-link" active-class="active">💰 Pricing</router-link>
      </li>
      <li v-if="!isStaff">
        <router-link to="/gallery" class="nav-link" active-class="active">📸 Gallery</router-link>
      </li>
      <li v-if="!isStaff">
        <router-link to="/about" class="nav-link" active-class="active">👥 About</router-link>
      </li>
      <li v-if="!isStaff">
        <router-link to="/contact" class="nav-link" active-class="active">📞 Contact</router-link>
      </li>
      
      <!-- STAFF ADMIN MENU -->
      <li v-if="isStaff">
        <router-link to="/admin" class="nav-link admin-link" active-class="active">
          🛠️ Admin Dashboard
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/staff-dashboard" class="nav-link admin-link" active-class="active">
          📊 Appointments
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/staff-customers" class="nav-link admin-link" active-class="active">
          👥 Customers
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/reports" class="nav-link admin-link" active-class="active">
          📈 Reports
        </router-link>
      </li>

      <!-- 👈 MOBILE ACTIONS - APPEAR IN HAMBURGER MENU -->
      <!-- <li v-if="!isLoggedIn" class="mobile-action">
        <router-link to="/login" class="login-button full-width">🔐 Login</router-link>
      </li> -->
      
      <!-- CUSTOMER ACTIONS -->
      <!-- <li v-if="isLoggedIn && !isStaff" class="mobile-action">
        <div class="customer-actions">
          <router-link to="/book" class="cta-button full-width">Book Service</router-link>
          <div class="user-section">
            <span class="user-greeting">👋 {{ userEmail }}</span>
            <button class="logout-button full-width" @click="$emit('logout')">🚪 Logout</button>
          </div>
        </div>
      </li> -->
      
      <!-- STAFF ACTIONS -->
      <!-- <li v-if="isStaff" class="mobile-action">
        <div class="staff-actions">
          <router-link to="/admin" class="admin-cta full-width">Admin Panel</router-link>
          <div class="user-section">
            <span class="user-greeting">{{ userEmail }} (Staff)</span>
            <button class="logout-button full-width" @click="$emit('logout')">🚪 Logout</button>
          </div>
        </div>
      </li> -->
    </ul>

    <!-- 👈 DESKTOP ACTIONS ONLY -->
    <div class="nav-actions-desktop">
      <!-- GUEST: Login -->
      <router-link v-if="!isLoggedIn" to="/login" class="login-button">🔐 Login</router-link>
      
      <!-- CUSTOMER -->
      <div v-if="isLoggedIn && !isStaff" class="customer-actions">
        <router-link to="/book" class="cta-button">Book Service</router-link>
        <span class="user-greeting">👋 {{ userEmail }}</span>
        <button class="logout-button" @click="$emit('logout')">🚪 Logout</button>
      </div>
      
      <!-- STAFF -->
      <div v-if="isStaff" class="staff-actions">
        <router-link to="/admin" class="admin-cta">Admin Panel</router-link>
        <span class="user-greeting">{{ userEmail }} (Staff)</span>
        <button class="logout-button" @click="$emit('logout')">🚪 Logout</button>
      </div>
    </div>

    <!-- Mobile Hamburger -->
    <button class="hamburger" @click="toggleMenu" :class="{ open: isOpen }" :aria-expanded="isOpen">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  user: {
    email: string
    role: 'customer' | 'staff'
    loggedIn: boolean
  } | null
}>()

const emit = defineEmits<{ logout: [] }>()

const isOpen = ref(false)

// Computed properties
const isLoggedIn = computed(() => props.user !== null)
const isStaff = computed(() => props.user?.role === 'staff')
const userEmail = computed(() => props.user?.email || '')

// Toggle mobile menu
const toggleMenu = () => {
  isOpen.value = !isOpen.value
  document.body.style.overflow = isOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isOpen.value = false
  document.body.style.overflow = ''
}

// Close menu on route change / login
watch(() => props.user, closeMenu, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', closeMenu)
  // Close on route change
  const router = useRouter()
  router.afterEach(closeMenu)
})

onUnmounted(() => {
  window.removeEventListener('resize', closeMenu)
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

/* 👈 NEW: Desktop actions container */
.nav-actions-desktop {
  display: none;
  flex-shrink: 0;
  gap: 1rem;
  align-items: center;
}

/* 👈 FIXED HAMBURGER - ALWAYS CORRECT */
.hamburger {
  display: flex;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
  gap: 4px;
  z-index: 1001;
}

.hamburger span {
  width: clamp(20px, 5vw, 28px);
  height: clamp(2px, 0.6vw, 3px);
  background: #000;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

/* ============================================================================ */
/* MOBILE - THE KEY FIXES */
/* ============================================================================ */

@media (max-width: 1024px) {
  /* 👈 FORCE FULL SCREEN - NOTHING CAN OVERRIDE */
  .nav-menu {
    position: fixed !important;
    inset: 0 !important;  /* top/right/bottom/left = 0 */
    width: 100vw !important;
    height: 100vh !important;
    
    background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%) !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    padding: 120px 30px 30px !important;
    margin: 0 !important;
    gap: 25px !important;
    
    /* HIDDEN */
    transform: translateX(-100%) !important;
    opacity: 0 !important;
    visibility: hidden !important;
    
    z-index: 10000 !important;
    overflow-y: auto !important;
    backdrop-filter: blur(20px) !important;
  }

  .nav-menu.open {
    transform: translateX(0) !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* 👈 BUTTONS TAKE FULL WIDTH */
  .nav-menu li {
    width: 100% !important;
    max-width: 450px !important;
  }

  .nav-menu .nav-link,
  .nav-menu .login-button,
  .nav-menu .cta-button {
    width: 100% !important;
    padding: 25px 40px !important;
    font-size: 1.6rem !important;
    text-align: center !important;
    color: white !important;
    background: rgba(255,255,255,0.15) !important;
    border: 2px solid transparent !important;
    border-radius: 25px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
  }

  .nav-menu .nav-link:hover,
  .nav-menu .login-button:hover,
  .nav-menu .cta-button:hover {
    background: rgba(255,215,0,0.3) !important;
    color: #000 !important;
    border-color: #ffd700 !important;
    transform: translateY(-3px) !important;
  }

  /* 👈 USER SECTIONS FULL WIDTH */
  .nav-menu .customer-actions,
  .nav-menu .staff-actions {
    width: 100% !important;
    padding: 40px !important;
    background: rgba(255,255,255,0.2) !important;
    border-radius: 30px !important;
    flex-direction: column !important;
    gap: 20px !important;
  }

  .nav-menu .user-greeting {
    font-size: 1.4rem !important;
    color: white !important;
    text-align: center !important;
  }

  .nav-menu .logout-button {
    width: 100% !important;
    padding: 20px !important;
    font-size: 1.3rem !important;
  }

  /* HIDE DESKTOP */
  .nav-actions-desktop,
  .nav-actions {
    display: none !important;
  }

  .hamburger {
    display: flex !important;
    z-index: 10001 !important;
  }
}

/* 👈 DESKTOP NORMAL */
@media (min-width: 1025px) {
  .nav-menu {
    position: static !important;
    width: auto !important;
    height: auto !important;
    transform: none !important;
    opacity: 1 !important;
    z-index: auto !important;
  }
}

/* DESKTOP: Normal layout */
@media (min-width: 1025px) {
  .nav-actions-desktop {
    display: flex !important;
  }
  .hamburger {
    display: none !important;
  }
  .nav-menu {
    position: static !important;
    transform: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    background: none !important;
    flex-direction: row !important;
    padding: 0 !important;
    max-width: 50% !important;
  }
}

/* Staff theme */
.navbar.staff-nav {
  background: linear-gradient(135deg, #28a745, #20c997, #17a2b8) !important;
}
</style>
