<template>
  <div class="appointments-container">

    <!-- Header -->
    <div class="appointments-header">
      <h1>📅 Appointments</h1>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value && !specificDate }"
        @click="setFilter(f.value)"
      >
        {{ f.label }}
      </button>

      <!-- Date Picker -->
      <div class="date-filter">
        <input
          type="date"
          class="date-input"
          :class="{ active: specificDate }"
          v-model="specificDate"
          @change="onDateChange"
        />
        <button v-if="specificDate" class="clear-date" @click="clearDate">✕</button>
      </div>

      <span class="appt-count">
        {{ filteredAppointments.length }} appointment{{ filteredAppointments.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Empty -->
    <div v-if="filteredAppointments.length === 0" class="empty-state">
      No appointments found for this period.
    </div>

    <!-- List -->
    <div v-else class="appointments-list">
      <div
        v-for="appt in paginatedAppointments"
        :key="appt.id"
        class="appt-card"
        :class="{ 'today-card': isToday(appt.appointmentDate) }"
      >
        <div class="appt-time-col">
          <span class="appt-day">{{ isToday(appt.appointmentDate) ? 'Today' : getDayName(appt.appointmentDate) }}</span>
          <span class="appt-time">{{ appt.appointmentTime }}</span>
        </div>
        <div class="appt-divider"></div>
        <div class="appt-body">
          <div class="appt-top">
            <h3 class="appt-title">{{ appt.customerName }}</h3>
            <span class="appt-id">#{{ appt.id }}</span>
          </div>
          <p class="appt-vehicle">{{ appt.vehicleYear }} {{ appt.vehicleMake }} {{ appt.vehicleModel }} · {{ appt.licensePlate }}</p>
          <div class="appt-meta">
            <span class="meta-tag date-tag">{{ formatDate(appt.appointmentDate) }}</span>
            <span class="meta-tag duration-tag">{{ appt.duration }}</span>
            <span v-if="appt.diagnoseTech" class="meta-tag tech-assigned-tag">
              👤 {{ appt.diagnoseTech }}
            </span>
            <span v-else class="meta-tag tech-unassigned-tag">
              Diagnose Tech: Not Assigned
            </span>
          </div>
        </div>
        <div class="appt-actions">
          <button class="btn-view" @click="openModal(appt)">View</button>
          <button
            v-if="!appt.diagnoseTech"
            class="btn-assign-tech"
            @click="openAssignTech(appt)"
          >
            Assign
          </button>
          <button
            v-else
            class="btn-change-tech"
            @click="openAssignTech(appt)"
          >
            Change
          </button>
          <button
            v-if="isPast(appt.appointmentDate, appt.appointmentTime)"
            class="btn-proceed"
            @click="openProceedConfirm(appt)"
          >
            Proceed
          </button>
          <button class="btn-cancel-appt" @click="openCancelConfirm(appt)">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-container">
      <button class="pagination-btn" @click="prevPage" :disabled="currentPage === 1">← Previous</button>
      <div class="pagination-info">
        <button
          v-for="page in totalPages"
          :key="page"
          class="pagination-page"
          :class="{ active: currentPage === page }"
          @click="goToPage(page)"
        >{{ page }}</button>
      </div>
      <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Next →</button>
    </div>

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
            <label>Price</label>
            <p>${{ modal.appt.price }}</p>
          </div>
          <div class="detail-group">
            <label>Status</label>
            <p>{{ formatStatus(modal.appt.status) }}</p>
          </div>
          <div class="detail-group">
            <label>Diagnose Technician</label>
            <p>{{ modal.appt.diagnoseTech || 'Not Assigned' }}</p>
          </div>
          <div v-if="modal.appt.notes" class="detail-group">
            <label>Notes</label>
            <p>{{ modal.appt.notes }}</p>
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
        <p class="confirm-desc">
          Select a diagnose technician for this appointment.
        </p>
        <div class="confirm-appt-info">
          <span class="confirm-name">{{ assignTech.appt && assignTech.appt.customerName }}</span>
          <span class="confirm-meta">
            {{ assignTech.appt && assignTech.appt.vehicleYear }}
            {{ assignTech.appt && assignTech.appt.vehicleMake }}
            {{ assignTech.appt && assignTech.appt.vehicleModel }}
            · #{{ assignTech.appt && assignTech.appt.id }}
          </span>
        </div>

        <!-- Technician Dropdown -->
        <div class="tech-select-wrapper">
          <label class="tech-select-label">Diagnose Technician</label>
          <div class="custom-select-container">

            <!-- Loading state -->
            <p v-if="technicianLoading" class="tech-loading">Loading technicians...</p>

            <!-- Error state -->
            <p v-else-if="technicianError" class="reason-error">{{ technicianError }}</p>

            <!-- Dropdown -->
            <select
              v-else
              v-model="assignTech.selectedTech"
              class="tech-select"
            >
              <option value="" disabled>— Select a technician —</option>
              <option
                v-for="tech in technicians"
                :key="tech.ID"
                :value="tech.Name"
              >{{ tech.Name }}</option>
            </select>

          </div>
        </div>

        <p v-if="assignTech.showError" class="reason-error">Please select a technician to continue.</p>

        <div class="modal-actions confirm-actions">
          <button class="btn-secondary" @click="closeAssignTech">Go Back</button>
          <button class="btn-confirm-assign" @click="submitAssignTech">
            {{ assignTech.appt && assignTech.appt.diagnoseTech ? 'Confirm Change' : 'Confirm Assign' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Proceed Confirmation Modal -->
    <div v-if="proceedConfirm.isOpen" class="modal-overlay" @click="closeProceedConfirm">
      <div class="modal-content confirm-modal-content" @click.stop>
        <div class="confirm-icon confirm-icon--proceed">✓</div>
        <h2>Confirm Proceed</h2>
        <p class="confirm-desc">
          Are you sure you want to mark this appointment as <strong>proceeded</strong>?
        </p>
        <div class="confirm-appt-info">
          <span class="confirm-name">{{ proceedConfirm.appt.customerName }}</span>
          <span class="confirm-meta">{{ proceedConfirm.appt.vehicleYear }} {{ proceedConfirm.appt.vehicleMake }} {{ proceedConfirm.appt.vehicleModel }} · #{{ proceedConfirm.appt.id }}</span>
        </div>
        <div class="modal-actions confirm-actions">
          <button class="btn-secondary" @click="closeProceedConfirm">Go Back</button>
          <button class="btn-confirm-proceed" @click="submitProceed">Yes, Proceed</button>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="cancelConfirm.isOpen" class="modal-overlay" @click="closeCancelConfirm">
      <div class="modal-content confirm-modal-content" @click.stop>
        <div class="confirm-icon confirm-icon--cancel">✕</div>
        <h2>Cancel Appointment</h2>
        <p class="confirm-desc">
          Select a reason for cancelling this appointment.
        </p>
        <div class="confirm-appt-info">
          <span class="confirm-name">{{ cancelConfirm.appt.customerName }}</span>
          <span class="confirm-meta">{{ cancelConfirm.appt.vehicleYear }} {{ cancelConfirm.appt.vehicleMake }} {{ cancelConfirm.appt.vehicleModel }} · #{{ cancelConfirm.appt.id }}</span>
        </div>

        <div class="cancel-reasons">
          <label
            v-for="reason in cancelReasons"
            :key="reason"
            class="reason-option"
            :class="{ selected: cancelConfirm.reason === reason }"
          >
            <input
              type="radio"
              name="cancelReason"
              :value="reason"
              v-model="cancelConfirm.reason"
            />
            <span class="reason-label">{{ reason }}</span>
          </label>
        </div>

        <p v-if="cancelConfirm.showError" class="reason-error">Please select a reason to continue.</p>

        <div class="modal-actions confirm-actions">
          <button class="btn-secondary" @click="closeCancelConfirm">Go Back</button>
          <button class="btn-confirm-cancel" @click="submitCancel">Confirm Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'AppointmentsPage',
  data() {
    const today = new Date();
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x.toISOString().split('T')[0];
    };
    const todayStr = today.toISOString().split('T')[0];

    return {
      activeFilter: 'today',
      currentPage: 1,
      itemsPerPage: 5,
      specificDate: '',
      now: new Date(),
      filters: [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'week'  },
        { label: 'This Month', value: 'month' },
        { label: 'All',        value: 'all'   },
      ],

      // Technicians — populated from API
      technicians: [],
      technicianLoading: false,
      technicianError: '',

      modal: { isOpen: false, appt: null },
      assignTech: { isOpen: false, appt: null, selectedTech: '', showError: false },
      proceedConfirm: { isOpen: false, appt: null },
      cancelConfirm: { isOpen: false, appt: null, reason: '', showError: false },
      cancelReasons: ['Customer did not show up', 'Reschedule'],
      appointments: [
        { id: 101, licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',    price: 75,  status: 'appointment', appointmentDate: todayStr,           appointmentTime: '09:00 AM', duration: '45 min',  diagnoseTech: '',          notes: 'Customer requested synthetic oil.' },
        { id: 102, licensePlate: 'XYZ-5678', vehicleMake: 'Honda',   vehicleModel: 'Civic',    vehicleYear: '2023', customerName: 'Priya Nair',      price: 60,  status: 'appointment', appointmentDate: todayStr,           appointmentTime: '02:30 PM', duration: '1 hr',    diagnoseTech: 'Ryan Patel', notes: null },
        { id: 103, licensePlate: 'DEF-9012', vehicleMake: 'Ford',    vehicleModel: 'F-150',    vehicleYear: '2021', customerName: 'Marco Silva',     price: 50,  status: 'appointment', appointmentDate: addDays(today, 2),  appointmentTime: '10:00 AM', duration: '30 min',  diagnoseTech: '',          notes: null },
        { id: 104, licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell',  price: 200, status: 'appointment', appointmentDate: addDays(today, 4),  appointmentTime: '03:30 PM', duration: '2 hrs',   diagnoseTech: 'Chris Lee', notes: 'Front and rear brake pads.' },
        { id: 105, licensePlate: 'JKL-7890', vehicleMake: 'Tesla',   vehicleModel: 'Model 3',  vehicleYear: '2023', customerName: 'David Okafor',    price: 50,  status: 'appointment', appointmentDate: addDays(today, 5),  appointmentTime: '11:00 AM', duration: '1 hr',    diagnoseTech: '',          notes: null },
        { id: 106, licensePlate: 'MNO-1122', vehicleMake: 'Audi',    vehicleModel: 'A4',       vehicleYear: '2022', customerName: 'Lena Hoffmann',   price: 350, status: 'appointment', appointmentDate: addDays(today, 10), appointmentTime: '08:30 AM', duration: '3 hrs',   diagnoseTech: '',          notes: 'Annual full service and inspection.' },
        { id: 107, licensePlate: 'PQR-3344', vehicleMake: 'Mazda',   vehicleModel: 'CX-5',     vehicleYear: '2020', customerName: 'Tom Nguyen',      price: 120, status: 'appointment', appointmentDate: addDays(today, 14), appointmentTime: '01:00 PM', duration: '1.5 hrs', diagnoseTech: '',          notes: null },
      ],
    };
  },

  async mounted() {
    await this.fetchTechnicians();
    this._nowTimer = setInterval(() => { this.now = new Date(); }, 60000);
  },
  beforeUnmount() {
    clearInterval(this._nowTimer);
  },

  computed: {
    todayStr() {
      return new Date().toISOString().split('T')[0];
    },
    endOfWeekStr() {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + (6 - today.getDay()));
      return end.toISOString().split('T')[0];
    },
    endOfMonthStr() {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    },
    filteredAppointments() {
      let list = this.appointments;
      if (this.specificDate) {
        list = list.filter(a => a.appointmentDate === this.specificDate);
      } else if (this.activeFilter === 'today') {
        list = list.filter(a => a.appointmentDate === this.todayStr);
      } else if (this.activeFilter === 'week') {
        list = list.filter(a => a.appointmentDate >= this.todayStr && a.appointmentDate <= this.endOfWeekStr);
      } else if (this.activeFilter === 'month') {
        list = list.filter(a => a.appointmentDate >= this.todayStr && a.appointmentDate <= this.endOfMonthStr);
      }
      return [...list].sort((a, b) =>
        a.appointmentDate.localeCompare(b.appointmentDate) ||
        this.parseTime(a.appointmentTime) - this.parseTime(b.appointmentTime)
      );
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredAppointments.length / this.itemsPerPage));
    },
    paginatedAppointments() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredAppointments.slice(start, start + this.itemsPerPage);
    },
  },

  methods: {
    // ── Fetch technicians from API ──────────────────────────────────────
    async fetchTechnicians() {
      this.technicianLoading = true;
      this.technicianError = '';
      try {
        const res = await fetch('http://localhost:3000/api/technicians');
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

    isToday(date) {
      return date === this.todayStr;
    },
    isPast(date, time) {
      const [timePart, modifier] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier === 'AM' && hours === 12) hours = 0;
      if (modifier === 'PM' && hours !== 12) hours += 12;
      const apptDate = new Date(date + 'T00:00:00');
      apptDate.setHours(hours, minutes, 0, 0);
      return this.now > apptDate;
    },

    // Assign Tech
    openAssignTech(appt) {
      this.assignTech.appt = appt;
      this.assignTech.selectedTech = appt.diagnoseTech || '';
      this.assignTech.showError = false;
      this.assignTech.isOpen = true;
    },
    closeAssignTech() {
      this.assignTech.isOpen = false;
      this.assignTech.appt = null;
      this.assignTech.selectedTech = '';
      this.assignTech.showError = false;
    },
    submitAssignTech() {
      if (!this.assignTech.selectedTech) {
        this.assignTech.showError = true;
        return;
      }
      this.assignTech.appt.diagnoseTech = this.assignTech.selectedTech;
      console.log('Tech assigned:', this.assignTech.appt.id, '->', this.assignTech.selectedTech);
      this.closeAssignTech();
    },

    // Proceed
    openProceedConfirm(appt) {
      this.proceedConfirm.appt = appt;
      this.proceedConfirm.isOpen = true;
    },
    closeProceedConfirm() {
      this.proceedConfirm.isOpen = false;
      this.proceedConfirm.appt = null;
    },
    submitProceed() {
      this.proceedConfirm.appt.status = 'proceeded';
      console.log('Proceeded:', this.proceedConfirm.appt.id);
      this.closeProceedConfirm();
    },

    // Cancel
    openCancelConfirm(appt) {
      this.cancelConfirm.appt = appt;
      this.cancelConfirm.reason = '';
      this.cancelConfirm.showError = false;
      this.cancelConfirm.isOpen = true;
    },
    closeCancelConfirm() {
      this.cancelConfirm.isOpen = false;
      this.cancelConfirm.appt = null;
    },
    submitCancel() {
      if (!this.cancelConfirm.reason) {
        this.cancelConfirm.showError = true;
        return;
      }
      this.cancelConfirm.appt.status = 'cancelled';
      console.log('Cancelled:', this.cancelConfirm.appt.id, 'Reason:', this.cancelConfirm.reason);
      this.closeCancelConfirm();
    },

    setFilter(val) {
      this.activeFilter = val;
      this.specificDate = '';
      this.currentPage = 1;
    },
    onDateChange() {
      this.currentPage = 1;
    },
    clearDate() {
      this.specificDate = '';
      this.currentPage = 1;
    },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
    parseTime(timeStr) {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'AM' && hours === 12) hours = 0;
      if (modifier === 'PM' && hours !== 12) hours += 12;
      return hours * 60 + minutes;
    },
    openModal(appt) {
      this.modal.appt = appt;
      this.modal.isOpen = true;
    },
    closeModal() {
      this.modal.isOpen = false;
      this.modal.appt = null;
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    getDayName(date) {
      if (!date) return '';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    },
    formatStatus(status) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
  },
};
</script>

<style scoped src="@/assets/managerAppointments.css"></style>