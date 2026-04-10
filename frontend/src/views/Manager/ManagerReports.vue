<template>
  <div class="mr-container manager-reports-page">
    <div class="mr-header">
      <h1>📝 Manager Reports</h1>
      <p class="mr-subtitle">Retrieve completed appointments and job orders.</p>
    </div>

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
          <div class="date-range-header">
            <div class="reports-section-title">Date Range
            </div>
            <button v-if="filters.dateFrom || filters.dateTo" type="button" class="clear-dates-btn"
              @click="filters.dateFrom = ''; filters.dateTo = ''">
              Clear
            </button>
          </div>
          <div class="date-range-row">
            <div class="reports-controls date-field-group">
              <label class="field-label" for="fromDate">From</label>
              <input id="fromDate" v-model="filters.dateFrom" type="date" class="date-input report-input"
                :max="filters.dateTo || '2999-12-31'" />
            </div>

            <div class="date-field-group">
              <label class="field-label" for="toDate">To</label>
              <input id="toDate" v-model="filters.dateTo" type="date" class="date-input report-input"
                :max="'2999-12-31'" :min="filters.dateFrom" />
            </div>
          </div>
        </div>
      </div>
      <div class="reports-section">
        <div class="additional-filters-header">
          <div class="reports-section-title">Additional Filters</div>
          <button v-if="filters.advanced.length < filterOptions.length" type="button" class="add-filter-btn"
            @click="addAdditionalFilter">+</button>
        </div>

        <div v-if="filters.advanced.length === 0" class="additional-filters-empty">
          No filters added.
        </div>

        <div v-else class="additional-filters-list">
          <div v-for="(filter, index) in filters.advanced" :key="filter.id" class="additional-filter-row">
            <div class="additional-filter-index">{{ index + 1 }}</div>

            <select v-model="filter.field" class="additional-filter-select report-input">
              <option v-for="opt in availableFilterOptions(filter.id)" :key="opt.value" :value="opt.value">{{ opt.label
                }}</option>
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
        <div v-if="currentSourceRecords.length >= 0 && searchBtnClicked && !pageLoading" class="appt-count">
          {{ currentSourceRecords.length }} completed {{ filters.type === 'appointments' ? 'appointment' : 'job order'
          }}
          record{{ currentSourceRecords.length === 1 ? '' : 's' }}.
        </div>
      </div>
    </section>

    <div v-if="!searchBtnClicked" style="display:none"></div>

    <div v-else-if="pageLoading" class="loading-state">
      <span class="loading-spinner"></span>
      <p>Loading records...</p>
    </div>

    <div v-else-if="currentSourceRecords.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <p>No historical records found.</p>
    </div>

    <template v-else>

      <!-- Appointment Cards -->
      <div v-if="filters.type === 'appointments'" class="appointments-list">
        <div v-for="appt in paginatedRecords" :key="appt.id" class="appt-card card--completed">
          <div class="appt-time-col time-col--completed">
            <span class="appt-day">{{ getDayName(appt.appointmentDate) }}</span>
            <span class="appt-time">{{ formatTime(appt.appointmentTime) }}</span>
          </div>
          <div class="appt-divider"></div>
          <div class="appt-body">
            <div class="appt-top">
              <h3 class="appt-title">{{ appt.customerName }}</h3>
              <span class="appt-id">#{{ appt.id }}</span>
              <span class="status-badge status-badge--completed">✓ Completed</span>
            </div>
            <p class="appt-vehicle">{{ appt.vehicleYear }} {{ appt.vehicleMake }} {{ appt.vehicleModel }} · {{
              appt.licensePlate }}</p>
            <div v-if="appt.notes" class="jc-card-notes-box">📝 {{ appt.notes }}</div>
            <div class="appt-meta">
              <span class="meta-tag date-tag">{{ formatDate(appt.appointmentDate) }}</span>
              <span v-if="appt.diagnoseTech" class="meta-tag tech-assigned-tag">👤 {{ appt.diagnoseTech }}</span>
            </div>
          </div>
          <div class="appt-actions">
            <button class="btn-view" @click="openApptModal(appt)">View</button>
          </div>
        </div>
      </div>

      <!-- Job Order Cards -->
      <div v-else class="jc-list">
        <div v-for="job in paginatedRecords" :key="job.id" class="jc-card">
          <div class="jc-status-col jc-status-col--check-out">
            <span class="jc-status-badge jc-status-badge--check-out">Check Out</span>
          </div>
          <div class="jc-divider jc-divider--check-out"></div>
          <div class="jc-card-body">
            <div class="jc-card-top">
              <h3 class="jc-card-name">{{ job.customerName }}</h3>
              <span class="jc-card-id">#{{ job.id }}</span>
            </div>
            <p class="jc-card-vehicle">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }} · {{
              job.licensePlate }}</p>
            <div v-if="job.notes" class="jc-card-notes-box">📝 {{ job.notes }}</div>
            <div class="jc-card-meta">
              <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
              <span v-if="job.serviceTechnician" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.serviceTechnician
                }}</span>
            </div>
            <div class="jc-card-items-row">
              <div class="jc-card-items-group">
                <span class="jc-items-label">Parts</span>
                <div class="jc-items-pills">
                  <span v-for="(part, i) in job.parts" :key="'p' + i"
                    class="jc-card-item-pill jc-card-item-pill--part">{{
                      part }}</span>
                  <span v-if="!job.parts || job.parts.length === 0"
                    class="jc-card-item-pill jc-card-item-pill--empty">None</span>
                </div>
              </div>
              <div class="jc-card-items-group">
                <span class="jc-items-label">Services</span>
                <div class="jc-items-pills">
                  <span v-for="(svc, i) in job.services" :key="'s' + i"
                    class="jc-card-item-pill jc-card-item-pill--service">{{ svc }}</span>
                  <span v-if="!job.services || job.services.length === 0"
                    class="jc-card-item-pill jc-card-item-pill--empty">None</span>
                </div>
              </div>
            </div>
          </div>
          <div class="jc-card-actions">
            <button class="jc-btn-view" @click="openJobModal(job)">View</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Pagination -->
    <div v-if="totalPages > 1 && searchBtnClicked && !pageLoading" class="pagination-container">
      <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage -= 1">Previous</button>
      <div class="pagination-info">
        <button v-for="page in totalPages" :key="page" class="pagination-page" :class="{ active: currentPage === page }"
          @click="currentPage = page">
          {{ page }}
        </button>
      </div>
      <button class="pagination-btn" :disabled="currentPage === totalPages" @click="currentPage += 1">Next</button>
    </div>

    <!-- Appointment View Modal -->
    <div v-if="apptModal.isOpen" class="modal-overlay" @click="closeApptModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeApptModal">&times;</button>
        <h2>Appointment Details</h2>
        <div class="modal-body">
          <div class="detail-group"><label>Customer</label>
            <p>{{ apptModal.appt.customerName }}</p>
          </div>
          <div class="detail-group"><label>Customer Email</label>
            <p>{{ apptModal.appt.customerEmail }}</p>
          </div>
          <div class="detail-group"><label>Phone Number</label>
            <p>{{ apptModal.appt.phoneNumber }}</p>
          </div>
          <div class="detail-group"><label>Vehicle</label>
            <p>{{ apptModal.appt.vehicleYear }} {{ apptModal.appt.vehicleMake }} {{ apptModal.appt.vehicleModel }}</p>
          </div>
          <div class="detail-group"><label>License Plate</label>
            <p>{{ apptModal.appt.licensePlate }}</p>
          </div>
          <div class="detail-group"><label>Appointment Date</label>
            <p>{{ formatDate(apptModal.appt.appointmentDate) }}</p>
          </div>
          <div class="detail-group"><label>Time</label>
            <p>{{ formatTime(apptModal.appt.appointmentTime) }}</p>
          </div>
          <div class="detail-group"><label>Duration</label>
            <p>{{ apptModal.appt.duration }}</p>
          </div>
          <div class="detail-group"><label>Status</label>
            <p>{{ formatStatus(apptModal.appt.status) }}</p>
          </div>
          <div v-if="apptModal.appt.status !== 'cancelled'" class="detail-group"><label>Diagnose Technician</label>
            <p>{{ apptModal.appt.diagnoseTech || 'Not Assigned' }}</p>
          </div>
          <div v-if="apptModal.appt.status !== 'cancelled' && apptModal.appt.techEmail" class="detail-group">
            <label>Technician Email</label>
            <p>{{ apptModal.appt.techEmail }}</p>
          </div>
          <div v-if="apptModal.appt.cancelReason && apptModal.appt.status === 'cancelled'" class="detail-group">
            <label>Cancellation Reason</label>
            <p>{{ apptModal.appt.cancelReason }}</p>
          </div>
          <div v-if="apptModal.appt.notes" class="detail-group"><label>Notes</label>
            <div class="jc-notes-box">{{ apptModal.appt.notes }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeApptModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Job Order View Modal -->
    <div v-if="jobModal.isOpen" class="jc-modal-overlay" @click="closeJobModal">
      <div class="jc-modal" @click.stop>
        <button class="jc-modal-close" @click="closeJobModal">&times;</button>
        <h2>Job Card Details</h2>
        <div class="jc-modal-body">
          <div class="jc-detail-group"><label>Status</label>
            <p><span class="jc-status-badge jc-status-badge--check-out">Check Out</span></p>
          </div>
          <div class="jc-detail-group"><label>Job Order ID</label>
            <p>{{ jobModal.job.id }}</p>
          </div>
          <div class="jc-detail-group"><label>Customer</label>
            <p>{{ jobModal.job.customerName }}</p>
          </div>
          <div class="jc-detail-group"><label>Vehicle</label>
            <p>{{ jobModal.job.vehicleYear }} {{ jobModal.job.vehicleMake }} {{ jobModal.job.vehicleModel }}</p>
          </div>
          <div class="jc-detail-group"><label>License Plate</label>
            <p>{{ jobModal.job.licensePlate }}</p>
          </div>
          <div class="jc-detail-group"><label>Job Date</label>
            <p>{{ formatDate(jobModal.job.jobDate) }}</p>
          </div>
          <div class="jc-detail-group"><label>Diagnose Technician</label>
            <p>{{ jobModal.job.diagnoseTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="jc-detail-group"><label>Service Technician</label>
            <p>{{ jobModal.job.serviceTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="jc-detail-group"><label>Customer Notes</label>
            <div class="jc-notes-box">{{ jobModal.job.notes || 'No notes provided' }}</div>
          </div>
          <div class="jc-modal-divider"></div>
          <div class="jc-detail-group">
            <label>Parts ({{ jobModal.job.parts ? jobModal.job.parts.length : 0 }})</label>
            <div v-if="jobModal.job.parts && jobModal.job.parts.length > 0" class="jc-item-list">
              <span v-for="(part, i) in jobModal.job.parts" :key="i" class="jc-item-pill jc-item-pill--part">{{ part
                }}</span>
            </div>
            <p v-else class="jc-empty-items">No parts added</p>
          </div>
          <div class="jc-detail-group">
            <label>Services ({{ jobModal.job.services ? jobModal.job.services.length : 0 }})</label>
            <div v-if="jobModal.job.services && jobModal.job.services.length > 0" class="jc-item-list">
              <span v-for="(svc, i) in jobModal.job.services" :key="i" class="jc-item-pill jc-item-pill--service">{{ svc
                }}</span>
            </div>
            <p v-else class="jc-empty-items">No services added</p>
          </div>
        </div>
        <div class="jc-modal-actions">
          <button class="jc-btn-secondary" @click="closeJobModal">Close</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import '@/assets/jobCards.css'
import '@/assets/managerAppointments.css'
import '@/assets/managerReports.css'
import { sgLocaleDate, sgNow } from '@/utils/sgTime.js'

const PAGE_SIZE = 8
let filterIdCounter = 1

export default {
  name: 'ManagerReports',

  data() {
    return {
      searchBtnClicked: false,
      pageLoading: false,

      filters: {
        type: 'appointments',
        dateFrom: '',
        dateTo: '',
        advanced: []
      },

      currentPage: 1,
      apptModal: { isOpen: false, appt: null },
      jobModal: { isOpen: false, job: null },

      appointments: [],
      appointmentsError: null,
      jobOrders: [],
      jobOrdersError: null,
    }
  },

  computed: {
    filterOptions() {
      return [
        { value: 'customerName', label: 'Customer Name' },
        { value: 'vehicleName', label: 'Vehicle Make/Model' },
        { value: 'licensePlate', label: 'License Plate No.' },
        { value: 'assignedTechnician', label: this.filters.type === 'appointments' ? 'Diagnose Technician' : 'Diagnose/Service Technician' },
        { value: 'recordId', label: 'Record ID' },
      ]
    },

    appointmentRecords() {
      return this.appointments
    },

    jobOrderRecords() {
      return this.jobOrders.map(row => this.transformJobCard(row))
    },

    currentSourceRecords() {
      return this.filters.type === 'appointments' ? this.appointmentRecords : this.jobOrderRecords
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.currentSourceRecords.length / PAGE_SIZE))
    },

    paginatedRecords() {
      const start = (this.currentPage - 1) * PAGE_SIZE
      return this.currentSourceRecords.slice(start, start + PAGE_SIZE)
    }
  },

  watch: {
    'filters.type'() {
      this.currentPage = 1
      this.searchBtnClicked = false
    },
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
    async fetchAppointments() {
      this.searchBtnClicked = true
      this.pageLoading = true
      this.appointmentsError = null
      this.appointments = []
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated. Please log in again.')

        const params = new URLSearchParams()
        if (this.filters.dateFrom) params.append('dateFrom', this.filters.dateFrom)
        if (this.filters.dateTo) params.append('dateTo', this.filters.dateTo)

        this.filters.advanced.forEach(f => {
          if (f.value) params.append(f.field, f.value)
        })

        const res = await fetch(`http://localhost:3000/api/manager/reports/appointments?${params}`, {
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
        this.appointments = []
      } finally {
        this.pageLoading = false
      }
    },

    async fetchJobOrders() {
      this.searchBtnClicked = true
      this.pageLoading = true
      this.jobOrdersError = null
      this.jobOrders = []
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated. Please log in again.')

        const params = new URLSearchParams()
        if (this.filters.dateFrom) params.append('dateFrom', this.filters.dateFrom)
        if (this.filters.dateTo) params.append('dateTo', this.filters.dateTo)

        this.filters.advanced.forEach(f => {
          if (f.value) params.append(f.field, f.value)
        })

        const res = await fetch(`http://localhost:3000/api/manager/reports/jobOrders?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || result.message || 'Failed to fetch job orders')
        this.jobOrders = result.data || []
      } catch (err) {
        console.error('Fetch job orders error:', err)
        this.jobOrdersError = err.message
        this.jobOrders = []
      } finally {
        this.pageLoading = false
      }
    },

    setType(value) {
      this.filters.type = value
    },

    availableFilterOptions(currentFilterId) {
      const usedFields = this.filters.advanced
        .filter(f => f.id !== currentFilterId)
        .map(f => f.field)
      return this.filterOptions.filter(opt => !usedFields.includes(opt.value))
    },

    addAdditionalFilter() {
      const usedFields = this.filters.advanced.map(f => f.field)
      const nextOption = this.filterOptions.find(opt => !usedFields.includes(opt.value))
      if (!nextOption) return
      this.filters.advanced.push({ id: filterIdCounter++, field: nextOption.value, value: '' })
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

    formatDate(value) {
      if (!value) return ''
      return sgLocaleDate(`${value}T00:00:00+08:00`, 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    },

    formatTime(value) {
      if (!value) return ''
      const parts = String(value).split(':')
      const hours = Number(parts[0] || 0)
      const minutes = Number(parts[1] || 0)
      const date = sgNow()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' })
    },

    // from ManagerAppointments
    getDayName(date) {
      if (!date) return ''
      return sgLocaleDate(`${date}T00:00:00+08:00`, 'en-US', { weekday: 'short' })
    },

    formatStatus(status) {
      return status.charAt(0).toUpperCase() + status.slice(1)
    },

    openApptModal(appt) { this.apptModal.appt = appt; this.apptModal.isOpen = true },
    closeApptModal() { this.apptModal.isOpen = false; this.apptModal.appt = null },
    openJobModal(job) { this.jobModal.job = job; this.jobModal.isOpen = true },
    closeJobModal() { this.jobModal.isOpen = false; this.jobModal.job = null },

    // from JobCards
    transformJobCard(row) {
      const appt = row.appointment ?? {}
      const customer = appt.CustomerProfile ?? {}
      const diagnoseTech = appt.DiagnoseTechnicianProfile ?? {}
      const serviceTech = row.ServiceTechnicianProfile ?? {}
      const parts = row.Parts ? row.Parts.split(',').map(s => s.trim()).filter(Boolean) : []
      const services = row.Services ? row.Services.split(',').map(s => s.trim()).filter(Boolean) : []
      return {
        id: row.Order_ID,
        appointmentId: row.appointment_id,
        customerId: row.Customer_id,
        customerName: customer.Name ?? 'Unknown',
        customerEmail: customer.Email ?? '',
        licensePlate: appt.vehicle_license_plate ?? '',
        vehicleMake: appt.vehicle_make ?? '',
        vehicleModel: appt.vehicle_model ?? '',
        vehicleYear: appt.vehicle_year ?? '',
        status: 'check-out',
        jobDate: row.Check_Out ?? null,
        diagnoseTechnician: diagnoseTech.Name ?? null,
        serviceTechnician: serviceTech.Name ?? null,
        parts,
        services,
        notes: appt.customer_notes ?? null,
      }
    }
  }
}
</script>
