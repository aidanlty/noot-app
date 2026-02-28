<template>
  <div class="page">
    <div class="card">

      <!-- Avatar -->
      <div class="avatar-ring">
        <div class="avatar">{{ initials }}</div>
      </div>

      <h1 class="card-name">{{ profile.name }}</h1>
      <p class="card-email-sub">{{ profile.email }}</p>

      <div class="divider"></div>

      <!-- Fields -->
      <div class="fields">
        <div class="field-row">
          <div class="field-meta">
            <span class="field-label">Role</span>
            <span class="field-value">{{ profile.role || 'err' }}</span>
          </div>
        </div>

        <div class="field-row">
          <div class="field-meta">
            <span class="field-label">Name</span>
            <span class="field-value">{{ profile.name }}</span>
          </div>
          <button class="edit-btn" @click="openModal('name')">Edit</button>
        </div>

        <div class="field-row">
          <div class="field-meta">
            <span class="field-label">Email</span>
            <span class="field-value">{{ profile.email }}</span>
          </div>
          <button class="edit-btn" @click="openModal('email')">Edit</button>
        </div>

        <div class="field-row">
          <div class="field-meta">
            <span class="field-label">Password</span>
            <span class="field-value">••••••••••</span>
          </div>
          <button class="edit-btn" @click="openModal('password')">Edit</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="success.isOpen" class="modal-overlay" @click="closeSuccess">
      <div class="modal-content success-modal" @click.stop>
        <div class="success-icon">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="25" stroke="#22c55e" stroke-width="2"/>
            <path d="M14 27l8 8 16-16" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="success-title">{{ success.title }}</h2>
        <p class="success-message">{{ success.message }}</p>
        <button class="btn-primary success-btn" @click="closeSuccess">Done</button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="modal.isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">&times;</button>

        <!-- Edit Name -->
        <div v-if="modal.type === 'name'">
          <h2>Edit Name</h2>
          <div class="modal-body">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" v-model="form.name" placeholder="Your full name" />
            </div>
            <p v-if="error" class="warning-text">{{ error }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="saveName">Save Changes</button>
          </div>
        </div>

        <!-- Change Email -->
        <div v-if="modal.type === 'email'">
          <h2>Change Email</h2>
          <div class="modal-body">
            <div class="form-group">
              <label>New Email</label>
              <input type="email" v-model="form.email" placeholder="new@email.com" />
            </div>
            <div class="form-group">
              <label>Confirm Email</label>
              <input type="email" v-model="form.emailConfirm" placeholder="Confirm email" />
            </div>
            <p v-if="error" class="warning-text">{{ error }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="saveEmail">Save Changes</button>
          </div>
        </div>

        <!-- Change Password -->
        <div v-if="modal.type === 'password'">
          <h2>Change Password</h2>
          <div class="modal-body">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" v-model="form.current" placeholder="Current password" />
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" v-model="form.newPass" placeholder="New password" />
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" v-model="form.confirm" placeholder="Confirm password" />
            </div>
            <p v-if="error" class="warning-text">{{ error }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn-danger" @click="savePassword">Save Changes</button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
import { supabase } from '@/supabase.js'

export default {
  name: 'ProfilePage',
  data() {
    return {
      userId: null,
      profile: {
        name: '',
        email: '',
        role: '',
      },
      modal: {
        isOpen: false,
        type: null,
      },
      success: {
        isOpen: false,
        title: '',
        message: '',
      },
      error: '',
      form: {
        role: '',
        name: '',
        email: '',
        emailConfirm: '',
        current: '',
        newPass: '',
        confirm: '',
      },
    };
  },
  computed: {
    initials() {
      if (!this.profile.name) return '?';
      return this.profile.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    },
  },

  async mounted() {
    await this.fetchProfile();
  },

  methods: {
    // ── Helpers ──────────────────────────────────────
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },

    async fetchProfile() {
      try {
        const token = localStorage.getItem('token');
        if (!token) { this.$router.push('/login'); return; }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        if (!userId) {
          console.error('Could not extract user ID from token');
          this.$router.push('/login');
          return;
        }

        const { data, error: dbError } = await supabase
          .from('Profiles')
          .select('"Name", "Email", "Role"')
          .eq('"ID"', userId)
          .single();

        if (dbError) { console.error('Error fetching profile:', dbError); return; }

        this.userId = userId;
        this.profile.name = data.Name;
        this.profile.email = data.Email;
        this.profile.role = data.Role;

      } catch (err) {
        console.error('Unexpected error fetching profile:', err);
      }
    },

    // ── Modal controls ────────────────────────────────
    openModal(type) {
      this.error = '';
      this.modal.type = type;
      this.modal.isOpen = true;

      if (type === 'name') this.form.name = this.profile.name;
      if (type === 'email') { this.form.email = ''; this.form.emailConfirm = ''; }
      if (type === 'password') { this.form.current = ''; this.form.newPass = ''; this.form.confirm = ''; }
    },
    closeModal() {
      this.modal.isOpen = false;
      this.modal.type = null;
      this.error = '';
    },
    showSuccess(title, message) {
      this.success.title = title;
      this.success.message = message;
      this.success.isOpen = true;
    },
    closeSuccess() {
      this.success.isOpen = false;
      this.success.title = '';
      this.success.message = '';
    },

    // ── Save handlers ─────────────────────────────────
    async saveName() {
      if (!this.form.name.trim()) { this.error = 'Name cannot be empty.'; return; }

      try {
        const { error: dbError } = await supabase
          .from('Profiles')
          .update({ Name: this.form.name.trim() })
          .eq('"ID"', this.userId);

        if (dbError) {
          this.error = 'Failed to update name. Please try again.';
          console.error('Error updating name:', dbError);
          return;
        }

        this.profile.name = this.form.name.trim();
        this.closeModal();
        this.showSuccess('Name Updated', `Your name has been changed to ${this.profile.name}.`);

      } catch (err) {
        this.error = 'An unexpected error occurred.';
        console.error('Unexpected error updating name:', err);
      }
    },

    async saveEmail() {
      const email = this.form.email.trim();

      if (!email) { this.error = 'Email cannot be empty.'; return; }
      if (!this.isValidEmail(email)) { this.error = 'Please enter a valid email address.'; return; }
      if (email !== this.form.emailConfirm.trim()) { this.error = 'Emails do not match.'; return; }
      if (email === this.profile.email) { this.error = 'New email must be different from your current email.'; return; }

      try {
        // Check if email already exists in Profiles
        const { data: existing } = await supabase
          .from('Profiles')
          .select('ID')
          .eq('Email', email)
          .maybeSingle();

        if (existing) {
          this.error = 'Email already exists. Please use a different email.';
          return;
        }

        const { error: dbError } = await supabase
          .from('Profiles')
          .update({ Email: email })
          .eq('"ID"', this.userId);

        if (dbError) {
          this.error = 'Email already exists. Please use a different email.';
          console.error('Error updating email:', dbError);
          return;
        }

        this.profile.email = email;
        this.closeModal();
        this.showSuccess('Email Updated', `Your email has been changed to ${this.profile.email}.`);

      } catch (err) {
        this.error = 'An unexpected error occurred.';
        console.error('Unexpected error updating email:', err);
      }
    },

    async savePassword() {
      if (!this.form.current) { this.error = 'Enter your current password.'; return; }
      if (this.form.newPass.length < 8) { this.error = 'Password must be at least 8 characters.'; return; }
      if (this.form.newPass !== this.form.confirm) { this.error = 'Passwords do not match.'; return; }

      try {
        const token = localStorage.getItem('token');
        if (!token) { this.$router.push('/login'); return; }

        // Verify current password
        const verifyRes = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.profile.email, password: this.form.current }),
        });

        if (!verifyRes.ok) { this.error = 'Current password is incorrect.'; return; }

        const res = await fetch('http://localhost:3000/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: this.form.newPass }),
        });

        const result = await res.json();
        if (!res.ok) { this.error = result.message || 'Failed to update password.'; return; }

        this.closeModal();
        this.showSuccess('Password Changed', 'Your password has been updated successfully.');

      } catch (err) {
        this.error = 'An unexpected error occurred.';
        console.error('Unexpected error changing password:', err);
      }
    },
  },
};
</script>

<style scoped src="@/assets/profile.css"></style>