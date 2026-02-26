<template>
  <div class="page">
    <div class="card">

      <!-- Avatar -->
      <div class="avatar-ring">
        <div class="avatar">{{ initials }}</div>
      </div>

      <h1 class="card-name">{{ profile.name}}</h1>
      <p class="card-email-sub">{{ profile.email }}</p>

      <div class="divider"></div>

      <!-- Fields -->
      <div class="fields">
        <div class="field-row">
          <div class="field-meta">
            <span class="field-label">Role</span>
            <span class="field-value">{{ profile.role || 'err'}}</span>
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

    <!-- Toast -->
    <div v-if="toast" class="toast">{{ toast }}</div>

    <!-- Modal — same pattern as reference -->
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
import {supabase} from '@/supabase.js'

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
      toast: '',
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
      if (!this.profile.name) return "Unable to fetch.";
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
  async fetchProfile() {
    try {
      // get jwt token
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }

      // extract the user's ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub; // standard JWT subject claim = user UUID
      // console.log("payload:", payload);
      // console.log("userId:", userId);

      if (!userId) {
        console.error('Could not extract user ID from token');
        this.$router.push('/login');
        return;
      }

      // fetch user's information using user ID
      const { data, error: dbError } = await supabase
        .from('Profiles')
        .select('"Name", "Email", "Role"')
        .eq('"ID"', userId)
        .single();

      if (dbError) {
        console.error('Error fetching profile:', dbError);
        return;
      }

      this.userId = payload.sub;
      // NEW: Populate profile with data from DB
      this.profile.name = data.Name;
      this.profile.email = data.Email;
      this.profile.role = data.Role;

    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    }
  },
    openModal(type) {
      this.error = '';
      this.modal.type = type;
      this.modal.isOpen = true;

      if (type === 'role') this.form.role = this.profile.role;
      if (type === 'name') this.form.name = this.profile.name;
      if (type === 'email') { this.form.email = ''; this.form.emailConfirm = ''; }
      if (type === 'password') { this.form.current = ''; this.form.newPass = ''; this.form.confirm = ''; }
    },
    closeModal() {
      this.modal.isOpen = false;
      this.modal.type = null;
      this.error = '';
    },
    showToast(msg) {
      this.toast = msg;
      setTimeout(() => { this.toast = ''; }, 3000);
    },
    async saveName() {
      if (!this.form.name.trim()) { this.error = 'Name cannot be empty.'; return; }

      try {
        console.log("userId:", this.userId);

        // update name in the backend
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
        this.showToast('Name updated successfully!');

      } catch (err) {
          
        this.error = 'An unexpected error occurred.';
        console.error('Unexpected error updating name:', err);
      }
    },
    async saveEmail() {
      if (!this.form.email.trim()) { this.error = 'Email cannot be empty.'; return; }

      try {

        // update name in the backend
        const { error: dbError } = await supabase
          .from('Profiles')
          .update({ Email: this.form.email.trim() })
          .eq('"ID"', this.userId);

        if (dbError) {
          this.error = 'Failed to update email. Please try again.';
          console.error('Error updating email:', dbError);
          return;
        }
      
        if (!this.form.email) { this.error = 'Please enter a new email.'; return; }
        if (this.form.email !== this.form.emailConfirm) { this.error = 'Emails do not match.'; return; }
        this.profile.email = this.form.email;
        this.closeModal();
        this.showToast('Email updated successfully!');

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
        // NEW: Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) { this.$router.push('/login'); return; }

        // verify current pw
        const verifyRes = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: this.profile.email,
            password: this.form.current,
          }),
        });

        if (!verifyRes.ok) {
          this.error = 'Current password is incorrect.';
          return;
        }

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
        this.showToast('Password changed successfully!');

      } catch (err) {
        this.error = 'An unexpected error occurred.';
        console.error('Unexpected error changing password:', err);
      }

      this.closeModal();
      this.showToast('Password changed successfully!');
    },
  },
};
</script>

<style scoped src="@/assets/profile.css"></style>