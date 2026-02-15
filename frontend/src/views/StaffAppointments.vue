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

<style scoped src="@/assets/staffAppointments.css"></style>