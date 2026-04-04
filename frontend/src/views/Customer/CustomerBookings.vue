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
            <span class="tab-count">{{ finishedJobs.length }}</span>
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
                  <div v-if="booking.status !== 'cancelled'" class="detail-item">
                    <span class="detail-label">License Plate:</span>
                    <span class="detail-value">{{ booking.licensePlate || 'N/A' }}</span>
                  </div>
                  <div v-if="booking.status !== 'cancelled'" class="detail-item">
                    <span class="detail-label">Phone Number:</span>
                    <span class="detail-value">{{ booking.phoneNumber || 'N/A' }}</span>
                  </div>

                  <div v-if="booking.customerNotes && booking.status !== 'cancelled'" class="jc-card-notes-box">📝 {{ booking.customerNotes }}</div>

                  <div class="detail-item appointment-item">
                    <span class="detail-label">Appointment Date:</span>
                    <span class="detail-value">{{ formatDate(booking.appointmentDate) }}</span>
                  </div>
                  <div class="detail-item appointment-item">
                    <span class="detail-label">Appointment Time:</span>
                    <span class="detail-value">{{ booking.appointmentTime || 'N/A' }}</span>
                  </div>
                  <div
                    v-if="booking.status === 'cancelled' && booking.cancelReason"
                    class="detail-item cancel-reason-item"
                  >
                    <span class="detail-label">Cancel Reason:</span>
                    <span class="detail-value">{{ booking.cancelReason }}</span>
                  </div>
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
                <div class="detail-group"><label>Vehicle:</label><p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }}</p></div>
                <div class="detail-group"><label>License Plate:</label><p>{{ modal.booking.licensePlate || 'N/A' }}</p></div>
                <div class="detail-group"><label>Booking ID:</label><p>#{{ modal.booking.id }}</p></div>
                <div class="detail-group"><label>Status:</label><p>{{ formatStatus(modal.booking.status) }}</p></div>
                <div class="detail-group"><label>Phone Number:</label><p>{{ modal.booking.phoneNumber || 'N/A' }}</p></div>
                <div class="detail-group"><label>Appointment Date:</label><p>{{ formatDate(modal.booking.appointmentDate) }}</p></div>
                <div class="detail-group"><label>Appointment Time:</label><p>{{ modal.booking.appointmentTime || 'N/A' }}</p></div>
                <div v-if="modal.booking.customerNotes" class="detail-group">
                  <label>Notes:</label>
                  <div class="jc-notes-box">{{ modal.booking.customerNotes }}</div>
                </div>
                <div v-if="modal.booking.status === 'cancelled' && modal.booking.cancelReason" class="detail-group">
                  <label>Cancel Reason:</label><p>{{ modal.booking.cancelReason }}</p>
                </div>
                <div v-if="modal.booking.status === 'cancelled' && modal.booking.cancelReason" class="detail-group cancelled-by-admin-modal">
                  <label>Cancelled By:</label><p>Porschify</p>
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
                  <input type="date" v-model="editForm.appointmentDate" :min="editMinDate" :max="editMaxDate" @change="onEditDateChange">
                  <p v-if="editIsSunday" class="warning-text" style="font-size:0.82rem; margin-top:4px;">Sundays are not available. Please select another date.</p>
                </div>
                <div class="form-group">
                  <label>Appointment Time:</label>
                  <select v-model="editForm.appointmentTime" :disabled="!editForm.appointmentDate || editIsSunday">
                    <option value="">Select time</option>
                    <option v-for="slot in editTimeSlots" :key="slot.value" :value="slot.value" :disabled="slot.disabled">
                      {{ slot.label }}{{ slot.disabled ? ' (Unavailable)' : '' }}
                    </option>
                  </select>
                  <div v-if="editIsSameAsOriginal" class="same-slot-warning">
                    <span class="same-slot-warning__icon">⚠️</span>
                    <span>This is the same date and time as your current appointment. Please select a different date or time to save.</span>
                  </div>
                </div>
              </div>
              <div class="modal-actions">
                <button class="btn-secondary" @click="closeModal">Cancel</button>
                <button class="btn-primary" @click="saveAppointment" :disabled="!editForm.appointmentDate || !editForm.appointmentTime || editIsSunday || editIsSameAsOriginal">Save Changes</button>
              </div>
            </div>
            <!-- CANCEL MODAL -->
            <div v-if="modal.type === 'cancel'">
              <h2>Cancel Appointment</h2>
              <div class="modal-body">
                <p>Are you sure you want to cancel this appointment?</p>
                <div class="detail-group"><label>Vehicle:</label><p>{{ modal.booking.vehicleYear }} {{ modal.booking.vehicleMake }}</p></div>
                <div class="detail-group"><label>Appointment Date:</label><p>{{ formatDate(modal.booking.appointmentDate) }}</p></div>
                <div class="detail-group"><label>Appointment Time:</label><p>{{ modal.booking.appointmentTime || 'N/A' }}</p></div>
                <p class="warning-text">This action cannot be undone.</p>
              </div>
              <div class="modal-actions">
                <button class="btn-secondary" @click="closeModal">Keep Appointment</button>
                <button class="btn-danger" :disabled="!canCancelBooking(modal.booking)" @click="confirmCancel">Yes, Cancel Appointment</button>
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
        <div v-if="jobCardsError" class="jc-empty-state">Error: {{ jobCardsError }}</div>
        <div v-else-if="filteredJobCards.length === 0" class="jc-empty-state">No active jobs found.</div>
        <div v-else class="jc-list">
          <div v-for="job in paginatedJobCards" :key="job.id" class="jc-card">
            <div class="jc-status-col" :class="'jc-status-col--' + job.status">
              <span class="jc-status-badge" :class="'jc-status-badge--' + job.status">{{ getStatusLabel(job.status) }}</span>
            </div>
            <div class="jc-divider" :class="'jc-divider--' + job.status"></div>
            <div class="jc-card-body">
              <div class="jc-card-top">
                <h3 class="jc-card-name">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }}</h3>
                <span class="jc-card-id">#{{ job.id }}</span>
              </div>
              <p class="jc-card-vehicle">{{ job.licensePlate }}</p>
              <div v-if="job.notes" class="jc-card-notes-box">📝 {{ job.notes }}</div>
              <div class="jc-card-meta">
                <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>

                <!-- Diagnose: show diagnose technician only -->
                <template v-if="job.status === 'diagnose'">
                  <span v-if="job.diagnoseTechnicianName" class="jc-meta-tag jc-meta-tag--technician">
                    👤 {{ job.diagnoseTechnicianName }}
                  </span>
                  <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
                </template>

                <!-- Quotation: show services names + parts count + diagnose technician -->
                <template v-else-if="job.status === 'quotation'">
                  <span v-if="job.serviceNames" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceNames }}</span>
                  <span v-if="job.parts && job.parts.length" class="jc-meta-tag jc-meta-tag--parts">🔩 {{ job.parts.length }} part{{ job.parts.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.diagnoseTechnicianName" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.diagnoseTechnicianName }}</span>
                  <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
                </template>

                <!-- Waiting For Parts: services names + parts count + expected arrival + diagnose technician -->
                <template v-else-if="job.status === 'waiting-for-parts'">
                  <span v-if="job.serviceNames" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceNames }}</span>
                  <span v-if="job.parts && job.parts.length" class="jc-meta-tag jc-meta-tag--parts">🔩 {{ job.parts.length }} part{{ job.parts.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.expectedPartsArrival" class="jc-meta-tag jc-meta-tag--eta">
                    📦 ETA for parts: {{ formatDate(job.expectedPartsArrival) }}
                  </span>
                  <span v-else class="jc-meta-tag jc-meta-tag--eta-missing">📦 ETA: Not Set</span>
                  <span v-if="job.diagnoseTechnicianName" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.diagnoseTechnicianName }}</span>
                  <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
                </template>
                <!-- Service: show services names + parts + services count + service technician -->
                <template v-else-if="job.status === 'service'">
                  <span v-if="job.serviceNames" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceNames }}</span>
                  <span v-if="job.parts && job.parts.length" class="jc-meta-tag jc-meta-tag--parts">🔩 {{ job.parts.length }} part{{ job.parts.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.services && job.services.length" class="jc-meta-tag jc-meta-tag--services">🔧 {{ job.services.length }} service{{ job.services.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.serviceTechnicianName" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.serviceTechnicianName }}</span>
                  <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Tech: Not Assigned</span>
                </template>

                <!-- Ready: show services names + parts + services count + service technician -->
                <template v-else-if="job.status === 'ready'">
                  <span v-if="job.serviceNames" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceNames }}</span>
                  <span v-if="job.parts && job.parts.length" class="jc-meta-tag jc-meta-tag--parts">🔩 {{ job.parts.length }} part{{ job.parts.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.services && job.services.length" class="jc-meta-tag jc-meta-tag--services">🔧 {{ job.services.length }} service{{ job.services.length !== 1 ? 's' : '' }}</span>
                  <span v-if="job.serviceTechnicianName" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.serviceTechnicianName }}</span>
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
              <!-- Order ID -->
              <div class="jc-detail-group">
                <label>Order ID</label>
                <p>#{{ jobModal.job.id }}</p>
              </div>
              <div class="jc-detail-group">
                <label>Status</label>
                <p><span class="jc-status-badge" :class="'jc-status-badge--' + jobModal.job.status">{{ getStatusLabel(jobModal.job.status) }}</span></p>
              </div>
              <div class="jc-detail-group"><label>Vehicle</label><p>{{ jobModal.job.vehicleYear }} {{ jobModal.job.vehicleMake }} {{ jobModal.job.vehicleModel }}</p></div>
              <div class="jc-detail-group"><label>License Plate</label><p>{{ jobModal.job.licensePlate }}</p></div>
              <div v-if="jobModal.job.notes" class="jc-detail-group">
                <label>Customer Notes</label>
                <div class="jc-notes-box">{{ jobModal.job.notes }}</div>
              </div>
              <div class="jc-detail-group"><label>Job Date</label><p>{{ formatDate(jobModal.job.jobDate) }}</p></div>

              <!-- Service type: shown for quotation and beyond -->
              <div v-if="jobModal.job.status !== 'diagnose' && jobModal.job.serviceNames" class="jc-detail-group">
                <label>Service Type</label><p>{{ jobModal.job.serviceNames }}</p>
              </div>

              <!-- Expected parts arrival: only for waiting-for-parts -->
              <div v-if="jobModal.job.status === 'waiting-for-parts' && jobModal.job.expectedPartsArrival" class="jc-detail-group">
                <label>Expected Parts Arrival</label><p>{{ formatDate(jobModal.job.expectedPartsArrival) }}</p>
              </div>

              <!-- DIAGNOSE technician: shown for diagnose, quotation, waiting-for-parts -->
              <div v-if="['diagnose', 'quotation', 'waiting-for-parts'].includes(jobModal.job.status)" class="jc-detail-group">
                <label>Diagnose Technician</label>
                <div v-if="jobModal.job.diagnoseTechnicianName">
                  <p>{{ jobModal.job.diagnoseTechnicianName }}</p>
                  <div class="jc-tech-contact" v-if="jobModal.job.diagnoseTechContact">
                    <span class="jc-tech-contact-item">{{ jobModal.job.diagnoseTechContact.email }}</span>
                  </div>
                </div>
                <p v-else class="jc-not-assigned">Not Assigned</p>
              </div>

              <!-- SERVICE technician: shown for service and ready statuses -->
              <div v-if="['service', 'ready'].includes(jobModal.job.status)" class="jc-detail-group">
                <label>Service Technician</label>
                <div v-if="jobModal.job.serviceTechnicianName">
                  <p>{{ jobModal.job.serviceTechnicianName }}</p>
                  <div class="jc-tech-contact" v-if="jobModal.job.serviceTechContact">
                    <span class="jc-tech-contact-item">{{ jobModal.job.serviceTechContact.email }}</span>
                  </div>
                </div>
                <p v-else class="jc-not-assigned">Not Assigned</p>
              </div>

              <!-- Parts: shown for quotation, waiting-for-parts, service, ready -->
              <div v-if="['quotation', 'waiting-for-parts', 'service', 'ready'].includes(jobModal.job.status) && jobModal.job.parts && jobModal.job.parts.length" class="jc-detail-group">
                <label>Parts</label>
                <div class="jc-item-list">
                  <div v-for="(part, i) in jobModal.job.parts" :key="i" class="jc-item-row">
                    <span class="jc-item-name">{{ part.name }}</span>
                  </div>
                </div>
              </div>

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
        <div v-if="finishedJobsError" class="jc-empty-state">Error: {{ finishedJobsError }}</div>
        <div v-else-if="finishedJobs.length === 0" class="jc-empty-state">No finished jobs found.</div>
        <div v-else class="jc-list" style="margin-top: 1.5rem;">
          <div v-for="job in paginatedFinishedJobs" :key="job.id" class="jc-card">
            <div class="jc-status-col jc-status-col--completed">
              <span class="jc-status-badge jc-status-badge--completed">Checked Out</span>
            </div>
            <div class="jc-divider jc-divider--completed"></div>
            <div class="jc-card-body">
              <div class="jc-card-top">
                <h3 class="jc-card-name">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }}</h3>
                <span class="jc-card-id">#{{ job.id }}</span>
              </div>
              <p class="jc-card-vehicle">{{ job.licensePlate }}</p>
              <div class="jc-card-meta">
                <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
                <span v-if="job.serviceNames" class="jc-meta-tag jc-meta-tag--service">{{ job.serviceNames }}</span>
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
              <!-- Order ID -->
              <div class="jc-detail-group">
                <label>Order ID</label>
                <p>#{{ finishedJobModal.job.id }}</p>
              </div>
              <div class="jc-detail-group">
                <label>Status</label>
                <p><span class="jc-status-badge jc-status-badge--completed">Checked Out</span></p>
              </div>
              <div class="jc-detail-group"><label>Vehicle</label><p>{{ finishedJobModal.job.vehicleYear }} {{ finishedJobModal.job.vehicleMake }} {{ finishedJobModal.job.vehicleModel }}</p></div>
              <div class="jc-detail-group"><label>License Plate</label><p>{{ finishedJobModal.job.licensePlate }}</p></div>
              <div v-if="finishedJobModal.job.notes" class="jc-detail-group">
                <label>Customer Notes</label>
                <div class="jc-notes-box">{{ finishedJobModal.job.notes }}</div>
              </div>
              <div v-if="finishedJobModal.job.checkOut" class="jc-detail-group">
                <label>Check-Out Date</label><p>{{ formatDate(finishedJobModal.job.checkOut) }}</p>
              </div>
              <!-- Service type from Services names -->
              <div v-if="finishedJobModal.job.serviceNames" class="jc-detail-group">
                <label>Service Type</label><p>{{ finishedJobModal.job.serviceNames }}</p>
              </div>
              <!-- Service Technician for finished jobs -->
              <div class="jc-detail-group">
                <label>Service Technician</label>
                <div v-if="finishedJobModal.job.serviceTechnicianName">
                  <p>{{ finishedJobModal.job.serviceTechnicianName }}</p>
                  <div class="jc-tech-contact" v-if="finishedJobModal.job.serviceTechContact">
                    <span class="jc-tech-contact-item">{{ finishedJobModal.job.serviceTechContact.email }}</span>
                  </div>
                </div>
                <p v-else class="jc-not-assigned">Not Assigned</p>
              </div>
              <!-- Parts -->
              <div v-if="finishedJobModal.job.parts && finishedJobModal.job.parts.length" class="jc-detail-group">
                <label>Parts</label>
                <div class="jc-item-list">
                  <div v-for="(part, i) in finishedJobModal.job.parts" :key="i" class="jc-item-row">
                    <span class="jc-item-name">{{ part.name }}</span>
                  </div>
                </div>
              </div>

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
import { formatYmd, sgDateFromYmd, sgDateTimeFrom, sgHourNow, sgLocaleDate, sgNow, sgTodayStr } from '@/utils/sgTime.js'

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

/**
 * Map the raw Order_Status string from the API directly to the
 * internal status key used throughout the frontend.
 *
 * API values  → internal key
 * ─────────────────────────────
 * diagnose         → diagnose
 * quotation        → quotation
 * waiting-for-parts→ waiting-for-parts
 * service          → service
 * ready            → ready
 * check-out        → completed   (finished-jobs tab)
 */
const ORDER_STATUS_MAP = {
  'diagnose':          'diagnose',
  'quotation':         'quotation',
  'waiting_for_parts': 'waiting-for-parts',
  'service':           'service',
  'ready':             'ready',
  'check-out':         'completed',
}

// Statuses that belong in the Active Jobs tab (no Check_Out yet)
const ACTIVE_STATUSES = new Set(['diagnose', 'quotation', 'waiting-for-parts', 'service', 'ready'])

function mapJobOrder(row) {
  const rawStatus = (row.Order_Status || '').toLowerCase().trim()
  const status    = ORDER_STATUS_MAP[rawStatus] || 'diagnose'

  // jobDate must match the CURRENT status's date column
  const statusDateMap = {
    'diagnose':          row.Diagnose,
    'quotation':         row.Quotation,
    'waiting-for-parts': row.Waiting_For_Parts,
    'service':           row.Service,
    'ready':             row.Ready,
    'completed':         row.Check_Out,
  }
  const jobDate = statusDateMap[status] || null

  // Parts: stored as a comma-separated string e.g. "part1,part2"
  // Parse into array of { name, price } objects (price unknown from this field)
  const rawParts = row.Parts || ''
  const parts = typeof rawParts === 'string' && rawParts.trim()
    ? rawParts.split(',').map(s => ({ name: s.trim(), price: 'N/A' }))
    : Array.isArray(rawParts)
      ? rawParts
      : []

  // Services: same pattern
  const rawServices = row.Services || ''
  const services = typeof rawServices === 'string' && rawServices.trim()
    ? rawServices.split(',').map(s => ({ name: s.trim(), price: 'N/A' }))
    : Array.isArray(rawServices)
      ? rawServices
      : []

  const serviceNames = services.length
    ? services.map(s => s.name).filter(Boolean).join(', ')
    : null

  const diagTech = row.diagnose_technician || null
  const svcTech  = row.service_technician  || null

  return {
    id:                   row.Order_ID,
    orderStatus:          row.Order_Status,
    status,
    jobDate,
    checkOut:             row.Check_Out                   || null,
    expectedPartsArrival: row.expected_parts_arrival_date || null,
    licensePlate:         row.vehicle_license_plate       || 'N/A',
    vehicleMake:          row.vehicle_make                || 'N/A',
    vehicleModel:         row.vehicle_model               || '',
    vehicleYear:          row.vehicle_year                || '',
    serviceNames,
    parts,
    services,
    diagnoseTechnicianName: diagTech ? diagTech.name  : null,
    diagnoseTechContact:    diagTech ? { email: diagTech.email } : null,
    serviceTechnicianName:  svcTech  ? svcTech.name   : null,
    serviceTechContact:     svcTech  ? { email: svcTech.email }  : null,
    notes:  row.notes ?? null,

  }
}
export default {
  name: 'CustomerBookingsView',

  data() {
    return {
      pageLoading: true,
      activeTab: 'appointments',

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
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
      bookings: [],

      currentJobPage: 1,
      itemsPerJobPage: 5,
      activeJobStatusFilter: '',
      jobModal: { isOpen: false, job: null },
      jobCardsError: null,
      // Active Jobs tab filter buttons — ready added
      activeJobStatuses: [
        { value: 'diagnose',          label: 'Diagnose'          },
        { value: 'quotation',         label: 'Quotation'         },
        { value: 'waiting-for-parts', label: 'Waiting For Parts' },
        { value: 'service',           label: 'Service'           },
        { value: 'ready',             label: 'Ready'             },
      ],
      jobCards: [],

      currentFinishedPage: 1,
      itemsPerFinishedPage: 5,
      finishedJobModal: { isOpen: false, job: null },
      finishedJobsError: null,
      finishedJobs: [],
    }
  },

  async mounted() {
    await Promise.all([
      this.fetchAppointments(),
      this.fetchJobOrders(),
    ])
  },

  computed: {
    filteredAndSortedBookings() {
      const parseTime = (t) => {
        if (!t) return { h: 0, min: 0 }
        const parts = t.trim().split(' ')
        const m = parts[1] ? parts[1].toUpperCase() : ''
        let [h, min] = parts[0].split(':').map(Number)
        if (m === 'PM' && h !== 12) h += 12
        if (m === 'AM' && h === 12) h = 0
        return { h, min: min || 0 }
      }
      let filtered
      if (this.statusFilter === 'upcoming') {
        const now = sgNow()
        filtered = this.bookings.filter(b => {
          if (b.status !== 'booked' || !b.appointmentDate) return false
          const apptDateTime = sgDateTimeFrom(b.appointmentDate, b.appointmentTime)
          return apptDateTime >= now
        })
        const getDateTime = (b) => {
          if (!b.appointmentDate) return null
          const dt = sgDateTimeFrom(b.appointmentDate, b.appointmentTime)
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
        const now = sgNow()
        filtered = this.bookings.filter(b => {
          if (b.status !== 'booked' || !b.appointmentDate || !b.appointmentTime) return false
          const apptDateTime = sgDateTimeFrom(b.appointmentDate, b.appointmentTime)
          return now > apptDateTime
        })
        filtered.sort((a, b) => sgDateFromYmd(b.appointmentDate) - sgDateFromYmd(a.appointmentDate))
      } else {
        filtered = this.bookings.filter(b => b.status === this.statusFilter)
        filtered.sort((a, b) => {
          const da = Date.parse(a.createdAt || 0)
          const db = Date.parse(b.createdAt || 0)
          return this.sortOrder === 'asc' ? da - db : db - da
        })
      }
      return filtered
    },
    nextUpBookingId() {
      const now = sgNow()
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
          const apptDateTime = sgDateTimeFrom(b.appointmentDate, b.appointmentTime)
          return apptDateTime >= now
        })
        .slice()
        .sort((a, b) => sgDateFromYmd(a.appointmentDate) - sgDateFromYmd(b.appointmentDate))
      return candidates.length ? candidates[0].id : null
    },
    paginatedBookings() {
      const s = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredAndSortedBookings.slice(s, s + this.itemsPerPage)
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredAndSortedBookings.length / this.itemsPerPage))
    },

    editMinDate() {
      const d = sgNow()
      d.setDate(d.getDate() + 3)
      return formatYmd(d)
    },
    editMaxDate() {
      const d = sgNow()
      d.setMonth(d.getMonth() + 1)
      return formatYmd(d)
    },
    editIsSunday() {
      if (!this.editForm.appointmentDate) return false
      return sgDateFromYmd(this.editForm.appointmentDate).getUTCDay() === 0
    },
    editIsSaturday() {
      if (!this.editForm.appointmentDate) return false
      return sgDateFromYmd(this.editForm.appointmentDate).getUTCDay() === 6
    },
    editIsToday() {
      if (!this.editForm.appointmentDate) return false
      return this.editForm.appointmentDate === sgTodayStr()
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
      const currentHour = sgHourNow()
      return slots.map(slot => {
        const slot24 = this.slotValueTo24h(slot.value)
        const slotHour = parseInt(slot24.split(':')[0])
        const isPast = this.editIsToday && slotHour <= currentHour
        const ownSlot24 = this.modal.booking ? this.timeTo24h(this.modal.booking.appointmentTime) : ''
        const ownDate   = this.modal.booking ? this.modal.booking.appointmentDate : ''
        const isBooked  = this.editBookedSlots.some(b => {
          const dateMatch = b.appointment_date === this.editForm.appointmentDate
          const timeMatch = b.appointment_time_24 === slot24
          const isOwnOriginalSlot = b.appointment_date === ownDate && b.appointment_time_24 === ownSlot24
          return dateMatch && timeMatch && !isOwnOriginalSlot
        })
        return { ...slot, disabled: isPast || isBooked }
      })
    },

    // Active jobs: rows whose status is NOT 'completed' (check-out)
    filteredJobCards() {
      let list = this.jobCards.filter(j => j.status !== 'completed')
      if (this.activeJobStatusFilter) list = list.filter(j => j.status === this.activeJobStatusFilter)
      return [...list].sort((a, b) => (a.jobDate || '').localeCompare(b.jobDate || ''))
    },
    totalJobPages() { return Math.max(1, Math.ceil(this.filteredJobCards.length / this.itemsPerJobPage)) },
    paginatedJobCards() {
      const s = (this.currentJobPage - 1) * this.itemsPerJobPage
      return this.filteredJobCards.slice(s, s + this.itemsPerJobPage)
    },

    totalFinishedPages() { return Math.max(1, Math.ceil(this.finishedJobs.length / this.itemsPerFinishedPage)) },
    paginatedFinishedJobs() {
      const s = (this.currentFinishedPage - 1) * this.itemsPerFinishedPage
      return this.finishedJobs.slice(s, s + this.itemsPerFinishedPage)
    },
  },

  methods: {
    async fetchAppointments() {
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
      }
    },

    async fetchJobOrders() {
      this.jobCardsError     = null
      this.finishedJobsError = null
      try {
        const token    = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/api/jobOrders/getJobOrders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.status === 404) {
          this.jobCards     = []
          this.finishedJobs = []
          return
        }
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || json.message || 'Failed to fetch job orders')

        const rows = json.data || []
        const mapped = rows.map(r => mapJobOrder(r))

        // Split by mapped status: 'completed' → finished tab; everything else → active tab
        this.jobCards = mapped.filter(j => j.status !== 'completed')
        this.finishedJobs = mapped
          .filter(j => j.status === 'completed')
          .sort((a, b) => (b.checkOut || '').localeCompare(a.checkOut || ''))
      } catch (err) {
        console.error('fetchJobOrders error:', err)
        this.jobCardsError     = err.message
        this.finishedJobsError = err.message
      } finally {
        this.pageLoading = false
      }
    },

    switchTab(tab) { this.activeTab = tab },

    canCancelBooking(booking) {
      if (!booking || !booking.appointmentDate) return false
      const today = sgDateFromYmd(sgTodayStr())
      const apptDate = sgDateFromYmd(booking.appointmentDate)
      const diffDays = (apptDate - today) / (1000 * 60 * 60 * 24)
      return diffDays > 2
    },

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
        const raw  = data.data || []
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
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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

    formatStatus(status) { return status.charAt(0).toUpperCase() + status.slice(1) },
    formatDate(date) {
      if (!date) return 'N/A'
      const normalizedDate = date.includes('T') ? date : `${date}T00:00:00+08:00`
      return sgLocaleDate(normalizedDate, 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    },

    goToPage(page)            { if (page >= 1 && page <= this.totalPages) this.currentPage = page },
    nextPage()                { if (this.currentPage < this.totalPages) this.currentPage++ },
    prevPage()                { if (this.currentPage > 1) this.currentPage-- },
    applyFilter(s)            { this.statusFilter = s; this.currentPage = 1 },
    toggleSortOrder()         { this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1 },
    toggleUpcomingSortOrder() { this.upcomingSortOrder = this.upcomingSortOrder === 'asc' ? 'desc' : 'asc'; this.currentPage = 1 },

    setJobStatusFilter(val) { this.activeJobStatusFilter = val; this.currentJobPage = 1 },
    goToJobPage(page)       { if (page >= 1 && page <= this.totalJobPages) this.currentJobPage = page },
    prevJobPage()           { if (this.currentJobPage > 1) this.currentJobPage-- },
    nextJobPage()           { if (this.currentJobPage < this.totalJobPages) this.currentJobPage++ },
    getStatusLabel(status)  {
      // Check active job statuses first, then handle 'completed' for finished jobs
      const f = this.activeJobStatuses.find(s => s.value === status)
      if (f) return f.label
      if (status === 'completed') return 'Checked Out'
      return status
    },
    openJobModal(job)  { this.jobModal = { job, isOpen: true } },
    closeJobModal()    { this.jobModal = { isOpen: false, job: null } },

    goToFinishedPage(page)    { if (page >= 1 && page <= this.totalFinishedPages) this.currentFinishedPage = page },
    prevFinishedPage()        { if (this.currentFinishedPage > 1) this.currentFinishedPage-- },
    nextFinishedPage()        { if (this.currentFinishedPage < this.totalFinishedPages) this.currentFinishedPage++ },
    openFinishedJobModal(job) { this.finishedJobModal = { job, isOpen: true } },
    closeFinishedJobModal()   { this.finishedJobModal = { isOpen: false, job: null } },
  },
}
</script>

<style scoped src="@/assets/customerBookings.css"></style>