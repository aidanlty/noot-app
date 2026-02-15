<script setup lang="ts">
import { reactive, ref, computed } from 'vue'

const emit = defineEmits(['login', 'register'])

// 🎯 DUMMY TEST ACCOUNTS - HARDCODED
const testAccounts = [
  { email: 'customer@test.com', password: '123456', role: 'customer' },
  { email: 'staff@test.com', password: '123456', role: 'staff' },
  { email: 'admin@test.com', password: 'admin123', role: 'staff' },
  { email: 'john@example.com', password: 'password', role: 'customer' }
]

const currentMode = ref('login')
const loginForm = reactive({ role: 'customer', email: '', password: '' })
const registerForm = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const error = ref('')
const loading = ref(false)

// Computed for v-model
const currentEmail = computed({
  get: () => currentMode.value === 'login' ? loginForm.email : registerForm.email,
  set: (value) => currentMode.value === 'login' ? loginForm.email = value : registerForm.email = value
})

const currentPassword = computed({
  get: () => currentMode.value === 'login' ? loginForm.password : registerForm.password,
  set: (value) => currentMode.value === 'login' ? loginForm.password = value : registerForm.password = value
})

const switchToLogin = () => {
  currentMode.value = 'login'
  error.value = ''
}

const switchToRegister = () => {
  currentMode.value = 'register'
  error.value = ''
}

// ✅ LOGIN FUNCTION - Tests against dummy accounts
const handleLogin = () => {
  // Check against hardcoded test accounts
  const validAccount = testAccounts.find(account => 
    account.email === loginForm.email && 
    account.password === loginForm.password && 
    account.role === loginForm.role
  )

  if (!validAccount) {
    error.value = '❌ Invalid email, password, or role combination'
    return
  }

  loading.value = true
  console.log('✅ Login successful:', validAccount)
  
  // Send valid user to App.vue
  emit('login', { 
    email: validAccount.email, 
    role: validAccount.role, 
    loggedIn: true 
  })
  
  setTimeout(() => loading.value = false, 1000)
}

// ✅ REGISTER FUNCTION - Still emits to parent (no validation against dummy accounts)
const handleRegister = () => {
  if (registerForm.password !== registerForm.confirmPassword) {
    error.value = '❌ Passwords do not match'
    return
  }
  if (registerForm.password.length < 6) {
    error.value = '❌ Password must be at least 6 characters'
    return
  }
  
  loading.value = true
  console.log('📝 Registration attempt:', registerForm.email)
  emit('register', registerForm)
  setTimeout(() => loading.value = false, 1000)
}

const handleSubmit = () => {
  if (currentMode.value === 'login') {
    handleLogin()
  } else {
    handleRegister()
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 🧪 TEST ACCOUNTS DISPLAY -->
    <div class="test-accounts" v-if="!loading">
      <h3 style="margin-top: 0;">🧪 Test Accounts:</h3>
      <div class="account-list">
        <div v-for="account in testAccounts" :key="account.email" class="account-item">
          <strong>{{ account.email }}</strong> 
          ({{ account.password }}) 
          <span class="role-badge role-{{ account.role }}">{{ account.role }}</span>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="login-form">
      <div class="mode-toggle">
        <button 
          type="button"
          :class="{ active: currentMode === 'login' }"
          @click="switchToLogin"
        >
          Login
        </button>
        <button 
          type="button"
          :class="{ active: currentMode === 'register' }"
          @click="switchToRegister"
        >
          Register
        </button>
      </div>

      <div v-if="currentMode === 'login'" class="role-group">
        <label>Login as:</label>
        <div class="role-buttons">
          <button 
            type="button"
            :class="{ active: loginForm.role === 'customer' }"
            @click="loginForm.role = 'customer'"
          >
            Customer
          </button>
          <button 
            type="button"
            :class="{ active: loginForm.role === 'staff' }"
            @click="loginForm.role = 'staff'"
          >
            Staff
          </button>
        </div>
      </div>

      <div v-if="currentMode === 'register'" class="form-group">
        <label>Name</label>
        <input 
          v-model="registerForm.name"
          type="text" 
          maxlength = "20"
          placeholder="Enter name"
          required 
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="currentEmail" 
          type="email" 
          placeholder="Enter email"
          required 
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input 
          v-model="currentPassword" 
          type="password" 
          placeholder="Enter password"
          required 
          :disabled="loading"
        />
      </div>

      <div v-if="currentMode === 'register'" class="form-group">
        <label>Confirm Password</label>
        <input 
          v-model="registerForm.confirmPassword"
          type="password" 
          placeholder="Confirm password"
          required 
          :disabled="loading"
        />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? 'Loading...' : (currentMode === 'login' ? 'Login' : 'Register') }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
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

.mode-toggle {
  display: flex;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.mode-toggle button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.mode-toggle button.active {
  background: #007bff;
  color: white;
}

.role-group {
  margin-bottom: 1.5rem;
}

.role-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.role-buttons {
  display: flex;
  gap: 0.5rem;
}

.role-buttons button {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-buttons button.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
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

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group input:disabled {
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

/* Style for dummy accounts, just testing for now */
.test-accounts {
  background: #e8f4f8;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  max-width: 400px;
  color: black;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: black;
}

.account-item {
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #007bff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-customer {
  background: #d1ecf1;
  color: #0c5460;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-staff {
  background: #d4edda;
  color: #155724;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}
</style>
