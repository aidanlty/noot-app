<template>
  <nav class="navbar" role="navigation">
    <!-- Brand/Logo -->
    <div class="nav-brand">
      <div class="logo-container">
        <span class="logo-icon">🔧</span>
        <span class="logo-text">Precision Auto</span>
      </div>
    </div>
    
    <!-- Desktop Menu -->
    <ul class="nav-menu" :class="{ open: isOpen }">
      <li>
        <router-link to="/" class="nav-link" active-class="active">
          🏠 Home
        </router-link>
      </li>
      <li>
        <router-link to="/services" class="nav-link" active-class="active">
          🔧 Services
        </router-link>
      </li>
      <li>
        <router-link to="/pricing" class="nav-link" active-class="active">
          💰 Pricing
        </router-link>
      </li>
      <li>
        <router-link to="/gallery" class="nav-link" active-class="active">
          📸 Gallery
        </router-link>
      </li>
      <li>
        <router-link to="/about" class="nav-link" active-class="active">
          👥 About
        </router-link>
      </li>
      <li>
        <router-link to="/contact" class="nav-link" active-class="active">
          📞 Contact
        </router-link>
      </li>
    </ul>

    <div class="nav-actions">
      <router-link to="/book" class="cta-button">Book Service</router-link>
      <router-link to="/login" class="login-button">🔐 Login</router-link>
    </div>

    <!-- Mobile Hamburger -->
    <button 
      class="hamburger" 
      @click="toggleMenu" 
      :aria-expanded="isOpen"
      aria-label="Toggle navigation menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOpen = ref(false)
let scrollHandler: (() => void) | null = null

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  document.body.style.overflow = isOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isOpen.value = false
  document.body.style.overflow = ''
}

// Auto-close on route change/resize
onMounted(() => {
  scrollHandler = () => closeMenu()
  window.addEventListener('resize', closeMenu)
})

onUnmounted(() => {
  window.removeEventListener('resize', closeMenu)
  closeMenu()
})
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(2rem, 6vw, 4rem);  /* logo → menu → actions */
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
  flex-wrap: nowrap;            /* Prevent wrapping */
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

/* Navigation Menu */
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

.login-button.active {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: #ffd700 !important;
  color: #ffd700 !important;
}

/* CTA Button */
.nav-actions {
  display: none;
  flex-shrink: 0;
}

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
html, body {
  overflow-x: hidden;    /* Body never scrolls horizontally */
  width: 100%;
  margin: 0;
  padding: 0;
}

@media (max-width: 1600px) {
  /* FULL reset for all nav items in mobile menu */
  .nav-menu a,
  .nav-menu .nav-link,
  .nav-menu .cta-button,
  .nav-menu .login-button {
    background: transparent !important;
    background-color: transparent !important;
    color: rgb(0, 0, 0) !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0.5rem 1rem !important;
    font-size: 1.1rem !important;
    font-weight: 600;
    transform: none !important;
  }

  /* Hover / active states — text only */
  .nav-menu a:hover,
  .nav-menu a.active {
    color: #000000 !important;
    background: transparent !important;
    border: 2px solid #000000 !important;
    border-radius: clamp(12px, 3vw, 24px) !important;
    padding: 0.5rem 1.25rem !important;
  }

  /* Remove pseudo elements */
  .nav-menu a::after {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .cta-button {
    padding: 0.75rem 1.75rem !important;  /* Fixed padding */
    font-size: 1rem !important;          /* Consistent size */
    min-height: 44px;                    /* Touch-friendly */
  }
}
@media (max-width: 1024px) {
  .nav-actions {
    display: none !important;  /* Force hide on mobile */
  }

}
.cta-button:hover {
  transform: translateY(-3px) scale(1.05) !important;
  box-shadow: 0 clamp(10px, 2.5vw, 20px) clamp(25px, 6vw, 50px) rgba(255,215,0,0.6) !important;
}

/* Hamburger */
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
  background: white;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

@media (min-width: 1024px) {
  .nav-actions {
    display: flex !important;      /* SHOW both buttons */
    gap: clamp(0.5rem, 1.5vw, 1rem);  /* Space between CTA/Login */
    align-items: center;
  }
  .hamburger {
    display: none !important;      /* Hide hamburger */
  }
  .nav-menu {
    gap: clamp(1rem, 2vw, 1.5rem); /* Nav link spacing */
  }
}

/* Mobile Menu */
@media (max-width: 1024px) {
  .nav-actions {
    display: none;
  }
  
  .hamburger {
    display: flex;
  }
  
  .nav-menu {
    position: fixed;
    top: clamp(70px, 15vw, 90px);
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: clamp(2rem, 8vw, 4rem) 2rem;
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    gap: clamp(1rem, 3vw, 1.5rem);
    backdrop-filter: blur(20px);
    border-top: clamp(2px, 0.5vw, 4px) solid rgba(255,215,0,0.3);
    overflow-y: auto;
  }
  
  .nav-menu.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  .hamburger span:nth-child(1).open {
    transform: rotate(45deg) translate(6px, 6px);
  }
  
  .hamburger span:nth-child(2).open {
    opacity: 0;
  }
  
  .hamburger span:nth-child(3).open {
    transform: rotate(-45deg) translate(6px, -5px);
  }
}

/* Tablet/Desktop CTA */
@media (min-width: 1024px) {
  .nav-actions {
    display: block;
  }
  
  .nav-menu {
    gap: clamp(1rem, 2.5vw, 2rem);
  }
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.nav-link, .cta-button {
  animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
