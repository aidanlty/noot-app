<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showSuccess = ref(false)
const form = reactive({
  name: '',
  email: '',
  role: 'manager',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''
  if (form.password !== form.confirmPassword) {
    error.value = '❌ Passwords do not match'
    return
  }
  if (form.password.length < 6) {
    error.value = '❌ Password must be at least 6 characters'
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role, // 'manager' | 'technician'
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to create staff account')

    console.log('✅ Staff user created:', data.user)
    // Show success page
    showSuccess.value = true
    await nextTick()

  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
const goToDashboard = () => {
  router.push('/manager-dashboard')
}
</script>

<template>
  <div class="admin-register-container">
    <!-- FORM PAGE -->
    <form v-if="!showSuccess" @submit.prevent="submit" class="login-form">
      <h2 class="title">Register Staff Account</h2>
      <p class="subtitle">Create manager or technician accounts as an administrator.</p>

      <div class="form-group">
        <label>Name</label>
        <input v-model="form.name" type="text" maxlength="50" placeholder="Enter name" required :disabled="loading" />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" placeholder="Enter email" required :disabled="loading" />
      </div>

      <div class="form-group">
        <label>Role</label>
        <select v-model="form.role" :disabled="loading" class="form-control">
          <option value="manager">👨‍💼 Manager</option>
          <option value="technician">🔧 Technician</option>
        </select>
      </div>

      <div class="form-group">
        <label>Password</label>
        <input v-model="form.password" type="password" placeholder="Enter password" required :disabled="loading" />
      </div>

      <div class="form-group">
        <label>Confirm Password</label>
        <input v-model="form.confirmPassword" type="password" placeholder="Confirm password" required
          :disabled="loading" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Creating...' : 'Create Staff Account' }}
      </button>
    </form>

    <!-- SUCCESS PAGE -->
    <div v-else class="login-form success-container">
      <div class="success-icon">✅</div>
      <h2 class="success-title">Staff Account Created!</h2>
      <p class="success-message">
        <strong>{{ form.name }}</strong> ({{ form.role }}) has been successfully registered.
      </p>
      <p class="success-details">
        Email: <strong>{{ form.email }}</strong>
      </p>

      <!-- <div class="success-actions">
        <button class="btn btn-success" @click="goToDashboard">
          👉 Go to Dashboard
        </button> -->
      <button class="btn btn-outline-secondary" type="button" @click="showSuccess = false">
        ➕ Create Another
      </button>
    </div>
  </div>
</template>


<style scoped>
.admin-register-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.title {
  margin-top: 0;
  margin-bottom: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.subtitle {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-group input:focus,
.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group input:disabled,
.form-control:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #dc3545;
  margin-bottom: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
</style>
