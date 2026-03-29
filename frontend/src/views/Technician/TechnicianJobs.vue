<template>
  <div class="tech-container">

    <!-- Header -->
    <div class="tech-header">
      <div class="tech-header-left">
        <div class="tech-header-info">
          <h1>Assigned Jobs</h1>
        </div>
      </div>
      <transition name="tech-stats-fade">
        <div v-if="activeTab === 'jobs'" class="tech-header-stats">
          <div class="tech-stat">
            <span class="tech-stat-value">{{ diagnosedCount }}</span>
            <span class="tech-stat-label">Diagnose</span>
          </div>
          <div class="tech-stat-divider"></div>
          <div class="tech-stat">
            <span class="tech-stat-value">{{ serviceCount }}</span>
            <span class="tech-stat-label">Service</span>
          </div>
          <div class="tech-stat-divider"></div>
          <div class="tech-stat">
            <span class="tech-stat-value">{{ totalAssigned }}</span>
            <span class="tech-stat-label">Total Jobs</span>
          </div>
        </div>
      </transition>
    </div>

    <!-- Tab Switcher -->
    <div class="tech-tab-switcher">
      <button
        class="tech-tab-btn"
        :class="{ active: activeTab === 'appointments' }"
        @click="switchTab('appointments')"
      >
        Appointments
        <span class="tech-tab-count">{{ filteredAppointments.length }}</span>
      </button>
      <button
        class="tech-tab-btn"
        :class="{ active: activeTab === 'jobs' }"
        @click="switchTab('jobs')"
      >
        Job Orders
        <span class="tech-tab-count">{{ filteredJobs.length }}</span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  TAB 1 — APPOINTMENTS                                       -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'appointments'">

      <!-- Loading State -->
      <div v-if="apptLoading" class="tech-loading-state">
        <span class="tech-loading-spinner"></span>
        <p>Loading appointments...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="apptError" class="tech-error-state">
        <p>⚠️ {{ apptError }}</p>
        <button class="tech-btn-retry" @click="fetchAppointments">Retry</button>
      </div>

      <template v-else>
        <!-- Filter Bar -->
        <div class="tech-filter-bar">
          <div class="tech-filter-row">
            <div class="tech-filter-row-label">Date</div>
            <div class="tech-filter-row-controls">
              <button
                v-for="f in dateFilters"
                :key="f.value"
                class="tech-filter-btn"
                :class="{ active: apptDateFilter === f.value && !apptSpecificDate }"
                @click="setApptDateFilter(f.value)"
              >{{ f.label }}</button>
              <div class="tech-date-filter">
                <input
                  type="date"
                  class="tech-date-input"
                  :class="{ active: apptSpecificDate }"
                  v-model="apptSpecificDate"
                  @change="apptPage = 1"
                />
                <button v-if="apptSpecificDate" class="tech-clear-date" @click="apptSpecificDate = ''; apptPage = 1">✕</button>
              </div>
            </div>
          </div>
          <div class="tech-count-row">
            <span class="tech-count">{{ filteredAppointments.length }} appointment{{ filteredAppointments.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredAppointments.length === 0" class="tech-empty-state">
          <span class="tech-empty-icon">📅</span>
          <p>No appointments found for this period.</p>
        </div>

        <!-- List -->
        <div v-else class="tech-list">
          <div
            v-for="appt in paginatedAppointments"
            :key="appt.id"
            class="tech-card"
            :class="{ 'tech-card--today': isToday(appt.appointmentDate) }"
          >
            <div class="tech-status-col tech-status-col--appt-upcoming">
              <span class="tech-card-appt-date">{{ formatDate(appt.appointmentDate) }}</span>
              <span class="tech-meta-tag tech-meta-tag--time">🕐 {{ appt.appointmentTime || 'N/A' }}</span>
            </div>
            <div class="tech-divider tech-divider--appt-upcoming"></div>
            <div class="tech-card-body">
              <div class="tech-card-top">
                <h3 class="tech-card-name">{{ appt.customerName }}</h3>
                <span class="tech-card-id">#{{ appt.id }}</span>
              </div>
              <p class="tech-card-vehicle">{{ appt.vehicleYear }} {{ appt.vehicleMake }} {{ appt.vehicleModel }} · {{ appt.licensePlate }}</p>
              <div class="tech-card-meta">
                <span class="tech-meta-tag tech-meta-tag--day">{{ isToday(appt.appointmentDate) ? 'Today' : getDayName(appt.appointmentDate) }}</span>
              </div>
              <p v-if="appt.customerNotes" class="tech-card-notes"><span class="tech-card-notes-label">Customer Notes:</span> {{ appt.customerNotes }}</p>
            </div>
            <div class="tech-card-actions">
              <button class="tech-btn-view" @click="openApptModal(appt)">View</button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="apptTotalPages > 1" class="tech-pagination">
          <button class="tech-pagination-btn" @click="apptPage--" :disabled="apptPage === 1">← Previous</button>
          <div class="tech-pagination-pages">
            <button
              v-for="page in apptTotalPages"
              :key="page"
              class="tech-pagination-page"
              :class="{ active: apptPage === page }"
              @click="apptPage = page"
            >{{ page }}</button>
          </div>
          <button class="tech-pagination-btn" @click="apptPage++" :disabled="apptPage === apptTotalPages">Next →</button>
        </div>
      </template>

      <!-- Appointment View Modal -->
      <div v-if="apptModal.isOpen" class="tech-modal-overlay" @click="apptModal.isOpen = false">
        <div class="tech-modal" @click.stop>
          <button class="tech-modal-close" @click="apptModal.isOpen = false">&times;</button>
          <h2>Appointment Details</h2>
          <div class="tech-modal-body">
            <div class="tech-detail-group"><label>Customer</label><p>{{ apptModal.appt.customerName }}</p></div>
            <div class="tech-detail-group"><label>Customer Email</label><p>{{ apptModal.appt.customerEmail || 'N/A' }}</p></div>
            <div class="tech-detail-group"><label>Phone Number</label><p>{{ apptModal.appt.phoneNumber || 'N/A' }}</p></div>
            <div class="tech-detail-group"><label>Vehicle</label><p>{{ apptModal.appt.vehicleYear }} {{ apptModal.appt.vehicleMake }} {{ apptModal.appt.vehicleModel }}</p></div>
            <div class="tech-detail-group"><label>License Plate</label><p>{{ apptModal.appt.licensePlate }}</p></div>
            <div class="tech-detail-group"><label>Appointment Date</label><p>{{ formatDate(apptModal.appt.appointmentDate) }}</p></div>
            <div class="tech-detail-group"><label>Appointment Time</label><p>{{ apptModal.appt.appointmentTime || 'N/A' }}</p></div>
            <div v-if="apptModal.appt.customerNotes" class="tech-detail-group"><label>Customer Notes</label><p>{{ apptModal.appt.customerNotes }}</p></div>
          </div>
          <div class="tech-modal-actions">
            <button class="tech-btn-secondary" @click="apptModal.isOpen = false">Close</button>
          </div>
        </div>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  TAB 2 — JOB ORDERS                                         -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'jobs'">

      <!-- Loading State -->
      <div v-if="jobLoading" class="tech-loading-state">
        <span class="tech-loading-spinner"></span>
        <p>Loading job orders...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="jobError" class="tech-error-state">
        <p>⚠️ {{ jobError }}</p>
        <button class="tech-btn-retry" @click="fetchJobOrders">Retry</button>
      </div>

      <template v-else>
        <!-- Filter Bar -->
        <div class="tech-filter-bar">

          <!-- Date filters -->
          <div class="tech-filter-row">
            <div class="tech-filter-row-label">Date</div>
            <div class="tech-filter-row-controls">
              <button
                v-for="f in dateFilters"
                :key="f.value"
                class="tech-filter-btn"
                :class="{ active: jobDateFilter === f.value && !jobSpecificDate }"
                @click="setJobDateFilter(f.value)"
              >{{ f.label }}</button>
              <div class="tech-date-filter">
                <input
                  type="date"
                  class="tech-date-input"
                  :class="{ active: jobSpecificDate }"
                  v-model="jobSpecificDate"
                  @change="jobPage = 1"
                />
                <button v-if="jobSpecificDate" class="tech-clear-date" @click="jobSpecificDate = ''; jobPage = 1">✕</button>
              </div>
            </div>
          </div>

          <!-- Status filters -->
          <div class="tech-filter-row">
            <div class="tech-filter-row-label">Status</div>
            <div class="tech-filter-row-controls">
              <button
                class="tech-filter-btn"
                :class="{ active: jobStatusFilter === '' }"
                @click="setJobStatusFilter('')"
              >All</button>
              <button
                v-for="s in jobStatuses"
                :key="s.value"
                class="tech-filter-btn tech-status-filter-btn"
                :class="['tech-status-btn--' + s.value, { active: jobStatusFilter === s.value }]"
                @click="setJobStatusFilter(s.value)"
              >{{ s.label }}</button>
            </div>
          </div>

          <!-- Items filters -->
          <div v-if="jobStatusFilter === 'diagnose'" class="tech-filter-row">
            <div class="tech-filter-row-label">Items</div>
            <div class="tech-filter-row-controls">
              <button
                class="tech-filter-btn"
                :class="{ active: jobItemFilter === 'all' }"
                @click="setJobItemFilter('all')"
              >All</button>
              <button
                class="tech-filter-btn tech-item-filter-btn--parts"
                :class="{ active: jobItemFilter === 'no-parts' }"
                @click="setJobItemFilter('no-parts')"
              >No Parts Added</button>
              <button
                class="tech-filter-btn tech-item-filter-btn--services"
                :class="{ active: jobItemFilter === 'no-services' }"
                @click="setJobItemFilter('no-services')"
              >No Services Added</button>
            </div>
          </div>

          <!-- Count -->
          <div class="tech-count-row">
            <span class="tech-count">{{ filteredJobs.length }} job order{{ filteredJobs.length !== 1 ? 's' : '' }}</span>
          </div>

        </div>

        <!-- Empty State -->
        <div v-if="filteredJobs.length === 0" class="tech-empty-state">
          <span class="tech-empty-icon">📋</span>
          <p>No job orders found for this period.</p>
        </div>

        <!-- List -->
        <div v-else class="tech-list">
          <div
            v-for="job in paginatedJobs"
            :key="job.id"
            class="tech-card"
            :class="{ 'tech-card--today': isToday(job.jobDate) }"
          >
            <div class="tech-status-col" :class="'tech-status-col--' + job.status">
              <span class="tech-card-day">{{ isToday(job.jobDate) ? 'Today' : getDayName(job.jobDate) }}</span>
              <span class="tech-status-badge" :class="'tech-status-badge--' + job.status">
                {{ getJobStatusLabel(job.status) }}
              </span>
            </div>
            <div class="tech-divider" :class="'tech-divider--' + job.status"></div>
            <div class="tech-card-body">
              <div class="tech-card-top">
                <h3 class="tech-card-name">{{ job.customerName }}</h3>
                <span class="tech-card-id">#{{ job.id }}</span>
              </div>
              <p class="tech-card-vehicle">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }} · {{ job.licensePlate }}</p>
              <div class="tech-card-meta">
                <span class="tech-meta-tag tech-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
                <span v-if="job.myRole === 'diagnose'" class="tech-meta-tag tech-meta-tag--role-diagnose">🔍 Diagnose Tech</span>
                <span v-if="job.myRole === 'service'"  class="tech-meta-tag tech-meta-tag--role-service">🔧 Service Tech</span>
              </div>
              <p v-if="job.customerNotes" class="tech-card-notes"><span class="tech-card-notes-label">Customer Notes:</span> {{ job.customerNotes }}</p>
            </div>
            <div class="tech-card-actions">
              <button class="tech-btn-view" @click="openJobModal(job)">View</button>

              <!-- Diagnose role: Parts + Services -->
              <template v-if="job.myRole === 'diagnose' && job.status === 'diagnose'">
                <button
                  class="tech-btn-add-parts"
                  :class="{ 'tech-btn-has-items': job.parts && job.parts.length > 0 }"
                  @click="openItemModal(job, 'parts')"
                >
                  <span v-if="job.parts && job.parts.length > 0">✏️ Parts <span class="tech-btn-count">{{ job.parts.length }}</span></span>
                  <span v-else>+ Parts</span>
                </button>
                <button
                  class="tech-btn-add-services"
                  :class="{ 'tech-btn-has-items': job.addedServices && job.addedServices.length > 0 }"
                  @click="openItemModal(job, 'services')"
                >
                  <span v-if="job.addedServices && job.addedServices.length > 0">✏️ Services <span class="tech-btn-count">{{ job.addedServices.length }}</span></span>
                  <span v-else>+ Services</span>
                </button>
              </template>

              <!-- Service role: Mark Complete -->
              <button
                v-if="job.myRole === 'service' && job.status === 'service'"
                class="tech-btn-update tech-btn-update--completed"
                @click="openUpdateModal(job)"
              >Mark As Ready</button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="jobTotalPages > 1" class="tech-pagination">
          <button class="tech-pagination-btn" @click="jobPage--" :disabled="jobPage === 1">← Previous</button>
          <div class="tech-pagination-pages">
            <button
              v-for="page in jobTotalPages"
              :key="page"
              class="tech-pagination-page"
              :class="{ active: jobPage === page }"
              @click="jobPage = page"
            >{{ page }}</button>
          </div>
          <button class="tech-pagination-btn" @click="jobPage++" :disabled="jobPage === jobTotalPages">Next →</button>
        </div>

      </template>

      <!-- Job View Modal -->
      <div v-if="jobModal.isOpen" class="tech-modal-overlay" @click="closeJobModal">
        <div class="tech-modal" @click.stop>
          <button class="tech-modal-close" @click="closeJobModal">&times;</button>
          <h2>Job Order Details</h2>
          <div class="tech-modal-body">
          <div class="tech-detail-group">
              <label>Order ID</label>
              <p>#{{ jobModal.job.id }}</p>
            </div>
            <div class="tech-detail-group">
              <label>Status</label>
              <p><span class="tech-status-badge" :class="'tech-status-badge--' + jobModal.job.status">{{ getJobStatusLabel(jobModal.job.status) }}</span></p>
            </div>
            <div class="tech-detail-group">
              <label>My Role</label>
              <p>
                <span class="tech-meta-tag" :class="jobModal.job.myRole === 'diagnose' ? 'tech-meta-tag--role-diagnose' : 'tech-meta-tag--role-service'">
                  {{ jobModal.job.myRole === 'diagnose' ? '🔍 Diagnose Technician' : '🔧 Service Technician' }}
                </span>
              </p>
            </div>
            <div class="tech-detail-group"><label>Customer</label><p>{{ jobModal.job.customerName }}</p></div>
            <div class="tech-detail-group"><label>Customer Email</label><p>{{ jobModal.job.customerEmail || 'N/A' }}</p></div>
            <div class="tech-detail-group"><label>Phone Number</label><p>{{ jobModal.job.phoneNumber || 'N/A' }}</p></div>
            <div class="tech-detail-group"><label>Vehicle</label><p>{{ jobModal.job.vehicleYear }} {{ jobModal.job.vehicleMake }} {{ jobModal.job.vehicleModel }}</p></div>
            <div class="tech-detail-group"><label>License Plate</label><p>{{ jobModal.job.licensePlate }}</p></div>
            <div class="tech-detail-group"><label>Job Date</label><p>{{ formatDate(jobModal.job.jobDate) }}</p></div>
    
            <div class="tech-detail-group"><label>Diagnose Technician</label><p>{{ jobModal.job.diagnoseTechnician || 'Not Assigned' }}</p></div>
            <div class="tech-detail-group"><label>Service Technician</label><p>{{ jobModal.job.serviceTechnician || 'Not Assigned' }}</p></div>
            <div v-if="jobModal.job.parts && jobModal.job.parts.length > 0" class="tech-detail-group">
              <label>Parts</label>
              <div class="tech-detail-tags">
                <span v-for="p in jobModal.job.parts" :key="p" class="tech-detail-tag tech-detail-tag--parts">{{ p }}</span>
              </div>
            </div>
            <div v-if="jobModal.job.addedServices && jobModal.job.addedServices.length > 0" class="tech-detail-group">
              <label>Services</label>
              <div class="tech-detail-tags">
                <span v-for="s in jobModal.job.addedServices" :key="s" class="tech-detail-tag tech-detail-tag--services">{{ s }}</span>
              </div>
            </div>
            <div v-if="jobModal.job.notes" class="tech-detail-group"><label>Customer Notes</label><p>{{ jobModal.job.notes }}</p></div>
          </div>
          <div class="tech-modal-actions">
            <button class="tech-btn-secondary" @click="closeJobModal">Close</button>
          </div>
        </div>
      </div>

      <!-- Parts / Services Modal -->
      <div v-if="itemModal.isOpen" class="tech-modal-overlay" @click="closeItemModal">
        <div class="tech-modal" @click.stop>
          <button class="tech-modal-close" @click="closeItemModal">&times;</button>
          <h2>{{ itemModal.type === 'parts' ? '🔩 Parts' : '🔧 Services' }}</h2>
          <div class="tech-modal-body">
            <p class="tech-item-sub">{{ itemModal.job ? itemModal.job.customerName : '' }} · #{{ itemModal.job ? itemModal.job.id : '' }}</p>
            <div class="tech-detail-group">
              <label>
                Selected
                <span v-if="itemModal.selected.length > 0" class="tech-selected-count">{{ itemModal.selected.length }}</span>
              </label>
              <div v-if="itemModal.selected.length > 0" class="tech-panel-items">
                <div
                  v-for="(item, idx) in itemModal.selected"
                  :key="idx"
                  class="tech-panel-item"
                  :class="itemModal.type === 'parts' ? 'tech-panel-item--parts' : 'tech-panel-item--services'"
                >
                  <span>{{ item }}</span>
                  <button class="tech-remove-item" @click="itemModal.selected.splice(idx, 1)">✕</button>
                </div>
              </div>
              <p v-else class="tech-panel-empty">Nothing selected yet. Search below to add items.</p>
            </div>
          </div>
          <div class="tech-item-search-section">
            <label class="tech-item-search-label">{{ itemModal.type === 'parts' ? 'Search Parts' : 'Search Services' }}</label>
            <div class="tech-search-wrap">
              <input
                type="text"
                class="tech-search-input"
                :placeholder="itemModal.type === 'parts' ? 'e.g. Brake Pads, Air Filter...' : 'e.g. Oil Change, Wheel Alignment...'"
                v-model="itemModal.search"
                @focus="itemModal.dropdownOpen = true"
                @blur="delayCloseDropdown"
                ref="itemSearchInput"
              />
              <div v-if="itemModal.dropdownOpen && filteredItemList.length > 0" class="tech-dropdown">
                <div
                  v-for="item in filteredItemList"
                  :key="item"
                  class="tech-dropdown-item"
                  :class="{ 'tech-dropdown-item--selected': itemModal.selected.includes(item) }"
                  @mousedown.prevent="toggleItem(item)"
                >
                  <span>{{ item }}</span>
                  <span v-if="itemModal.selected.includes(item)" class="tech-dropdown-check">✓</span>
                </div>
              </div>
              <div v-if="itemModal.dropdownOpen && itemModal.search && filteredItemList.length === 0" class="tech-dropdown">
                <div class="tech-dropdown-empty">No results found</div>
              </div>
            </div>
          </div>
          <div class="tech-modal-actions tech-item-modal-actions">
            <button class="tech-btn-secondary" @click="closeItemModal">Cancel</button>
            <button class="tech-btn-view" @click="saveItemModal">Save</button>
          </div>
        </div>
      </div>

      <!-- Mark Complete Confirm Modal -->
      <div v-if="updateModal.isOpen" class="tech-modal-overlay" @click="closeUpdateModal">
        <div class="tech-modal tech-confirm-modal" @click.stop>
          <div class="tech-confirm-icon tech-confirm-icon--completed">✓</div>
          <h2>Mark As Ready</h2>
          <p class="tech-confirm-desc">Confirm that all service work has been completed for this job order.</p>
          <div class="tech-confirm-card-info">
            <span class="tech-confirm-name">{{ updateModal.job.customerName }}</span>
            <span class="tech-confirm-meta">{{ updateModal.job.vehicleYear }} {{ updateModal.job.vehicleMake }} {{ updateModal.job.vehicleModel }} · #{{ updateModal.job.id }}</span>
            <span class="tech-confirm-meta">Order #{{ updateModal.job.id }}</span>
          </div>
          <div class="tech-modal-actions tech-confirm-actions">
            <button class="tech-btn-secondary" @click="closeUpdateModal">Go Back</button>
            <button class="tech-btn-update tech-btn-update--completed" @click="submitUpdate">Confirm</button>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script>
export default {
  name: 'TechnicianJobsView',
  data() {
    return {
      activeTab: 'appointments',

      // ── Shared ──
      dateFilters: [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'week'  },
        { label: 'This Month', value: 'month' },
        { label: 'All',        value: 'all'   },
      ],

      // ── Appointments state ──
      appointments:     [],
      apptLoading:      false,
      apptError:        null,
      apptDateFilter:   'all',
      apptSpecificDate: '',
      apptPage:         1,
      apptItemsPerPage: 5,
      apptModal:        { isOpen: false, appt: {} },

      // ── Job Orders state ──
      jobCards:         [],
      jobLoading:       false,
      jobError:         null,
      jobDateFilter:    'all',
      jobSpecificDate:  '',
      jobStatusFilter:  '',
      jobItemFilter:    'all',
      jobPage:          1,
      jobItemsPerPage:  5,
      jobStatuses: [
        { value: 'diagnose',         label: 'Diagnose'          },
        { value: 'service',          label: 'Service'           },
      ],
      jobModal:    { isOpen: false, job: {} },
      updateModal: { isOpen: false, job: {} },
      itemModal: {
        isOpen: false, job: null, type: null,
        search: '', dropdownOpen: false, selected: [],
      },
      predefinedParts: [
        'Air Filter', 'Oil Filter', 'Brake Pads', 'Brake Rotors', 'Spark Plugs',
        'Timing Belt', 'Serpentine Belt', 'Cabin Air Filter', 'Fuel Filter',
        'Wiper Blades', 'Battery', 'Alternator', 'Starter Motor', 'Radiator',
        'Thermostat', 'Water Pump', 'CV Axle', 'Shock Absorbers', 'Struts',
        'Control Arm', 'Tie Rod End', 'Ball Joint', 'Wheel Bearing', 'Oxygen Sensor',
        'MAF Sensor', 'Throttle Body', 'Fuel Injector', 'Catalytic Converter',
        'Exhaust Manifold', 'Head Gasket', 'Valve Cover Gasket', 'PCV Valve',
      ],
      predefinedServices: [
        'Oil Change', 'Tire Rotation', 'Wheel Alignment', 'Wheel Balancing',
        'Brake Flush', 'Coolant Flush', 'Transmission Fluid Change',
        'Power Steering Flush', 'Fuel System Cleaning', 'Air Conditioning Service',
        'Battery Test & Replace', 'Spark Plug Replacement', 'Timing Belt Service',
        'Engine Diagnostic Scan', 'Suspension Inspection', 'Brake Inspection',
        'Exhaust Inspection', 'Full Safety Inspection', 'Pre-purchase Inspection',
        'Tyre Replacement', 'Headlight Restoration', 'Windshield Repair',
      ],
    };
  },

  async mounted() {
    await Promise.all([
      this.fetchAppointments(),
      this.fetchJobOrders(),
    ]);
  },

  computed: {
    todayStr()        { return new Date().toISOString().split('T')[0]; },
    startOfWeekStr()  { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - t.getDay()); return s.toISOString().split('T')[0]; },
    endOfWeekStr()    { const t = new Date(); const e = new Date(t); e.setDate(t.getDate() + (6 - t.getDay())); return e.toISOString().split('T')[0]; },
    startOfMonthStr() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split('T')[0]; },
    endOfMonthStr()   { const t = new Date(); return new Date(t.getFullYear(), t.getMonth() + 1, 0).toISOString().split('T')[0]; },

    // ── Header stats ──
    diagnosedCount() { return this.jobCards.filter(j => j.myRole === 'diagnose').length; },
    serviceCount()   { return this.jobCards.filter(j => j.myRole === 'service').length; },
    totalAssigned()  { return this.jobCards.length; },

    // ── Appointments ──
    filteredAppointments() {
      let list = this.appointments;
      if (this.apptSpecificDate) {
        list = list.filter(a => a.appointmentDate === this.apptSpecificDate);
      } else if (this.apptDateFilter === 'today') {
        list = list.filter(a => a.appointmentDate === this.todayStr);
      } else if (this.apptDateFilter === 'week') {
        list = list.filter(a => a.appointmentDate >= this.startOfWeekStr && a.appointmentDate <= this.endOfWeekStr);
      } else if (this.apptDateFilter === 'month') {
        list = list.filter(a => a.appointmentDate >= this.startOfMonthStr && a.appointmentDate <= this.endOfMonthStr);
      }
      return [...list].sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
    },
    apptTotalPages()        { return Math.max(1, Math.ceil(this.filteredAppointments.length / this.apptItemsPerPage)); },
    paginatedAppointments() { const s = (this.apptPage - 1) * this.apptItemsPerPage; return this.filteredAppointments.slice(s, s + this.apptItemsPerPage); },

    // ── Job Orders ──
    filteredJobs() {
      let list = this.jobCards;
      if (this.jobSpecificDate) {
        list = list.filter(j => j.jobDate === this.jobSpecificDate);
      } else if (this.jobDateFilter === 'today') {
        list = list.filter(j => j.jobDate === this.todayStr);
      } else if (this.jobDateFilter === 'week') {
        list = list.filter(j => j.jobDate >= this.startOfWeekStr && j.jobDate <= this.endOfWeekStr);
      } else if (this.jobDateFilter === 'month') {
        list = list.filter(j => j.jobDate >= this.startOfMonthStr && j.jobDate <= this.endOfMonthStr);
      }
      if (this.jobStatusFilter)                 list = list.filter(j => j.status === this.jobStatusFilter);
      if (this.jobItemFilter === 'no-parts')    list = list.filter(j => !j.parts || j.parts.length === 0);
      if (this.jobItemFilter === 'no-services') list = list.filter(j => !j.addedServices || j.addedServices.length === 0);
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate));
    },
    jobTotalPages() { return Math.max(1, Math.ceil(this.filteredJobs.length / this.jobItemsPerPage)); },
    paginatedJobs() { const s = (this.jobPage - 1) * this.jobItemsPerPage; return this.filteredJobs.slice(s, s + this.jobItemsPerPage); },

    filteredItemList() {
      const source = this.itemModal.type === 'parts' ? this.predefinedParts : this.predefinedServices;
      const q      = this.itemModal.search.toLowerCase().trim();
      return q ? source.filter(i => i.toLowerCase().includes(q)) : source;
    },
  },

  methods: {
    // ── Fetch Appointments ──
    async fetchAppointments() {
      this.apptLoading = true;
      this.apptError   = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please log in again.');
        const res  = await fetch('http://localhost:3000/api/technicians/getAppointments', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);
        this.appointments = (json.data || []).map(a => ({
          id:              a.id,
          customerName:    a.Profiles?.Name        || '',
          customerEmail:   a.Profiles?.Email       || '',
          phoneNumber:     a.phone_number          || '',
          licensePlate:    a.vehicle_license_plate || '',
          vehicleMake:     a.vehicle_make          || '',
          vehicleModel:    a.vehicle_model         || '',
          vehicleYear:     a.vehicle_year          || '',
          appointmentDate: a.appointment_date      || '',
          appointmentTime: a.appointment_time      || '',
          customerNotes:   a.customer_notes        || null,
        }));
      } catch (err) {
        console.error('Error fetching appointments:', err);
        this.apptError = err.message;
      } finally {
        this.apptLoading = false;
      }
    },

    // ── Fetch Job Orders ──
    async fetchJobOrders() {
      this.jobLoading = true;
      this.jobError   = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please log in again.');
        const res  = await fetch('http://localhost:3000/api/jobOrders/getTechnicianJobOrders', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const json = await res.json();

        // 404 = no jobs assigned yet — treat as empty, not an error
        if (res.status === 404) { this.jobCards = []; return; }
        if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);

        this.jobCards = (json.data || []).map(o => ({
          id:                 o.Order_ID,
          status:             o.Order_Status,
          myRole:             o.Order_Status === 'diagnose' ? 'diagnose' : 'service',
          jobDate:            o.Order_Status === 'service'
                      ? (o.Service ? o.Service.split('T')[0] : '')
                      : (o.Diagnose ? o.Diagnose.split('T')[0] : ''),
          customerName:       o.customer_name             || 'Unknown Customer',
          customerEmail:      o.customer_email            || null,
          phoneNumber:        o.phone_number              || null,
          licensePlate:       o.vehicle_license_plate     || '',
          vehicleMake:        o.vehicle_make              || '',
          vehicleModel:       o.vehicle_model             || '',
          vehicleYear:        o.vehicle_year              || '',
          notes:              o.customer_notes            || null,
          diagnoseTechnician: o.diagnose_technician?.name || null,
          serviceTechnician:  o.service_technician?.name  || null,
          parts:              typeof o.Parts === 'string' && o.Parts
                                ? o.Parts.split(',')
                                : [],
          addedServices:      typeof o.Services === 'string' && o.Services
                                ? o.Services.split(',')
                                : [],
        }));      
      } catch (err) {
        console.error('Error fetching job orders:', err);
        this.jobError = err.message;
      } finally {
        this.jobLoading = false;
      }
    },

    // ── Helpers ──
    switchTab(tab) { this.activeTab = tab; },
    isToday(date)  { return date === this.todayStr; },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    getDayName(date) {
      if (!date) return '';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    },

    // ── Appointment methods ──
    setApptDateFilter(val) { this.apptDateFilter = val; this.apptSpecificDate = ''; this.apptPage = 1; },
    openApptModal(appt)    { this.apptModal.appt = appt; this.apptModal.isOpen = true; },

    // ── Job Order methods ──
    setJobDateFilter(val)   { this.jobDateFilter = val; this.jobSpecificDate = ''; this.jobPage = 1; },
    setJobStatusFilter(val) { this.jobStatusFilter = val; this.jobPage = 1; if (val !== 'diagnose') this.jobItemFilter = 'all'; },
    setJobItemFilter(val)   { this.jobItemFilter = val; this.jobPage = 1; },
    getJobStatusLabel(status) { const f = this.jobStatuses.find(s => s.value === status); return f ? f.label : status; },
    openJobModal(job)    { this.jobModal.job = job; this.jobModal.isOpen = true; },
    closeJobModal()      { this.jobModal.isOpen = false; },
    openUpdateModal(job) { this.updateModal.job = job; this.updateModal.isOpen = true; },
    closeUpdateModal()   { this.updateModal.isOpen = false; },
    async submitUpdate() {
      const job = this.updateModal.job;
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated. Please log in again.');

        const res  = await fetch(`http://localhost:3000/api/jobOrders/${job.id}/status`, {
          method:  'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ status: 'ready' }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);

        // Update local state on success
        job.status  = 'ready';
        job.jobDate = new Date().toISOString().split('T')[0];

        this.closeUpdateModal();
      } catch (err) {
        console.error('Error updating job status:', err);
        alert(`Failed to update status: ${err.message}`);
      }
    },

    // ── Item modal ──
    openItemModal(job, type) {
      this.itemModal.job          = job;
      this.itemModal.type         = type;
      this.itemModal.selected     = type === 'parts' ? [...job.parts] : [...job.addedServices];
      this.itemModal.search       = '';
      this.itemModal.dropdownOpen = false;
      this.itemModal.isOpen       = true;
      this.$nextTick(() => { if (this.$refs.itemSearchInput) this.$refs.itemSearchInput.focus(); });
    },
    closeItemModal() {
      this.itemModal.isOpen       = false;
      this.itemModal.job          = null;
      this.itemModal.type         = null;
      this.itemModal.selected     = [];
      this.itemModal.search       = '';
      this.itemModal.dropdownOpen = false;
    },
  async saveItemModal() {
    const { job, type } = this.itemModal;
    const selected = [...this.itemModal.selected];

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated. Please log in again.');

      const endpoint = type === 'parts'
        ? `http://localhost:3000/api/joborders/${job.id}/parts`
        : `http://localhost:3000/api/joborders/${job.id}/services`;

      const body = type === 'parts'
        ? { parts: selected.join(',') }
        : { services: selected.join(',') };

      const res  = await fetch(endpoint, {
        method:  'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);

      // Update local state on success
      if (type === 'parts')    job.parts         = selected;
      if (type === 'services') job.addedServices = selected;

      this.closeItemModal();
    } catch (err) {
      console.error('Error saving items:', err);
      alert(`Failed to save ${type}: ${err.message}`);
    }
    },    
    toggleItem(item) {
      const i = this.itemModal.selected.indexOf(item);
      if (i === -1) this.itemModal.selected.push(item);
      else          this.itemModal.selected.splice(i, 1);
    },
    delayCloseDropdown() { setTimeout(() => { this.itemModal.dropdownOpen = false; }, 150); },
  },
};
</script>

<style scoped src="@/assets/technicianJobs.css"></style>