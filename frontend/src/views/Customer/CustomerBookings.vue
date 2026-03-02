<template>
  <div class="bookings-container">
    <!-- Loading Screen -->
    <div v-if="pageLoading" class="page-loading">
      <p>Loading...</p>
    </div>
    <template v-else>
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
        <div v-if="bookingsError" class="no-bookings">
          <p>Error: {{ bookingsError }}</p>
        </div>
        <div v-else-if="bookings.length === 0" class="no-bookings">
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
                  <h3>{{ booking.vehicleYear }} {{ booking.vehicleMake }}</h3>
                  <span class="booking-id">#{{ booking.id }}</span>
                </div>
                <div class="booking-details">
                  <!-- Hide license plate, phone, notes for cancelled bookings -->
                  <div v-if="booking.status !== 'cancelled'" class="detail-item">
                    <span class="detail-label">License Plate:</span>
                    <span class="detail-value">{{ booking.licensePlate || 'N/A' }}</span>
                  </div>
                  <div v-if="booking.status !== 'cancelled'" class="detail-item">
                    <span class="detail-label">Phone Number:</span>
                    <span class="detail-value">{{ booking.phoneNumber || 'N/A' }}</span>
                  </div>
                  <div v-if="booking.customerNotes && booking.status !== 'cancelled'" class="detail-item">
                    <span class="detail-label">Notes:</span>
                    <span class="detail-value">{{ booking.customerNotes }}</span>
                  </div>
                  <div class="detail-item appointment-item">
                    <span class="detail-label">Appointment Date:</span>
                    <span class="detail-value">{{ formatDate(booking.appointmentDate) }}</span>
                  </div>
                  <div class="detail-item appointment-item">
                    <span class="detail-label">Appointment Time:</span>
                    <span class="detail-value">{{ booking.appointmentTime || 'N/A' }}</span>
                  </div>
                  <!-- Cancel Reason -->
                  <div
                    v-if="booking.status === 'cancelled' && booking.cancelReason"
                    class="detail-item cancel-reason-item"
                  >
                    <span class="detail-label">Cancel Reason:</span>
                    <span class="detail-value">{{ booking.cancelReason }}</span>
                  </div>
                  <!-- Cancelled by Porschify Notice -->
                  <div
                    v-if="booking.status === 'cancelled' && booking.cancelReason"
                    class="detail-item appointment-item cancelled-by-admin"
                  >
                    <span class="detail-label">Cancelled By:</span>
                    <span class="detail-value">Porschify</span>
                  </div>
                </div>
              </div>
              <div class="row-actions">
                <button class="btn-view" @click="openModal('view', booking)">View Details</button>
                <button
                  v-if="booking.status === 'booked' && statusFilter !== 'ongoing'"
                  class="btn-edit"
                  :class="{ 'btn-edit--disabled': !canCancelBooking(booking) }"
                  :disabled="!canCancelBooking(booking)"
                  :title="!canCancelBooking(booking) ? 'Edits are not allowed within 2 days of the appointment' : 'Edit this appointment'"
                  @click="openModal('edit', booking)"
                >Edit Appointment</button>
                <button
                  v-if="booking.status === 'booked'"
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
        </div>
        <!-- MODALS -->
        <div v-if="modal.isOpen" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button class="modal-close" @click="closeModal">&times;</button>
            <!-- VIEW MODAL -->
            <div v-if="modal.type === 'view'">
              <h2>Booking Details</h2>
              <div class="modal-body">
                <div class="detail-group">
                  <label>Vehicle:</label>
                  <p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }}</p>
                </div>
                <div class="detail-group">
                  <label>License Plate:</label>
                  <p>{{ modal.booking.licensePlate || 'N/A' }}</p>
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
                  <label>Phone Number:</label>
                  <p>{{ modal.booking.phoneNumber || 'N/A' }}</p>
                </div>
                <div class="detail-group">
                  <label>Appointment Date:</label>
                  <p>{{ formatDate(modal.booking.appointmentDate) }}</p>
                </div>
                <div class="detail-group">
                  <label>Appointment Time:</label>
                  <p>{{ modal.booking.appointmentTime || 'N/A' }}</p>
                </div>
                <div v-if="modal.booking.customerNotes" class="detail-group">
                  <label>Notes:</label>
                  <p>{{ modal.booking.customerNotes }}</p>
                </div>
                <div
                  v-if="modal.booking.status === 'cancelled' && modal.booking.cancelReason"
                  class="detail-group"
                >
                  <label>Cancel Reason:</label>
                  <p>{{ modal.booking.cancelReason }}</p>
                </div>
                <div
                  v-if="modal.booking.status === 'cancelled' && modal.booking.cancelReason"
                  class="detail-group cancelled-by-admin-modal"
                >
                  <label>Cancelled By:</label>
                  <p>Porschify</p>
                </div>
              </div>
              <div class="modal-actions">
                <button class="btn-secondary" @click="closeModal">Close</button>
              </div>
            </div>
            <!-- EDIT MODAL -->
            <div v-if="modal.type === 'edit'">
              <h2>Edit Appointment</h2>
              <div class="modal-body">
                <div class="form-group">
                  <label>Vehicle:</label>
                  <input type="text" :value="`${modal.booking.vehicleYear} ${modal.booking.vehicleMake}`" disabled>
                </div>
                <div class="form-group">
                  <label>Appointment Date:</label>
                  <input
                    type="date"
                    v-model="editForm.appointmentDate"
                    :min="editMinDate"
                    :max="editMaxDate"
                    @change="onEditDateChange"
                  >
                  <p v-if="editIsSunday" class="warning-text" style="font-size:0.82rem; margin-top:4px;">
                    Sundays are not available. Please select another date.
                  </p>
                </div>
                <div class="form-group">
                  <label>Appointment Time:</label>
                  <select
                    v-model="editForm.appointmentTime"
                    :disabled="!editForm.appointmentDate || editIsSunday"
                  >
                    <option value="">Select time</option>
                    <option
                      v-for="slot in editTimeSlots"
                      :key="slot.value"
                      :value="slot.value"
                      :disabled="slot.disabled"
                    >
                      {{ slot.label }}{{ slot.disabled ? ' (Unavailable)' : '' }}
                    </option>
                  </select>
                  <!-- ── SAME DATE & TIME WARNING ── -->
                  <div v-if="editIsSameAsOriginal" class="same-slot-warning">
                    <span class="same-slot-warning__icon">⚠️</span>
                    <span>This is the same date and time as your current appointment. Please select a different date or time to save.</span>
                  </div>
                </div>
              </div>
              <div class="modal-actions">
                <button class="btn-secondary" @click="closeModal">Cancel</button>
                <button
                  class="btn-primary"
                  @click="saveAppointment"
                  :disabled="!editForm.appointmentDate || !editForm.appointmentTime || editIsSunday || editIsSameAsOriginal"
                >Save Changes</button>
              </div>
            </div>
            <!-- CANCEL MODAL -->
            <div v-if="modal.type === 'cancel'">
              <h2>Cancel Appointment</h2>
              <div class="modal-body">
                <p>Are you sure you want to cancel this appointment?</p>
                <div class="detail-group">
                  <label>Vehicle:</label>
                  <p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }}</p>
                </div>
                <div class="detail-group">
                  <label>Appointment Date:</label>
                  <p>{{ formatDate(modal.booking.appointmentDate) }}</p>
                </div>
                <div class="detail-group">
                  <label>Appointment Time:</label>
                  <p>{{ modal.booking.appointmentTime || 'N/A' }}</p>
                </div>
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
                    <span class="jc-tech-contact-item">{{ getTechContact(jobModal.job.diagnoseTechnician).email }}</span>
                    <span class="jc-tech-contact-item">{{ getTechContact(jobModal.job.diagnoseTechnician).phone }}</span>
                  </div>
                </div>
                <p v-else class="jc-not-assigned">Not Assigned</p>
              </div>
              <div class="jc-detail-group">
                <label>Service Technician</label>
                <div v-if="jobModal.job.serviceTechnician">
                  <p>{{ jobModal.job.serviceTechnician }}</p>
                  <div class="jc-tech-contact" v-if="getTechContact(jobModal.job.serviceTechnician)">
                    <span class="jc-tech-contact-item">{{ getTechContact(jobModal.job.serviceTechnician).email }}</span>
                    <span class="jc-tech-contact-item">{{ getTechContact(jobModal.job.serviceTechnician).phone }}</span>
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
                <span v-if="job.finalCost" class="jc-meta-tag jc-meta-tag--cost">${{ job.finalCost }}</span>
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
                    <span class="jc-tech-contact-item">{{ getTechContact(finishedJobModal.job.diagnoseTechnician).email }}</span>
                    <span class="jc-tech-contact-item">{{ getTechContact(finishedJobModal.job.diagnoseTechnician).phone }}</span>
                  </div>
                </div>
                <p v-else class="jc-not-assigned">Not Assigned</p>
              </div>
              <div class="jc-detail-group">
                <label>Service Technician</label>
                <div v-if="finishedJobModal.job.serviceTechnician">
                  <p>{{ finishedJobModal.job.serviceTechnician }}</p>
                  <div class="jc-tech-contact" v-if="getTechContact(finishedJobModal.job.serviceTechnician)">
                    <span class="jc-tech-contact-item">{{ getTechContact(finishedJobModal.job.serviceTechnician).email }}</span>
                    <span class="jc-tech-contact-item">{{ getTechContact(finishedJobModal.job.serviceTechnician).phone }}</span>
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
    </template>
  </div>
</template>

<script>
const EDIT_ALL_SLOTS = [
  { value: '10:00 AM', label: '10:00 AM' },
  { value: '11:00 AM', label: '11:00 AM' },
  { value: '12:00 PM', label: '12:00 PM' },
  { value: '01:00 PM', label: '01:00 PM' },
  { value: '02:00 PM', label: '02:00 PM' },
  { value: '03:00 PM', label: '03:00 PM' },
  { value: '04:00 PM', label: '04:00 PM' },
]
const EDIT_SATURDAY_SLOTS = EDIT_ALL_SLOTS.filter(s =>
  ['10:00 AM', '11:00 AM', '12:00 PM'].includes(s.value)
)

export default {
  name: 'CustomerBookingsView',
  data() {
    const today = new Date()
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0] }
    const subDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0] }
    const todayStr = today.toISOString().split('T')[0]
    return {
      // ── Page ──
      pageLoading: true,
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
      editBookedSlots: [],
      bookingsError: null,
      appointmentFilters: [
        { value: 'upcoming',  label: 'Upcoming'  },
        { value: 'ongoing',   label: 'Ongoing'   },
        { value: 'completed', label: 'Completed'  },
        { value: 'cancelled', label: 'Cancelled'  },
      ],
      bookings: [],
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
    }
  },
  async mounted() {
    await this.fetchAppointments()
  },
  computed: {
    // ── Appointments ──
    filteredAndSortedBookings() {
      let filtered
      const parseTime = (t) => {
        if (!t) return { h: 0, min: 0 }
        const parts = t.trim().split(' ')
        const m = parts[1] ? parts[1].toUpperCase() : ''
        let [h, min] = parts[0].split(':').map(Number)
        if (m === 'PM' && h !== 12) h += 12
        if (m === 'AM' && h === 12) h = 0
        return { h, min: min || 0 }
      }
      if (this.statusFilter === 'upcoming') {
        const now = new Date()
        filtered = this.bookings.filter(b => {
          if (b.status !== 'booked' || !b.appointmentDate) return false
          const { h, min } = parseTime(b.appointmentTime)
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00')
          apptDateTime.setHours(h, min, 0, 0)
          return apptDateTime >= now
        })
        const getDateTime = (b) => {
          if (!b.appointmentDate) return null
          const { h, min } = parseTime(b.appointmentTime)
          const dt = new Date(b.appointmentDate + 'T00:00:00')
          dt.setHours(h, min, 0, 0)
          return dt.getTime()
        }
        filtered.sort((a, b) => {
          const da = getDateTime(a), db = getDateTime(b)
          if (da === null && db === null) return 0
          if (da === null) return 1
          if (db === null) return -1
          return this.upcomingSortOrder === 'asc' ? da - db : db - da
        })
      } else if (this.statusFilter === 'ongoing') {
        const now = new Date()
        filtered = this.bookings.filter(b => {
          if (b.status !== 'booked' || !b.appointmentDate || !b.appointmentTime) return false
          const { h, min } = parseTime(b.appointmentTime)
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00')
          apptDateTime.setHours(h, min, 0, 0)
          return now > apptDateTime
        })
        filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
      } else {
        filtered = this.bookings.filter(b => b.status === this.statusFilter)
        filtered.sort((a, b) => {
          const da = new Date(a.createdAt || 0)
          const db = new Date(b.createdAt || 0)
          return this.sortOrder === 'asc' ? da - db : db - da
        })
      }
      return filtered
    },
    nextUpBookingId() {
      const now = new Date()
      const parseTime = (t) => {
        if (!t) return { h: 0, min: 0 }
        const parts = t.trim().split(' ')
        const m = parts[1] ? parts[1].toUpperCase() : ''
        let [h, min] = parts[0].split(':').map(Number)
        if (m === 'PM' && h !== 12) h += 12
        if (m === 'AM' && h === 12) h = 0
        return { h, min: min || 0 }
      }
      const candidates = this.bookings
        .filter(b => {
          if (b.status !== 'booked' || !b.appointmentDate) return false
          const { h, min } = parseTime(b.appointmentTime)
          const apptDateTime = new Date(b.appointmentDate + 'T00:00:00')
          apptDateTime.setHours(h, min, 0, 0)
          return apptDateTime >= now
        })
        .slice()
        .sort((a, b) => new Date(a.appointmentDate + 'T00:00:00') - new Date(b.appointmentDate + 'T00:00:00'))
      return candidates.length ? candidates[0].id : null
    },
    paginatedBookings() {
      const s = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredAndSortedBookings.slice(s, s + this.itemsPerPage)
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredAndSortedBookings.length / this.itemsPerPage))
    },
    // ── Edit modal constraints ──
    editMinDate() {
      const d = new Date()
      d.setDate(d.getDate() + 3)
      return d.toISOString().split('T')[0]
    },
    editMaxDate() {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      return d.toISOString().split('T')[0]
    },
    editIsSunday() {
      if (!this.editForm.appointmentDate) return false
      return new Date(this.editForm.appointmentDate + 'T00:00:00').getDay() === 0
    },
    editIsSaturday() {
      if (!this.editForm.appointmentDate) return false
      return new Date(this.editForm.appointmentDate + 'T00:00:00').getDay() === 6
    },
    editIsToday() {
      if (!this.editForm.appointmentDate) return false
      return this.editForm.appointmentDate === new Date().toISOString().split('T')[0]
    },
    editIsSameAsOriginal() {
      if (!this.modal.booking || !this.editForm.appointmentDate || !this.editForm.appointmentTime) return false
      const originalTime24 = this.timeTo24h(this.modal.booking.appointmentTime)
      const selectedTime24 = this.timeTo24h(this.editForm.appointmentTime)
      return (
        this.editForm.appointmentDate === this.modal.booking.appointmentDate &&
        selectedTime24 === originalTime24
      )
    },
    editTimeSlots() {
      if (!this.editForm.appointmentDate || this.editIsSunday) return []
      const slots = this.editIsSaturday ? EDIT_SATURDAY_SLOTS : EDIT_ALL_SLOTS
      const currentHour = new Date().getHours()
      return slots.map(slot => {
        const slot24 = this.slotValueTo24h(slot.value)
        const slotHour = parseInt(slot24.split(':')[0])
        const isPast = this.editIsToday && slotHour <= currentHour
        const ownSlot24 = this.modal.booking ? this.timeTo24h(this.modal.booking.appointmentTime) : ''
        const ownDate = this.modal.booking ? this.modal.booking.appointmentDate : ''
        const isBooked = this.editBookedSlots.some(b => {
          const dateMatch = b.appointment_date === this.editForm.appointmentDate
          const timeMatch = b.appointment_time_24 === slot24
          const isOwnOriginalSlot = b.appointment_date === ownDate && b.appointment_time_24 === ownSlot24
          return dateMatch && timeMatch && !isOwnOriginalSlot
        })
        return { ...slot, disabled: isPast || isBooked }
      })
    },
    // ── Active Jobs ──
    filteredJobCards() {
      let list = this.jobCards
      if (this.activeJobStatusFilter) list = list.filter(j => j.status === this.activeJobStatusFilter)
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate))
    },
    totalJobPages() { return Math.max(1, Math.ceil(this.filteredJobCards.length / this.itemsPerJobPage)) },
    paginatedJobCards() {
      const s = (this.currentJobPage - 1) * this.itemsPerJobPage
      return this.filteredJobCards.slice(s, s + this.itemsPerJobPage)
    },
    // ── Finished Jobs ──
    filteredFinishedJobs() {
      let list = this.finishedJobs
      if (this.finishedStatusFilter) list = list.filter(j => j.status === this.finishedStatusFilter)
      return [...list].sort((a, b) => b.jobDate.localeCompare(a.jobDate))
    },
    totalFinishedPages() { return Math.max(1, Math.ceil(this.filteredFinishedJobs.length / this.itemsPerFinishedPage)) },
    paginatedFinishedJobs() {
      const s = (this.currentFinishedPage - 1) * this.itemsPerFinishedPage
      return this.filteredFinishedJobs.slice(s, s + this.itemsPerFinishedPage)
    },
  },
  methods: {
    // ── API ──────────────────────────────────────────────────────
    async fetchAppointments() {
      this.pageLoading = true
      this.bookingsError = null
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/customer/getAppointments', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || json.message || 'Failed to fetch appointments')
        this.bookings = (json.data || []).map(a => ({
          id:              a.id,
          appointmentDate: a.appointment_date,
          appointmentTime: a.appointment_time,
          licensePlate:    a.vehicle_license_plate,
          vehicleMake:     a.vehicle_make,
          vehicleYear:     a.vehicle_year,
          phoneNumber:     a.phone_number,
          customerNotes:   a.customer_notes,
          status:          a.status,
          cancelReason:    a.cancel_reason,
          createdAt:       a.created_at,
        }))
      } catch (err) {
        console.error('fetchAppointments error:', err)
        this.bookingsError = err.message
      } finally {
        this.pageLoading = false
      }
    },
    // ── Tab ──────────────────────────────────────────────────────
    switchTab(tab) { this.activeTab = tab },
    // ── Cancellation Guard ───────────────────────────────────────
    canCancelBooking(booking) {
      if (!booking || !booking.appointmentDate) return false
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const apptDate = new Date(booking.appointmentDate + 'T00:00:00')
      const diffDays = (apptDate - today) / (1000 * 60 * 60 * 24)
      return diffDays > 2
    },
    // ── Appointment Modals ───────────────────────────────────────
    async openModal(type, booking) {
      if ((type === 'cancel' || type === 'edit') && !this.canCancelBooking(booking)) return
      this.modal = { type, booking, isOpen: true }
      if (type === 'edit') {
        this.editForm.appointmentDate = booking.appointmentDate
        this.editForm.appointmentTime = ''
        await this.fetchEditBookedSlots()
        await this.$nextTick()
        this.editForm.appointmentTime = this.time24hToSlotFormat(booking.appointmentTime)
      }
    },
    closeModal() {
      this.modal = { isOpen: false, type: null, booking: null }
      this.editForm = { appointmentDate: '', appointmentTime: '' }
      this.editBookedSlots = []
    },
    // ── Edit date/time helpers ───────────────────────────────────
    async onEditDateChange() {
      this.editForm.appointmentTime = ''
      if (!this.editForm.appointmentDate || this.editIsSunday) return
      await this.fetchEditBookedSlots()
    },
    async fetchEditBookedSlots() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/customer/bookedSlots', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        const raw = data.data || []
        this.editBookedSlots = raw.map(b => ({
          appointment_date:    b.appointment_date || b.appointmentDate || '',
          appointment_time_24: this.timeTo24h(b.appointment_time || b.appointmentTime || ''),
        }))
      } catch (err) {
        console.error('Failed to fetch booked slots for edit:', err)
        this.editBookedSlots = []
      }
    },
    timeTo24h(t) {
      if (!t) return ''
      t = t.trim()
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
        const [h, m] = t.split(':').map(Number)
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }
      const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (match) {
        let h = parseInt(match[1])
        const m = parseInt(match[2])
        const meridiem = match[3].toUpperCase()
        if (meridiem === 'PM' && h !== 12) h += 12
        if (meridiem === 'AM' && h === 12) h = 0
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }
      return t
    },
    slotValueTo24h(slotValue) { return this.timeTo24h(slotValue) },
    time24hToSlotFormat(t) {
      if (!t) return ''
      const parts = t.split(':')
      let h = parseInt(parts[0])
      const m = parseInt(parts[1] || 0)
      const meridiem = h >= 12 ? 'PM' : 'AM'
      if (h > 12) h -= 12
      if (h === 0) h = 12
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`
    },
    async saveAppointment() {
      if (this.editIsSameAsOriginal) return
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3000/api/customer/editAppointment/${this.modal.booking.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment_date: this.editForm.appointmentDate,
            appointment_time: this.editForm.appointmentTime,
          }),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || json.message)
        const idx = this.bookings.findIndex(b => b.id === this.modal.booking.id)
        if (idx !== -1) {
          this.bookings[idx].appointmentDate = this.editForm.appointmentDate
          this.bookings[idx].appointmentTime = this.editForm.appointmentTime
        }
        alert('Appointment updated successfully!')
        this.closeModal()
      } catch (err) {
        console.error('saveAppointment error:', err)
        alert(`Failed to update appointment: ${err.message}`)
      }
    },
    async confirmCancel() {
      if (!this.canCancelBooking(this.modal.booking)) {
        alert('Cancellations are not allowed within 2 days of the appointment.')
        this.closeModal()
        return
      }
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3000/api/customer/cancelAppointment/${this.modal.booking.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || json.message)
        const idx = this.bookings.findIndex(b => b.id === this.modal.booking.id)
        if (idx !== -1) this.bookings[idx].status = 'cancelled'
        alert('Appointment cancelled successfully!')
        this.closeModal()
      } catch (err) {
        console.error('confirmCancel error:', err)
        alert(`Failed to cancel appointment: ${err.message}`)
      }
    },
    // ── Formatting ───────────────────────────────────────────────
    formatStatus(status) { return status.charAt(0).toUpperCase() + status.slice(1) },
    formatDate(date) {
      if (!date) return 'N/A'
      return new Date(date + (date.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },
    // ── Appointment Pagination ───────────────────────────────────
    goToPage(page) { if (page >= 1 && page <= this.totalPages) this.currentPage = page },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++ },
    prevPage() { if (this.currentPage > 1) this.currentPage-- },
    applyFilter(s) { this.statusFilter = s; this.currentPage = 1 },
    toggleSortOrder() { this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1 },
    toggleUpcomingSortOrder() { this.upcomingSortOrder = this.upcomingSortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1 },
    // ── Active Jobs ──────────────────────────────────────────────
    setJobStatusFilter(val) { this.activeJobStatusFilter = val; this.currentJobPage = 1 },
    goToJobPage(page) { if (page >= 1 && page <= this.totalJobPages) this.currentJobPage = page },
    prevJobPage() { if (this.currentJobPage > 1) this.currentJobPage-- },
    nextJobPage() { if (this.currentJobPage < this.totalJobPages) this.currentJobPage++ },
    getStatusLabel(status) { const f = this.activeJobStatuses.find(s => s.value === status); return f ? f.label : status },
    openJobModal(job) { this.jobModal = { job, isOpen: true } },
    closeJobModal() { this.jobModal = { isOpen: false, job: null } },
    // ── Finished Jobs ────────────────────────────────────────────
    setFinishedStatusFilter(val) { this.finishedStatusFilter = val; this.currentFinishedPage = 1 },
    goToFinishedPage(page) { if (page >= 1 && page <= this.totalFinishedPages) this.currentFinishedPage = page },
    prevFinishedPage() { if (this.currentFinishedPage > 1) this.currentFinishedPage-- },
    nextFinishedPage() { if (this.currentFinishedPage < this.totalFinishedPages) this.currentFinishedPage++ },
    getFinishedStatusLabel(status) { const f = this.finishedJobStatuses.find(s => s.value === status); return f ? f.label : status },
    openFinishedJobModal(job) { this.finishedJobModal = { job, isOpen: true } },
    closeFinishedJobModal() { this.finishedJobModal = { isOpen: false, job: null } },
    // ── Shared ───────────────────────────────────────────────────
    getDayName(date) {
      if (!date) return ''
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
    },
    getTechContact(name) { return this.technicianContacts[name] || null },
  },
}
</script>

<style scoped src="@/assets/customerBookings.css"></style>