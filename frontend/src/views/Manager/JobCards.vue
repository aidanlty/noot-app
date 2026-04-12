<template>
  <div class="jc-container">

    <!-- Header -->
    <div class="jc-header">
      <h1>Job Cards</h1>
    </div>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="jc-empty-state">Loading job cards…</div>
    <div v-else-if="loadError" class="jc-empty-state jc-empty-state--error">
      ⚠️ {{ loadError }} <button class="jc-btn-secondary" @click="fetchJobCards">Retry</button>
    </div>

    <template v-else>

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

        <!-- Row 4: Technician filter — only shown when status = service -->
        <div v-if="activeStatusFilter === 'service'" class="jc-filter-row">
          <div class="jc-filter-row-label">Assigned</div>
          <div class="jc-filter-row-controls">
            <button class="jc-filter-btn" :class="{ active: activeTechFilter === 'all' }" @click="setTechFilter('all')">All</button>
            <button class="jc-filter-btn jc-tech-filter-btn--unassigned" :class="{ active: activeTechFilter === 'unassigned' }" @click="setTechFilter('unassigned')">Not Assigned</button>
            <button class="jc-filter-btn jc-tech-filter-btn--assigned"   :class="{ active: activeTechFilter === 'assigned' }"   @click="setTechFilter('assigned')">Assigned</button>
          </div>
        </div>

        <!-- Row 5: Count -->
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
            <p class="jc-card-vehicle">
              {{ job.vehicleYear }} {{ job.vehicleMake }} {{ job.vehicleModel }} · {{ job.licensePlate }}
            </p>

            <!-- Customer Notes -->
            <div v-if="job.notes" class="jc-card-notes-box">📝 {{ job.notes }}</div>

            <div class="jc-card-meta">
              <span class="jc-meta-tag jc-meta-tag--date">{{ formatDate(job.jobDate) }}</span>
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
              <span class="jc-readiness-pill" :class="job.parts && job.parts.length > 0 ? 'jc-readiness-pill--ok' : 'jc-readiness-pill--missing'">
                {{ job.parts && job.parts.length > 0 ? '✓' : '✕' }} Parts ({{ job.parts ? job.parts.length : 0 }})
              </span>
              <span class="jc-readiness-pill" :class="job.services && job.services.length > 0 ? 'jc-readiness-pill--ok' : 'jc-readiness-pill--missing'">
                {{ job.services && job.services.length > 0 ? '✓' : '✕' }} Services ({{ job.services ? job.services.length : 0 }})
              </span>
            </div>

            <!-- Parts & Services summary for quotation onwards -->
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
              <button v-if="!job.serviceTechnician" class="jc-btn-assign" @click="openTechModal(job, 'assign', 'service')">Assign</button>
              <button v-else                         class="jc-btn-change" @click="openTechModal(job, 'change', 'service')">Change</button>
            </template>

            <!-- DIAGNOSE → Quotation -->
            <template v-if="job.status === 'diagnose'">
              <div class="jc-proceed-wrapper" :title="getDiagnoseBlockReason(job) || ''">
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

            <!-- QUOTATION → Waiting For Parts OR Ready -->
            <template v-if="job.status === 'quotation'">
              <button class="jc-btn-proceed jc-btn-proceed--secondary" @click="openPartsArrivalModal(job)">Waiting for Parts →</button>
              <button class="jc-btn-proceed"                            @click="openConfirmModal(job, 'ready')">Proceed to Ready →</button>
            </template>

            <!-- WAITING-FOR-PARTS → Service -->
            <template v-if="job.status === 'waiting-for-parts'">
              <button class="jc-btn-proceed" @click="openConfirmModal(job, 'service')">Proceed to Service →</button>
            </template>

            <!-- READY → Check Out -->
            <template v-if="job.status === 'ready'">
              <button class="jc-btn-proceed jc-btn-proceed--checkout" @click="openConfirmModal(job, 'check-out')">Check Out →</button>
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

    </template>

    <!-- ── View Modal ──────────────────────────────────────────────────── -->
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
            <label>Job Order ID</label>
            <p>{{ modal.job.id }}</p>
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
            <label>Diagnose Technician</label>
            <p>{{ modal.job.diagnoseTechnician || 'Not Assigned' }}</p>
          </div>

          <div class="jc-detail-group">
            <label>Service Technician</label>
            <p>{{ modal.job.serviceTechnician || 'Not Assigned' }}</p>
          </div>

          <!-- Customer Notes -->
          <div class="jc-detail-group">
            <label>Customer Notes</label>
            <div class="jc-notes-box">{{ modal.job.notes || 'No notes provided' }}</div>
          </div>

          <!-- Parts & Services — quotation onwards -->
          <template v-if="['diagnose','quotation','waiting-for-parts','service','ready','check-out'].includes(modal.job.status)">
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
            <button class="jc-btn-proceed jc-btn-proceed--modal jc-btn-proceed--secondary" @click="openPartsArrivalModal(modal.job); closeModal()">Waiting for Parts →</button>
            <button class="jc-btn-proceed jc-btn-proceed--modal"                           @click="openConfirmModal(modal.job, 'ready'); closeModal()">Proceed to Ready →</button>
          </template>

          <template v-if="modal.job.status === 'waiting-for-parts'">
            <button class="jc-btn-proceed jc-btn-proceed--modal" @click="openConfirmModal(modal.job, 'service'); closeModal()">Proceed to Service →</button>
          </template>

          <template v-if="modal.job.status === 'ready'">
            <button class="jc-btn-proceed jc-btn-proceed--modal jc-btn-proceed--checkout" @click="openConfirmModal(modal.job, 'check-out'); closeModal()">Check Out →</button>
          </template>

          <button class="jc-btn-secondary" @click="closeModal">Close</button>
        </div>
      </div>
    </div>

    <!-- ── Technician Assign/Change Modal ──────────────────────────────── -->
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
            <p class="jc-current-tech">
              {{ techModal.techType === 'diagnose' ? techModal.job.diagnoseTechnician : techModal.job.serviceTechnician }}
            </p>
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
          <button class="jc-btn-confirm-tech" @click="submitTech">{{ techModal.mode === 'assign' ? 'Assign' : 'Change' }}</button>
        </div>
      </div>
    </div>

    <!-- ── Confirmation Modal ──────────────────────────────────────────── -->
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

    <!-- ── Parts Arrival Date Modal ────────────────────────────────────── -->
    <div v-if="partsArrivalModal.isOpen" class="jc-modal-overlay" @click="closePartsArrivalModal">
      <div class="jc-modal jc-confirm-modal" @click.stop>
        <button class="jc-modal-close" @click="closePartsArrivalModal">&times;</button>

        <!-- Step 1: Date selection -->
        <template v-if="!partsArrivalModal.confirmed">
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
                :min="todayStr"
              />
              <p v-if="partsArrivalModal.showError" class="jc-tech-error">Please select an expected arrival date to continue.</p>
            </div>

            <!-- Confirmation display -->
            <div v-if="partsArrivalModal.date" class="jc-arrival-confirm-box">
              <span class="jc-arrival-confirm-label">📦 Parts expected on</span>
              <span class="jc-arrival-confirm-date">{{ formatDate(partsArrivalModal.date) }}</span>
            </div>
          </div>
          <div class="jc-modal-actions" style="justify-content:center; gap:1rem;">
            <button class="jc-btn-secondary jc-btn-secondary--wide" @click="closePartsArrivalModal">Cancel</button>
            <button class="jc-btn-confirm-proceed" @click="requestPartsArrivalConfirm">Confirm →</button>
          </div>
        </template>

        <!-- Step 2: Final confirmation -->
        <template v-else>
          <div class="jc-confirm-icon">⚠️</div>
          <h2>Are you sure?</h2>
          <p class="jc-confirm-subtitle">
            You are setting the expected parts arrival date for
            <strong>{{ partsArrivalModal.job && partsArrivalModal.job.customerName }}</strong> to:
          </p>
          <div class="jc-arrival-confirm-box" style="justify-content:center; margin: 1rem 0;">
            <span class="jc-arrival-confirm-label">📦 Parts expected on</span>
            <span class="jc-arrival-confirm-date">{{ formatDate(partsArrivalModal.date) }}</span>
          </div>
          <p class="jc-confirm-warning">This will move the job to <strong>Waiting For Parts</strong>. Continue?</p>
          <div class="jc-modal-actions" style="justify-content:center; gap:1rem;">
            <button class="jc-btn-secondary jc-btn-secondary--wide" @click="partsArrivalModal.confirmed = false">← Go Back</button>
            <button class="jc-btn-confirm-proceed" @click="confirmPartsArrival">Yes, Confirm</button>
          </div>
        </template>

      </div>
    </div>  
    </div>
</template>

<script>
import { sgEndOfMonthStr, sgEndOfWeekStr, sgLocaleDate, sgStartOfMonthStr, sgStartOfWeekStr, sgTodayStr } from '@/utils/sgTime.js'

export default {
  name: 'JobCards',

  data() {
    return {
      // ── UI state ──────────────────────────────────────────────────────
      activeDateFilter:  'all',
      activeStatusFilter: '',
      activeTechFilter:  'all',
      nameSearch:        '',
      currentPage:       1,
      itemsPerPage:      5,
      specificDate:      '',
      isLoading:         false,
      loadError:         null,

      // ── Static config ─────────────────────────────────────────────────
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

      // ── Modal state ───────────────────────────────────────────────────
      modal:             { isOpen: false, job: null },
      techModal:         { isOpen: false, job: null, selected: '', mode: '', techType: '', showError: false },
      confirmModal:      { isOpen: false, job: null, targetStatus: '' },
      partsArrivalModal: { isOpen: false, job: null, date: '', showError: false, confirmed: false },


      // ── Data ──────────────────────────────────────────────────────────
      technicians: [],
      jobCards:    [],
    };
  },

  computed: {
    todayStr() {
      return sgTodayStr();
    },
    startOfWeekStr() {
      return sgStartOfWeekStr();
    },
    endOfWeekStr() {
      return sgEndOfWeekStr();
    },
    startOfMonthStr() {
      return sgStartOfMonthStr();
    },
    endOfMonthStr() {
      return sgEndOfMonthStr();
    },

    filteredJobCards() {
      let list = this.jobCards;

      // Date filter
      if (this.specificDate) {
        list = list.filter(j => j.jobDate === this.specificDate);
      } else if (this.activeDateFilter === 'today') {
        list = list.filter(j => j.jobDate === this.todayStr);
      } else if (this.activeDateFilter === 'week') {
        list = list.filter(j => j.jobDate >= this.startOfWeekStr && j.jobDate <= this.endOfWeekStr);
      } else if (this.activeDateFilter === 'month') {
        list = list.filter(j => j.jobDate >= this.startOfMonthStr && j.jobDate <= this.endOfMonthStr);
      }

      // Status filter
      if (this.activeStatusFilter) {
        list = list.filter(j => j.status === this.activeStatusFilter);
      }

      // Tech assignment filter (only relevant for service status)
      if (this.activeTechFilter === 'unassigned') {
        list = list.filter(j => j.status === 'service' && !j.serviceTechnician);
      } else if (this.activeTechFilter === 'assigned') {
        list = list.filter(j => j.status === 'service' && !!j.serviceTechnician);
      }

      // Name search
      if (this.nameSearch.trim()) {
        const q = this.nameSearch.trim().toLowerCase();
        list = list.filter(j => j.customerName.toLowerCase().includes(q));
      }

      return [...list].sort((a, b) => (a.jobDate ?? '').localeCompare(b.jobDate ?? ''));
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredJobCards.length / this.itemsPerPage));
    },

    paginatedJobCards() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredJobCards.slice(start, start + this.itemsPerPage);
    },
  },

  async mounted() {
    await Promise.all([this.fetchJobCards(), this.fetchTechnicians()]);
  },

  methods: {

    // ── Status mapping ────────────────────────────────────────────────────
    mapStatus(dbStatus) {
      if (!dbStatus) return 'diagnose';
      const map = {
        'diagnose':          'diagnose',
        'quotation':         'quotation',
        'waiting_for_parts': 'waiting-for-parts',
        'waiting for parts': 'waiting-for-parts',
        'waiting-for-parts': 'waiting-for-parts',
        'service':           'service',
        'ready':             'ready',
        'check_out':         'check-out',
        'check out':         'check-out',
        'check-out':         'check-out',
      };
      return map[dbStatus.toLowerCase()] ?? dbStatus.toLowerCase();
    },

    mapStatusToDb(frontendStatus) {
      const map = {
        'diagnose':          'diagnose',
        'quotation':         'quotation',
        'waiting-for-parts': 'waiting_for_parts',
        'service':           'service',
        'ready':             'ready',
        'check-out':         'check_out',
      };
      return map[frontendStatus] ?? frontendStatus;
    },

    // ── Row transform ─────────────────────────────────────────────────────
    // Maps a raw Job_Orders API row to the shape the template expects.
    // vehicleModel uses vehicle_make (second occurrence) per your instruction.
    transformJobCard(row) {
      const appt        = row.appointment                          ?? {};
      const customer    = appt.CustomerProfile                     ?? {};
      const diagnoseTech = appt.DiagnoseTechnicianProfile          ?? {};
      const serviceTech  = row.ServiceTechnicianProfile            ?? {};

      const parts    = row.Parts    ? row.Parts.split(',').map(s => s.trim()).filter(Boolean)    : [];
      const services = row.Services ? row.Services.split(',').map(s => s.trim()).filter(Boolean) : [];
      return {
        // Identifiers
        id:                row.Order_ID,
        appointmentId:     row.appointment_id,
        customerId:        row.Customer_id,

        // Customer
        customerName:      customer.Name  ?? 'Unknown',
        customerEmail:     customer.Email ?? '',

        // Vehicle — all from Appointments
        // Per your instruction: vehicleModel = vehicle_make (the second make field)
        licensePlate:      appt.vehicle_license_plate ?? '',
        vehicleMake:       appt.vehicle_make          ?? '',
        vehicleModel:      appt.vehicle_make          ?? '',   // same field, labelled as model
        vehicleYear:       appt.vehicle_year          ?? '',

        // Status
        status:            this.mapStatus(row.Order_Status),

        // Primary job date: link to current status
        jobDate: this.resolveJobDate(row),

        // Parts ETA
        partsArrivalDate:  row.expected_parts_arrival_date ?? null,

        // Technicians
        diagnoseTechnician: diagnoseTech.Name ?? null,
        serviceTechnician:  serviceTech.Name  ?? null,

        // Parts & Services (jsonb arrays of strings)
        parts,
        services,

        // Customer notes from appointment
        notes:             appt.customer_notes ?? null,
      };
    },

    // ── Data fetching ─────────────────────────────────────────────────────
    async fetchJobCards() {
      this.isLoading = true;
      this.loadError = null;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/manager/jobCards', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const json = await res.json();
        
        this.jobCards = (json.data ?? [])
        // to not show the gb data
        .filter(row => {
          const num = parseInt((row.Order_ID ?? '').replace(/\D/g, ''), 10);
          return !isNaN(num) && num >= 285; 
        })
        .map(row => this.transformJobCard(row));
      } catch (err) {
        console.error('Failed to load job cards:', err);
        this.loadError = err.message;
      } finally {
        
        this.isLoading = false;
      }
    },

    async fetchTechnicians() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/technicians/getTechnicians', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.error('Technicians fetch failed:', res.status);
          return;
        }
        const json = await res.json();

        // Defensively handle: array, { data: [] }, { technicians: [] }, { users: [] }
        let raw = [];
        if (Array.isArray(json))              raw = json;
        else if (Array.isArray(json.data))        raw = json.data;
        else if (Array.isArray(json.technicians)) raw = json.technicians;
        else if (Array.isArray(json.users))       raw = json.users;
        else {
          console.warn('Unexpected technicians response shape:', json);
          return;
        }

        this.technicians = raw.map(t => ({ ID: t.ID, Name: t.Name }));
      } catch (err) {
        console.error('Failed to load technicians:', err);
      }
    },
    // ── Filter helpers ────────────────────────────────────────────────────
    isToday(date)        { return date === this.todayStr; },
    setDateFilter(val)   { this.activeDateFilter = val; this.specificDate = ''; this.currentPage = 1; },
    setStatusFilter(val) {
      this.activeStatusFilter = val;
      if (val !== 'service') this.activeTechFilter = 'all';
      this.currentPage = 1;
    },
    setTechFilter(val)   { this.activeTechFilter = val; this.currentPage = 1; },
    onDateChange()       { this.currentPage = 1; },
    clearDate()          { this.specificDate = ''; this.currentPage = 1; },
    goToPage(page)       { if (page >= 1 && page <= this.totalPages) this.currentPage = page; },
    prevPage()           { if (this.currentPage > 1) this.currentPage--; },
    nextPage()           { if (this.currentPage < this.totalPages) this.currentPage++; },
    getStatusLabel(s)    { return this.jobStatuses.find(x => x.value === s)?.label ?? s; },

    // ── View modal ────────────────────────────────────────────────────────
    openModal(job)  { this.modal.job = job; this.modal.isOpen = true; },
    closeModal()    { this.modal.isOpen = false; this.modal.job = null; },

    // ── Technician modal ──────────────────────────────────────────────────
    openTechModal(job, mode, techType) {
      this.techModal = { isOpen: true, job, mode, techType, selected: '', showError: false };
    },
    closeTechModal() { this.techModal.isOpen = false; this.techModal.job = null; },

    async submitTech() {
      if (!this.techModal.selected) { this.techModal.showError = true; return; }

      const { job, selected } = this.techModal;
      const tech   = this.technicians.find(t => t.Name === selected);
      const techId = tech?.ID ?? null;
      const token  = localStorage.getItem('token');

      try {
        const res = await fetch(`http://localhost:3000/api/jobOrders/${job.id}/serviceTechnician`, {
          method:  'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ technician_id: techId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? err.message ?? `HTTP ${res.status}`);
        }

        // Optimistic update
        job.serviceTechnician = selected;
      } catch (err) {
        console.error('Failed to assign technician:', err);
        alert(`❌ Could not assign technician: ${err.message}`);
      }
      this.closeTechModal();
    },

    // ── Parts arrival modal ───────────────────────────────────────────────
    openPartsArrivalModal(job) {
      this.partsArrivalModal = { isOpen: true, job, date: '', showError: false, confirmed: false };
    },
    closePartsArrivalModal() {
      this.partsArrivalModal.isOpen    = false;
      this.partsArrivalModal.job       = null;
      this.partsArrivalModal.date      = '';
      this.partsArrivalModal.confirmed = false;
    },

    requestPartsArrivalConfirm() {
      if (!this.partsArrivalModal.date) { this.partsArrivalModal.showError = true; return; }
      this.partsArrivalModal.showError = false;
      this.partsArrivalModal.confirmed = true;
    },

    async confirmPartsArrival() {
      if (!this.partsArrivalModal.date) { this.partsArrivalModal.showError = true; return; }

      const { job, date } = this.partsArrivalModal;
      const token = localStorage.getItem('token');

      try {
        // 1. Update status to waiting_for_parts
        const statusRes = await fetch(`http://localhost:3000/api/jobOrders/${job.id}/status`, {
          method:  'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'waiting_for_parts' }),
        });
        if (!statusRes.ok) throw new Error(`Status update failed: HTTP ${statusRes.status}`);
        const statusJson = await statusRes.json();

        job.partsArrivalDate = date;
        job.status           = 'waiting-for-parts';
        job.jobDate          = statusJson.data?.Waiting_For_Parts ?? job.jobDate;

        // 2. Update expected_parts_arrival_date
        const dateRes = await fetch(`http://localhost:3000/api/jobOrders/${job.id}/partsArrival`, {
          method:  'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ expected_parts_arrival_date: date }),
        });
        if (!dateRes.ok) throw new Error(`Parts arrival update failed: HTTP ${dateRes.status}`);
      } catch (err) {
        console.error('Failed to update parts arrival:', err);
        alert(`❌ ${err.message}`);
      }
      this.closePartsArrivalModal();
    },

    // ── Confirmation modal ────────────────────────────────────────────────
    openConfirmModal(job, targetStatus) {
      this.confirmModal = { isOpen: true, job, targetStatus };
    },
    closeConfirmModal() {
      this.confirmModal.isOpen       = false;
      this.confirmModal.job          = null;
      this.confirmModal.targetStatus = '';
    },

    async confirmProceed() {
      if (!this.confirmModal.job || !this.confirmModal.targetStatus) return;

      try {
        const newStatus = this.confirmModal.targetStatus;
        console.log(`Calling: /api/job-orders/${this.confirmModal.job.id}/status`);

        const response = await fetch(`http://localhost:3000/api/job-orders/${this.confirmModal.job.id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerEmail: this.confirmModal.job.customerEmail,
            customerName: this.confirmModal.job.customerName,
            status: newStatus,
            orderId: this.confirmModal.job.id,
            licensePlate: this.confirmModal.job.licensePlate
          })  // ← Fixed: proper object closing
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Status update failed');
        }

        console.log('✅ Status updated:', data);
        
        // Close modal and refresh data
        this.closeConfirmModal();
        await this.refreshJobData();  // Assuming you have this method
        
      } catch (error) {
        console.error('❌ Status update failed:', error);
        alert(`Failed to update status: ${error.message}`);
      }
    },    
  // ── Formatting ────────────────────────────────────────────────────────
    formatDate(date) {
      if (!date) return 'N/A';
      return sgLocaleDate(`${date}T00:00:00+08:00`, 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    },
    getDayName(date) {
      if (!date) return '';
      return sgLocaleDate(`${date}T00:00:00+08:00`, 'en-US', { weekday: 'short' });
    },

    // ── Diagnose gating ───────────────────────────────────────────────────
    canProceedFromDiagnose(job) {
      return job.parts?.length > 0 && job.services?.length > 0;
    },
    getDiagnoseBlockReason(job) {
      const hasParts    = job.parts?.length    > 0;
      const hasServices = job.services?.length > 0;
      if (!hasParts && !hasServices) return 'Add at least one part and one service before proceeding';
      if (!hasParts)                 return 'Add at least one part before proceeding';
      if (!hasServices)              return 'Add at least one service before proceeding';
      return '';
    },

    // Match status to job date
      resolveJobDate(row) {
        const statusDateMap = {
          'diagnose':          row.Diagnose,
          'quotation':         row.Quotation,
          'waiting_for_parts': row.Waiting_For_Parts,
          'waiting for parts': row.Waiting_For_Parts,
          'service':           row.Service,
          'ready':             row.Ready,
          'check_out':         row.Check_Out,
          'check out':         row.Check_Out,
        };
        const status = (row.Order_Status ?? '').toLowerCase();
        return statusDateMap[status] ?? row.Diagnose ?? null;
    },
  },
};
</script>

<style scoped src="@/assets/jobCards.css"></style>