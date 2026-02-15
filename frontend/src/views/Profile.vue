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
export default {
  name: 'ProfilePage',
  data() {
    return {
      profile: {
        name: 'Alexandra Johnson',
        email: 'alex.johnson@example.com',
      },
      modal: {
        isOpen: false,
        type: null,
      },
      toast: '',
      error: '',
      form: {
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
      return this.profile.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    },
  },
  methods: {
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
    showToast(msg) {
      this.toast = msg;
      setTimeout(() => { this.toast = ''; }, 3000);
    },
    saveName() {
      if (!this.form.name.trim()) { this.error = 'Name cannot be empty.'; return; }
      this.profile.name = this.form.name.trim();
      this.closeModal();
      this.showToast('Name updated successfully!');
    },
    saveEmail() {
      if (!this.form.email) { this.error = 'Please enter a new email.'; return; }
      if (this.form.email !== this.form.emailConfirm) { this.error = 'Emails do not match.'; return; }
      this.profile.email = this.form.email;
      this.closeModal();
      this.showToast('Email updated successfully!');
    },
    savePassword() {
      if (!this.form.current) { this.error = 'Enter your current password.'; return; }
      if (this.form.newPass.length < 8) { this.error = 'Password must be at least 8 characters.'; return; }
      if (this.form.newPass !== this.form.confirm) { this.error = 'Passwords do not match.'; return; }
      this.closeModal();
      this.showToast('Password changed successfully!');
    },
  },
};
</script>

<style scoped src="@/assets/profile.css"></style>