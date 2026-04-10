<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ── Hero entrance ────────────────────────────────────────────
const visible = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})

// ── Services scroll-triggered entrance (whileInView) ─────────
const servicesVisible = ref(false)
const servicesRef = ref<HTMLElement | null>(null)

// ── CTA scroll-triggered entrance ────────────────────────────
const ctaVisible = ref(false)
const ctaRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const observer = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { servicesVisible.value = true } },
    { threshold: 0.15 }
  )
  if (servicesRef.value) observer.observe(servicesRef.value)

  const ctaObserver = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { ctaVisible.value = true } },
    { threshold: 0.2 }
  )
  if (ctaRef.value) ctaObserver.observe(ctaRef.value)
})

const serviceItems = [
  { icon: 'wrench',    title: 'Engine Repair',  desc: 'Full diagnostics & rebuilds with OEM parts'  },
  { icon: 'tyre',      title: 'Tyre & Brake',   desc: 'Safety certified premium service'             },
  { icon: 'settings',  title: 'Full Servicing', desc: 'Oil, AC, and scheduled maintenance'           },
  { icon: 'car',       title: 'Body Work',      desc: 'Expert dent repair & precision painting'      },
]
</script>

<template>
  <div class="homepage">

    <!-- ─── HERO ─────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero-bg">
        <img src="@/assets/hero-car.jpg" alt="Luxury car" class="hero-img" />
        <div class="hero-overlay" />
      </div>

      <div class="hero-content" :class="{ 'is-visible': visible }">
        <p class="hero-eyebrow">Elevate Your Drive</p>
        <h1 class="hero-title">
          Expert Automotive<br>
          <span class="hero-accent">Mastery</span>
        </h1>
        <p class="hero-subtitle">
          Precision repairs, tailored upgrades,
          and unmatched craftsmanship for your luxury vehicle.
        </p>
        <div class="hero-buttons">
          <a href="#services" class="btn btn-primary">Explore Services</a>
          <a href="#contact"  class="btn btn-primary">Contact Us</a>
        </div>
      </div>

      <div class="scroll-indicator" :class="{ 'is-visible': visible }">
        <div class="scroll-line" />
      </div>
    </section>

    <!-- ─── SERVICES ──────────────────────────────────────────── -->
    <section id="services" class="services-preview">
      <div class="services-inner">
        <div class="services-header" :class="{ 'is-visible': servicesVisible }" ref="servicesRef">
          <p class="services-eyebrow">What We Do</p>
          <h2 class="services-title">Our Services</h2>
        </div>

        <div class="services-grid">
          <div
            v-for="(service, i) in serviceItems"
            :key="service.title"
            class="service-card"
            :class="{ 'is-visible': servicesVisible }"
            :style="{ '--delay': i * 0.15 + 's' }"
          >
            <div class="service-icon-wrap">
              <svg v-if="service.icon === 'wrench'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="service-icon">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
              <svg v-else-if="service.icon === 'tyre'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="service-icon">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else-if="service.icon === 'settings'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="service-icon">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else-if="service.icon === 'car'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="service-icon">
                <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h6l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/>
                <circle cx="7.5" cy="14.5" r="1.5"/>
                <circle cx="16.5" cy="14.5" r="1.5"/>
              </svg>
            </div>
            <h3 class="service-card-title">{{ service.title }}</h3>
            <p class="service-card-desc">{{ service.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── STATS ─────────────────────────────────────────────── -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">5000+</div>
            <p>Vehicles Serviced</p>
          </div>
          <div class="stat">
            <div class="stat-number">20+</div>
            <p>Years Exp.</p>
          </div>
          <div class="stat">
            <div class="stat-number">98%</div>
            <p>Client Satisfaction</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA ───────────────────────────────────────────────── -->
    <section id="contact" class="cta-banner">
      <div class="cta-inner" ref="ctaRef" :class="{ 'is-visible': ctaVisible }">
        <p class="cta-eyebrow">Ready to Start?</p>
        <h2 class="cta-title">Book Your Service</h2>
        <p class="cta-sub">Experience excellence with Porschify's tailored automotive care.</p>
        <router-link to="/login" class="cta-bin">Get a Quote</router-link>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ─── TOKENS ──────────────────────────────────────────────── */
:root {
  --gold:      #fdc601;
  --gold-glow: rgba(253, 198, 1, 0.55);
  --fg:        #ffffff;
  --fg-muted:  rgba(255,255,255,0.65);
  --bg-dark:   #0a0a0a;
}

/* ─── BASE ────────────────────────────────────────────────── */
.homepage {
  font-family: 'Barlow', system-ui, sans-serif;
  color: var(--fg);
  overflow-x: hidden;
  background: var(--bg-dark);
  padding: 0;
  margin: 0;
  width: 100%;
}

.container {
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
  width: 100%;
  box-sizing: border-box;
}

/* ─── HERO ────────────────────────────────────────────────── */
.hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100%;
  height: 100%;
}

.hero-img {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.55) 0%,
    rgba(10, 10, 10, 0.35) 45%,
    rgba(10, 10, 10, 1.00) 100%
  );
}

/* Content block — flattened nesting for Vue scoped compatibility */
.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 clamp(1.5rem, 5vw, 3rem);
  max-width: 900px;
  margin: 0 auto;
}

/* All direct children start invisible */
.hero-content > * {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

/* Staggered reveal on each child */
.hero-content.is-visible > *:nth-child(1) { opacity: 1; transform: none; transition-delay: 0.3s; }
.hero-content.is-visible > *:nth-child(2) { opacity: 1; transform: none; transition-delay: 0.5s; }
.hero-content.is-visible > *:nth-child(3) { opacity: 1; transform: none; transition-delay: 0.7s; }
.hero-content.is-visible > *:nth-child(4) { opacity: 1; transform: none; transition-delay: 0.9s; }

.hero-eyebrow {
  font-size: clamp(0.7rem, 1.5vw, 0.875rem);
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #fdc601;
  font-weight: 500;
  margin: 0 0 1.5rem;
}

.hero-title {
  font-size: clamp(2.8rem, 9vw, 6.5rem);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 2rem;
  font-family: Georgia, 'Times New Roman', Times, serif;
  color: #ffffff;
}

.hero-accent {
  color: #fdc601;
  text-shadow:
    0 0 40px var(--gold-glow),
    0 0 80px rgba(253, 198, 1, 0.25);
  font-weight: 700;
}

.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: rgba(255,255,255,0.75);
  font-weight: 300;
  line-height: 1.75;
  max-width: 600px;
  margin: 0 auto 3rem;
}

.hero-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}

@media (min-width: 640px) {
  .hero-buttons { flex-direction: row; }
}

/* ─── BUTTONS ─────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-sizing: border-box;
}

.btn-primary {
  background: transparent;
  color: #ffffff;
  border: 0.5px solid #ffffff;
}
.btn-primary:hover {
  background: #fdc601;
  transform: translateY(-2px);
  color: #000;
  box-shadow: 0 8px 25px rgba(253, 198, 1, 0.35);
}

/* ─── SCROLL INDICATOR ────────────────────────────────────── */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.8s ease 1.5s;
}
.scroll-indicator.is-visible { opacity: 1; }

.scroll-line {
  width: 1px;
  height: 4rem;
  background: linear-gradient(to bottom, transparent, rgba(253,198,1,0.5), #fdc601);
  animation: scroll-pulse 1.8s ease-in-out infinite;
}

@keyframes scroll-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ─── SERVICES ────────────────────────────────────────────── */
.services-preview {
  padding: clamp(4rem, 10vw, 8rem) 0;
  background: #000;
}

.services-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
}

.services-header {
  text-align: center;
  margin-bottom: clamp(3rem, 8vw, 5rem);
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.services-header.is-visible { opacity: 1; transform: none; }

.services-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #fdc601;
  font-weight: 500;
  margin: 0 0 1rem;
}

.services-title {
  font-size: clamp(2.5rem, 7vw, 4rem);
  font-weight: 800;
  font-family: Georgia, 'Times New Roman', Times, serif;
  letter-spacing: -0.02em;
  color: #ffffff;
  margin: 0;
  line-height: 1;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 640px)  { .services-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .services-grid { grid-template-columns: repeat(4, 1fr); } }

.service-card {
  background: #141414;
  border: 1px solid rgba(255,255,255,0.08);
  padding: clamp(2rem, 4vw, 2.5rem);
  cursor: pointer;
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 0.6s ease var(--delay, 0s),
    transform 0.6s ease var(--delay, 0s),
    border-color 0.5s ease,
    background 0.5s ease,
    box-shadow 0.5s ease;
}
.service-card.is-visible { opacity: 1; transform: none; }
.service-card:hover {
  border-color: rgba(253, 198, 1, 0.4);
  background: #161616;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.service-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  color: #fdc601;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}
.service-card:hover .service-icon-wrap { transform: scale(1.1); }

.service-icon { width: 100%; height: 100%; display: block; }

.service-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  font-family: Georgia, 'Times New Roman', Times, serif;
  color: #ffffff;
  margin: 0 0 0.75rem;
  letter-spacing: 0.01em;
}

.service-card-desc {
  color: #bdb9b9;
  font-size: 0.875rem;
  line-height: 1.65;
  margin: 0;
  font-weight: 300;
}

/* ─── STATS ───────────────────────────────────────────────── */
.stats {
  padding: clamp(3rem, 8vw, 6rem) 0;
  background: #141414;
  border-top: 0.5px solid #2c2b2b;
  border-bottom: 0.5px solid #2c2b2b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
}

.stat-number {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  font-family: Georgia, 'Times New Roman', Times, serif;
  color: #fdc601;
  line-height: 1;
  margin-bottom: 0.5rem;
  letter-spacing: -0.03em;
}

.stat p {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #ffffff;
  margin: 0;
}

/* ─── CTA ─────────────────────────────────────────────────── */
.cta-banner {
  padding: clamp(4rem, 10vw, 8rem) 0;
  background:#000;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.cta-bin {
  color: #fdc601;
}

.cta-inner {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  text-align: center;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.cta-inner.is-visible { opacity: 1; transform: none; }

.cta-eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #fdc601;
  font-weight: 500;
  margin: 0 0 1rem;
}

.cta-title {
  font-size: clamp(2.5rem, 7vw, 4rem);
  font-weight: 800;
  font-family: Georgia, 'Times New Roman', Times, serif;
  letter-spacing: -0.02em;
  line-height: 1;
  color: #ffffff;
  margin: 0 0 1.5rem;
}

.cta-sub {
  color:#bdb9b9;
  font-size: 1.3rem;
  font-weight: 400;
  margin: 0 0 2.5rem;
  font-family:Georgia, 'Times New Roman', Times, serif;
}

/* CTA button — sharp, gold fill, uppercase tracking */
.cta-btn {
  display: inline-block;
  padding: 1rem 3rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  background: #fdc601;
  color: #000000;
  text-decoration: none;
  border-radius: 0;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}
.cta-btn:hover {
  background:transparent;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(253, 198, 1, 0.3);
  color:#ffffff;
  text-decoration: none;
  border:0.5px solid #ffffff;
}

/* ─── MOBILE ──────────────────────────────────────────────── */
@media (max-width: 480px) {
  .container { padding: 0 1rem; }
  .hero-buttons .btn { width: 100%; max-width: 300px; }
}

@media (max-height: 500px) and (orientation: landscape) {
  .hero { min-height: 100vh; }
}
</style>
