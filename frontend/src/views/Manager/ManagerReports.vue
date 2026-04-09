<template>
  <div class="mr-container manager-reports-page">
    <div class="mr-header">
      <h1>Manager Reports</h1>
      <p class="mr-subtitle">Retrieve completed appointments and job orders with filters.</p>
    </div>

    <!-- ───────────────────────────── DASHBOARD ───────────────────────────── -->
    <section class="dashboard-section">
      <div class="dashboard-grid">

        <!-- Job Order Status Donut -->
        <div class="dashboard-card donut-card">
          <div class="dashboard-card-title">Job Order Status</div>
          <div v-if="dashboardLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="donut-wrapper">
            <svg viewBox="0 0 160 160" class="donut-svg">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#f0f0f0" stroke-width="22" />
              <!-- Complete segment -->
              <circle
                cx="80" cy="80" r="60"
                fill="none"
                stroke="#097969"
                stroke-width="22"
                stroke-dasharray="0 377"
                :style="donutCompleteStyle"
                stroke-linecap="butt"
                transform="rotate(-90 80 80)"
              />
              <!-- In Progress segment -->
              <circle
                cx="80" cy="80" r="60"
                fill="none"
                stroke="#fb923c"
                stroke-width="22"
                stroke-dasharray="0 377"
                :style="donutInProgressStyle"
                stroke-linecap="butt"
                transform="rotate(-90 80 80)"
              />
              <!-- Others segment -->
              <circle
                cx="80" cy="80" r="60"
                fill="none"
                stroke="#94a3b8"
                stroke-width="22"
                stroke-dasharray="0 377"
                :style="donutOthersStyle"
                stroke-linecap="butt"
                transform="rotate(-90 80 80)"
              />
              <text x="80" y="75" text-anchor="middle" class="donut-center-num">{{ dashboardStats.totalOrders }}</text>
              <text x="80" y="92" text-anchor="middle" class="donut-center-label">Total Orders</text>
            </svg>
            <div class="donut-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background:#097969"></span>
                <span>Completed</span>
                <span class="legend-val">{{ dashboardStats.completed }} ({{ donutPct(dashboardStats.completed) }}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#fb923c"></span>
                <span>In Progress</span>
                <span class="legend-val">{{ dashboardStats.inProgress }} ({{ donutPct(dashboardStats.inProgress) }}%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background:#94a3b8"></span>
                <span>Others</span>
                <span class="legend-val">{{ dashboardStats.others }} ({{ donutPct(dashboardStats.others) }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Vehicle Makes Bar Chart -->
        <div class="dashboard-card bar-card">
          <div class="dashboard-card-title">Top Vehicle Makes</div>
          <div v-if="dashboardLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="bar-chart">
            <div
              v-for="(item, i) in topVehicleMakes"
              :key="i"
              class="bar-row"
            >
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: barPct(item.count, topVehicleMakes) + '%' }"
                ></div>
              </div>
              <div class="bar-count">{{ item.count }}</div>
            </div>
            <div v-if="topVehicleMakes.length === 0" class="dashboard-empty">No data yet.</div>
          </div>
        </div>

        <!-- Top Services Bar Chart -->
        <div class="dashboard-card bar-card">
          <div class="dashboard-card-title">Top Services</div>
          <div v-if="dashboardLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="bar-chart">
            <div
              v-for="(item, i) in topServices"
              :key="i"
              class="bar-row"
            >
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill bar-fill--purple"
                  :style="{ width: barPct(item.count, topServices) + '%' }"
                ></div>
              </div>
              <div class="bar-count">{{ item.count }}</div>
            </div>
            <div v-if="topServices.length === 0" class="dashboard-empty">No data yet.</div>
          </div>
        </div>

      </div>
    </section>
    <!-- ─────────────────────────── END DASHBOARD ─────────────────────────── -->

    <section class="reports-search-panel">
      <div class="top-row-reports-section">
        <div class="reports-section">
          <div class="reports-section-title">Select Record Type <span style="color:orangered">*</span> </div>
          <div class="reports-controls record-type-row">
            <button type="button" class="record-type-btn" :class="{ active: filters.type === 'appointments' }"
              @click="setType('appointments')">
              Appointments
            </button>
            <button type="button" class="record-type-btn" :class="{ active: filters.type === 'jobOrders' }"
              @click="setType('jobOrders')">
              Job Orders
            </button>
          </div>
        </div>

        <div class="reports-section">
          <div class="reports-section-title">Date Range</div>
          <div class="date-range-row">
            <div class="reports-controls date-field-group">
              <label class="field-label" for="fromDate">From</label>
              <input id="fromDate" v-model="filters.dateFrom" type="date" class="date-input report-input" />
            </div>

            <div class="date-field-group">
              <label class="field-label" for="toDate">To</label>
              <input id="toDate" v-model="filters.dateTo" type="date" class="date-input report-input" />
            </div>
          </div>
        </div>
      </div>
      <div class="reports-section">
        <div class="additional-filters-header">
          <div class="reports-section-title">Additional Filters</div>
          <button type="button" class="add-filter-btn" @click="addAdditionalFilter">+</button>
        </div>

        <div v-if="filters.advanced.length === 0" class="additional-filters-empty">
          No filters added.
        </div>

        <div v-else class="additional-filters-list">
          <div v-for="(filter, index) in filters.advanced" :key="filter.id" class="additional-filter-row">
            <div class="additional-filter-index">{{ index + 1 }}</div>

            <select v-model="filter.field" class="additional-filter-select report-input">
              <option value="customerName">Customer Name</option>
              <option value="vehicleName">Vehicle Name</option>
              <option value="licensePlate">License Plate No.</option>
              <option value="assignedTechnician">Assigned Technician</option>
              <option value="recordId">Record ID</option>
            </select>

            <input v-model.trim="filter.value" type="text" class="additional-filter-input report-input"
              :placeholder="getFilterPlaceholder(filter.field)" />

            <button type="button" class="remove-filter-btn" @click="removeAdditionalFilter(filter.id)">
              Remove
            </button>
          </div>
        </div>
      </div>

      <div class="reports-summary-row">
        <button class="search-btn"
          @click="filters.type === 'appointments' ? fetchAppointments() : fetchJobOrders()">Search</button>
        <div v-if="filteredRecords.length >= 0" class="appt-count">
          {{ filteredRecords.length }} completed {{ filters.type === 'appointments' ? 'appointment' : 'job order' }}
          record{{ filteredRecords.length === 1 ? '' : 's' }}. (Only gets first 100 records from DB, NEED TO UPDATE API ROUTES)
        </div>
      </div>
    </section>

    <div v-if="!searchBtnClicked"></div>

    <div v-else-if="pageLoading" class="loading-state">
      <span class="loading-spinner"></span>
      <p>Loading records...</p>
    </div>

    <div v-else-if="filteredRecords.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <p>No historical records found.</p>
    </div>

    <div v-else class="report-table-wrapper">
      <table class="report-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>ID</th>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>License Plate</th>
            <th>Technician</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedRecords" :key="record.key">
            <td>{{ record.typeLabel }}</td>
            <td>{{ record.idLabel }}</td>
            <td>{{ record.filterValues.customerName }}</td>
            <td>{{ record.filterValues.vehicleName }}</td>
            <td>{{ record.filterValues.licensePlate }}</td>
            <td>{{ record.filterValues.assignedTechnician }}</td>
            <td>{{ formatDate(record.dateValue) }}</td>
            <td>
              <button class="btn-view" @click="openRecord(record)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pagination-container">
      <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage -= 1">
        Previous
      </button>

      <div class="pagination-info">
        <button v-for="page in totalPages" :key="page" class="pagination-page" :class="{ active: currentPage === page }"
          @click="currentPage = page">
          {{ page }}
        </button>
      </div>

      <button class="pagination-btn" :disabled="currentPage === totalPages" @click="currentPage += 1">
        Next
      </button>
    </div>

    <div v-if="selectedRecord" class="modal-overlay" @click.self="closeRecord">
      <div class="modal-content">
        <button class="modal-close" @click="closeRecord">×</button>
        <h2>{{ selectedRecord.title }}</h2>

        <div class="modal-body">
          <div v-if="selectedRecord" class="modal-overlay" @click.self="closeRecord">
            <div class="modal-content">
              <button class="modal-close" @click="closeRecord">×</button>

              <h2>
                {{ selectedRecord.recordType === 'Appointment' ? 'Appointment Details' : 'Job Order Details' }}
              </h2>

              <div class="modal-body">
                <template v-if="selectedRecord.recordType === 'Appointment'">
                  <div class="detail-group">
                    <label>Customer</label>
                    <p>{{ selectedRecord.customerName || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Customer Email</label>
                    <p>{{ selectedRecord.customerEmail || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Phone Number</label>
                    <p>{{ selectedRecord.phoneNumber || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Vehicle</label>
                    <p>{{ selectedRecord.vehicle || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>License Plate</label>
                    <p>{{ selectedRecord.licensePlate || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Appointment Date</label>
                    <p>{{ formatDate(selectedRecord.appointmentDate) || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Time</label>
                    <p>{{ formatTime(selectedRecord.appointmentTime) || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Duration</label>
                    <p>{{ selectedRecord.duration || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Status</label>
                    <p>{{ selectedRecord.status || '-' }}</p>
                  </div>
                  <div class="detail-group" v-if="selectedRecord.status !== 'cancelled'">
                    <label>Diagnose Technician</label>
                    <p>{{ selectedRecord.diagnoseTech || 'Not Assigned' }}</p>
                  </div>
                  <div class="detail-group" v-if="selectedRecord.status !== 'cancelled'">
                    <label>Technician Email</label>
                    <p>{{ selectedRecord.techEmail || '-' }}</p>
                  </div>
                  <div class="detail-group" v-if="selectedRecord.cancelReason">
                    <label>Cancellation Reason</label>
                    <p>{{ selectedRecord.cancelReason }}</p>
                  </div>
                  <div class="detail-group" v-if="selectedRecord.notes">
                    <label>Notes</label>
                    <p>{{ selectedRecord.notes }}</p>
                  </div>
                </template>

                <template v-else>
                  <div class="detail-group">
                    <label>Job Order ID</label>
                    <p>{{ selectedRecord.orderId || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Status</label>
                    <p>{{ selectedRecord.status || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Customer</label>
                    <p>{{ selectedRecord.customerName || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Customer Email</label>
                    <p>{{ selectedRecord.customerEmail || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Vehicle</label>
                    <p>{{ selectedRecord.vehicle || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>License Plate</label>
                    <p>{{ selectedRecord.licensePlate || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Diagnose Technician</label>
                    <p>{{ selectedRecord.diagnoseTech || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Service Technician</label>
                    <p>{{ selectedRecord.serviceTech || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Services</label>
                    <p>{{ selectedRecord.services || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Parts</label>
                    <p>{{ selectedRecord.parts || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Quotation</label>
                    <p>{{ selectedRecord.quotation || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Diagnosis</label>
                    <p>{{ selectedRecord.diagnosis || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Waiting For Parts</label>
                    <p>{{ selectedRecord.waitingForParts || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Ready</label>
                    <p>{{ selectedRecord.ready || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Service Date</label>
                    <p>{{ formatDate(selectedRecord.serviceDate) || '-' }}</p>
                  </div>
                  <div class="detail-group">
                    <label>Check Out</label>
                    <p>{{ formatDate(selectedRecord.checkOut) || '-' }}</p>
                  </div>
                </template>
              </div>

              <div class="modal-actions">
                <button class="btn-secondary" @click="closeRecord">Close</button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-print" @click="closeRecord">Print</button>
          <button class="btn-secondary" @click="closeRecord">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/supabase.js'
import '@/assets/managerReports.css'
import { sgLocaleDate, sgNow } from '@/utils/sgTime.js'

const PAGE_SIZE = 8
let filterIdCounter = 1

// Circumference of the donut circle (2 * π * r = 2 * π * 60 ≈ 377)
const CIRCUMFERENCE = 2 * Math.PI * 60

export default {
  name: 'ManagerReports',

  data() {
    return {
      searchBtnClicked: false,
      filters: {
        type: 'appointments',
        dateFrom: '',
        dateTo: '',
        advanced: []
      },
      currentPage: 1,
      selectedRecord: null,
      pageLoading: false,

      // Existing Supabase data
      appointments: [],
      appointmentsError: null,
      jobOrders: [],
      jobOrdersError: null,

      // ── Dashboard ──────────────────────────────────────────────
      dashboardLoading: false,
      dashboardAllOrders: [],   // raw job order data for dashboard charts
    }
  },

  computed: {
    // ── Dashboard computed ─────────────────────────────────────

    /**
     * Counts job orders by status group:
     *  - completed  → "Check Out"
     *  - inProgress → "In Progress" / "Waiting For Parts" / "Ready"
     *  - others     → everything else (e.g. "Pending", "Cancelled")
     */
    dashboardStats() {
      const total = this.dashboardAllOrders.length
      const completed = this.dashboardAllOrders.filter(o => o.Order_Status === 'Check Out').length
      const inProgress = this.dashboardAllOrders.filter(o =>
        ['In Progress', 'Waiting For Parts', 'Ready'].includes(o.Order_Status)
      ).length
      const others = total - completed - inProgress
      return { totalOrders: total, completed, inProgress, others }
    },

    /**
     * SVG stroke-dasharray/offset styles for each donut segment.
     * stroke-dasharray = "filled_length remaining_length"
     * stroke-dashoffset shifts the start point of the dash around the circle.
     */
    donutCompleteStyle() {
      const { totalOrders, completed } = this.dashboardStats
      if (totalOrders === 0) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const len = (completed / totalOrders) * CIRCUMFERENCE
      return {
        strokeDasharray: `${len} ${CIRCUMFERENCE - len}`,
        strokeDashoffset: 0
      }
    },

    donutInProgressStyle() {
      const { totalOrders, completed, inProgress } = this.dashboardStats
      if (totalOrders === 0) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const completedLen = (completed / totalOrders) * CIRCUMFERENCE
      const len = (inProgress / totalOrders) * CIRCUMFERENCE
      // Offset by the length of the previous (completed) segment
      return {
        strokeDasharray: `${len} ${CIRCUMFERENCE - len}`,
        strokeDashoffset: -completedLen
      }
    },

    donutOthersStyle() {
      const { totalOrders, completed, inProgress, others } = this.dashboardStats
      if (totalOrders === 0) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const completedLen = (completed / totalOrders) * CIRCUMFERENCE
      const inProgressLen = (inProgress / totalOrders) * CIRCUMFERENCE
      const len = (others / totalOrders) * CIRCUMFERENCE
      return {
        strokeDasharray: `${len} ${CIRCUMFERENCE - len}`,
        strokeDashoffset: -(completedLen + inProgressLen)
      }
    },

    /**
     * Top 6 vehicle makes from all job orders, sorted descending.
     * Reads vehicle_make from the nested appointment relation.
     */
    topVehicleMakes() {
      const counts = {}
      this.dashboardAllOrders.forEach(order => {
        const make = (order.appointment?.vehicle_make || 'Unknown').trim()
        if (make) counts[make] = (counts[make] || 0) + 1
      })
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    },

    /**
     * Top 6 services requested across all job orders.
     * The Services field may be a comma-separated string like "Oil Change, Brake Pad Replacement".
     * We split it, trim each entry, and tally them individually.
     */
    topServices() {
      const counts = {}
      this.dashboardAllOrders.forEach(order => {
        const raw = order.Services || ''
        const items = raw.split(',').map(s => s.trim()).filter(Boolean)
        items.forEach(svc => {
          counts[svc] = (counts[svc] || 0) + 1
        })
      })
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    },

    // ── Existing computed ──────────────────────────────────────

    appointmentRecords() {
      return this.appointments
        .filter((item) => item.status === 'completed')
        .map((item) => ({
          key: 'APT-' + item.id,
          type: 'appointment',
          typeLabel: 'Appointment',
          idLabel: item.id,
          dateValue: item.appointmentDate,
          filterValues: {
            customerName: item.customerName || '',
            vehicleName: [item.vehicleYear, item.vehicleMake, item.vehicleModel].filter(Boolean).join(' '),
            licensePlate: item.licensePlate || '',
            assignedTechnician: item.diagnoseTech || '',
            recordId: item.id
          },
          modalData: {
            recordType: 'Appointment',
            id: item.id,
            customerName: item.customerName,
            customerEmail: item.customerEmail,
            phoneNumber: item.phoneNumber,
            vehicle: [item.vehicleYear, item.vehicleMake, item.vehicleModel].filter(Boolean).join(' '),
            licensePlate: item.licensePlate,
            appointmentDate: item.appointmentDate,
            appointmentTime: item.appointmentTime,
            duration: item.duration,
            status: item.status,
            diagnoseTech: item.diagnoseTech,
            techEmail: item.techEmail,
            cancelReason: item.cancelReason,
            notes: item.notes
          }
        }))
    },

    jobOrderRecords() {
      return this.jobOrders
        .filter((item) => item.Order_Status === 'Check Out')
        .map((item) => ({
          key: 'JOB-' + item.Order_ID,
          type: 'jobOrders',
          typeLabel: 'Job Order',
          idLabel: item.Order_ID,
          dateValue: item.Check_Out || item.Service,
          filterValues: {
            customerName: item.appointment?.CustomerProfile?.Name || '',
            vehicleName: [
              item.appointment?.vehicle_year,
              item.appointment?.vehicle_make,
              item.appointment?.vehicle_model
            ].filter(Boolean).join(' '),
            licensePlate: item.appointment?.vehicle_license_plate || '',
            assignedTechnician: item.ServiceTechnicianProfile?.Name || '',
            recordId: item.Order_ID
          },
          modalData: {
            recordType: 'Job Order',
            orderId: item.Order_ID,
            status: item.Order_Status,
            customerName: item.appointment?.CustomerProfile?.Name || '',
            customerEmail: item.appointment?.CustomerProfile?.Email || '',
            vehicle: [
              item.appointment?.vehicle_year,
              item.appointment?.vehicle_make,
              item.appointment?.vehicle_model
            ].filter(Boolean).join(' '),
            licensePlate: item.appointment?.vehicle_license_plate || '',
            diagnoseTech: item.appointment?.DiagnoseTechnicianProfile?.Name || '',
            serviceTech: item.ServiceTechnicianProfile?.Name || '',
            services: item.Services,
            parts: item.Parts,
            quotation: item.Quotation,
            diagnosis: item.Diagnose,
            waitingForParts: item.Waiting_For_Parts,
            ready: item.Ready,
            serviceDate: item.Service,
            checkOut: item.Check_Out
          }
        }))
    },

    currentSourceRecords() {
      return this.filters.type === 'appointments' ? this.appointmentRecords : this.jobOrderRecords
    },

    filteredRecords() {
      return this.currentSourceRecords.filter((record) => {
        const fromMatch = !this.filters.dateFrom || !record.dateValue || record.dateValue >= this.filters.dateFrom
        const toMatch = !this.filters.dateTo || !record.dateValue || record.dateValue <= this.filters.dateTo
        const advancedMatch = this.filters.advanced.every((advancedFilter) => {
          if (!advancedFilter.value) return true
          const sourceValue = String(record.filterValues[advancedFilter.field] || '').toLowerCase()
          return sourceValue.includes(advancedFilter.value.toLowerCase())
        })
        return fromMatch && toMatch && advancedMatch
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredRecords.length / PAGE_SIZE))
    },

    paginatedRecords() {
      const start = (this.currentPage - 1) * PAGE_SIZE
      return this.filteredRecords.slice(start, start + PAGE_SIZE)
    }
  },

  // ── Lifecycle ────────────────────────────────────────────────
  mounted() {
    // Auto-load dashboard data when the page first opens
    this.fetchDashboard()
  },

  watch: {
    'filters.type'() { this.currentPage = 1 },
    'filters.dateFrom'() { this.currentPage = 1 },
    'filters.dateTo'() { this.currentPage = 1 },
    'filters.advanced': {
      deep: true,
      handler() { this.currentPage = 1 }
    },
    totalPages(value) {
      if (this.currentPage > value) this.currentPage = value
    }
  },

  methods: {
    // ── Dashboard methods ──────────────────────────────────────

    /**
     * Fetches ALL job orders (no status filter) so the dashboard
     * can show the full picture across every status group.
     * Uses a high limit (500) — adjust when your API supports pagination.
     */
    async fetchDashboard() {
      this.dashboardLoading = true
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated.')

        const res = await fetch('http://localhost:3000/api/manager/jobCards?limit=500&page=1', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || result.message || 'Failed to fetch dashboard data')

        this.dashboardAllOrders = result.data || []
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        this.dashboardAllOrders = []
      } finally {
        this.dashboardLoading = false
      }
    },

    /**
     * Returns what percentage a count is of the total orders.
     * Used in the donut legend labels.
     */
    donutPct(count) {
      const total = this.dashboardStats.totalOrders
      if (!total) return 0
      return Math.round((count / total) * 100)
    },

    /**
     * Returns what percentage a bar's count is of the max count
     * in its list, so the biggest bar always fills 100%.
     */
    barPct(count, list) {
      const max = list[0]?.count || 1
      return Math.round((count / max) * 100)
    },

    // ── Existing methods (unchanged) ───────────────────────────

    async fetchAppointments() {
      this.searchBtnClicked = true
      this.pageLoading = true
      this.appointmentsError = null
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated. Please log in again.')
        const res = await fetch('http://localhost:3000/api/manager/getAllAppointments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`)
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
        }))
      } catch (err) {
        console.error('Error fetching appointments:', err)
        this.appointmentsError = err.message
      } finally {
        this.pageLoading = false
      }
    },

    async fetchJobOrders() {
      this.searchBtnClicked = true
      this.pageLoading = true
      this.jobOrdersError = null
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated. Please log in again.')
        const res = await fetch('http://localhost:3000/api/manager/jobCards?limit=100&page=1', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()
        console.log(JSON.stringify(result.data?.[0], null, 2))
        if (!res.ok) throw new Error(result.error || result.message || 'Failed to fetch job orders')
        this.jobOrders = result.data || []
      } catch (err) {
        console.error('Fetch job orders error:', err)
        this.jobOrders = []
      } finally {
        this.pageLoading = false
      }
    },

    setType(value) { this.filters.type = value },

    addAdditionalFilter() {
      this.filters.advanced.push({ id: filterIdCounter++, field: 'customerName', value: '' })
    },

    removeAdditionalFilter(id) {
      const index = this.filters.advanced.findIndex((filter) => filter.id === id)
      if (index !== -1) this.filters.advanced.splice(index, 1)
    },

    getFilterPlaceholder(field) {
      const placeholders = {
        customerName: 'Enter customer name',
        vehicleName: 'Enter vehicle name',
        licensePlate: 'Enter license plate number',
        assignedTechnician: 'Enter technician name',
        recordId: 'Enter appointment or job order ID'
      }
      return placeholders[field] || 'Enter value'
    },

    openRecord(record) { this.selectedRecord = record.modalData },
    closeRecord() { this.selectedRecord = null },

    formatLabel(value) {
      if (!value) return ''
      return String(value).replaceAll('_', ' ').split(' ').filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
    },

    formatDate(value) {
      if (!value) return ''
      return sgLocaleDate(value, 'en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
    },

    formatTime(value) {
      if (!value) return ''
      const parts = String(value).split(':')
      const hours = Number(parts[0] || 0)
      const minutes = Number(parts[1] || 0)
      const date = sgNow()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' })
    }
  }
}
</script>