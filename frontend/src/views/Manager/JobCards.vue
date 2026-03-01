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

      <!-- Row 3: Name search -->
      <div class="jc-filter-row">
        <div class="jc-filter-row-label">Search</div>
        <div class="jc-filter-row-controls">
          <div class="jc-search-wrapper">
            <span class="jc-search-icon">🔍</span>
            <input
              type="text"
              class="jc-search-input"
              placeholder="Search by customer name..."
              v-model="nameSearch"
              @input="currentPage = 1"
            />
            <button v-if="nameSearch" class="jc-clear-date" @click="nameSearch = ''; currentPage = 1">✕</button>
          </div>
        </div>
      </div>

      <!-- Row 4: Technician filter — only shown when a status that supports assignment is selected -->
      <div v-if="activeStatusFilter === 'service'" class="jc-filter-row">
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
              <span class="jc-meta-tag jc-meta-tag--technician">👤 {{ job.diagnoseTechnician }}</span>
            </template>
            <template v-if="job.status === 'waiting-for-parts' && job.partsArrivalDate">
              <span class="jc-meta-tag jc-meta-tag--eta">📦 ETA: {{ formatDate(job.partsArrivalDate) }}</span>
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

          <!-- Parts & Services summary for quotation and onwards -->
          <template v-if="['quotation','waiting-for-parts','service','ready','check-out'].includes(job.status)">
            <div class="jc-card-items-row">
              <div class="jc-card-items-group">
                <span class="jc-items-label">Parts</span>
                <div class="jc-items-pills">
                  <span v-for="(part, i) in job.parts" :key="'p'+i" class="jc-card-item-pill jc-card-item-pill--part">{{ part }}</span>
                  <span v-if="!job.parts || job.parts.length === 0" class="jc-card-item-pill jc-card-item-pill--empty">None</span>
                </div>
              </div>
              <div class="jc-card-items-group">
                <span class="jc-items-label">Services</span>
                <div class="jc-items-pills">
                  <span v-for="(svc, i) in job.services" :key="'s'+i" class="jc-card-item-pill jc-card-item-pill--service">{{ svc }}</span>
                  <span v-if="!job.services || job.services.length === 0" class="jc-card-item-pill jc-card-item-pill--empty">None</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="jc-card-actions">
          <button class="jc-btn-view" @click="openModal(job)">View</button>

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

          <!-- Proceed Buttons -->

          <!-- DIAGNOSE: Proceed to Quotation (requires parts + services) -->
          <template v-if="job.status === 'diagnose'">
            <div
              class="jc-proceed-wrapper"
              :title="getDiagnoseBlockReason(job) || ''"
            >
              <button
                class="jc-btn-proceed"
                :class="{ 'jc-btn-proceed--blocked': !canProceedFromDiagnose(job) }"
                :disabled="!canProceedFromDiagnose(job)"
                @click="openConfirmModal(job, 'quotation')"
              >
                Proceed to Quotation →
              </button>
            </div>
          </template>

          <!-- QUOTATION: Two buttons — to Waiting For Parts OR directly to Ready -->
          <template v-if="job.status === 'quotation'">
            <button
              class="jc-btn-proceed jc-btn-proceed--secondary"
              @click="openPartsArrivalModal(job)"
            >
              Waiting for Parts →
            </button>
            <button
              class="jc-btn-proceed"
              @click="openConfirmModal(job, 'ready')"
            >
              Proceed to Ready →
            </button>
          </template>

          <!-- WAITING-FOR-PARTS: Proceed to Service -->
          <template v-if="job.status === 'waiting-for-parts'">
            <button
              class="jc-btn-proceed"
              @click="openConfirmModal(job, 'service')"
            >
              Proceed to Service →
            </button>
          </template>

          <!-- SERVICE: No proceed button (service → ready is manual) -->

          <!-- READY: Proceed to Check Out -->
          <template v-if="job.status === 'ready'">
            <button
              class="jc-btn-proceed jc-btn-proceed--checkout"
              @click="openConfirmModal(job, 'check-out')"
            >
              Check Out →
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
          <div v-if="modal.job.notes" class="jc-detail-group">
            <label>Notes</label>
            <p>{{ modal.job.notes }}</p>
          </div>

          <!-- Parts & Services — shown for quotation and all statuses onwards -->
          <template v-if="['quotation','waiting-for-parts','service','ready','check-out'].includes(modal.job.status)">
            <div class="jc-modal-divider"></div>
            <div class="jc-detail-group">
              <label>Parts ({{ modal.job.parts ? modal.job.parts.length : 0 }})</label>
              <div v-if="modal.job.parts && modal.job.parts.length > 0" class="jc-item-list">
                <span v-for="(part, i) in modal.job.parts" :key="i" class="jc-item-pill jc-item-pill--part">{{ part }}</span>
              </div>
              <p v-else class="jc-empty-items">No parts added</p>
            </div>
            <div class="jc-detail-group">
              <label>Services ({{ modal.job.services ? modal.job.services.length : 0 }})</label>
              <div v-if="modal.job.services && modal.job.services.length > 0" class="jc-item-list">
                <span v-for="(svc, i) in modal.job.services" :key="i" class="jc-item-pill jc-item-pill--service">{{ svc }}</span>
              </div>
              <p v-else class="jc-empty-items">No services added</p>
            </div>
          </template>
        </div>
        <div class="jc-modal-actions">
          <!-- Modal proceed buttons mirroring card actions -->
          <template v-if="modal.job.status === 'diagnose'">
            <div :title="getDiagnoseBlockReason(modal.job) || ''">
              <button
                class="jc-btn-proceed jc-btn-proceed--modal"
                :class="{ 'jc-btn-proceed--blocked': !canProceedFromDiagnose(modal.job) }"
                :disabled="!canProceedFromDiagnose(modal.job)"
                @click="openConfirmModal(modal.job, 'quotation'); closeModal()"
              >
                Proceed to Quotation →
              </button>
            </div>
          </template>
          <template v-if="modal.job.status === 'quotation'">
            <button
              class="jc-btn-proceed jc-btn-proceed--modal jc-btn-proceed--secondary"
              @click="openPartsArrivalModal(modal.job); closeModal()"
            >
              Waiting for Parts →
            </button>
            <button
              class="jc-btn-proceed jc-btn-proceed--modal"
              @click="openConfirmModal(modal.job, 'ready'); closeModal()"
            >
              Proceed to Ready →
            </button>
          </template>
          <template v-if="modal.job.status === 'waiting-for-parts'">
            <button
              class="jc-btn-proceed jc-btn-proceed--modal"
              @click="openConfirmModal(modal.job, 'service'); closeModal()"
            >
              Proceed to Service →
            </button>
          </template>
          <template v-if="modal.job.status === 'ready'">
            <button
              class="jc-btn-proceed jc-btn-proceed--modal jc-btn-proceed--checkout"
              @click="openConfirmModal(modal.job, 'check-out'); closeModal()"
            >
              Check Out →
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
            <select class="jc-tech-select" v-model="techModal.selected">
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

    <!-- Confirmation Modal -->
    <div v-if="confirmModal.isOpen" class="jc-modal-overlay" @click="closeConfirmModal">
      <div class="jc-modal jc-confirm-modal" @click.stop>
        <button class="jc-modal-close" @click="closeConfirmModal">&times;</button>
        <div class="jc-confirm-icon">⚡</div>
        <h2>Confirm Status Change</h2>
        <p class="jc-confirm-subtitle">
          You are about to move <strong>{{ confirmModal.job && confirmModal.job.customerName }}</strong>'s job card
        </p>
        <div class="jc-confirm-flow">
          <span class="jc-status-badge" :class="'jc-status-badge--' + (confirmModal.job && confirmModal.job.status)">
            {{ confirmModal.job ? getStatusLabel(confirmModal.job.status) : '' }}
          </span>
          <span class="jc-confirm-arrow">→</span>
          <span class="jc-status-badge" :class="'jc-status-badge--' + confirmModal.targetStatus">
            {{ getStatusLabel(confirmModal.targetStatus) }}
          </span>
        </div>
        <p class="jc-confirm-warning">This action cannot be undone. Are you sure?</p>
        <div class="jc-modal-actions" style="justify-content:center; gap:1rem;">
          <button class="jc-btn-secondary jc-btn-secondary--wide" @click="closeConfirmModal">Cancel</button>
          <button class="jc-btn-confirm-proceed" @click="confirmProceed">Yes, Proceed</button>
        </div>
      </div>
    </div>

    <!-- Parts Arrival Date Modal -->
    <div v-if="partsArrivalModal.isOpen" class="jc-modal-overlay" @click="closePartsArrivalModal">
      <div class="jc-modal jc-confirm-modal" @click.stop>
        <button class="jc-modal-close" @click="closePartsArrivalModal">&times;</button>
        <div class="jc-confirm-icon">📦</div>
        <h2>Expected Parts Arrival</h2>
        <p class="jc-confirm-subtitle">
          Enter the expected date parts will arrive for
          <strong>{{ partsArrivalModal.job && partsArrivalModal.job.customerName }}</strong>
        </p>

        <div class="jc-modal-body">
          <div class="jc-detail-group">
            <label>Expected Arrival Date</label>
            <input
              type="date"
              class="jc-date-input jc-arrival-date-input"
              :class="{ active: partsArrivalModal.date }"
              v-model="partsArrivalModal.date"
            />
            <p v-if="partsArrivalModal.showError" class="jc-tech-error">Please select an expected arrival date to continue.</p>
          </div>
        </div>

        <div class="jc-modal-actions" style="justify-content:center; gap:1rem;">
          <button class="jc-btn-secondary jc-btn-secondary--wide" @click="closePartsArrivalModal">Cancel</button>
          <button class="jc-btn-confirm-proceed" @click="confirmPartsArrival">Confirm →</button>
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
      activeTechFilter: 'all',
      nameSearch: '',
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
        { value: 'ready',             label: 'Ready'             },
        { value: 'check-out',         label: 'Check Out'         },
      ],
      modal: { isOpen: false, job: null },
      techModal: { isOpen: false, job: null, selected: '', mode: '', techType: '', showError: false },
      confirmModal: { isOpen: false, job: null, targetStatus: '' },
      partsArrivalModal: { isOpen: false, job: null, date: '', showError: false },

      // Dummy technician data (replaces API)
      technicians: [
        { ID: 1, Name: 'Alex Johnson'  },
        { ID: 2, Name: 'Chris Lee'     },
        { ID: 3, Name: 'Ryan Patel'    },
        { ID: 4, Name: 'Maria Santos'  },
        { ID: 5, Name: 'Jordan Kim'    },
        { ID: 6, Name: 'Taylor Brooks' },
        { ID: 7, Name: 'Sam Rivera'    },
      ],

      jobCards: [
        { id: 'JC-001', licensePlate: 'ABC-1234', vehicleMake: 'Toyota',  vehicleModel: 'Camry',    vehicleYear: '2022', customerName: 'James Carter',   status: 'diagnose',          jobDate: todayStr,          serviceType: 'Engine Check',            diagnoseTechnician: 'Alex Johnson',  serviceTechnician: null,         notes: 'Customer reports unusual engine noise at idle.', parts: ['Spark Plugs', 'Engine Mount', 'Gasket Set'],              services: ['Engine Inspection', 'Idle Calibration'],                    partsArrivalDate: null },
        { id: 'JC-002', licensePlate: 'XYZ-5678', vehicleMake: 'Honda',   vehicleModel: 'Civic',    vehicleYear: '2023', customerName: 'Priya Nair',     status: 'quotation',         jobDate: todayStr,          serviceType: 'Brake Replacement',       diagnoseTechnician: null,           serviceTechnician: null,         notes: 'Awaiting customer approval on parts quote.',    parts: ['Brake Pads (Front)', 'Brake Pads (Rear)', 'Brake Fluid'],   services: ['Brake Pad Replacement', 'Brake Fluid Flush'],               partsArrivalDate: null },
        { id: 'JC-003', licensePlate: 'DEF-9012', vehicleMake: 'Ford',    vehicleModel: 'F-150',    vehicleYear: '2021', customerName: 'Marco Silva',    status: 'waiting-for-parts', jobDate: todayStr,          serviceType: 'Suspension Repair',       diagnoseTechnician: null,           serviceTechnician: null,         notes: 'Parts ordered — ETA 2 days.',                   parts: ['Shock Absorbers (x2)', 'Control Arm Bushings'],              services: ['Suspension Overhaul', 'Wheel Alignment'],                   partsArrivalDate: addDays(today, 2) },
        { id: 'JC-004', licensePlate: 'GHI-3456', vehicleMake: 'BMW',     vehicleModel: '3 Series', vehicleYear: '2024', customerName: 'Sarah Mitchell', status: 'service',           jobDate: todayStr,          serviceType: 'Full Service',            diagnoseTechnician: 'Alex Johnson', serviceTechnician: 'Chris Lee',  notes: null,                                            parts: ['Oil Filter', 'Air Filter', 'Cabin Filter', 'Spark Plugs'],   services: ['Full Service', 'Fluid Top-Up', 'Multi-Point Inspection'],   partsArrivalDate: null },
        { id: 'JC-005', licensePlate: 'JKL-7890', vehicleMake: 'Tesla',   vehicleModel: 'Model 3',  vehicleYear: '2023', customerName: 'David Okafor',   status: 'diagnose',          jobDate: addDays(today, 1), serviceType: 'Battery Diagnostic',      diagnoseTechnician: 'Jordan Kim',    serviceTechnician: null,         notes: 'Check charging system and battery health.',     parts: ['Battery Cell Module'],                                        services: [],                                                           partsArrivalDate: null },
        { id: 'JC-006', licensePlate: 'MNO-1122', vehicleMake: 'Audi',    vehicleModel: 'A4',       vehicleYear: '2022', customerName: 'Lena Hoffmann',  status: 'quotation',         jobDate: addDays(today, 2), serviceType: 'Gearbox Service',         diagnoseTechnician: null,           serviceTechnician: null,         notes: null,                                            parts: ['Gearbox Oil', 'Filter Kit', 'Gasket Set'],                   services: ['Gearbox Oil Change', 'Gearbox Inspection'],                 partsArrivalDate: null },
        { id: 'JC-007', licensePlate: 'PQR-3344', vehicleMake: 'Mazda',   vehicleModel: 'CX-5',     vehicleYear: '2020', customerName: 'Tom Nguyen',     status: 'waiting-for-parts', jobDate: addDays(today, 3), serviceType: 'AC Compressor Replace',   diagnoseTechnician: null,           serviceTechnician: null,         notes: 'Compressor unit on back-order.',                parts: ['AC Compressor', 'Refrigerant R134a', 'O-Ring Kit'],           services: ['AC Compressor Replacement', 'System Pressure Test'],        partsArrivalDate: addDays(today, 5) },
        { id: 'JC-008', licensePlate: 'STU-5566', vehicleMake: 'Hyundai', vehicleModel: 'Tucson',   vehicleYear: '2021', customerName: 'Nina Patel',     status: 'service',           jobDate: addDays(today, 4), serviceType: 'Oil Change & Filter',     diagnoseTechnician: 'Ryan Patel',   serviceTechnician: null,         notes: null,                                            parts: ['Oil Filter', 'Engine Oil 5W-30 (5L)'],                       services: ['Oil Change', 'Filter Replacement'],                         partsArrivalDate: null },
        { id: 'JC-009', licensePlate: 'VWX-7788', vehicleMake: 'Kia',     vehicleModel: 'Sportage', vehicleYear: '2023', customerName: 'Leo Fernandez',  status: 'ready',             jobDate: subDays(today, 1), serviceType: 'Electrical Fault',        diagnoseTechnician: 'Ryan Patel',   serviceTechnician: 'Taylor Brooks', notes: 'Multiple warning lights on dash.',              parts: ['Fuse Kit', 'Relay Switch', 'OBD Module'],                     services: ['Electrical Diagnosis', 'ECU Reset'],                        partsArrivalDate: null },
        { id: 'JC-010', licensePlate: 'YZA-9900', vehicleMake: 'Subaru',  vehicleModel: 'Forester', vehicleYear: '2022', customerName: 'Chloe Kim',      status: 'check-out',         jobDate: subDays(today, 2), serviceType: 'Timing Belt Replacement',  diagnoseTechnician: 'Maria Santos', serviceTechnician: 'Sam Rivera',    notes: null,                                            parts: ['Timing Belt', 'Tensioner Pulley', 'Water Pump', 'Idler Pulley'], services: ['Timing Belt Replacement', 'Coolant Flush'],              partsArrivalDate: null },
      ],
    };
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
          if (j.status === 'service') return !j.serviceTechnician;
          return false;
        });
      } else if (this.activeTechFilter === 'assigned') {
        list = list.filter(j => {
          if (j.status === 'service') return !!j.serviceTechnician;
          return false;
        });
      }
      if (this.nameSearch.trim()) {
        const q = this.nameSearch.trim().toLowerCase();
        list = list.filter(j => j.customerName.toLowerCase().includes(q));
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
    isToday(date) { return date === this.todayStr; },
    setDateFilter(val) { this.activeDateFilter = val; this.specificDate = ''; this.currentPage = 1; },
    setStatusFilter(val) {
      this.activeStatusFilter = val;
      if (val !== 'service') this.activeTechFilter = 'all';
      this.currentPage = 1;
    },
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
      this.techModal.job.serviceTechnician = this.techModal.selected;
      this.closeTechModal();
    },

    // ── Parts Arrival Modal ─────────────────────────────────────────────
    openPartsArrivalModal(job) {
      this.partsArrivalModal.job = job;
      this.partsArrivalModal.date = '';
      this.partsArrivalModal.showError = false;
      this.partsArrivalModal.isOpen = true;
    },
    closePartsArrivalModal() {
      this.partsArrivalModal.isOpen = false;
      this.partsArrivalModal.job = null;
      this.partsArrivalModal.date = '';
    },
    confirmPartsArrival() {
      if (!this.partsArrivalModal.date) {
        this.partsArrivalModal.showError = true;
        return;
      }
      this.partsArrivalModal.job.partsArrivalDate = this.partsArrivalModal.date;
      this.partsArrivalModal.job.status = 'waiting-for-parts';
      this.closePartsArrivalModal();
    },

    // ── Confirmation Modal ──────────────────────────────────────────────
    openConfirmModal(job, targetStatus) {
      this.confirmModal.job = job;
      this.confirmModal.targetStatus = targetStatus;
      this.confirmModal.isOpen = true;
    },
    closeConfirmModal() {
      this.confirmModal.isOpen = false;
      this.confirmModal.job = null;
      this.confirmModal.targetStatus = '';
    },
    confirmProceed() {
      if (this.confirmModal.job && this.confirmModal.targetStatus) {
        this.confirmModal.job.status = this.confirmModal.targetStatus;
      }
      this.closeConfirmModal();
    },

    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    getDayName(date) {
      if (!date) return '';
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    },

    // ── Diagnose gating ──────────────────────────────────────────────────
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
  },
};
</script>

<style scoped src="@/assets/jobCards.css"></style>