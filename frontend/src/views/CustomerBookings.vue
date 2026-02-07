<template>
  <div class="bookings-container">
    <div class="bookings-header">
      <h1>My Bookings</h1>
      <p class="total-bookings">Total Bookings: {{ filteredAndSortedBookings.length }}</p>
    </div>

    <!-- Filter and Sort Controls -->
    <div class="filter-sort-container">
      <div class="filter-group">
        <label class="filter-label">Filter by Status:</label>
        <div class="filter-buttons">
          <button 
            v-for="status in ['all', 'appointment', 'completed', 'pending', 'cancelled']"
            :key="status"
            class="filter-btn"
            :class="{ active: statusFilter === status }"
            @click="applyFilter(status)"
          >
            {{ status === 'all' ? 'All' : formatStatus(status) }}
          </button>
        </div>
      </div>

      <div class="sort-group">
        <label class="sort-label">Sort by Booking Date:</label>
        <button 
          class="sort-btn"
          :class="{ asc: sortOrder === 'asc', desc: sortOrder === 'desc' }"
          @click="toggleSortOrder"
        >
          {{ sortOrder === 'asc' ? '↑ Ascending (Oldest First)' : '↓ Descending (Newest First)' }}
        </button>
      </div>
    </div>

    <div v-if="bookings.length === 0" class="no-bookings">
      <p>You have no bookings yet.</p>
    </div>

    <div v-else class="bookings-list">
      <div
        v-for="booking in paginatedBookings"
        :key="booking.id"
        class="booking-row"
      >
        <!-- Status Badge -->
        <div class="row-status">
          <span :class="['status-badge', `status-${booking.status}`]">
            {{ formatStatus(booking.status) }}
          </span>
        </div>

        <!-- Booking Details -->
        <div class="row-content">
          <div class="content-main">
            <div class="booking-title">
              <h3>{{ booking.vehicleYear }} {{ booking.vehicleMake }} {{ booking.vehicleModel }}</h3>
              <span class="booking-id">#{{ booking.id }}</span>
            </div>

            <div class="booking-details">
              <div class="detail-item">
                <span class="detail-label">License Plate:</span>
                <span class="detail-value">{{ booking.licensePlate }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Price:</span>
                <span class="detail-value">${{ booking.price }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Booking Date:</span>
                <span class="detail-value">{{ formatDate(booking.bookedDate) }}</span>
              </div>

              <!-- Appointment Details (Only show if status is "appointment") -->
              <div v-if="booking.status === 'appointment'" class="appointment-details">
                <div class="detail-item appointment-item">
                  <span class="detail-label">📅 Appointment Date:</span>
                  <span class="detail-value">{{ formatDate(booking.appointmentDate) }}</span>
                </div>
                <div class="detail-item appointment-item">
                  <span class="detail-label">🕐 Appointment Time:</span>
                  <span class="detail-value">{{ booking.appointmentTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="row-actions">
            <button class="btn-view" @click="openModal('view', booking)">View Details</button>
            <button v-if="booking.status === 'appointment'" class="btn-edit" @click="openModal('edit', booking)">
              Edit Appointment
            </button>
            <button v-if="booking.status === 'appointment'" class="btn-cancel" @click="openModal('cancel', booking)">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination Navigator -->
      <div class="pagination-container">
        <button 
          class="pagination-btn" 
          @click="prevPage" 
          :disabled="currentPage === 1"
        >
          ← Previous
        </button>

        <div class="pagination-info">
          <button 
            v-for="page in totalPages"
            :key="page"
            class="pagination-page"
            :class="{ active: currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button 
          class="pagination-btn" 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
        >
          Next →
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal.isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">&times;</button>

        <!-- View Details Modal -->
        <div v-if="modal.type === 'view'">
          <h2>Booking Details</h2>
          <div class="modal-body">
            <div class="detail-group">
              <label>Vehicle:</label>
              <p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }} {{ modal.booking.vehicleModel }}</p>
            </div>
            <div class="detail-group">
              <label>License Plate:</label>
              <p>{{ modal.booking.licensePlate }}</p>
            </div>
            <div class="detail-group">
              <label>Booking ID:</label>
              <p>#{{ modal.booking.id }}</p>
            </div>
            <div class="detail-group">
              <label>Status:</label>
              <p>{{ formatStatus(modal.booking.status) }}</p>
            </div>
            <div class="detail-group">
              <label>Booking Date:</label>
              <p>{{ formatDate(modal.booking.bookedDate) }}</p>
            </div>
            <div class="detail-group">
              <label>Price:</label>
              <p>${{ modal.booking.price }}</p>
            </div>
            <div v-if="modal.booking.status === 'appointment'" class="detail-group">
              <label>Appointment Date:</label>
              <p>{{ formatDate(modal.booking.appointmentDate) }}</p>
            </div>
            <div v-if="modal.booking.status === 'appointment'" class="detail-group">
              <label>Appointment Time:</label>
              <p>{{ modal.booking.appointmentTime }}</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Close</button>
          </div>
        </div>

        <!-- Edit Appointment Modal -->
        <div v-if="modal.type === 'edit'">
          <h2>Edit Appointment</h2>
          <div class="modal-body">
            <div class="form-group">
              <label>Vehicle:</label>
              <input type="text" :value="`${modal.booking.vehicleYear} ${modal.booking.vehicleMake} ${modal.booking.vehicleModel}`" disabled>
            </div>
            <div class="form-group">
              <label>Appointment Date:</label>
              <input type="date" v-model="editForm.appointmentDate">
            </div>
            <div class="form-group">
              <label>Appointment Time:</label>
              <input type="time" v-model="editForm.appointmentTime">
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="saveAppointment">Save Changes</button>
          </div>
        </div>

        <!-- Cancel Appointment Modal -->
        <div v-if="modal.type === 'cancel'">
          <h2>Cancel Appointment</h2>
          <div class="modal-body">
            <p>Are you sure you want to cancel this appointment?</p>
            <div class="detail-group">
              <label>Vehicle:</label>
              <p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }} {{ modal.booking.vehicleModel }}</p>
            </div>
            <div class="detail-group">
              <label>Appointment Date:</label>
              <p>{{ formatDate(modal.booking.appointmentDate) }}</p>
            </div>
            <div class="detail-group">
              <label>Appointment Time:</label>
              <p>{{ modal.booking.appointmentTime }}</p>
            </div>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">Keep Appointment</button>
            <button class="btn-danger" @click="confirmCancel">Yes, Cancel Appointment</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VehicleBookingsView',
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 5,
      statusFilter: 'all', // 'all', 'appointment', 'completed', 'pending', 'cancelled'
      sortOrder: 'desc', // 'asc' for ascending, 'desc' for descending
      modal: {
        isOpen: false,
        type: null, // 'view', 'edit', or 'cancel'
        booking: null,
      },
      editForm: {
        appointmentDate: '',
        appointmentTime: '',
      },
      bookings: [
        {
          id: 1,
          licensePlate: 'ABC-1234',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: '2022',
          serviceType: 'Oil Change',
          price: 75,
          status: 'appointment',
          bookedDate: '2026-02-05',
          appointmentDate: '2026-02-15',
          appointmentTime: '10:30 AM',
        },
        {
          id: 2,
          licensePlate: 'XYZ-5678',
          vehicleMake: 'Honda',
          vehicleModel: 'Civic',
          vehicleYear: '2023',
          serviceType: 'Tire Rotation',
          price: 120,
          status: 'completed',
          bookedDate: '2026-01-20',
          appointmentDate: '2026-02-01',
          appointmentTime: '02:00 PM',
        },
        {
          id: 3,
          licensePlate: 'DEF-9012',
          vehicleMake: 'Ford',
          vehicleModel: 'F-150',
          vehicleYear: '2021',
          serviceType: 'Battery Replacement',
          price: 150,
          status: 'pending',
          bookedDate: '2026-02-03',
          appointmentDate: null,
          appointmentTime: null,
        },
        {
          id: 4,
          licensePlate: 'GHI-3456',
          vehicleMake: 'BMW',
          vehicleModel: '3 Series',
          vehicleYear: '2024',
          serviceType: 'Brake Service',
          price: 200,
          status: 'appointment',
          bookedDate: '2026-02-01',
          appointmentDate: '2026-02-20',
          appointmentTime: '03:30 PM',
        },
        {
          id: 5,
          licensePlate: 'JKL-7890',
          vehicleMake: 'Tesla',
          vehicleModel: 'Model 3',
          vehicleYear: '2023',
          serviceType: 'Alignment Check',
          price: 50,
          status: 'cancelled',
          bookedDate: '2026-01-15',
          appointmentDate: '2026-02-10',
          appointmentTime: '06:00 PM',
        },
      ],
    };
  },
  computed: {
    filteredAndSortedBookings() {
      // Filter by status
      let filtered = this.bookings.filter(booking => {
        if (this.statusFilter === 'all') {
          return true;
        }
        return booking.status === this.statusFilter;
      });

      // Sort by booking date
      filtered.sort((a, b) => {
        const dateA = new Date(a.bookedDate);
        const dateB = new Date(b.bookedDate);
        
        if (this.sortOrder === 'asc') {
          return dateA - dateB; // Oldest first
        } else {
          return dateB - dateA; // Newest first
        }
      });

      return filtered;
    },
    paginatedBookings() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.filteredAndSortedBookings.slice(startIndex, endIndex);
    },
    totalPages() {
      return Math.ceil(this.filteredAndSortedBookings.length / this.itemsPerPage);
    },
  },
  methods: {
    openModal(type, booking) {
      this.modal.type = type;
      this.modal.booking = booking;
      this.modal.isOpen = true;

      // Pre-fill edit form with current appointment details
      if (type === 'edit') {
        this.editForm.appointmentDate = booking.appointmentDate;
        this.editForm.appointmentTime = booking.appointmentTime;
      }
    },
    closeModal() {
      this.modal.isOpen = false;
      this.modal.type = null;
      this.modal.booking = null;
      this.editForm = {
        appointmentDate: '',
        appointmentTime: '',
      };
    },
    saveAppointment() {
      // Find and update the booking
      const bookingIndex = this.bookings.findIndex(b => b.id === this.modal.booking.id);
      if (bookingIndex !== -1) {
        this.bookings[bookingIndex].appointmentDate = this.editForm.appointmentDate;
        this.bookings[bookingIndex].appointmentTime = this.editForm.appointmentTime;
      }
      alert('Appointment updated successfully!');
      this.closeModal();
    },
    confirmCancel() {
      // Find and update the booking status to cancelled
      const bookingIndex = this.bookings.findIndex(b => b.id === this.modal.booking.id);
      if (bookingIndex !== -1) {
        this.bookings[bookingIndex].status = 'cancelled';
      }
      alert('Appointment cancelled successfully!');
      this.closeModal();
    },
    formatStatus(status) {
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    formatDate(date) {
      if (!date) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(date).toLocaleDateString('en-US', options);
    },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    applyFilter(status) {
      this.statusFilter = status;
      this.currentPage = 1; // Reset to first page when filter changes
    },
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.currentPage = 1; // Reset to first page when sort changes
    },
  },
};
</script>


<style scoped src="@/assets/customerBookings.css"></style>
