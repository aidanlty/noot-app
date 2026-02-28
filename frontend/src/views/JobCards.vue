<template>
  <div class="jc-container">

    <!-- Header -->
    <div class="jc-header">
      <h1>🔧 Job Cards</h1>
    </div>

    <!-- Filter Bar -->
    <div class="jc-filter-bar">

      <!-- Row 1: Date filters -->
      <div class="jc-filter-row">
        <div class="jc-filter-row-label">Date</div>
        <div class="jc-filter-row-controls">
          <button
            v-for="f in dateFilters"
            :key="f.value"
            class="jc-filter-btn"
            :class="{ active: activeDateFilter === f.value && !specificDate }"
            @click="setDateFilter(f.value)"
          >
            {{ f.label }}
          </button>
          <div class="jc-date-filter">
            <input
              type="date"
              class="jc-date-input"
              :class="{ active: specificDate }"
              v-model="specificDate"
              @change="onDateChange"
            />
            <button v-if="specificDate" class="jc-clear-date" @click="clearDate">✕</button>
          </div>
        </div>
      </div>

      <!-- Row 2: Status filters -->
      <div class="jc-filter-row">
        <div class="jc-filter-row-label">Status</div>
        <div class="jc-filter-row-controls">
          <button
            class="jc-filter-btn jc-status-filter-btn"
            :class="{ active: activeStatusFilter === '' }"
            @click="setStatusFilter('')"
          >
            All
          </button>
          <button
            v-for="s in jobStatuses"
            :key="s.value"
            class="jc-filter-btn jc-status-filter-btn"
            :class="['jc-status-btn--' + s.value, { active: activeStatusFilter === s.value }]"
            @click="setStatusFilter(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Row 3: Technician filter -->
      <div class="jc-filter-row">
        <div class="jc-filter-row-label">Assigned</div>
        <div class="jc-filter-row-controls">
          <button
            class="jc-filter-btn"
            :class="{ active: activeTechFilter === 'all' }"
            @click="setTechFilter('all')"
          >All</button>
          <button
            class="jc-filter-btn jc-tech-filter-btn--unassigned"
            :class="{ active: activeTechFilter === 'unassigned' }"
            @click="setTechFilter('unassigned')"
          >Not Assigned</button>
          <button
            class="jc-filter-btn jc-tech-filter-btn--assigned"
            :class="{ active: activeTechFilter === 'assigned' }"
            @click="setTechFilter('assigned')"
          >Assigned</button>
        </div>
      </div>

      <!-- Row 4: Count -->
      <div class="jc-count-row">
        <span class="jc-count">{{ filteredJobCards.length }} job card{{ filteredJobCards.length !== 1 ? 's' : '' }}</span>
      </div>

    </div>

    <!-- Empty -->
    <div v-if="filteredJobCards.length === 0" class="jc-empty-state">
      No job cards found for this period.
    </div>

    <!-- List -->
    <div v-else class="jc-list">
      <div
        v-for="job in paginatedJobCards"
        :key="job.id"
        class="jc-card"
        :class="{ 'jc-card--today': isToday(job.jobDate) }"
      >
        <!-- Status Column -->
        <div class="jc-status-col" :class="'jc-status-col--' + job.status">
          <span class="jc-card-day">{{ isToday(job.jobDate) ? 'Today' : getDayName(job.jobDate) }}</span>
          <span class="jc-status-badge" :class="'jc-status-badge--' + job.status">
            {{ getStatusLabel(job.status) }}
          </span>
        </div>

        <div class="jc-divider" :class="'jc-divider--' + job.status"></div>

        <div class="jc-card-body">
          <div class="jc-card-top">
            <h3 class="jc-card-name">{{ job.customerName }}</h3>
            <span class="jc-card-id">#{{ job.id }}</span>
          </div>
          <p class="jc-card-vehicle">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }} · {{ job.licensePlate }}</p>
          <div class="jc-card-meta">
            <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
            <span class="jc-meta-tag jc-meta-tag--service">{{ job.serviceType }}</span>
            <template v-if="job.status === 'diagnose'">
              <span v-if="job.diagnoseTechnician" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.diagnoseTechnician }}</span>
              <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Diagnose Tech: Not Assigned</span>
            </template>
            <template v-if="job.status === 'service'">
              <span v-if="job.serviceTechnician" class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.serviceTechnician }}</span>
              <span v-else class="jc-meta-tag jc-meta-tag--unassigned">Service Tech: Not Assigned</span>
            </template>
          </div>

          <!-- Diagnose readiness pills -->
          <div v-if="job.status === 'diagnose'" class="jc-readiness-row">
            <span
              class="jc-readiness-pill"
              :class="job.parts && job.parts.length > 0 ? 'jc-readiness-pill--ok' : 'jc-readiness-pill--missing'"
            >
              {{ job.parts && job.parts.length > 0 ? '✓' : '✕' }} Parts ({{ job.parts ? job.parts.length : 0 }})
            </span>
            <span
              class="jc-readiness-pill"
              :class="job.services && job.services.length > 0 ? 'jc-readiness-pill--ok' : 'jc-readiness-pill--missing'"
            >
              {{ job.services && job.services.length > 0 ? '✓' : '✕' }} Services ({{ job.services ? job.services.length : 0 }})
            </span>
          </div>
        </div>

        <div class="jc-card-actions">
          <button class="jc-btn-view" @click="openModal(job)">View</button>

          <template v-if="job.status === 'diagnose'">
            <button
              v-if="!job.diagnoseTechnician"
              class="jc-btn-assign"
              @click="openTechModal(job, 'assign', 'diagnose')"
            >Assign</button>
            <button
              v-else
              class="jc-btn-change"
              @click="openTechModal(job, 'change', 'diagnose')"
            >Change</button>
          </template>

          <template v-if="job.status === 'service'">
            <button
              v-if="!job.serviceTechnician"
              class="jc-btn-assign"
              @click="openTechModal(job, 'assign', 'service')"
            >Assign</button>
            <button
              v-else
              class="jc-btn-change"
              @click="openTechModal(job, 'change', 'service')"
            >Change</button>
          </template>

          <!-- Proceed Button -->
          <template v-if="getNextStatus(job.status)">
            <div
              v-if="job.status === 'diagnose'"
              class="jc-proceed-wrapper"
              :title="getDiagnoseBlockReason(job) || ''"
            >
              <button
                class="jc-btn-proceed"
                :class="{ 'jc-btn-proceed--blocked': !canProceedFromDiagnose(job) }"
                :disabled="!canProceedFromDiagnose(job)"
                @click="proceedToNextStatus(job)"
              >
                {{ getNextStatusLabel(job.status) }} →
              </button>
            </div>
            <button
              v-else
              class="jc-btn-proceed"
              @click="proceedToNextStatus(job)"
            >
              {{ getNextStatusLabel(job.status) }} →
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="jc-pagination">
      <button class="jc-pagination-btn" @click="prevPage" :disabled="currentPage === 1">← Previous</button>
      <div class="jc-pagination-pages">
        <button
          v-for="page in totalPages"
          :key="page"
          class="jc-pagination-page"
          :class="{ active: currentPage === page }"
          @click="goToPage(page)"
        >{{ page }}</button>
      </div>
      <button class="jc-pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Next →</button>
    </div>

    <!-- View Modal -->
    <div v-if="modal.isOpen" class="jc-modal-overlay" @click="closeModal">
      <div class="jc-modal" @click.stop>
        <button class="jc-modal-close" @click="closeModal">&times;</button>
        <h2>Job Card Details</h2>
        <div class="jc-modal-body">
          <div class="jc-detail-group">
            <label>Status</label>
            <p>
              <span class="jc-status-badge" :class="'jc-status-badge--' + modal.job.status">
                {{ getStatusLabel(modal.job.status) }}
              </span>
            </p>
          </div>
          <div class="jc-detail-group">
            <label>Customer</label>
            <p>{{ modal.job.customerName }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Vehicle</label>
            <p>{{ modal.job.vehicleYear }} {{ modal.job.vehicleMake }} {{ modal.job.vehicleModel }}</p>
          </div>
          <div class="jc-detail-group">
            <label>License Plate</label>
            <p>{{ modal.job.licensePlate }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Job Date</label>
            <p>{{ formatDate(modal.job.jobDate) }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Service Type</label>
            <p>{{ modal.job.serviceType }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Diagnose Technician</label>
            <p>{{ modal.job.diagnoseTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Service Technician</label>
            <p>{{ modal.job.serviceTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="jc-detail-group">
            <label>Estimated Cost</label>
            <p>${{ modal.job.estimatedCost }}</p>
          </div>
          <div v-if="modal.job.notes" class="jc-detail-group">
            <label>Notes</label>
            <p>{{ modal.job.notes }}</p>
          </div>
        </div>
        <div class="jc-modal-actions">
          <template v-if="getNextStatus(modal.job.status)">
            <div
              v-if="modal.job.status === 'diagnose'"
              :title="getDiagnoseBlockReason(modal.job) || ''"
            >
              <button
                class="jc-btn-proceed jc-btn-proceed--modal"
                :class="{ 'jc-btn-proceed--blocked': !canProceedFromDiagnose(modal.job) }"
                :disabled="!canProceedFromDiagnose(modal.job)"
                @click="proceedToNextStatus(modal.job); closeModal()"
              >
                {{ getNextStatusLabel(modal.job.status) }} →
              </button>
            </div>
            <button
              v-else
              class="jc-btn-proceed jc-btn-proceed--modal"
              @click="proceedToNextStatus(modal.job); closeModal()"
            >
              {{ getNextStatusLabel(modal.job.status) }} →
            </button>
          </template>
          <button class="jc-btn-secondary" @click="closeModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Technician Assign/Change Modal -->
    <div v-if="techModal.isOpen" class="jc-modal-overlay" @click="closeTechModal">
      <div class="jc-modal jc-tech-modal" @click.stop>
        <button class="jc-modal-close" @click="closeTechModal">&times;</button>
        <h2>{{ techModal.mode === 'assign' ? 'Assign' : 'Change' }} {{ techModal.techType === 'diagnose' ? 'Diagnose' : 'Service' }} Technician</h2>
        <p class="jc-tech-modal-subtitle">
          {{ techModal.job.customerName }} &middot; #{{ techModal.job.id }} &middot;
          {{ techModal.job.vehicleYear }} {{ techModal.job.vehicleMake }} {{ techModal.job.vehicleModel }}
        </p>

        <div class="jc-modal-body">
          <div v-if="techModal.mode === 'change'" class="jc-detail-group">
            <label>Current Technician</label>
            <p class="jc-current-tech">{{ techModal.techType === 'diagnose' ? techModal.job.diagnoseTechnician : techModal.job.serviceTechnician }}</p>
          </div>
          <div class="jc-detail-group">
            <label>{{ techModal.mode === 'assign' ? 'Select Technician' : 'New Technician' }}</label>

            <!-- Loading state -->
            <p v-if="technicianLoading" class="jc-tech-loading">Loading technicians...</p>

            <!-- Error state -->
            <p v-else-if="technicianError" class="jc-tech-error">{{ technicianError }}</p>

            <!-- Dropdown -->
            <select v-else class="jc-tech-select" v-model="techModal.selected">
              <option value="">— Select a technician —</option>
              <option
                v-for="t in technicians"
                :key="t.ID"
                :value="t.Name"
                :disabled="techModal.mode === 'change' && t.Name === (techModal.techType === 'diagnose' ? techModal.job.diagnoseTechnician : techModal.job.serviceTechnician)"
              >{{ t.Name }}</option>
            </select>

            <p v-if="techModal.showError" class="jc-tech-error">Please select a technician to continue.</p>
          </div>
        </div>

        <div class="jc-modal-actions" style="display:flex; justify-content:flex-end; gap:0.75rem;">
          <button class="jc-btn-secondary" @click="closeTechModal">Cancel</button>
          <button class="jc-btn-confirm-tech" @click="submitTech">
            {{ techModal.mode === 'assign' ? 'Assign' : 'Change' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'JobCards',
  data() {
    const today = new Date();
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x.toISOString().split('T')[0];
    };
    const subDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() - n);
      return x.toISOString().split('T')[0];
    };
    const todayStr = today.toISOString().split('T')[0];

    return {
      activeDateFilter: 'all',
      activeStatusFilter: '',
      activeTechFilter: 'unassigned',
      currentPage: 1,
      itemsPerPage: 5,
      specificDate: '',
      dateFilters: [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'week'  },
        { label: 'This Month', value: 'month' },
        { label: 'All',        value: 'all'   },
      ],
      jobStatuses: [
        { value: 'diagnose',          label: 'Diagnose'          },
        { value: 'quotation',         label: 'Quotation'         },
        { value: 'waiting-for-parts', label: 'Waiting For Parts' },
        { value: 'service',           label: 'Service'           },
      ],
      modal: { isOpen: false, job: null },
      techModal: { isOpen: false, job: null, selected: '', mode: '', techType: '', showError: false },

      // Technicians — populated from API
      technicians: [],
      technicianLoading: false,
      technicianError: '',

      jobCards: [
        { id: 'JC-001', licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',   status: 'diagnose',          jobDate: todayStr,          serviceType: 'Engine Check',           diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 120,  notes: 'Customer reports unusual engine noise at idle.', parts: [], services: [] },
        { id: 'JC-002', licensePlate: 'XYZ-5678', vehicleMake: 'Honda',   vehicleModel: 'Civic',    vehicleYear: '2023', customerName: 'Priya Nair',     status: 'quotation',         jobDate: todayStr,          serviceType: 'Brake Replacement',      diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 350,  notes: 'Awaiting customer approval on parts quote.',    parts: [], services: [] },
        { id: 'JC-003', licensePlate: 'DEF-9012', vehicleMake: 'Ford',    vehicleModel: 'F-150',    vehicleYear: '2021', customerName: 'Marco Silva',    status: 'waiting-for-parts', jobDate: todayStr,          serviceType: 'Suspension Repair',      diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 780,  notes: 'Parts ordered — ETA 2 days.',                   parts: [], services: [] },
        { id: 'JC-004', licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell', status: 'service',           jobDate: todayStr,          serviceType: 'Full Service',           diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Chris Lee',  estimatedCost: 500,  notes: null,                                            parts: ['Oil Filter', 'Air Filter'], services: ['Full Service', 'Fluid Top-Up'] },
        { id: 'JC-005', licensePlate: 'JKL-7890', vehicleMake: 'Tesla',   vehicleModel: 'Model 3',  vehicleYear: '2023', customerName: 'David Okafor',   status: 'diagnose',          jobDate: addDays(today, 1), serviceType: 'Battery Diagnostic',     diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 80,   notes: 'Check charging system and battery health.',     parts: ['Battery Cell Module'], services: [] },
        { id: 'JC-006', licensePlate: 'MNO-1122', vehicleMake: 'Audi',    vehicleModel: 'A4',       vehicleYear: '2022', customerName: 'Lena Hoffmann',  status: 'quotation',         jobDate: addDays(today, 2), serviceType: 'Gearbox Service',        diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 950,  notes: null,                                            parts: [], services: [] },
        { id: 'JC-007', licensePlate: 'PQR-3344', vehicleMake: 'Mazda',   vehicleModel: 'CX-5',     vehicleYear: '2020', customerName: 'Tom Nguyen',     status: 'waiting-for-parts', jobDate: addDays(today, 3), serviceType: 'AC Compressor Replace',  diagnoseTechnician: null,           serviceTechnician: null,         estimatedCost: 620,  notes: 'Compressor unit on back-order.',                parts: [], services: [] },
        { id: 'JC-008', licensePlate: 'STU-5566', vehicleMake: 'Hyundai', vehicleModel: 'Tucson',   vehicleYear: '2021', customerName: 'Nina Patel',     status: 'service',           jobDate: addDays(today, 4), serviceType: 'Oil Change & Filter',    diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 90,   notes: null,                                            parts: ['Oil Filter'], services: ['Oil Change'] },
        { id: 'JC-009', licensePlate: 'VWX-7788', vehicleMake: 'Kia',     vehicleModel: 'Sportage', vehicleYear: '2023', customerName: 'Leo Fernandez',  status: 'diagnose',          jobDate: subDays(today, 1), serviceType: 'Electrical Fault',       diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 150,  notes: 'Multiple warning lights on dash.',              parts: ['Fuse Kit', 'Relay Switch'], services: ['Electrical Diagnosis'] },
        { id: 'JC-010', licensePlate: 'YZA-9900', vehicleMake: 'Subaru',  vehicleModel: 'Forester', vehicleYear: '2022', customerName: 'Chloe Kim',      status: 'service',           jobDate: subDays(today, 2), serviceType: 'Timing Belt Replacement', diagnoseTechnician: 'Maria Santos', serviceTechnician: null,         estimatedCost: 1100, notes: null,                                            parts: ['Timing Belt', 'Tensioner Pulley'], services: ['Timing Belt Replacement'] },
      ],
    };
  },

  async mounted() {
    await this.fetchTechnicians();
  },

  computed: {
    todayStr() {
      return new Date().toISOString().split('T')[0];
    },
    startOfWeekStr() {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return start.toISOString().split('T')[0];
    },
    endOfWeekStr() {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + (6 - today.getDay()));
      return end.toISOString().split('T')[0];
    },
    startOfMonthStr() {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    },
    endOfMonthStr() {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    },
    filteredJobCards() {
      let list = this.jobCards;
      if (this.specificDate) {
        list = list.filter(j => j.jobDate === this.specificDate);
      } else if (this.activeDateFilter === 'today') {
        list = list.filter(j => j.jobDate === this.todayStr);
      } else if (this.activeDateFilter === 'week') {
        list = list.filter(j => j.jobDate >= this.startOfWeekStr && j.jobDate <= this.endOfWeekStr);
      } else if (this.activeDateFilter === 'month') {
        list = list.filter(j => j.jobDate >= this.startOfMonthStr && j.jobDate <= this.endOfMonthStr);
      }
      if (this.activeStatusFilter) {
        list = list.filter(j => j.status === this.activeStatusFilter);
      }
      if (this.activeTechFilter === 'unassigned') {
        list = list.filter(j => {
          if (j.status === 'diagnose') return !j.diagnoseTechnician;
          if (j.status === 'service')  return !j.serviceTechnician;
          return false;
        });
      } else if (this.activeTechFilter === 'assigned') {
        list = list.filter(j => {
          if (j.status === 'diagnose') return !!j.diagnoseTechnician;
          if (j.status === 'service')  return !!j.serviceTechnician;
          return false;
        });
      }
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate));
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredJobCards.length / this.itemsPerPage));
    },
    paginatedJobCards() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredJobCards.slice(start, start + this.itemsPerPage);
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

    isToday(date) { return date === this.todayStr; },
    setDateFilter(val) { this.activeDateFilter = val; this.specificDate = ''; this.currentPage = 1; },
    setStatusFilter(val) { this.activeStatusFilter = val; this.currentPage = 1; },
    setTechFilter(val) { this.activeTechFilter = val; this.currentPage = 1; },
    onDateChange() { this.currentPage = 1; },
    clearDate() { this.specificDate = ''; this.currentPage = 1; },
    goToPage(page) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    getStatusLabel(status) {
      const found = this.jobStatuses.find(s => s.value === status);
      return found ? found.label : status;
    },
    openModal(job) { this.modal.job = job; this.modal.isOpen = true; },
    closeModal() { this.modal.isOpen = false; this.modal.job = null; },
    openTechModal(job, mode, techType) {
      this.techModal.job = job;
      this.techModal.mode = mode;
      this.techModal.techType = techType;
      this.techModal.selected = '';
      this.techModal.showError = false;
      this.techModal.isOpen = true;
    },
    closeTechModal() {
      this.techModal.isOpen = false;
      this.techModal.job = null;
    },
    submitTech() {
      if (!this.techModal.selected) {
        this.techModal.showError = true;
        return;
      }
      if (this.techModal.techType === 'diagnose') {
        this.techModal.job.diagnoseTechnician = this.techModal.selected;
      } else {
        this.techModal.job.serviceTechnician = this.techModal.selected;
      }
      this.closeTechModal();
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    getDayName(date) {
      if (!date) return '';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    },

    // ── Status Progression ──────────────────────────────────────────────
    getNextStatus(currentStatus) {
      const flow = {
        'diagnose':          'quotation',
        'quotation':         'waiting-for-parts',
        'waiting-for-parts': 'service',
      };
      return flow[currentStatus] || null;
    },
    getNextStatusLabel(currentStatus) {
      const labels = {
        'diagnose':          'Proceed to Quotation',
        'quotation':         'Proceed to Waiting for Parts',
        'waiting-for-parts': 'Proceed to Service',
      };
      return labels[currentStatus] || '';
    },
    canProceedFromDiagnose(job) {
      return job.parts && job.parts.length > 0 && job.services && job.services.length > 0;
    },
    getDiagnoseBlockReason(job) {
      const hasParts    = job.parts    && job.parts.length    > 0;
      const hasServices = job.services && job.services.length > 0;
      if (!hasParts && !hasServices) return 'Add at least one part and one service before proceeding';
      if (!hasParts)    return 'Add at least one part before proceeding';
      if (!hasServices) return 'Add at least one service before proceeding';
      return '';
    },
    proceedToNextStatus(job) {
      if (job.status === 'diagnose' && !this.canProceedFromDiagnose(job)) return;
      const next = this.getNextStatus(job.status);
      if (next) job.status = next;
    },
  },
};
</script>

<style scoped src="@/assets/jobCards.css"></style>