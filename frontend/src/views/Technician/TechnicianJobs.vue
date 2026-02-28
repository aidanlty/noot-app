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

      <!-- Row 2: Status filters -->
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

      <!-- Row 3: Items filters -->
      <div class="tech-filter-row">
        <div class="tech-filter-row-label">Items</div>
        <div class="tech-filter-row-controls">
          <button
            class="tech-filter-btn"
            :class="{ active: activeItemFilter === 'all' }"
            @click="setItemFilter('all')"
          >All</button>
          <button
            class="tech-filter-btn tech-item-filter-btn--parts"
            :class="{ active: activeItemFilter === 'no-parts' }"
            @click="setItemFilter('no-parts')"
          >No Parts Added</button>
          <button
            class="tech-filter-btn tech-item-filter-btn--services"
            :class="{ active: activeItemFilter === 'no-services' }"
            @click="setItemFilter('no-services')"
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
          >Mark Complete</button>
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
          <div v-if="modal.job.parts && modal.job.parts.length > 0" class="tech-detail-group">
            <label>Parts</label>
            <div class="tech-detail-tags">
              <span v-for="p in modal.job.parts" :key="p" class="tech-detail-tag tech-detail-tag--parts">{{ p }}</span>
            </div>
          </div>
          <div v-if="modal.job.addedServices && modal.job.addedServices.length > 0" class="tech-detail-group">
            <label>Added Services</label>
            <div class="tech-detail-tags">
              <span v-for="s in modal.job.addedServices" :key="s" class="tech-detail-tag tech-detail-tag--services">{{ s }}</span>
            </div>
          </div>
          <div v-if="modal.job.notes" class="tech-detail-group">
            <label>Notes</label>
            <p>{{ modal.job.notes }}</p>
          </div>
        </div>
        <div class="tech-modal-actions">
          <button class="tech-btn-secondary" @click="closeModal">Close</button>
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

          <!-- Selected items -->
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
                <button class="tech-remove-item" @click="removeItemFromModal(idx)">✕</button>
              </div>
            </div>
            <p v-else class="tech-panel-empty">Nothing selected yet. Search below to add items.</p>
          </div>
        </div>

        <!-- Search -->
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
                :class="{ 'tech-dropdown-item--selected': isItemSelected(item) }"
                @mousedown.prevent="toggleItem(item)"
              >
                <span>{{ item }}</span>
                <span v-if="isItemSelected(item)" class="tech-dropdown-check">✓</span>
              </div>
            </div>
            <div v-if="itemModal.dropdownOpen && itemModal.search && filteredItemList.length === 0" class="tech-dropdown">
              <div class="tech-dropdown-empty">No results found</div>
            </div>
          </div>
        </div>

        <!-- Actions below search -->
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
        <h2>Mark Job Complete</h2>
        <p class="tech-confirm-desc">Confirm that all service work has been completed for this job order.</p>
        <div class="tech-confirm-card-info">
          <span class="tech-confirm-name">{{ updateModal.job.customerName }}</span>
          <span class="tech-confirm-meta">{{ updateModal.job.vehicleYear }} {{ updateModal.job.vehicleMake }} {{ updateModal.job.vehicleModel }} · #{{ updateModal.job.id }}</span>
          <span class="tech-confirm-service">{{ updateModal.job.serviceType }}</span>
        </div>
        <div class="tech-modal-actions tech-confirm-actions">
          <button class="tech-btn-secondary" @click="closeUpdateModal">Go Back</button>
          <button class="tech-btn-update tech-btn-update--completed" @click="submitUpdate">Confirm</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'TechnicianJobOrders',
  data() {
    const today    = new Date();
    const addDays  = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().split('T')[0]; };
    const subDays  = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x.toISOString().split('T')[0]; };
    const todayStr = today.toISOString().split('T')[0];

    const currentTech = { name: 'Ryan Patel', initials: 'RP' };

    const allJobCards = [
      { id: 'JC-001', licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',   status: 'diagnose', jobDate: todayStr,          serviceType: 'Engine Check',         diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 120, notes: 'Customer reports unusual engine noise at idle.' },
      { id: 'JC-004', licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell', status: 'service',  jobDate: todayStr,          serviceType: 'Full Service',         diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Ryan Patel', estimatedCost: 500, notes: null },
      { id: 'JC-008', licensePlate: 'STU-5566', vehicleMake: 'Hyundai', vehicleModel: 'Tucson',   vehicleYear: '2021', customerName: 'Nina Patel',     status: 'service',  jobDate: addDays(today, 1), serviceType: 'Oil Change & Filter',  diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 90,  notes: null },
      { id: 'JC-009', licensePlate: 'VWX-7788', vehicleMake: 'Kia',     vehicleModel: 'Sportage', vehicleYear: '2023', customerName: 'Leo Fernandez',  status: 'diagnose', jobDate: subDays(today, 1), serviceType: 'Electrical Fault',     diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 150, notes: 'Multiple warning lights on dash.' },
      { id: 'JC-011', licensePlate: 'BCD-2233', vehicleMake: 'Nissan',  vehicleModel: 'Altima',   vehicleYear: '2021', customerName: 'Grace Huang',    status: 'service',  jobDate: addDays(today, 2), serviceType: 'Transmission Service', diagnoseTechnician: 'Maria Santos', serviceTechnician: 'Ryan Patel', estimatedCost: 430, notes: null },
      { id: 'JC-012', licensePlate: 'EFG-4455', vehicleMake: 'Jeep',    vehicleModel: 'Wrangler', vehicleYear: '2020', customerName: 'Carlos Rivera',  status: 'diagnose', jobDate: addDays(today, 3), serviceType: 'Steering Check',       diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         estimatedCost: 200, notes: 'Slight pull to the left reported by customer.' },
    ];

    const myJobs = allJobCards
      .filter(j => j.diagnoseTechnician === currentTech.name || j.serviceTechnician === currentTech.name)
      .filter(j => j.status === 'diagnose' || j.status === 'service')
      .map(j => ({ ...j, myRole: j.diagnoseTechnician === currentTech.name ? 'diagnose' : 'service', parts: [], addedServices: [] }));

    return {
      currentTech,
      activeDateFilter:   'all',
      activeStatusFilter: '',
      activeItemFilter:   'all',
      currentPage:        1,
      itemsPerPage:       5,
      specificDate:       '',
      dateFilters: [
        { label: 'Today',      value: 'today' },
        { label: 'This Week',  value: 'week'  },
        { label: 'This Month', value: 'month' },
        { label: 'All',        value: 'all'   },
      ],
      jobStatuses: [
        { value: 'diagnose', label: 'Diagnose' },
        { value: 'service',  label: 'Service'  },
      ],

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

      itemModal: {
        isOpen:       false,
        job:          null,
        type:         null,
        search:       '',
        dropdownOpen: false,
        selected:     [],
      },

      modal:       { isOpen: false, job: null },
      updateModal: { isOpen: false, job: null },
      jobCards:    myJobs,
    };
  },

  computed: {
    todayStr()        { return new Date().toISOString().split('T')[0]; },
    startOfWeekStr()  { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - t.getDay()); return s.toISOString().split('T')[0]; },
    endOfWeekStr()    { const t = new Date(); const e = new Date(t); e.setDate(t.getDate() + (6 - t.getDay())); return e.toISOString().split('T')[0]; },
    startOfMonthStr() { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split('T')[0]; },
    endOfMonthStr()   { const t = new Date(); return new Date(t.getFullYear(), t.getMonth() + 1, 0).toISOString().split('T')[0]; },
    diagnosedCount()  { return this.jobCards.filter(j => j.myRole === 'diagnose').length; },
    serviceCount()    { return this.jobCards.filter(j => j.myRole === 'service').length; },
    totalAssigned()   { return this.jobCards.length; },

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
      if (this.activeStatusFilter) list = list.filter(j => j.status === this.activeStatusFilter);
      if (this.activeItemFilter === 'no-parts')    list = list.filter(j => !j.parts || j.parts.length === 0);
      if (this.activeItemFilter === 'no-services') list = list.filter(j => !j.addedServices || j.addedServices.length === 0);
      return [...list].sort((a, b) => a.jobDate.localeCompare(b.jobDate));
    },

    totalPages()    { return Math.max(1, Math.ceil(this.filteredJobs.length / this.itemsPerPage)); },
    paginatedJobs() { const s = (this.currentPage - 1) * this.itemsPerPage; return this.filteredJobs.slice(s, s + this.itemsPerPage); },

    filteredItemList() {
      const source = this.itemModal.type === 'parts' ? this.predefinedParts : this.predefinedServices;
      const q      = this.itemModal.search.toLowerCase().trim();
      return q ? source.filter(i => i.toLowerCase().includes(q)) : source;
    },
  },

  methods: {
    isToday(date)        { return date === this.todayStr; },
    setDateFilter(val)   { this.activeDateFilter = val; this.specificDate = ''; this.currentPage = 1; },
    setStatusFilter(val) { this.activeStatusFilter = val; this.currentPage = 1; },
    setItemFilter(val)   { this.activeItemFilter = val; this.currentPage = 1; },
    onDateChange()       { this.currentPage = 1; },
    clearDate()          { this.specificDate = ''; this.currentPage = 1; },
    goToPage(page)       { if (page >= 1 && page <= this.totalPages) this.currentPage = page; },
    prevPage()           { if (this.currentPage > 1) this.currentPage--; },
    nextPage()           { if (this.currentPage < this.totalPages) this.currentPage++; },
    getStatusLabel(status) { const f = this.jobStatuses.find(s => s.value === status); return f ? f.label : status; },
    formatDate(date)     { if (!date) return 'N/A'; return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); },
    getDayName(date)     { if (!date) return ''; return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }); },

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
    saveItemModal() {
      const job  = this.itemModal.job;
      const type = this.itemModal.type;
      if (type === 'parts')    job.parts         = [...this.itemModal.selected];
      if (type === 'services') job.addedServices = [...this.itemModal.selected];
      this.closeItemModal();
    },
    isItemSelected(item)     { return this.itemModal.selected.includes(item); },
    toggleItem(item)         { const i = this.itemModal.selected.indexOf(item); if (i === -1) this.itemModal.selected.push(item); else this.itemModal.selected.splice(i, 1); },
    removeItemFromModal(idx) { this.itemModal.selected.splice(idx, 1); },
    delayCloseDropdown()     { setTimeout(() => { this.itemModal.dropdownOpen = false; }, 150); },

    openModal(job)       { this.modal.job = job; this.modal.isOpen = true; },
    closeModal()         { this.modal.isOpen = false; this.modal.job = null; },
    openUpdateModal(job) { this.updateModal.job = job; this.updateModal.isOpen = true; },
    closeUpdateModal()   { this.updateModal.isOpen = false; this.updateModal.job = null; },
    submitUpdate() {
      this.updateModal.job.status = 'completed';
      this.closeUpdateModal();
    },
  },
};
</script>

<style scoped src="@/assets/technicianJobs.css"></style>