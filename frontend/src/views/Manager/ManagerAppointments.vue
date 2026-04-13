<template>
  <div class="appointments-container">

    <!-- Header -->
    <div class="appointments-header">
      <h1>📅 Appointments</h1>
    </div>

    <!-- Loading State -->
    <div v-if="pageLoading" class="loading-state">
      <span class="loading-spinner"></span>
      <p>Loading appointments...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="appointmentsError" class="error-state">
      <p>⚠️ {{ appointmentsError }}</p>
      <button class="btn-retry" @click="fetchAppointments">Retry</button>
    </div>

    <template v-else>

      <!-- Status Tabs -->
      <div class="status-tabs">
        <button v-for="tab in statusTabs" :key="tab.value" class="status-tab"
          :class="['status-tab--' + tab.value, { active: activeStatusTab === tab.value }]"
          @click="setStatusTab(tab.value)">
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-badge">{{ getStatusCount(tab.value) }}</span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <button v-for="f in filters" :key="f.value" class="filter-btn"
          :class="{ active: activeFilter === f.value && !specificDate }" @click="setFilter(f.value)">
          {{ f.label }}
        </button>

        <div class="date-filter">
          <input type="date" class="date-input" :class="{ active: specificDate }" v-model="specificDate"
            @change="onDateChange" />
          <button v-if="specificDate" class="clear-date" @click="clearDate">✕</button>
        </div>

        <div class="search-filter">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" v-model="customerSearch" placeholder="Search by customer name..."
            @input="currentPage = 1" />
          <button v-if="customerSearch" class="clear-search" @click="clearSearch">✕</button>
        </div>

        <span class="appt-count">
          {{ filteredAppointments.length }} appointment{{ filteredAppointments.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Empty -->
      <div v-if="filteredAppointments.length === 0" class="empty-state">
        <span class="empty-icon">{{ emptyIcon }}</span>
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- List -->
      <div v-else class="appointments-list">
        <div v-for="appt in paginatedAppointments" :key="appt.id" class="appt-card" :class="{
          'today-card': isToday(appt.appointmentDate) && activeStatusTab === 'active',
          'card--completed': appt.status === 'completed',
          'card--cancelled': appt.status === 'cancelled',
          'card--diagnose': appt.status === 'diagnose',
          'card--unread': !appt.diagnoseTech && activeStatusTab === 'active',
        }">
          <div class="appt-time-col" :class="{
            'time-col--completed': appt.status === 'completed',
            'time-col--cancelled': appt.status === 'cancelled',
            'time-col--diagnose': appt.status === 'diagnose',
          }">
            <span class="appt-day">{{ isToday(appt.appointmentDate) && activeStatusTab === 'active' ? 'Today' :
              getDayName(appt.appointmentDate) }}</span>
            <span class="appt-time">{{ appt.appointmentTime }}</span>
          </div>
          <div class="appt-divider"></div>
          <div class="appt-body">
            <div class="appt-top">
              <h3 class="appt-title">{{ appt.customerName }}</h3>
              <span class="appt-id">#{{ appt.id }}</span>
              <span v-if="appt.status === 'completed'" class="status-badge status-badge--completed">✓ Completed</span>
              <span v-else-if="appt.status === 'cancelled'" class="status-badge status-badge--cancelled">✕
                Cancelled</span>
              <span v-else-if="appt.status === 'diagnose'" class="status-badge status-badge--diagnose">🔬
                Diagnose</span>
            </div>
            <p class="appt-vehicle">{{ appt.vehicleYear }} {{ appt.vehicleMake }} {{ appt.vehicleModel }} · {{
              appt.licensePlate }}</p>
            <div v-if="appt.notes" class="jc-card-notes-box">📝 {{ appt.notes }}</div>
            <div class="appt-meta">
              <span class="meta-tag date-tag">{{ formatDate(appt.appointmentDate) }}</span>
              <span v-if="appt.diagnoseTech" class="meta-tag tech-assigned-tag">
                👤 {{ appt.diagnoseTech }}
              </span>
              <span v-else-if="activeStatusTab === 'active' && appt.status !== 'cancelled'"
                class="meta-tag tech-unassigned-tag">
                Diagnose Tech: Not Assigned
              </span>
              <span v-if="appt.cancelReason && appt.status === 'cancelled'" class="meta-tag cancel-reason-tag">
                {{ appt.cancelReason }}
              </span>
            </div>
          </div>
          <div class="appt-actions">
            <button class="btn-view" @click="openModal(appt)">View</button>
            <template v-if="activeStatusTab === 'active'">
              <button v-if="!appt.diagnoseTech" class="btn-assign-tech" @click="openAssignTech(appt)">
                Assign
              </button>
              <button v-else class="btn-change-tech" @click="openAssignTech(appt)">
                Change
              </button>
              <button v-if="isPast(appt.appointmentDate, appt.appointmentTime)" class="btn-diagnose"
                :class="{ 'btn-proceed--disabled': !appt.diagnoseTech }" :disabled="!appt.diagnoseTech"
                :title="!appt.diagnoseTech ? 'Assign a technician before proceeding to diagnose' : ''"
                @click="openDiagnoseConfirm(appt)">
                Diagnose
              </button>
              <button class="btn-cancel-appt" @click="openCancelConfirm(appt)">Cancel</button>
            </template>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-container">
        <button class="pagination-btn" @click="prevPage" :disabled="currentPage === 1">← Previous</button>
        <div class="pagination-info">
          <button v-for="page in totalPages" :key="page" class="pagination-page"
            :class="{ active: currentPage === page }" @click="goToPage(page)">{{ page }}</button>
        </div>
        <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Next →</button>
      </div>

      <!-- ───────────── MODALS ───────────── -->

      <!-- View Modal -->
      <div v-if="modal.isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal">&times;</button>
          <h2>Appointment Details</h2>
          <div class="modal-body">
            <div class="detail-group">
              <label>Customer</label>
              <p>{{ modal.appt.customerName }}</p>
            </div>
            <div class="detail-group">
              <label>Customer Email</label>
              <p>{{ modal.appt.customerEmail }}</p>
            </div>
            <div class="detail-group">
              <label>Phone Number</label>
              <p>{{ modal.appt.phoneNumber }}</p>
            </div>
            <div class="detail-group">
              <label>Vehicle</label>
              <p>{{ modal.appt.vehicleYear }} {{ modal.appt.vehicleMake }} {{ modal.appt.vehicleModel }}</p>
            </div>
            <div class="detail-group">
              <label>License Plate</label>
              <p>{{ modal.appt.licensePlate }}</p>
            </div>
            <div class="detail-group">
              <label>Appointment Date</label>
              <p>{{ formatDate(modal.appt.appointmentDate) }}</p>
            </div>
            <div class="detail-group">
              <label>Time</label>
              <p>{{ modal.appt.appointmentTime }}</p>
            </div>
            <div class="detail-group">
              <label>Duration</label>
              <p>{{ modal.appt.duration }}</p>
            </div>
            <div class="detail-group">
              <label>Status</label>
              <p>{{ formatStatus(modal.appt.status) }}</p>
            </div>
            <div v-if="modal.appt.status !== 'cancelled'" class="detail-group">
              <label>Diagnose Technician</label>
              <p>{{ modal.appt.diagnoseTech || 'Not Assigned' }}</p>
            </div>
            <div v-if="modal.appt.status !== 'cancelled' && modal.appt.techEmail" class="detail-group">
              <label>Technician Email</label>
              <p>{{ modal.appt.techEmail }}</p>
            </div>
            <div v-if="modal.appt.cancelReason && modal.appt.status === 'cancelled'" class="detail-group">
              <label>Cancellation Reason</label>
              <p>{{ modal.appt.cancelReason }}</p>
            </div>
            <div v-if="modal.appt.notes" class="detail-group">
              <label>Notes</label>
              <div class="jc-notes-box">{{ modal.appt.notes }}</div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Close</button>
          </div>
        </div>
      </div>

      <!-- Assign Tech Modal -->
      <div v-if="assignTech.isOpen" class="modal-overlay" @click="closeAssignTech">
        <div class="modal-content confirm-modal-content" @click.stop>
          <button class="modal-close" @click="closeAssignTech">&times;</button>
          <div class="confirm-icon confirm-icon--tech">🔧</div>
          <h2>{{ assignTech.appt && assignTech.appt.diagnoseTech ? 'Change Technician' : 'Assign Technician' }}</h2>
          <p class="confirm-desc">Select a diagnose technician for this appointment.</p>
          <div class="confirm-appt-info">
            <span class="confirm-name">{{ assignTech.appt && assignTech.appt.customerName }}</span>
            <span class="confirm-meta">
              {{ assignTech.appt && assignTech.appt.vehicleYear }}
              {{ assignTech.appt && assignTech.appt.vehicleMake }}
              {{ assignTech.appt && assignTech.appt.vehicleModel }}
              · #{{ assignTech.appt && assignTech.appt.id }}
            </span>
          </div>
          <div class="tech-select-wrapper">
            <label class="tech-select-label">Diagnose Technician</label>
            <div class="custom-select-container">
              <p v-if="technicianLoading" class="tech-loading">Loading technicians...</p>
              <p v-else-if="technicianError" class="reason-error">{{ technicianError }}</p>
              <select v-else v-model="assignTech.selectedTechId" class="tech-select">
                <option value="" disabled>— Select a technician —</option>
                <option v-for="tech in technicians" :key="tech.ID" :value="tech.ID">{{ tech.Name }}</option>
              </select>
            </div>
          </div>
          <p v-if="assignTech.showError" class="reason-error">Please select a technician to continue.</p>
          <p v-if="assignTech.submitError" class="reason-error">{{ assignTech.submitError }}</p>
          <div class="modal-actions confirm-actions">
            <button class="btn-secondary" @click="closeAssignTech">Go Back</button>
            <button class="btn-confirm-assign" @click="submitAssignTech" :disabled="assignTech.submitting">
              {{ assignTech.submitting ?
                'Saving...' : (assignTech.appt && assignTech.appt.diagnoseTech ?
                  'Confirm Change' : 'Confirm Assign')
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- Diagnose Confirm Modal -->
      <div v-if="diagnoseConfirm.isOpen" class="modal-overlay" @click="closeDiagnoseConfirm">
        <div class="modal-content confirm-modal-content" @click.stop>
          <button class="modal-close" @click="closeDiagnoseConfirm">&times;</button>

          <!-- Success State -->
          <template v-if="diagnoseConfirm.success">
            <div class="confirm-icon confirm-icon--success">✓</div>
            <h2>Job Card Created</h2>
            <p class="confirm-desc">
              The job card has been successfully created for
              <strong>{{ diagnoseConfirm.appt && diagnoseConfirm.appt.customerName }}</strong>.
              The appointment has been marked as completed.
            </p>
            <div class="modal-actions confirm-actions">
              <button class="btn-confirm-assign" @click="closeDiagnoseConfirm">Done</button>
            </div>
          </template>

          <!-- Confirm State -->
          <template v-else>
            <div class="confirm-icon confirm-icon--tech">🔬</div>
            <h2>Proceed to Diagnose?</h2>
            <p class="confirm-desc">
              This will create a job card and mark the appointment as completed.
            </p>
            <div class="confirm-appt-info">
              <span class="confirm-name">{{ diagnoseConfirm.appt && diagnoseConfirm.appt.customerName }}</span>
              <span class="confirm-meta">
                {{ diagnoseConfirm.appt && diagnoseConfirm.appt.vehicleYear }}
                {{ diagnoseConfirm.appt && diagnoseConfirm.appt.vehicleMake }}
                {{ diagnoseConfirm.appt && diagnoseConfirm.appt.vehicleModel }}
                · #{{ diagnoseConfirm.appt && diagnoseConfirm.appt.id }}
              </span>
            </div>
            <p class="confirm-desc">
              Assigned Technician: <strong>{{ diagnoseConfirm.appt && diagnoseConfirm.appt.diagnoseTech }}</strong>
            </p>
            <p v-if="diagnoseConfirm.submitError" class="reason-error">{{ diagnoseConfirm.submitError }}</p>
            <div class="modal-actions confirm-actions">
              <button class="btn-secondary" @click="closeDiagnoseConfirm" :disabled="diagnoseConfirm.submitting">Go
                Back</button>
              <button class="btn-confirm-assign" @click="createJobCard(diagnoseConfirm.appt)"
                :disabled="diagnoseConfirm.submitting">
                {{ diagnoseConfirm.submitting ? 'Creating...' : 'Confirm' }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Cancel Confirmation Modal -->
      <div v-if="cancelConfirm.isOpen" class="modal-overlay" @click="closeCancelConfirm">
        <div class="modal-content confirm-modal-content" @click.stop>
          <div class="confirm-icon confirm-icon--cancel">✕</div>
          <h2>Cancel Appointment</h2>
          <p class="confirm-desc">Select a reason for cancelling this appointment.</p>
          <div class="confirm-appt-info">
            <span class="confirm-name">{{ cancelConfirm.appt.customerName }}</span>
            <span class="confirm-meta">{{ cancelConfirm.appt.vehicleYear }} {{ cancelConfirm.appt.vehicleMake }} {{
              cancelConfirm.appt.vehicleModel }} · #{{ cancelConfirm.appt.id }}</span>
          </div>
          <div class="cancel-reasons">
            <label v-for="reason in cancelReasons" :key="reason" class="reason-option"
              :class="{ selected: cancelConfirm.reason === reason }">
              <input type="radio" name="cancelReason" :value="reason" v-model="cancelConfirm.reason" />
              <span class="reason-label">{{ reason }}</span>
            </label>
          </div>
          <p v-if="cancelConfirm.showError" class="reason-error">Please select a reason to continue.</p>
          <p v-if="cancelConfirm.submitError" class="reason-error">{{ cancelConfirm.submitError }}</p>
          <div class="modal-actions confirm-actions">
            <button class="btn-secondary" @click="closeCancelConfirm" :disabled="cancelConfirm.submitting">Go
              Back</button>
            <button class="btn-confirm-cancel" @click="submitCancel" :disabled="cancelConfirm.submitting">
              {{ cancelConfirm.submitting ? 'Cancelling...' : 'Confirm Cancel' }}
            </button>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script>
import { sgDateTimeFrom, sgEndOfMonthStr, sgEndOfWeekStr, sgLocaleDate, sgNow, sgStartOfMonthStr, sgStartOfWeekStr, sgTodayStr } from '@/utils/sgTime.js'

export default {
  name: 'AppointmentsPage',
  data() {
    return {
      // ── Loading / Error ──
      pageLoading: false,
      appointmentsError: null,

      // ── Tabs & Filters ──
      activeStatusTab: 'active',
      activeFilter: 'today',
      currentPage: 1,
      itemsPerPage: 5,
      specificDate: '',
      customerSearch: '',
      now: sgNow(),

      statusTabs: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      filters: [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'All', value: 'all' },
      ],

      // ── Technicians ──
      technicians: [],
      technicianLoading: false,
      technicianError: '',

      // ── Modals ──
      modal: { isOpen: false, appt: null },
      assignTech: {
        isOpen: false, appt: null,
        selectedTech: '', selectedTechId: '',
        showError: false, submitting: false, submitError: '',
      },
      diagnoseConfirm: {
        isOpen: false, appt: null,
        submitting: false, submitError: '',
        success: false,
      },
      cancelConfirm: {
        isOpen: false, appt: null,
        reason: '', showError: false, submitting: false, submitError: '',
      },
      cancelReasons: ['Customer did not show up', 'Reschedule'],

      // ── Appointments ──
      appointments: [],
    };
  },

  async mounted() {
    await Promise.all([this.fetchAppointments(), this.fetchTechnicians()]);
    this._nowTimer = setInterval(() => { this.now = sgNow(); }, 60000);
  },
  beforeUnmount() {
    clearInterval(this._nowTimer);
  },

  computed: {
    todayStr() {
      return sgTodayStr();
    },
    startOfWeekStr() {
      return sgStartOfWeekStr();
    },
    endOfWeekStr() {
      return sgEndOfWeekStr();
    },
    startOfMonthStr() {
      return sgStartOfMonthStr();
    },
    endOfMonthStr() {
      return sgEndOfMonthStr();
    },
    activeAppointments() {
      return this.appointments.filter(a => a.status === 'appointment' || a.status === 'booked');
    },
    completedAppointments() {
      return this.appointments.filter(a => a.status === 'completed');
    },
    cancelledAppointments() {
      return this.appointments.filter(a => a.status === 'cancelled');
    },

    tabAppointments() {
      if (this.activeStatusTab === 'active') return this.activeAppointments;
      if (this.activeStatusTab === 'completed') return this.completedAppointments;
      if (this.activeStatusTab === 'cancelled') return this.cancelledAppointments;
      return this.appointments;
    },

    filteredAppointments() {
      let list = this.tabAppointments;

      if (this.customerSearch.trim()) {
        const query = this.customerSearch.trim().toLowerCase();
        list = list.filter(a => a.customerName.toLowerCase().includes(query));
      }

      if (this.specificDate) {
        list = list.filter(a => a.appointmentDate === this.specificDate);
      } else if (this.activeFilter === 'today') {
        list = list.filter(a => a.appointmentDate === this.todayStr);
      } else if (this.activeFilter === 'week') {
        list = list.filter(a => a.appointmentDate >= this.startOfWeekStr && a.appointmentDate <= this.endOfWeekStr);
      } else if (this.activeFilter === 'month') {
        list = list.filter(a => a.appointmentDate >= this.startOfMonthStr && a.appointmentDate <= this.endOfMonthStr);
      }

      return [...list].sort((a, b) =>
        b.appointmentDate.localeCompare(a.appointmentDate) ||
        this.parseTime(b.appointmentTime) - this.parseTime(a.appointmentTime)
      );
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredAppointments.length / this.itemsPerPage));
    },
    paginatedAppointments() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredAppointments.slice(start, start + this.itemsPerPage);
    },

    emptyIcon() {
      if (this.activeStatusTab === 'completed') return '✓';
      if (this.activeStatusTab === 'cancelled') return '✕';
      return '📅';
    },
    emptyMessage() {
      if (this.customerSearch.trim()) return 'No appointments found matching that name.';
      if (this.activeStatusTab === 'completed') return 'No completed appointments yet.';
      if (this.activeStatusTab === 'cancelled') return 'No cancelled appointments.';
      return 'No appointments found for this period.';
    },
  },

  methods: {
    // ── Fetch ──
    async fetchAppointments() {
      this.pageLoading = true;
      this.appointmentsError = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please log in again.');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/manager/getAllAppointments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);
        this.appointments = (json.data || []).map(a => ({
          id: a.id,
          customerId: a.Profiles?.ID || '',
          customerName: a.Profiles?.Name || '',
          customerEmail: a.Profiles?.Email || '',
          phoneNumber: a.phone_number || '',
          licensePlate: a.vehicle_license_plate || '',
          vehicleMake: a.vehicle_make || '',
          vehicleModel: a.vehicle_model || '',
          vehicleYear: a.vehicle_year || '',
          appointmentDate: a.appointment_date || '',
          appointmentTime: a.appointment_time || '',
          duration: a.duration || '',
          status: a.status || '',
          diagnoseTech: a.TechnicianProfile?.Name || '',
          diagnoseTechId: a.TechnicianProfile?.ID || '',
          techEmail: a.TechnicianProfile?.Email || '',
          cancelReason: a.cancel_reason || null,
          notes: a.customer_notes || null,
        }));
      } catch (err) {
        console.error('Error fetching appointments:', err);
        this.appointmentsError = err.message;
      } finally {
        this.pageLoading = false;
      }
    },

    async fetchTechnicians() {
      this.technicianLoading = true;
      this.technicianError = '';
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/technicians/getTechnicians`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch technicians');
        const data = await res.json();
        this.technicians = data.technicians;
      } catch (err) {
        console.error('Error fetching technicians:', err);
        this.technicianError = 'Could not load technicians. Please try again.';
      } finally {
        this.technicianLoading = false;
      }
    },

    // ── Diagnose Confirm ──
    openDiagnoseConfirm(appt) {
      this.diagnoseConfirm.appt = appt;
      this.diagnoseConfirm.submitting = false;
      this.diagnoseConfirm.submitError = '';
      this.diagnoseConfirm.success = false;
      this.diagnoseConfirm.isOpen = true;
    },
    closeDiagnoseConfirm() {
      // Move card out of active tab only after user dismisses success screen
      if (this.diagnoseConfirm.success && this.diagnoseConfirm.appt) {
        this.diagnoseConfirm.appt.status = 'completed';
      }
      this.diagnoseConfirm.isOpen = false;
      this.diagnoseConfirm.appt = null;
      this.diagnoseConfirm.submitting = false;
      this.diagnoseConfirm.submitError = '';
      this.diagnoseConfirm.success = false;
    },

    async createJobCard(appt) {
      this.diagnoseConfirm.submitting = true;
      this.diagnoseConfirm.submitError = '';

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please log in again.');

        // 1) Create the job card
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/jobOrders/createJobCard`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: appt.customerId,
            appointment_id: appt.id,
            diagnose_technician_id: appt.diagnoseTechId,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Error ${res.status}`);

        // 2) Reuse the existing function to update status + send email
        await this.notifyAppointmentStatusUpdate(
          appt.id,
          'in diagnosis',
          appt.customerEmail
        );

        // 3) Update UI state
        this.diagnoseConfirm.success = true;
        if (this.diagnoseConfirm.appt) {
          this.diagnoseConfirm.appt.status = 'completed';
        }

      } catch (err) {
        console.error('Error creating job card:', err);
        this.diagnoseConfirm.submitError = err.message;
      } finally {
        this.diagnoseConfirm.submitting = false;
      }
    },

    // ── Assign Tech ──
    openAssignTech(appt) {
      this.assignTech.appt = appt;
      this.assignTech.selectedTechId = appt.diagnoseTechId || '';
      this.assignTech.selectedTech = appt.diagnoseTech || '';
      this.assignTech.showError = false;
      this.assignTech.submitError = '';
      this.assignTech.submitting = false;
      this.assignTech.isOpen = true;
    },
    closeAssignTech() {
      this.assignTech.isOpen = false;
      this.assignTech.appt = null;
      this.assignTech.selectedTech = '';
      this.assignTech.selectedTechId = '';
      this.assignTech.showError = false;
      this.assignTech.submitError = '';
      this.assignTech.submitting = false;
    },
    async submitAssignTech() {
      if (!this.assignTech.selectedTechId) {
        this.assignTech.showError = true;
        return;
      }
      this.assignTech.submitting = true;
      this.assignTech.submitError = '';
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/manager/${this.assignTech.appt.id}/technician`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ technician_id: this.assignTech.selectedTechId }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Error ${res.status}`);

        const selectedTech = this.technicians.find(t => t.ID === this.assignTech.selectedTechId);
        this.assignTech.appt.diagnoseTech = selectedTech?.Name || '';
        this.assignTech.appt.diagnoseTechId = selectedTech?.ID || '';
        this.assignTech.appt.techEmail = selectedTech?.Email || '';

        this.closeAssignTech();
      } catch (err) {
        console.error('Error assigning technician:', err);
        this.assignTech.submitError = err.message;
      } finally {
        this.assignTech.submitting = false;
      }
    },

    // ── Cancel Confirm ──
    openCancelConfirm(appt) {
      this.cancelConfirm.appt = appt;
      this.cancelConfirm.reason = '';
      this.cancelConfirm.showError = false;
      this.cancelConfirm.submitError = '';
      this.cancelConfirm.submitting = false;
      this.cancelConfirm.isOpen = true;
    },
    closeCancelConfirm() {
      this.cancelConfirm.isOpen = false;
      this.cancelConfirm.appt = null;
      this.cancelConfirm.reason = '';
      this.cancelConfirm.showError = false;
      this.cancelConfirm.submitError = '';
      this.cancelConfirm.submitting = false;
    },
    async submitCancel() {
      if (!this.cancelConfirm.reason) {
        this.cancelConfirm.showError = true;
        return;
      }
      this.cancelConfirm.submitting = true;
      this.cancelConfirm.submitError = '';
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/manager/cancelAppointment/${this.cancelConfirm.appt.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cancel_reason: this.cancelConfirm.reason }),
          }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Error ${res.status}`);

        await this.notifyAppointmentStatusUpdate(
          this.cancelConfirm.appt.id,
          'cancelled',
          this.cancelConfirm.appt.customerEmail
        );

        this.cancelConfirm.appt.status = 'cancelled';
        this.cancelConfirm.appt.cancelReason = this.cancelConfirm.reason;
        this.closeCancelConfirm();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        this.cancelConfirm.submitError = err.message;
      } finally {
        this.cancelConfirm.submitting = false;
      }
    },

    // -Send Email --
    async notifyAppointmentStatusUpdate(appointmentId, status, customerEmail) {
      const token = localStorage.getItem('token');

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, customerEmail }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || json.message || `Error ${res.status}`);
      }

      console.log('Appointment status updated:', json);

      return json;
    },

    // ── Filters / Pagination ──
    setFilter(val) {
      this.activeFilter = val;
      this.specificDate = '';
      this.currentPage = 1;
    },
    onDateChange() { this.currentPage = 1; },
    clearDate() {
      this.specificDate = '';
      this.currentPage = 1;
    },
    clearSearch() {
      this.customerSearch = '';
      this.currentPage = 1;
    },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    parseTime(timeStr) {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'AM' && hours === 12) hours = 0;
      if (modifier === 'PM' && hours !== 12) hours += 12;
      return hours * 60 + minutes;
    },

    // ── Helpers ──
    getStatusCount(tabValue) {
      if (tabValue === 'active') return this.activeAppointments.length;
      if (tabValue === 'completed') return this.completedAppointments.length;
      if (tabValue === 'cancelled') return this.cancelledAppointments.length;
      return 0;
    },
    setStatusTab(val) {
      this.activeStatusTab = val;
      this.currentPage = 1;
      this.customerSearch = '';
      this.specificDate = '';
      this.activeFilter = 'all';
    },
    isToday(date) { return date === this.todayStr; },
    isPast(date, time) {
      const apptDate = sgDateTimeFrom(date, time);
      return this.now > apptDate;
    },
    openModal(appt) {
      this.modal.appt = appt
      this.modal.isOpen = true
    },
    closeModal() { this.modal.isOpen = false; this.modal.appt = null; },
    formatDate(date) {
      if (!date) return 'N/A';
      return sgLocaleDate(`${date}T00:00:00+08:00`, 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    getDayName(date) {
      if (!date) return '';
      return sgLocaleDate(`${date}T00:00:00+08:00`, 'en-US', { weekday: 'short' });
    },
    formatStatus(status) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
  },
};
</script>

<style scoped src="@/assets/managerAppointments.css"></style>