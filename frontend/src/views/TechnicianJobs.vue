<template>
  <div class="tech-container">

    <!-- Header -->
    <div class="tech-header">
      <div class="tech-header-left">
        <div class="tech-avatar">{{ currentTech.initials }}</div>
        <div class="tech-header-info">
          <h1>My Job Orders</h1>
          <p class="tech-name">{{ currentTech.name }}</p>
        </div>
      </div>
      <div class="tech-header-stats">
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
          <span class="tech-stat-label">Total</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="tech-filter-bar">

      <!-- Row 1: Date filters -->
      <div class="tech-filter-row">
        <div class="tech-filter-row-label">Date</div>
        <div class="tech-filter-row-controls">
          <button
            v-for="f in dateFilters"
            :key="f.value"
            class="tech-filter-btn"
            :class="{ active: activeDateFilter === f.value && !specificDate }"
            @click="setDateFilter(f.value)"
          >{{ f.label }}</button>
          <div class="tech-date-filter">
            <input
              type="date"
              class="tech-date-input"
              :class="{ active: specificDate }"
              v-model="specificDate"
              @change="onDateChange"
            />
            <button v-if="specificDate" class="tech-clear-date" @click="clearDate">✕</button>
          </div>
        </div>
      </div>

      <!-- Row 2: Role filters -->
      <div class="tech-filter-row">
        <div class="tech-filter-row-label">Role</div>
        <div class="tech-filter-row-controls">
          <button
            class="tech-filter-btn"
            :class="{ active: activeRoleFilter === 'all' }"
            @click="setRoleFilter('all')"
          >All</button>
          <button
            class="tech-filter-btn tech-role-btn--diagnose"
            :class="{ active: activeRoleFilter === 'diagnose' }"
            @click="setRoleFilter('diagnose')"
          >Diagnose</button>
          <button
            class="tech-filter-btn tech-role-btn--service"
            :class="{ active: activeRoleFilter === 'service' }"
            @click="setRoleFilter('service')"
          >Service</button>
        </div>
      </div>

      <!-- Row 3: Status filters -->
      <div class="tech-filter-row">
        <div class="tech-filter-row-label">Status</div>
        <div class="tech-filter-row-controls">
          <button
            class="tech-filter-btn"
            :class="{ active: activeStatusFilter === '' }"
            @click="setStatusFilter('')"
          >All</button>
          <button
            v-for="s in jobStatuses"
            :key="s.value"
            class="tech-filter-btn tech-status-filter-btn"
            :class="['tech-status-btn--' + s.value, { active: activeStatusFilter === s.value }]"
            @click="setStatusFilter(s.value)"
          >{{ s.label }}</button>
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
        <!-- Status Column -->
        <div class="tech-status-col" :class="'tech-status-col--' + job.status">
          <span class="tech-card-day">{{ isToday(job.jobDate) ? 'Today' : getDayName(job.jobDate) }}</span>
          <span class="tech-status-badge" :class="'tech-status-badge--' + job.status">
            {{ getStatusLabel(job.status) }}
          </span>
        </div>

        <div class="tech-divider" :class="'tech-divider--' + job.status"></div>

        <!-- Body -->
        <div class="tech-card-body">
          <div class="tech-card-top">
            <h3 class="tech-card-name">{{ job.customerName }}</h3>
            <span class="tech-card-id">#{{ job.id }}</span>
          </div>
          <p class="tech-card-vehicle">{{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }} · {{ job.licensePlate }}</p>
          <div class="tech-card-meta">
            <span class="tech-meta-tag tech-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
            <span class="tech-meta-tag tech-meta-tag--service">{{ job.serviceType }}</span>
            <span v-if="job.myRole === 'diagnose'" class="tech-meta-tag tech-meta-tag--role-diagnose">🔍 Diagnose Tech</span>
            <span v-if="job.myRole === 'service'"  class="tech-meta-tag tech-meta-tag--role-service">🔧 Service Tech</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="tech-card-actions">
          <button class="tech-btn-view" @click="openModal(job)">View</button>
          <button
            v-if="canUpdateStatus(job)"
            class="tech-btn-update"
            :class="'tech-btn-update--' + nextStatus(job).value"
            @click="openUpdateModal(job)"
          >{{ nextStatus(job).label }}</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="tech-pagination">
      <button class="tech-pagination-btn" @click="prevPage" :disabled="currentPage === 1">← Previous</button>
      <div class="tech-pagination-pages">
        <button
          v-for="page in totalPages"
          :key="page"
          class="tech-pagination-page"
          :class="{ active: currentPage === page }"
          @click="goToPage(page)"
        >{{ page }}</button>
      </div>
      <button class="tech-pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">Next →</button>
    </div>

    <!-- View Modal -->
    <div v-if="modal.isOpen" class="tech-modal-overlay" @click="closeModal">
      <div class="tech-modal" @click.stop>
        <button class="tech-modal-close" @click="closeModal">&times;</button>
        <h2>Job Order Details</h2>
        <div class="tech-modal-body">
          <div class="tech-detail-group">
            <label>Status</label>
            <p><span class="tech-status-badge" :class="'tech-status-badge--' + modal.job.status">{{ getStatusLabel(modal.job.status) }}</span></p>
          </div>
          <div class="tech-detail-group">
            <label>My Role</label>
            <p>
              <span class="tech-meta-tag" :class="modal.job.myRole === 'diagnose' ? 'tech-meta-tag--role-diagnose' : 'tech-meta-tag--role-service'">
                {{ modal.job.myRole === 'diagnose' ? '🔍 Diagnose Technician' : '🔧 Service Technician' }}
              </span>
            </p>
          </div>
          <div class="tech-detail-group">
            <label>Customer</label>
            <p>{{ modal.job.customerName }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Vehicle</label>
            <p>{{ modal.job.vehicleYear }} {{ modal.job.vehicleMake }} {{ modal.job.vehicleModel }}</p>
          </div>
          <div class="tech-detail-group">
            <label>License Plate</label>
            <p>{{ modal.job.licensePlate }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Job Date</label>
            <p>{{ formatDate(modal.job.jobDate) }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Service Type</label>
            <p>{{ modal.job.serviceType }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Diagnose Technician</label>
            <p>{{ modal.job.diagnoseTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Service Technician</label>
            <p>{{ modal.job.serviceTechnician || 'Not Assigned' }}</p>
          </div>
          <div class="tech-detail-group">
            <label>Estimated Cost</label>
            <p>${{ modal.job.estimatedCost }}</p>
          </div>
          <div v-if="modal.job.notes" class="tech-detail-group">
            <label>Notes</label>
            <p>{{ modal.job.notes }}</p>
          </div>
        </div>
        <div class="tech-modal-actions">
          <button class="tech-btn-secondary" @click="closeModal">Close</button>
          <button
            v-if="canUpdateStatus(modal.job)"
            class="tech-btn-update"
            :class="'tech-btn-update--' + nextStatus(modal.job).value"
            @click="openUpdateModal(modal.job); closeModal()"
          >{{ nextStatus(modal.job).label }}</button>
        </div>
      </div>
    </div>

    <!-- Update Status Confirm Modal -->
    <div v-if="updateModal.isOpen" class="tech-modal-overlay" @click="closeUpdateModal">
      <div class="tech-modal tech-confirm-modal" @click.stop>
        <div class="tech-confirm-icon" :class="'tech-confirm-icon--' + nextStatus(updateModal.job).value">
          {{ nextStatus(updateModal.job).icon }}
        </div>
        <h2>{{ nextStatus(updateModal.job).confirmTitle }}</h2>
        <p class="tech-confirm-desc">{{ nextStatus(updateModal.job).confirmDesc }}</p>

        <div class="tech-confirm-card-info">
          <span class="tech-confirm-name">{{ updateModal.job.customerName }}</span>
          <span class="tech-confirm-meta">{{ updateModal.job.vehicleYear }} {{ updateModal.job.vehicleMake }} {{ updateModal.job.vehicleModel }} · #{{ updateModal.job.id }}</span>
          <span class="tech-confirm-service">{{ updateModal.job.serviceType }}</span>
        </div>

        <!-- Notes field for diagnose → quotation -->
        <div v-if="updateModal.job.status === 'diagnose'" class="tech-notes-field">
          <label class="tech-notes-label">Diagnose Notes <span class="tech-optional">(optional)</span></label>
          <textarea
            v-model="updateModal.notes"
            class="tech-notes-textarea"
            placeholder="Describe findings, parts needed, estimated work..."
            rows="3"
          ></textarea>
        </div>

        <div class="tech-modal-actions tech-confirm-actions">
          <button class="tech-btn-secondary" @click="closeUpdateModal">Go Back</button>
          <button
            class="tech-btn-update"
            :class="'tech-btn-update--' + nextStatus(updateModal.job).value"
            @click="submitUpdate"
          >Confirm</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'TechnicianJobOrders',
  data() {
    const today = new Date();
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
    const subDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };
    const todayStr = today.toISOString().split('T')[0];

    const currentTech = { name: 'Ryan Patel', initials: 'RP' };

    const allJobCards = [
      { id: 'JC-001', licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',   status: 'diagnose',          jobDate: todayStr,          serviceType: 'Engine Check',           diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 120,  notes: 'Customer reports unusual engine noise at idle.' },
      { id: 'JC-002', licensePlate: 'XYZ-5678', vehicleMake: 'Honda',   vehicleModel: 'Civic',    vehicleYear: '2023', customerName: 'Priya Nair',     status: 'quotation',         jobDate: todayStr,          serviceType: 'Brake Replacement',      diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 350,  notes: 'Awaiting customer approval on parts quote.' },
      { id: 'JC-003', licensePlate: 'DEF-9012', vehicleMake: 'Ford',    vehicleModel: 'F-150',    vehicleYear: '2021', customerName: 'Marco Silva',    status: 'waiting-for-parts', jobDate: todayStr,          serviceType: 'Suspension Repair',      diagnoseTechnician: null,           serviceTechnician: 'Ryan Patel', estimatedCost: 780,  notes: 'Parts ordered — ETA 2 days.' },
      { id: 'JC-004', licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell', status: 'service',           jobDate: todayStr,          serviceType: 'Full Service',           diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Ryan Patel', estimatedCost: 500,  notes: null },
      { id: 'JC-008', licensePlate: 'STU-5566', vehicleMake: 'Hyundai', vehicleModel: 'Tucson',   vehicleYear: '2021', customerName: 'Nina Patel',     status: 'service',           jobDate: addDays(today, 1), serviceType: 'Oil Change & Filter',    diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 90,   notes: null },
      { id: 'JC-009', licensePlate: 'VWX-7788', vehicleMake: 'Kia',     vehicleModel: 'Sportage', vehicleYear: '2023', customerName: 'Leo Fernandez',  status: 'diagnose',          jobDate: subDays(today, 1), serviceType: 'Electrical Fault',       diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 150,  notes: 'Multiple warning lights on dash.' },
      { id: 'JC-011', licensePlate: 'BCD-2233', vehicleMake: 'Nissan',  vehicleModel: 'Altima',   vehicleYear: '2021', customerName: 'Grace Huang',    status: 'service',           jobDate: addDays(today, 2), serviceType: 'Transmission Service',   diagnoseTechnician: 'Maria Santos', serviceTechnician: 'Ryan Patel', estimatedCost: 430,  notes: null },
      { id: 'JC-012', licensePlate: 'EFG-4455', vehicleMake: 'Jeep',    vehicleModel: 'Wrangler', vehicleYear: '2020', customerName: 'Carlos Rivera',  status: 'diagnose',          jobDate: addDays(today, 3), serviceType: 'Steering Check',         diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 200,  notes: 'Slight pull to the left reported by customer.' },
    ];

    const myJobs = allJobCards
      .filter(j => j.diagnoseTechnician === currentTech.name || j.serviceTechnician === currentTech.name)
      .map(j => ({ ...j, myRole: j.diagnoseTechnician === currentTech.name ? 'diagnose' : 'service' }));

    return {
      currentTech,
      activeDateFilter: 'all',
      activeStatusFilter: '',
      activeRoleFilter: 'all',
      currentPage: 1,
      itemsPerPage: 5,
      specificDate: '',
      dateFilters: [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'All', value: 'all' },
      ],
      jobStatuses: [
        { value: 'diagnose',          label: 'Diagnose' },
        { value: 'quotation',         label: 'Quotation' },
        { value: 'waiting-for-parts', label: 'Waiting For Parts' },
        { value: 'service',           label: 'Service' },
      ],
      modal: { isOpen: false, job: null },
      updateModal: { isOpen: false, job: null, notes: '' },
      jobCards: myJobs,
    };
  },
  computed: {
    todayStr() { return new Date().toISOString().split('T')[0]; },
    startOfWeekStr() { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - t.getDay()); return s.toISOString().split('T')[0]; },
    endOfWeekStr()   { const t = new Date(); const e = new Date(t); e.setDate(t.getDate() + (6 - t.getDay())); return e.toISOString().split('T')[0]; },
    startOfMonthStr(){ const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split('T')[0]; },
    endOfMonthStr()  { const t = new Date(); return new Date(t.getFullYear(), t.getMonth() + 1, 0).toISOString().split('T')[0]; },
    diagnosedCount() { return this.jobCards.filter(j => j.myRole === 'diagnose').length; },
    serviceCount()   { return this.jobCards.filter(j => j.myRole === 'service').length; },
    totalAssigned()  { return this.jobCards.length; },
    filteredJobs() {
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
      if (this.activeRoleFilter !== 'all') list = list.filter(j => j.myRole === this.activeRoleFilter);
      if (this.activeStatusFilter)        list = list.filter(j => j.status === this.activeStatusFilter);
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate));
    },
    totalPages() { return Math.max(1, Math.ceil(this.filteredJobs.length / this.itemsPerPage)); },
    paginatedJobs() { const s = (this.currentPage - 1) * this.itemsPerPage; return this.filteredJobs.slice(s, s + this.itemsPerPage); },
  },
  methods: {
    isToday(date) { return date === this.todayStr; },
    setDateFilter(val) { this.activeDateFilter = val; this.specificDate = ''; this.currentPage = 1; },
    setStatusFilter(val) { this.activeStatusFilter = val; this.currentPage = 1; },
    setRoleFilter(val)   { this.activeRoleFilter = val; this.currentPage = 1; },
    onDateChange() { this.currentPage = 1; },
    clearDate() { this.specificDate = ''; this.currentPage = 1; },
    goToPage(page) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    getStatusLabel(status) { const f = this.jobStatuses.find(s => s.value === status); return f ? f.label : status; },
    formatDate(date) { if (!date) return 'N/A'; return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); },
    getDayName(date) { if (!date) return ''; return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); },
    canUpdateStatus(job) {
      if (job.myRole === 'diagnose' && job.status === 'diagnose') return true;
      if (job.myRole === 'service'  && job.status === 'service')  return true;
      return false;
    },
    nextStatus(job) {
      if (!job) return {};
      if (job.myRole === 'diagnose' && job.status === 'diagnose') return { value: 'quotation', label: 'Send to Quotation', icon: '📋', confirmTitle: 'Send to Quotation', confirmDesc: 'Mark this diagnosis as complete and move the job to Quotation stage.' };
      if (job.myRole === 'service'  && job.status === 'service')  return { value: 'completed', label: 'Mark Complete',     icon: '✓',  confirmTitle: 'Mark Job Complete',  confirmDesc: 'Confirm that all service work has been completed for this job order.' };
      return {};
    },
    openModal(job)   { this.modal.job = job; this.modal.isOpen = true; },
    closeModal()     { this.modal.isOpen = false; this.modal.job = null; },
    openUpdateModal(job) { this.updateModal.job = job; this.updateModal.notes = ''; this.updateModal.isOpen = true; },
    closeUpdateModal()   { this.updateModal.isOpen = false; this.updateModal.job = null; },
    submitUpdate() {
      const job  = this.updateModal.job;
      const next = this.nextStatus(job);
      if (this.updateModal.notes) job.notes = this.updateModal.notes;
      job.status = next.value;
      console.log('Status updated:', job.id, '->', next.value);
      this.closeUpdateModal();
    },
  },
};
</script>

<style scoped src="@/assets/technicianJobs.css"></style>