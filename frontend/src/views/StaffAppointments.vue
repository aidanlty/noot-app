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
          </div>
        </div>
        <div class="appt-actions">
          <button class="btn-view" @click="openModal(appt)">View</button>
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

    <!-- Modal -->
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
      filters: [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'week'  },
        { label: 'This Month', value: 'month' },
        { label: 'All',        value: 'all'   },
      ],
      modal: { isOpen: false, appt: null },
      appointments: [
        { id: 101, licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',    price: 75,  status: 'appointment', appointmentDate: todayStr,           appointmentTime: '09:00 AM', duration: '45 min',  notes: 'Customer requested synthetic oil.' },
        { id: 102, licensePlate: 'XYZ-5678', vehicleMake: 'Honda',   vehicleModel: 'Civic',    vehicleYear: '2023', customerName: 'Priya Nair',      price: 60,  status: 'appointment', appointmentDate: todayStr,           appointmentTime: '02:30 PM', duration: '1 hr',    notes: null },
        { id: 103, licensePlate: 'DEF-9012', vehicleMake: 'Ford',    vehicleModel: 'F-150',    vehicleYear: '2021', customerName: 'Marco Silva',     price: 50,  status: 'appointment', appointmentDate: addDays(today, 2),  appointmentTime: '10:00 AM', duration: '30 min',  notes: null },
        { id: 104, licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell',  price: 200, status: 'appointment', appointmentDate: addDays(today, 4),  appointmentTime: '03:30 PM', duration: '2 hrs',   notes: 'Front and rear brake pads.' },
        { id: 105, licensePlate: 'JKL-7890', vehicleMake: 'Tesla',   vehicleModel: 'Model 3',  vehicleYear: '2023', customerName: 'David Okafor',    price: 50,  status: 'appointment', appointmentDate: addDays(today, 5),  appointmentTime: '11:00 AM', duration: '1 hr',    notes: null },
        { id: 106, licensePlate: 'MNO-1122', vehicleMake: 'Audi',    vehicleModel: 'A4',       vehicleYear: '2022', customerName: 'Lena Hoffmann',   price: 350, status: 'appointment', appointmentDate: addDays(today, 10), appointmentTime: '08:30 AM', duration: '3 hrs',   notes: 'Annual full service and inspection.' },
        { id: 107, licensePlate: 'PQR-3344', vehicleMake: 'Mazda',   vehicleModel: 'CX-5',     vehicleYear: '2020', customerName: 'Tom Nguyen',      price: 120, status: 'appointment', appointmentDate: addDays(today, 14), appointmentTime: '01:00 PM', duration: '1.5 hrs', notes: null },
      ],
    };
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
    isToday(date) {
      return date === this.todayStr;
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

<style scoped>
/* ── Container ── */
.appointments-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* ── Header ── */
.appointments-header {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
}
.appointments-header h1 {
  font-size: 2.2rem;
  color: #FFD700;
  margin: 0;
  font-weight: 700;
}

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1.2rem;
  border: 1px solid #2a2a2a;
  background: #1c1c1c;
  color: #888888;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.filter-btn:hover {
  border-color: #FFD700;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.06);
}
.filter-btn.active {
  background: #FFD700;
  color: #111111;
  border-color: #FFD700;
  font-weight: 700;
}

/* ── Date Filter ── */
.date-filter {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.date-input {
  padding: 0.5rem 0.9rem;
  border: 1px solid #2a2a2a;
  background: #1c1c1c;
  color: #888888;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}
.date-input:hover {
  border-color: #FFD700;
  color: #e0e0e0;
}
.date-input:focus {
  border-color: #FFD700;
  color: #e0e0e0;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}
.date-input.active {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
}
.date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}
.date-input.active::-webkit-calendar-picker-indicator {
  filter: invert(0.8) sepia(1) saturate(5) hue-rotate(0deg);
}

.clear-date {
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}
.clear-date:hover {
  background: rgba(255, 215, 0, 0.25);
}

/* ── Count ── */
.appt-count {
  margin-left: auto;
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ── Empty State ── */
.empty-state {
  background: #1c1c1c;
  border: 1px dashed #2e2e2e;
  border-radius: 10px;
  padding: 2rem;
  color: #555555;
  font-size: 0.9rem;
  text-align: center;
}

/* ── List ── */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Card ── */
.appt-card {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.appt-card:hover {
  transform: translateX(4px);
  border-color: #3a3a3a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.today-card {
  border-color: rgba(255, 215, 0, 0.25);
}
.today-card:hover {
  border-color: #FFD700;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1);
}

/* ── Time Column ── */
.appt-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: #141414;
  min-width: 90px;
  gap: 0.25rem;
}
.appt-day {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888888;
}
.appt-time {
  font-size: 0.9rem;
  font-weight: 700;
  color: #FFD700;
  white-space: nowrap;
}

/* ── Divider ── */
.appt-divider {
  width: 2px;
  align-self: stretch;
  background: #2e2e2e;
}
.today-card .appt-divider {
  background: rgba(255, 215, 0, 0.3);
}

/* ── Body ── */
.appt-body {
  flex: 1;
  padding: 1rem 1.25rem;
}
.appt-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
}
.appt-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
}
.appt-id {
  font-size: 0.78rem;
  color: #444444;
}
.appt-vehicle {
  font-size: 0.85rem;
  color: #888888;
  margin: 0 0 0.6rem;
}
.appt-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
}
.date-tag {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}
.duration-tag {
  background: rgba(255, 215, 0, 0.08);
  color: #888888;
}

/* ── Actions ── */
.appt-actions {
  padding: 0 1.25rem;
}
.btn-view {
  padding: 0.5rem 1.1rem;
  background: #FFD700;
  color: #111111;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.15s ease;
}
.btn-view:hover {
  background: #e6c200;
  transform: scale(1.05);
}

/* ── Pagination ── */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
}
.pagination-btn {
  padding: 0.55rem 1.2rem;
  border: 1px solid #FFD700;
  background: transparent;
  color: #FFD700;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.pagination-btn:hover:not(:disabled) {
  background: #FFD700;
  color: #111111;
  transform: scale(1.05);
}
.pagination-btn:disabled {
  border-color: #333333;
  color: #444444;
  cursor: not-allowed;
  opacity: 0.5;
}
.pagination-info {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.pagination-page {
  padding: 0.45rem 0.75rem;
  border: 1px solid #2a2a2a;
  background: #141414;
  color: #888888;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  min-width: 36px;
  text-align: center;
  transition: all 0.2s ease;
}
.pagination-page:hover {
  border-color: #FFD700;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.08);
}
.pagination-page.active {
  background: #FFD700;
  color: #111111;
  border-color: #FFD700;
  font-weight: 700;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}
.modal-content h2 {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0 0 1.5rem;
  font-weight: 600;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
}
.modal-close:hover { color: #FFD700; }

.modal-body { margin-bottom: 1.5rem; }
.detail-group { margin-bottom: 1.1rem; }
.detail-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666666;
  margin-bottom: 0.3rem;
}
.detail-group p {
  color: #e0e0e0;
  margin: 0;
  font-size: 0.95rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-secondary {
  padding: 0.6rem 1.4rem;
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #aaaaaa;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-secondary:hover { border-color: #666666; color: #ffffff; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .appointments-container { padding: 1rem; }
  .appointments-header h1 { font-size: 1.7rem; }
  .appt-time-col { min-width: 70px; padding: 1rem 0.75rem; }
  .appt-body { padding: 0.85rem 1rem; }
  .appt-actions { padding: 0 0.75rem; }
  .appt-title { font-size: 0.95rem; }
  .appt-count { margin-left: 0; width: 100%; }
  .pagination-container { flex-wrap: wrap; gap: 0.75rem; padding: 1rem; }
  .pagination-btn { padding: 0.5rem 1rem; font-size: 0.8rem; }
}
</style>

<style scoped>
/* ── Container ── */
.appointments-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* ── Header ── */
.appointments-header {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
}
.appointments-header h1 {
  font-size: 2.2rem;
  color: #FFD700;
  margin: 0;
  font-weight: 700;
}

/* ── Filter Bar ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1.2rem;
  border: 1px solid #2a2a2a;
  background: #1c1c1c;
  color: #888888;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.filter-btn:hover {
  border-color: #FFD700;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.06);
}
.filter-btn.active {
  background: #FFD700;
  color: #111111;
  border-color: #FFD700;
  font-weight: 700;
}

/* ── Date Filter ── */
.date-filter {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.date-input {
  padding: 0.5rem 0.9rem;
  border: 1px solid #2a2a2a;
  background: #1c1c1c;
  color: #888888;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}
.date-input:hover {
  border-color: #FFD700;
  color: #e0e0e0;
}
.date-input:focus {
  border-color: #FFD700;
  color: #e0e0e0;
  box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
}
.date-input.active {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
  color: #FFD700;
}
.date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
  cursor: pointer;
}
.date-input.active::-webkit-calendar-picker-indicator {
  filter: invert(0.8) sepia(1) saturate(5) hue-rotate(0deg);
}

.clear-date {
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #FFD700;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}
.clear-date:hover {
  background: rgba(255, 215, 0, 0.25);
}

/* ── Count ── */
.appt-count {
  margin-left: auto;
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ── Empty State ── */
.empty-state {
  background: #1c1c1c;
  border: 1px dashed #2e2e2e;
  border-radius: 10px;
  padding: 2rem;
  color: #555555;
  font-size: 0.9rem;
  text-align: center;
}

/* ── List ── */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Card ── */
.appt-card {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.appt-card:hover {
  transform: translateX(4px);
  border-color: #3a3a3a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.today-card {
  border-color: rgba(255, 215, 0, 0.25);
}
.today-card:hover {
  border-color: #FFD700;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1);
}

/* ── Time Column ── */
.appt-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: #141414;
  min-width: 90px;
  gap: 0.25rem;
}
.appt-day {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888888;
}
.appt-time {
  font-size: 0.9rem;
  font-weight: 700;
  color: #FFD700;
  white-space: nowrap;
}

/* ── Divider ── */
.appt-divider {
  width: 2px;
  align-self: stretch;
  background: #2e2e2e;
}
.today-card .appt-divider {
  background: rgba(255, 215, 0, 0.3);
}

/* ── Body ── */
.appt-body {
  flex: 1;
  padding: 1rem 1.25rem;
}
.appt-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
}
.appt-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
}
.appt-id {
  font-size: 0.78rem;
  color: #444444;
}
.appt-vehicle {
  font-size: 0.85rem;
  color: #888888;
  margin: 0 0 0.6rem;
}
.appt-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
}
.date-tag {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}
.duration-tag {
  background: rgba(255, 215, 0, 0.08);
  color: #888888;
}

/* ── Actions ── */
.appt-actions {
  padding: 0 1.25rem;
}
.btn-view {
  padding: 0.5rem 1.1rem;
  background: #FFD700;
  color: #111111;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.15s ease;
}
.btn-view:hover {
  background: #e6c200;
  transform: scale(1.05);
}

/* ── Pagination ── */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 10px;
}
.pagination-btn {
  padding: 0.55rem 1.2rem;
  border: 1px solid #FFD700;
  background: transparent;
  color: #FFD700;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.pagination-btn:hover:not(:disabled) {
  background: #FFD700;
  color: #111111;
  transform: scale(1.05);
}
.pagination-btn:disabled {
  border-color: #333333;
  color: #444444;
  cursor: not-allowed;
  opacity: 0.5;
}
.pagination-info {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.pagination-page {
  padding: 0.45rem 0.75rem;
  border: 1px solid #2a2a2a;
  background: #141414;
  color: #888888;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  min-width: 36px;
  text-align: center;
  transition: all 0.2s ease;
}
.pagination-page:hover {
  border-color: #FFD700;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.08);
}
.pagination-page.active {
  background: #FFD700;
  color: #111111;
  border-color: #FFD700;
  font-weight: 700;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-content {
  background: #1c1c1c;
  border: 1px solid #2e2e2e;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
}
.modal-content h2 {
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0 0 1.5rem;
  font-weight: 600;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: color 0.2s;
}
.modal-close:hover { color: #FFD700; }

.modal-body { margin-bottom: 1.5rem; }
.detail-group { margin-bottom: 1.1rem; }
.detail-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666666;
  margin-bottom: 0.3rem;
}
.detail-group p {
  color: #e0e0e0;
  margin: 0;
  font-size: 0.95rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-secondary {
  padding: 0.6rem 1.4rem;
  background: transparent;
  border: 1px solid #3a3a3a;
  color: #aaaaaa;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-secondary:hover { border-color: #666666; color: #ffffff; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .appointments-container { padding: 1rem; }
  .appointments-header h1 { font-size: 1.7rem; }
  .appt-time-col { min-width: 70px; padding: 1rem 0.75rem; }
  .appt-body { padding: 0.85rem 1rem; }
  .appt-actions { padding: 0 0.75rem; }
  .appt-title { font-size: 0.95rem; }
  .appt-count { margin-left: 0; width: 100%; }
  .pagination-container { flex-wrap: wrap; gap: 0.75rem; padding: 1rem; }
  .pagination-btn { padding: 0.5rem 1rem; font-size: 0.8rem; }
}
</style>