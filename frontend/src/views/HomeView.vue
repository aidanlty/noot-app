<script setup lang="ts">
// Responsive utilities
</script>

<template>
  <div class="homepage">
    <!-- Hero Section - Fully Responsive -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          Precision Auto Repair<br>
          <span class="highlight">Expert Mechanics</span>
        </h1>
        <p class="hero-subtitle">
          20+ years serving Singapore. Certified repairs, fast service.
        </p>
        <div class="hero-buttons">
          <a href="#services" class="btn btn-primary">Book Now</a>
          <a href="#contact" class="btn btn-secondary">Call Us</a>
        </div>
      </div>
    </section>

    <!-- Services - Responsive Grid -->
    <section id="services" class="services-preview">
      <div class="container">
        <h2 class="section-title">Our Services</h2>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">🔧</div>
            <h3>Engine Repair</h3>
            <p>Full diagnostics & rebuilds</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🛞</div>
            <h3>Tyre & Brake</h3>
            <p>Safety certified service</p>
          </div>
          <div class="service-card">
            <div class="service-icon">⚙️</div>
            <h3>Full Servicing</h3>
            <p>Oil, AC, maintenance</p>
          </div>
          <div class="service-card">
            <div class="service-icon">🚗</div>
            <h3>Body Work</h3>
            <p>Dents & painting</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats - Auto Responsive -->
    <section class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">5000+</div>
            <p>Vehicles Fixed</p>
          </div>
          <div class="stat">
            <div class="stat-number">20+</div>
            <p>Years Exp.</p>
          </div>
          <div class="stat">
            <div class="stat-number">98%</div>
            <p>Satisfaction</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA - Mobile Optimized -->
    <section class="cta-banner">
      <div class="container">
        <h2>Ready for Service?</h2>
        <p>20% off first visit • Free check</p>
        <a href="#contact" class="btn btn-primary btn-large">Get Quote</a>
      </div>
    </section>
  </div>
</template>

<style scoped>
:root {
  --primary-gradient: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  --secondary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --shadow-light: 0 5px 20px rgba(0,0,0,0.1);
  --shadow-hover: 0 10px 40px rgba(0,0,0,0.2);
}

.homepage {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #ffffff;
  overflow-x: hidden; /* Prevents horizontal scroll */
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
  width: 100%;
  box-sizing: border-box;
}

/* Hero - Perfect Mobile/Desktop */
.hero {
  min-height: clamp(70vh, 90vw, 100vh);
  background: var(--primary-gradient);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: clamp(2rem, 8vw, 6rem) clamp(1rem, 5vw, 4rem);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1.5" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  z-index: 1;
  position: relative;
}

.hero-title {
  font-size: clamp(2rem, 8vw, 4.5rem);
  margin: 0 0 clamp(1rem, 4vw, 2rem);
  line-height: 1.1;
  font-weight: 700;
}

.highlight {
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255,215,0,0.6);
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.4rem);
  margin: 0 0 clamp(2rem, 6vw, 3rem);
  opacity: 0.95;
}

.hero-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  width: 100%;
}

@media (min-width: 640px) {
  .hero-buttons {
    flex-direction: row;
    justify-content: center;
  }
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1.5rem, 4vw, 2.5rem);
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  min-height: 56px;
  box-sizing: border-box;
}

.btn-primary {
  background: #ffd700;
  color: #1e3c72;
  box-shadow: var(--shadow-light);
}

.btn-primary:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-hover);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.9);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.15);
}

.btn-large {
  min-width: 200px;
}

/* Services Grid - Perfect Responsive */
.services-preview {
  padding: clamp(4rem, 10vw, 8rem) 0;
  background: #f8f9fa;
}

.section-title {
  text-align: center;
  font-size: clamp(2rem, 6vw, 3.5rem);
  margin-bottom: clamp(2.5rem, 6vw, 4rem);
  color: #1e3c72;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(250px, 25vw, 320px), 1fr));
  gap: clamp(1.5rem, 4vw, 3rem);
}

.service-card {
  background: white;
  padding: clamp(2rem, 5vw, 3rem);
  border-radius: 24px;
  text-align: center;
  box-shadow: var(--shadow-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
}

.service-card:hover {
  transform: translateY(-12px);
  box-shadow: var(--shadow-hover);
}

.service-icon {
  font-size: clamp(2.5rem, 8vw, 4rem);
  margin-bottom: 1.25rem;
}

.service-card h3 {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  margin: 0 0 1rem 0;
  color: #1e3c72;
}

/* Stats - Auto Responsive */
.stats {
  padding: clamp(3rem, 8vw, 6rem) 0;
  background: var(--secondary-gradient);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
}

.stat-number {
  font-size: clamp(2rem, 8vw, 4rem);
  font-weight: 800;
  margin-bottom: 0.75rem;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

/* CTA - Mobile Perfect */
.cta-banner {
  padding: clamp(3rem, 8vw, 6rem) 0;
  background: #1e3c72;
  color: white;
  text-align: center;
}

.cta-banner h2 {
  font-size: clamp(2rem, 6vw, 3rem);
  margin-bottom: 1.25rem;
}

/* Universal Mobile Fixes */
@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
  
  .hero-buttons .btn {
    width: 100%;
    max-width: 300px;
  }
}

/* Landscape Mobile */
@media (max-height: 500px) and (orientation: landscape) {
  .hero {
    min-height: 100vh;
    padding: 2rem 1rem;
  }
}
</style>
