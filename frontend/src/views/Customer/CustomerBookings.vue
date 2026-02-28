<template>
  <div class="bookings-container">

    <!-- Header -->
    <div class="bookings-header">
      <h1>My Bookings</h1>

      <!-- Tabs -->
      <div class="tab-switcher">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'appointments' }"
          @click="switchTab('appointments')"
        >
          Appointments
          <span class="tab-count">{{ filteredAndSortedBookings.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'activejobs' }"
          @click="switchTab('activejobs')"
        >
          Active Jobs
          <span class="tab-count">{{ filteredJobCards.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'finishedjobs' }"
          @click="switchTab('finishedjobs')"
        >
          Finished Jobs
          <span class="tab-count">{{ filteredFinishedJobs.length }}</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  TAB 1 — APPOINTMENTS                                       -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'appointments'">

      <div class="filter-sort-container">
        <div class="filter-group">
          <label class="filter-label">Filter by Status:</label>
          <div class="filter-buttons">
            <button
              v-for="f in appointmentFilters"
              :key="f.value"
              class="filter-btn"
              :class="['filter-btn--' + f.value, { active: statusFilter === f.value }]"
              @click="applyFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="statusFilter === 'upcoming'" class="sort-group">
          <label class="sort-label">Sort by Appointment Time:</label>
          <button
            class="sort-btn"
            :class="{ asc: upcomingSortOrder === 'asc', desc: upcomingSortOrder === 'desc' }"
            @click="toggleUpcomingSortOrder"
          >
            {{ upcomingSortOrder === 'asc' ? '↑ Ascending (Soonest First)' : '↓ Descending (Latest First)' }}
          </button>
        </div>

        <div v-if="statusFilter !== 'upcoming' && statusFilter !== 'ongoing'" class="sort-group">
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
          :class="{ 'booking-row--next-up': statusFilter === 'upcoming' && booking.id === nextUpBookingId }"
        >
          <div v-if="statusFilter === 'upcoming' && booking.id === nextUpBookingId" class="next-up-banner">
            <span class="next-up-pulse"></span>
            Next Up
          </div>

          <div class="row-status">
            <span :class="['status-badge', `status-${booking.status}`]">
              {{ formatStatus(booking.status) }}
            </span>
          </div>

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
            <div class="row-actions">
              <button class="btn-view" @click="openModal('view', booking)">View Details</button>
              <button v-if="booking.status === 'appointment'" class="btn-edit" @click="openModal('edit', booking)">Edit Appointment</button>
              <button
                v-if="booking.status === 'appointment'"
                class="btn-cancel"
                :class="{ 'btn-cancel--disabled': !canCancelBooking(booking) }"
                :disabled="!canCancelBooking(booking)"
                :title="!canCancelBooking(booking) ? 'Cancellations are not allowed within 2 days of the appointment' : 'Cancel this appointment'"
                @click="openModal('cancel', booking)"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div class="pagination-container">
          <button class="pagination-btn" @click="prevPage" :disabled="currentPage === 1">← Previous</button>
          <div class="pagination-info">
            <button v-for="page in totalPages" :key="page" class="pagination-page" :class="{ active: currentPage === page }" @click="goToPage(page)">{{ page }}</button>
          </div>
          <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Next →</button>
        </div>
      </div>

      <div v-if="modal.isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal">&times;</button>

          <div v-if="modal.type === 'view'">
            <h2>Booking Details</h2>
            <div class="modal-body">
              <div class="detail-group"><label>Vehicle:</label><p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }} {{ modal.booking.vehicleModel }}</p></div>
              <div class="detail-group"><label>License Plate:</label><p>{{ modal.booking.licensePlate }}</p></div>
              <div class="detail-group"><label>Booking ID:</label><p>#{{ modal.booking.id }}</p></div>
              <div class="detail-group"><label>Status:</label><p>{{ formatStatus(modal.booking.status) }}</p></div>
              <div class="detail-group"><label>Booking Date:</label><p>{{ formatDate(modal.booking.bookedDate) }}</p></div>
              <div class="detail-group"><label>Price:</label><p>${{ modal.booking.price }}</p></div>
              <div v-if="modal.booking.status === 'appointment'" class="detail-group"><label>Appointment Date:</label><p>{{ formatDate(modal.booking.appointmentDate) }}</p></div>
              <div v-if="modal.booking.status === 'appointment'" class="detail-group"><label>Appointment Time:</label><p>{{ modal.booking.appointmentTime }}</p></div>
            </div>
            <div class="modal-actions"><button class="btn-secondary" @click="closeModal">Close</button></div>
          </div>

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

          <div v-if="modal.type === 'cancel'">
            <h2>Cancel Appointment</h2>
            <div class="modal-body">
              <p>Are you sure you want to cancel this appointment?</p>
              <div class="detail-group"><label>Vehicle:</label><p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }} {{ modal.booking.vehicleModel }}</p></div>
              <div class="detail-group"><label>Appointment Date:</label><p>{{ formatDate(modal.booking.appointmentDate) }}</p></div>
              <div class="detail-group"><label>Appointment Time:</label><p>{{ modal.booking.appointmentTime }}</p></div>
              <p class="warning-text">This action cannot be undone.</p>
            </div>
            <div class="modal-actions">
              <button class="btn-secondary" @click="closeModal">Keep Appointment</button>
              <button
                class="btn-danger"
                :disabled="!canCancelBooking(modal.booking)"
                @click="confirmCancel"
              >
                Yes, Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  TAB 2 — ACTIVE JOBS                                        -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'activejobs'">

      <div class="jc-filter-bar">
        <div class="jc-filter-row">
          <div class="jc-filter-row-label">Status</div>
          <div class="jc-filter-row-controls">
            <button class="jc-filter-btn jc-status-filter-btn" :class="{ active: activeJobStatusFilter === '' }" @click="setJobStatusFilter('')">All</button>
            <button
              v-for="s in activeJobStatuses"
              :key="s.value"
              class="jc-filter-btn jc-status-filter-btn"
              :class="['jc-status-btn--' + s.value, { active: activeJobStatusFilter === s.value }]"
              @click="setJobStatusFilter(s.value)"
            >{{ s.label }}</button>
          </div>
        </div>
        <div class="jc-count-row">
          <span class="jc-count">{{ filteredJobCards.length }} job{{ filteredJobCards.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div v-if="filteredJobCards.length === 0" class="jc-empty-state">No active jobs found.</div>

      <div v-else class="jc-list">
        <div v-for="job in paginatedJobCards" :key="job.id" class="jc-card">
          <div class="jc-status-col" :class="'jc-status-col--' + job.status">
            <span class="jc-card-day">{{ getDayName(job.jobDate) }}</span>
            <span class="jc-status-badge" :class="'jc-status-badge--' + job.status">{{ getStatusLabel(job.status) }}</span>
          </div>
          <div class="jc-divider" :class="'jc-divider--' + job.status"></div>
          <div class="jc-card-body">
            <div class="jc-card-top">
              <h3 class="jc-card-name">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }}</h3>
              <span class="jc-card-id">#{{ job.id }}</span>
            </div>
            <p class="jc-card-vehicle">{{ job.licensePlate }}</p>
            <div class="jc-card-meta">
              <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
              <span v-if="job.status !== 'diagnose'" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceType }}</span>
              <template v-if="job.status !== 'diagnose'">
                <span v-if="job.parts && job.parts.length" class="jc-meta-tag jc-meta-tag--parts">🔩 {{ job.parts.length }} part{{ job.parts.length !== 1 ? 's' : '' }}</span>
                <span v-if="job.services && job.services.length" class="jc-meta-tag jc-meta-tag--services">🔧 {{ job.services.length }} service{{ job.services.length !== 1 ? 's' : '' }}</span>
              </template>
              <template v-if="job.status === 'diagnose'">
                <span v-if="job.diagnoseTechnician" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.diagnoseTechnician }}</span>
                <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
              </template>
              <template v-if="job.status === 'service'">
                <span v-if="job.serviceTechnician" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.serviceTechnician }}</span>
                <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
              </template>
            </div>
          </div>
          <div class="jc-card-actions">
            <button class="jc-btn-view" @click="openJobModal(job)">View</button>
          </div>
        </div>
      </div>

      <div v-if="totalJobPages > 1" class="jc-pagination">
        <button class="jc-pagination-btn" @click="prevJobPage" :disabled="currentJobPage === 1">← Previous</button>
        <div class="jc-pagination-pages">
          <button v-for="page in totalJobPages" :key="page" class="jc-pagination-page" :class="{ active: currentJobPage === page }" @click="goToJobPage(page)">{{ page }}</button>
        </div>
        <button class="jc-pagination-btn" @click="nextJobPage" :disabled="currentJobPage === totalJobPages">Next →</button>
      </div>

      <!-- Active Job View Modal -->
      <div v-if="jobModal.isOpen" class="jc-modal-overlay" @click="closeJobModal">
        <div class="jc-modal" @click.stop>
          <button class="jc-modal-close" @click="closeJobModal">&times;</button>
          <h2>Job Details</h2>
          <div class="jc-modal-body">
            <div class="jc-detail-group">
              <label>Status</label>
              <p><span class="jc-status-badge" :class="'jc-status-badge--' + jobModal.job.status">{{ getStatusLabel(jobModal.job.status) }}</span></p>
            </div>
            <div class="jc-detail-group"><label>Vehicle</label><p>{{ jobModal.job.vehicleYear }} {{ jobModal.job.vehicleMake }} {{ jobModal.job.vehicleModel }}</p></div>
            <div class="jc-detail-group"><label>License Plate</label><p>{{ jobModal.job.licensePlate }}</p></div>
            <div class="jc-detail-group"><label>Job Date</label><p>{{ formatDate(jobModal.job.jobDate) }}</p></div>
            <div v-if="jobModal.job.status !== 'diagnose'" class="jc-detail-group"><label>Service Type</label><p>{{ jobModal.job.serviceType }}</p></div>
            <div class="jc-detail-group"><label>Estimated Cost</label><p>${{ jobModal.job.estimatedCost }}</p></div>

            <div class="jc-detail-group">
              <label>Diagnose Technician</label>
              <div v-if="jobModal.job.diagnoseTechnician">
                <p>{{ jobModal.job.diagnoseTechnician }}</p>
                <div class="jc-tech-contact" v-if="getTechContact(jobModal.job.diagnoseTechnician)">
                  <span class="jc-tech-contact-item">✉️ {{ getTechContact(jobModal.job.diagnoseTechnician).email }}</span>
                  <span class="jc-tech-contact-item">📞 {{ getTechContact(jobModal.job.diagnoseTechnician).phone }}</span>
                </div>
              </div>
              <p v-else class="jc-not-assigned">Not Assigned</p>
            </div>

            <div class="jc-detail-group">
              <label>Service Technician</label>
              <div v-if="jobModal.job.serviceTechnician">
                <p>{{ jobModal.job.serviceTechnician }}</p>
                <div class="jc-tech-contact" v-if="getTechContact(jobModal.job.serviceTechnician)">
                  <span class="jc-tech-contact-item">✉️ {{ getTechContact(jobModal.job.serviceTechnician).email }}</span>
                  <span class="jc-tech-contact-item">📞 {{ getTechContact(jobModal.job.serviceTechnician).phone }}</span>
                </div>
              </div>
              <p v-else class="jc-not-assigned">Not Assigned</p>
            </div>

            <div v-if="jobModal.job.status !== 'diagnose' && jobModal.job.parts && jobModal.job.parts.length" class="jc-detail-group">
              <label>Parts</label>
              <div class="jc-item-list">
                <div v-for="(part, i) in jobModal.job.parts" :key="i" class="jc-item-row">
                  <span class="jc-item-name">{{ part.name }}</span>
                  <span class="jc-item-price">${{ part.price }}</span>
                </div>
              </div>
            </div>

            <div v-if="jobModal.job.status !== 'diagnose' && jobModal.job.services && jobModal.job.services.length" class="jc-detail-group">
              <label>Services</label>
              <div class="jc-item-list">
                <div v-for="(svc, i) in jobModal.job.services" :key="i" class="jc-item-row">
                  <span class="jc-item-name">{{ svc.name }}</span>
                  <span class="jc-item-price">${{ svc.price }}</span>
                </div>
              </div>
            </div>

            <div v-if="jobModal.job.notes" class="jc-detail-group"><label>Notes</label><p>{{ jobModal.job.notes }}</p></div>
          </div>
          <div class="jc-modal-actions">
            <button class="jc-btn-secondary" @click="closeJobModal">Close</button>
          </div>
        </div>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  TAB 3 — FINISHED JOBS                                      -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'finishedjobs'">

      <div class="jc-filter-bar">
        <div class="jc-filter-row">
          <div class="jc-filter-row-label">Status</div>
          <div class="jc-filter-row-controls">
            <button class="jc-filter-btn jc-status-filter-btn" :class="{ active: finishedStatusFilter === '' }" @click="setFinishedStatusFilter('')">All</button>
            <button
              v-for="s in finishedJobStatuses"
              :key="s.value"
              class="jc-filter-btn jc-status-filter-btn"
              :class="['jc-status-btn--' + s.value, { active: finishedStatusFilter === s.value }]"
              @click="setFinishedStatusFilter(s.value)"
            >{{ s.label }}</button>
          </div>
        </div>
        <div class="jc-count-row">
          <span class="jc-count">{{ filteredFinishedJobs.length }} job{{ filteredFinishedJobs.length !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div v-if="filteredFinishedJobs.length === 0" class="jc-empty-state">No finished jobs found.</div>

      <div v-else class="jc-list">
        <div v-for="job in paginatedFinishedJobs" :key="job.id" class="jc-card">
          <div class="jc-status-col" :class="'jc-status-col--' + job.status">
            <span class="jc-card-day">{{ getDayName(job.jobDate) }}</span>
            <span class="jc-status-badge" :class="'jc-status-badge--' + job.status">{{ getFinishedStatusLabel(job.status) }}</span>
          </div>
          <div class="jc-divider" :class="'jc-divider--' + job.status"></div>
          <div class="jc-card-body">
            <div class="jc-card-top">
              <h3 class="jc-card-name">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }}</h3>
              <span class="jc-card-id">#{{ job.id }}</span>
            </div>
            <p class="jc-card-vehicle">{{ job.licensePlate }}</p>
            <div class="jc-card-meta">
              <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
              <span class="jc-meta-tag jc-meta-tag--service">{{ job.serviceType }}</span>
              <span v-if="job.finalCost" class="jc-meta-tag jc-meta-tag--cost">💰 ${{ job.finalCost }}</span>
            </div>
          </div>
          <div class="jc-card-actions">
            <button class="jc-btn-view" @click="openFinishedJobModal(job)">View</button>
          </div>
        </div>
      </div>

      <div v-if="totalFinishedPages > 1" class="jc-pagination">
        <button class="jc-pagination-btn" @click="prevFinishedPage" :disabled="currentFinishedPage === 1">← Previous</button>
        <div class="jc-pagination-pages">
          <button v-for="page in totalFinishedPages" :key="page" class="jc-pagination-page" :class="{ active: currentFinishedPage === page }" @click="goToFinishedPage(page)">{{ page }}</button>
        </div>
        <button class="jc-pagination-btn" @click="nextFinishedPage" :disabled="currentFinishedPage === totalFinishedPages">Next →</button>
      </div>

      <!-- Finished Job View Modal -->
      <div v-if="finishedJobModal.isOpen" class="jc-modal-overlay" @click="closeFinishedJobModal">
        <div class="jc-modal" @click.stop>
          <button class="jc-modal-close" @click="closeFinishedJobModal">&times;</button>
          <h2>Finished Job Details</h2>
          <div class="jc-modal-body">
            <div class="jc-detail-group">
              <label>Status</label>
              <p><span class="jc-status-badge" :class="'jc-status-badge--' + finishedJobModal.job.status">{{ getFinishedStatusLabel(finishedJobModal.job.status) }}</span></p>
            </div>
            <div class="jc-detail-group"><label>Vehicle</label><p>{{ finishedJobModal.job.vehicleYear }} {{ finishedJobModal.job.vehicleMake }} {{ finishedJobModal.job.vehicleModel }}</p></div>
            <div class="jc-detail-group"><label>License Plate</label><p>{{ finishedJobModal.job.licensePlate }}</p></div>
            <div class="jc-detail-group"><label>Job Date</label><p>{{ formatDate(finishedJobModal.job.jobDate) }}</p></div>
            <div class="jc-detail-group"><label>Service Type</label><p>{{ finishedJobModal.job.serviceType }}</p></div>
            <div v-if="finishedJobModal.job.finalCost" class="jc-detail-group"><label>Final Cost</label><p>${{ finishedJobModal.job.finalCost }}</p></div>

            <div class="jc-detail-group">
              <label>Diagnose Technician</label>
              <div v-if="finishedJobModal.job.diagnoseTechnician">
                <p>{{ finishedJobModal.job.diagnoseTechnician }}</p>
                <div class="jc-tech-contact" v-if="getTechContact(finishedJobModal.job.diagnoseTechnician)">
                  <span class="jc-tech-contact-item">✉️ {{ getTechContact(finishedJobModal.job.diagnoseTechnician).email }}</span>
                  <span class="jc-tech-contact-item">📞 {{ getTechContact(finishedJobModal.job.diagnoseTechnician).phone }}</span>
                </div>
              </div>
              <p v-else class="jc-not-assigned">Not Assigned</p>
            </div>

            <div class="jc-detail-group">
              <label>Service Technician</label>
              <div v-if="finishedJobModal.job.serviceTechnician">
                <p>{{ finishedJobModal.job.serviceTechnician }}</p>
                <div class="jc-tech-contact" v-if="getTechContact(finishedJobModal.job.serviceTechnician)">
                  <span class="jc-tech-contact-item">✉️ {{ getTechContact(finishedJobModal.job.serviceTechnician).email }}</span>
                  <span class="jc-tech-contact-item">📞 {{ getTechContact(finishedJobModal.job.serviceTechnician).phone }}</span>
                </div>
              </div>
              <p v-else class="jc-not-assigned">Not Assigned</p>
            </div>

            <div v-if="finishedJobModal.job.parts && finishedJobModal.job.parts.length" class="jc-detail-group">
              <label>Parts</label>
              <div class="jc-item-list">
                <div v-for="(part, i) in finishedJobModal.job.parts" :key="i" class="jc-item-row">
                  <span class="jc-item-name">{{ part.name }}</span>
                  <span class="jc-item-price">${{ part.price }}</span>
                </div>
              </div>
            </div>

            <div v-if="finishedJobModal.job.services && finishedJobModal.job.services.length" class="jc-detail-group">
              <label>Services</label>
              <div class="jc-item-list">
                <div v-for="(svc, i) in finishedJobModal.job.services" :key="i" class="jc-item-row">
                  <span class="jc-item-name">{{ svc.name }}</span>
                  <span class="jc-item-price">${{ svc.price }}</span>
                </div>
              </div>
            </div>

            <div v-if="finishedJobModal.job.notes" class="jc-detail-group"><label>Notes</label><p>{{ finishedJobModal.job.notes }}</p></div>
          </div>
          <div class="jc-modal-actions">
            <button class="jc-btn-secondary" @click="closeFinishedJobModal">Close</button>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script>
export default {
  name: 'VehicleBookingsView',
  data() {
    const today = new Date();
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
    const subDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };
    const todayStr = today.toISOString().split('T')[0];

    return {
      // ── Tab ──
      activeTab: 'appointments',

      // ── Appointments ──
      currentPage: 1,
      itemsPerPage: 5,
      statusFilter: 'upcoming',
      sortOrder: 'desc',
      upcomingSortOrder: 'asc',
      modal: { isOpen: false, type: null, booking: null },
      editForm: { appointmentDate: '', appointmentTime: '' },
      appointmentFilters: [
        { value: 'upcoming',  label: '📅 Upcoming'  },
        { value: 'ongoing',   label: '⏳ Ongoing'   },
        { value: 'completed', label: '✓ Completed'  },
        { value: 'cancelled', label: '✕ Cancelled'  },
      ],
      bookings: [
        { id: 1, licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry',    vehicleYear: '2022', serviceType: 'Oil Change',          price: 75,  status: 'appointment', bookedDate: '2026-02-05', appointmentDate: '2026-02-28', appointmentTime: '10:30 AM' },
        { id: 2, licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry',    vehicleYear: '2022', serviceType: 'Tire Rotation',       price: 120, status: 'completed',   bookedDate: '2026-01-20', appointmentDate: '2026-02-01', appointmentTime: '02:00 PM' },
        { id: 3, licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry',    vehicleYear: '2022', serviceType: 'Battery Replacement', price: 150, status: 'pending',     bookedDate: '2026-02-03', appointmentDate: null,         appointmentTime: null },
        { id: 4, licensePlate: 'GHI-3456', vehicleMake: 'BMW',    vehicleModel: '3 Series', vehicleYear: '2024', serviceType: 'Brake Service',       price: 200, status: 'appointment', bookedDate: '2026-02-01', appointmentDate: '2026-03-20', appointmentTime: '03:30 PM' },
        { id: 5, licensePlate: 'GHI-3456', vehicleMake: 'BMW',    vehicleModel: '3 Series', vehicleYear: '2024', serviceType: 'Alignment Check',     price: 50,  status: 'cancelled',   bookedDate: '2026-01-15', appointmentDate: '2026-02-10', appointmentTime: '06:00 PM' },
      ],

      // ── Active Jobs ──
      currentJobPage: 1,
      itemsPerJobPage: 5,
      activeJobStatusFilter: '',
      jobModal: { isOpen: false, job: null },
      activeJobStatuses: [
        { value: 'diagnose',          label: 'Diagnose'          },
        { value: 'quotation',         label: 'Quotation'         },
        { value: 'waiting-for-parts', label: 'Waiting For Parts' },
        { value: 'service',           label: 'Service'           },
      ],
      jobCards: [
        {
          id: 'JC-001', licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry', vehicleYear: '2022',
          status: 'diagnose', jobDate: todayStr, serviceType: 'Engine Check',
          diagnoseTechnician: 'Alex Johnson', serviceTechnician: null,
          estimatedCost: 120, parts: [], services: [],
          notes: 'Customer reports unusual engine noise at idle.',
        },
        {
          id: 'JC-002', licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry', vehicleYear: '2022',
          status: 'quotation', jobDate: addDays(today, 1), serviceType: 'Brake Replacement',
          diagnoseTechnician: 'Alex Johnson', serviceTechnician: null,
          estimatedCost: 350,
          parts:    [{ name: 'Brake Pads (Set of 4)', price: 95 }, { name: 'Brake Rotors x2', price: 140 }],
          services: [{ name: 'Brake Replacement Labour', price: 115 }],
          notes: 'Awaiting customer approval on parts quote.',
        },
        {
          id: 'JC-003', licensePlate: 'GHI-3456', vehicleMake: 'BMW', vehicleModel: '3 Series', vehicleYear: '2024',
          status: 'waiting-for-parts', jobDate: addDays(today, 2), serviceType: 'Suspension Repair',
          diagnoseTechnician: 'Ryan Patel', serviceTechnician: null,
          estimatedCost: 780,
          parts:    [{ name: 'Front Control Arm', price: 320 }, { name: 'Ball Joint', price: 85 }],
          services: [{ name: 'Suspension Labour', price: 200 }, { name: 'Wheel Alignment', price: 80 }],
          notes: 'Parts ordered — ETA 2 days.',
        },
        {
          id: 'JC-004', licensePlate: 'GHI-3456', vehicleMake: 'BMW', vehicleModel: '3 Series', vehicleYear: '2024',
          status: 'service', jobDate: addDays(today, 3), serviceType: 'Full Service',
          diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Chris Lee',
          estimatedCost: 500,
          parts:    [{ name: 'Oil Filter', price: 25 }, { name: 'Air Filter', price: 30 }, { name: 'Spark Plugs x4', price: 60 }],
          services: [{ name: 'Oil Change', price: 80 }, { name: 'Full Inspection', price: 120 }],
          notes: null,
        },
      ],

      // ── Finished Jobs ──
      currentFinishedPage: 1,
      itemsPerFinishedPage: 5,
      finishedStatusFilter: '',
      finishedJobModal: { isOpen: false, job: null },
      finishedJobStatuses: [
        { value: 'completed', label: 'Completed' },
        { value: 'invoiced',  label: 'Invoiced'  },
      ],
      finishedJobs: [
        {
          id: 'JC-F01', licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry', vehicleYear: '2022',
          status: 'completed', jobDate: subDays(today, 5), serviceType: 'Oil Change & Filter',
          diagnoseTechnician: 'Ryan Patel', serviceTechnician: 'Chris Lee',
          finalCost: 95,
          parts:    [{ name: 'Engine Oil (5L)', price: 45 }, { name: 'Oil Filter', price: 20 }],
          services: [{ name: 'Oil Change Labour', price: 30 }],
          notes: 'Completed without issues.',
        },
        {
          id: 'JC-F02', licensePlate: 'GHI-3456', vehicleMake: 'BMW', vehicleModel: '3 Series', vehicleYear: '2024',
          status: 'invoiced', jobDate: subDays(today, 12), serviceType: 'Tyre Rotation & Alignment',
          diagnoseTechnician: 'Maria Santos', serviceTechnician: 'Sam Okafor',
          finalCost: 210,
          parts:    [{ name: 'Valve Stems x4', price: 20 }],
          services: [{ name: 'Tyre Rotation', price: 60 }, { name: 'Wheel Alignment', price: 80 }, { name: 'Wheel Balancing', price: 50 }],
          notes: null,
        },
        {
          id: 'JC-F03', licensePlate: 'ABC-1234', vehicleMake: 'Toyota', vehicleModel: 'Camry', vehicleYear: '2022',
          status: 'completed', jobDate: subDays(today, 20), serviceType: 'Battery Replacement',
          diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Jordan Williams',
          finalCost: 175,
          parts:    [{ name: 'Car Battery 60Ah', price: 120 }],
          services: [{ name: 'Battery Replacement Labour', price: 55 }],
          notes: 'Old battery fully dead. New battery installed and tested.',
        },
      ],

      // ── Technician contacts ──
      technicianContacts: {
        'Alex Johnson':    { email: 'alex.johnson@workshop.com',    phone: '+1 (555) 201-1001' },
        'Maria Santos':    { email: 'maria.santos@workshop.com',    phone: '+1 (555) 201-1002' },
        'Ryan Patel':      { email: 'ryan.patel@workshop.com',      phone: '+1 (555) 201-1003' },
        'Chris Lee':       { email: 'chris.lee@workshop.com',       phone: '+1 (555) 201-1004' },
        'Jordan Williams': { email: 'jordan.williams@workshop.com', phone: '+1 (555) 201-1005' },
        'Sam Okafor':      { email: 'sam.okafor@workshop.com',      phone: '+1 (555) 201-1006' },
      },
    };
  },

  computed: {
    // ── Appointments ──
    filteredAndSortedBookings() {
      let filtered;

      // ── Shared time parser ──
      const parseTime = (t) => {
        if (!t) return { h: 0, min: 0 };
        const parts = t.trim().split(' ');
        const m = parts[1] ? parts[1].toUpperCase() : '';
        let [h, min] = parts[0].split(':').map(Number);
        if (m === 'PM' && h !== 12) h += 12;
        if (m === 'AM' && h === 12) h = 0;
        return { h, min: min || 0 };
      };

      if (this.statusFilter === 'upcoming') {
        // Future appointments only: appointmentDate+time >= now
        const now = new Date();
        filtered = this.bookings.filter(b => {
          if (b.status !== 'appointment' || !b.appointmentDate) return false;
          const { h, min } = parseTime(b.appointmentTime);
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00');
          apptDateTime.setHours(h, min, 0, 0);
          return apptDateTime >= now;
        });

        const getDateTime = (b) => {
          if (!b.appointmentDate) return null;
          const { h, min } = parseTime(b.appointmentTime);
          const dt = new Date(b.appointmentDate + 'T00:00:00');
          dt.setHours(h, min, 0, 0);
          return dt.getTime();
        };
        filtered.sort((a, b) => {
          const da = getDateTime(a), db = getDateTime(b);
          if (da === null && db === null) return 0;
          if (da === null) return 1;
          if (db === null) return -1;
          return this.upcomingSortOrder === 'asc' ? da - db : db - da;
        });

      } else if (this.statusFilter === 'ongoing') {
        // Ongoing: appointment status AND appointmentDate+time is in the past
        const now = new Date();
        filtered = this.bookings.filter(b => {
          if (b.status !== 'appointment' || !b.appointmentDate || !b.appointmentTime) return false;
          const { h, min } = parseTime(b.appointmentTime);
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00');
          apptDateTime.setHours(h, min, 0, 0);
          return now > apptDateTime;
        });
        // Sort: most recently started first
        filtered.sort((a, b) => {
          const da = new Date(a.appointmentDate + 'T00:00:00');
          const db = new Date(b.appointmentDate + 'T00:00:00');
          return db - da;
        });

      } else {
        filtered = this.bookings.filter(b => b.status === this.statusFilter);
        filtered.sort((a, b) => {
          const da = new Date(a.bookedDate), db = new Date(b.bookedDate);
          return this.sortOrder === 'asc' ? da - db : db - da;
        });
      }

      return filtered;
    },

    nextUpBookingId() {
      const now = new Date();
      const parseTime = (t) => {
        if (!t) return { h: 0, min: 0 };
        const parts = t.trim().split(' ');
        const m = parts[1] ? parts[1].toUpperCase() : '';
        let [h, min] = parts[0].split(':').map(Number);
        if (m === 'PM' && h !== 12) h += 12;
        if (m === 'AM' && h === 12) h = 0;
        return { h, min: min || 0 };
      };
      const candidates = this.bookings
        .filter(b => {
          if (b.status !== 'appointment' || !b.appointmentDate) return false;
          const { h, min } = parseTime(b.appointmentTime);
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00');
          apptDateTime.setHours(h, min, 0, 0);
          return apptDateTime >= now;
        })
        .slice()
        .sort((a, b) => new Date(a.appointmentDate + 'T00:00:00') - new Date(b.appointmentDate + 'T00:00:00'));
      return candidates.length ? candidates[0].id : null;
    },

    paginatedBookings() {
      const s = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredAndSortedBookings.slice(s, s + this.itemsPerPage);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredAndSortedBookings.length / this.itemsPerPage));
    },

    // ── Active Jobs ──
    filteredJobCards() {
      let list = this.jobCards;
      if (this.activeJobStatusFilter) list = list.filter(j => j.status === this.activeJobStatusFilter);
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate));
    },
    totalJobPages() { return Math.max(1, Math.ceil(this.filteredJobCards.length / this.itemsPerJobPage)); },
    paginatedJobCards() {
      const s = (this.currentJobPage - 1) * this.itemsPerJobPage;
      return this.filteredJobCards.slice(s, s + this.itemsPerJobPage);
    },

    // ── Finished Jobs ──
    filteredFinishedJobs() {
      let list = this.finishedJobs;
      if (this.finishedStatusFilter) list = list.filter(j => j.status === this.finishedStatusFilter);
      return [...list].sort((a, b) => b.jobDate.localeCompare(a.jobDate));
    },
    totalFinishedPages() { return Math.max(1, Math.ceil(this.filteredFinishedJobs.length / this.itemsPerFinishedPage)); },
    paginatedFinishedJobs() {
      const s = (this.currentFinishedPage - 1) * this.itemsPerFinishedPage;
      return this.filteredFinishedJobs.slice(s, s + this.itemsPerFinishedPage);
    },
  },

  methods: {
    // ── Tab ──
    switchTab(tab) { this.activeTab = tab; },

    // ── Cancellation Guard ──
    canCancelBooking(booking) {
      if (!booking || !booking.appointmentDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apptDate = new Date(booking.appointmentDate + 'T00:00:00');
      const diffDays = (apptDate - today) / (1000 * 60 * 60 * 24);
      return diffDays > 2;
    },

    // ── Appointments ──
    openModal(type, booking) {
      if (type === 'cancel' && !this.canCancelBooking(booking)) return;
      this.modal = { type, booking, isOpen: true };
      if (type === 'edit') {
        this.editForm.appointmentDate = booking.appointmentDate;
        this.editForm.appointmentTime = booking.appointmentTime;
      }
    },
    closeModal() {
      this.modal = { isOpen: false, type: null, booking: null };
      this.editForm = { appointmentDate: '', appointmentTime: '' };
    },
    saveAppointment() {
      const idx = this.bookings.findIndex(b => b.id === this.modal.booking.id);
      if (idx !== -1) {
        this.bookings[idx].appointmentDate = this.editForm.appointmentDate;
        this.bookings[idx].appointmentTime = this.editForm.appointmentTime;
      }
      alert('Appointment updated successfully!');
      this.closeModal();
    },
    confirmCancel() {
      if (!this.canCancelBooking(this.modal.booking)) {
        alert('Cancellations are not allowed within 2 days of the appointment.');
        this.closeModal();
        return;
      }
      const idx = this.bookings.findIndex(b => b.id === this.modal.booking.id);
      if (idx !== -1) this.bookings[idx].status = 'cancelled';
      alert('Appointment cancelled successfully!');
      this.closeModal();
    },
    formatStatus(status) { return status.charAt(0).toUpperCase() + status.slice(1); },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date + (date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    goToPage(page) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    applyFilter(s) { this.statusFilter = s; this.currentPage = 1; },
    toggleSortOrder() { this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1; },
    toggleUpcomingSortOrder() { this.upcomingSortOrder = this.upcomingSortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1; },

    // ── Active Jobs ──
    setJobStatusFilter(val) { this.activeJobStatusFilter = val; this.currentJobPage = 1; },
    goToJobPage(page) { if (page >= 1 && page <= this.totalJobPages) this.currentJobPage = page; },
    prevJobPage() { if (this.currentJobPage > 1) this.currentJobPage--; },
    nextJobPage() { if (this.currentJobPage < this.totalJobPages) this.currentJobPage++; },
    getStatusLabel(status) { const f = this.activeJobStatuses.find(s => s.value === status); return f ? f.label : status; },
    openJobModal(job) { this.jobModal = { job, isOpen: true }; },
    closeJobModal() { this.jobModal = { isOpen: false, job: null }; },

    // ── Finished Jobs ──
    setFinishedStatusFilter(val) { this.finishedStatusFilter = val; this.currentFinishedPage = 1; },
    goToFinishedPage(page) { if (page >= 1 && page <= this.totalFinishedPages) this.currentFinishedPage = page; },
    prevFinishedPage() { if (this.currentFinishedPage > 1) this.currentFinishedPage--; },
    nextFinishedPage() { if (this.currentFinishedPage < this.totalFinishedPages) this.currentFinishedPage++; },
    getFinishedStatusLabel(status) { const f = this.finishedJobStatuses.find(s => s.value === status); return f ? f.label : status; },
    openFinishedJobModal(job) { this.finishedJobModal = { job, isOpen: true }; },
    closeFinishedJobModal() { this.finishedJobModal = { isOpen: false, job: null }; },

    // ── Shared ──
    getDayName(date) {
      if (!date) return '';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    },
    getTechContact(name) { return this.technicianContacts[name] || null; },
  },
};
</script>

<style scoped src="@/assets/customerBookings.css"></style>