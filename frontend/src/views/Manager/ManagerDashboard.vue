<template>
  <div class="md-container manager-dashboard-page">

    <div class="md-header">
      <div>
        <h1>Manager Dashboard</h1>
        <p class="md-subtitle">Live overview of workshop operations and job performance.</p>
      </div>
      <button class="md-refresh-btn" @click="refreshAll" :disabled="anyLoading">
        <span :class="{ spinning: anyLoading }">↻</span>
        {{ anyLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- ══════════════════ KPI CARDS ══════════════════ -->
    <section class="kpi-section">
      <div class="kpi-grid">

        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-body">
            <div class="kpi-label">Total Job Orders</div>
            <div class="kpi-value">{{ kpi.totalOrders }}</div>
            <div class="kpi-sub">All time</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-body">
            <div class="kpi-label">Completed This Month</div>
            <div class="kpi-value">{{ kpi.completedThisMonth }}</div>
            <div class="kpi-sub">{{ currentMonthLabel }}</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📅</div>
          <div class="kpi-body">
            <div class="kpi-label">Appointments Today</div>
            <div class="kpi-value">{{ kpi.appointmentsToday }}</div>
            <div class="kpi-sub">Active bookings</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">✕</div>
          <div class="kpi-body">
            <div class="kpi-label">Cancellation Rate</div>
            <div class="kpi-value">{{ kpi.cancellationRate }}%</div>
            <div class="kpi-sub">Of all appointments</div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══════════════════ ROW 1: Donut + Funnel ══════════════════ -->
    <section class="dashboard-section">
      <div class="dashboard-grid dashboard-grid--2col">

        <!-- Job Order Status Donut -->
        <div class="dashboard-card donut-card">
          <div class="dashboard-card-title">Job Order Status</div>
          <div v-if="ordersLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="donut-wrapper">
            <svg viewBox="0 0 160 160" class="donut-svg">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#2a2a2a" stroke-width="22" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="#097969" stroke-width="22"
                stroke-dasharray="0 377" :style="donutCompleteStyle"
                stroke-linecap="butt" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="#fb923c" stroke-width="22"
                stroke-dasharray="0 377" :style="donutInProgressStyle"
                stroke-linecap="butt" transform="rotate(-90 80 80)" />
              <circle cx="80" cy="80" r="60" fill="none" stroke="#4b5563" stroke-width="22"
                stroke-dasharray="0 377" :style="donutOthersStyle"
                stroke-linecap="butt" transform="rotate(-90 80 80)" />
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
                <span class="legend-dot" style="background:#4b5563"></span>
                <span>Others</span>
                <span class="legend-val">{{ dashboardStats.others }} ({{ donutPct(dashboardStats.others) }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointment Funnel -->
        <div class="dashboard-card funnel-card">
          <div class="dashboard-card-title">Appointment Funnel</div>
          <div v-if="apptLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="bar-chart">
            <div class="bar-row" v-for="(stage, i) in appointmentFunnel" :key="i">
              <div class="bar-label">{{ stage.label }}</div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: funnelPct(stage.count) + '%', background: stage.color }"
                ></div>
              </div>
              <div class="bar-count">{{ stage.count }}</div>
            </div>
            <div v-if="!appointmentFunnel.length" class="dashboard-empty">No appointment data.</div>
            <div class="funnel-note">
              Conversion: <strong>{{ conversionRate }}%</strong> of bookings completed
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ══════════════════ ROW 2: Monthly Trend ══════════════════ -->
    <section class="dashboard-section">
      <div class="dashboard-card trend-card">
        <div class="dashboard-card-title">Jobs Completed — Last 6 Months</div>
        <div v-if="ordersLoading" class="dashboard-loading">Loading...</div>
        <div v-else-if="monthlyTrend.length === 0" class="dashboard-empty">No completed job data yet.</div>
        <div v-else class="trend-chart">
          <div class="trend-y-axis">
            <span v-for="tick in yAxisTicks" :key="tick" class="y-tick">{{ tick }}</span>
          </div>
          <div class="trend-bars">
            <div class="trend-gridlines">
              <div v-for="tick in yAxisTicks" :key="tick" class="trend-gridline"></div>
            </div>
            <div class="trend-bar-group" v-for="(month, i) in monthlyTrend" :key="i">
              <div class="trend-bar-wrap">
                <div
                  class="trend-bar"
                  :style="{ height: trendBarHeight(month.count) + '%' }"
                  :title="month.label + ': ' + month.count + ' jobs'"
                >
                  <span class="trend-bar-val" v-if="month.count > 0">{{ month.count }}</span>
                </div>
              </div>
              <div class="trend-bar-label">{{ month.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════ ROW 3: Vehicle Makes + Top Services ══════════════════ -->
    <section class="dashboard-section">
      <div class="dashboard-grid">

        <div class="dashboard-card bar-card">
          <div class="dashboard-card-title">Top Vehicle Makes</div>
          <div v-if="ordersLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="bar-chart">
            <div v-for="(item, i) in topVehicleMakes" :key="i" class="bar-row">
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barPct(item.count, topVehicleMakes) + '%' }"></div>
              </div>
              <div class="bar-count">{{ item.count }}</div>
            </div>
            <div v-if="topVehicleMakes.length === 0" class="dashboard-empty">No data yet.</div>
          </div>
        </div>

        <div class="dashboard-card bar-card">
          <div class="dashboard-card-title">Top Services Requested</div>
          <div v-if="ordersLoading" class="dashboard-loading">Loading...</div>
          <div v-else class="bar-chart">
            <div v-for="(item, i) in topServices" :key="i" class="bar-row">
              <div class="bar-label">{{ item.name }}</div>
              <div class="bar-track">
                <div class="bar-fill bar-fill--alt" :style="{ width: barPct(item.count, topServices) + '%' }"></div>
              </div>
              <div class="bar-count">{{ item.count }}</div>
            </div>
            <div v-if="topServices.length === 0" class="dashboard-empty">No data yet.</div>
          </div>
        </div>

        <!-- <div class="dashboard-card bar-card bar-card--placeholder">
          <div class="dashboard-card-title">Revenue Trend</div>
          <div class="dashboard-empty">Available once invoice API is connected.</div>
        </div> -->

      </div>
    </section>

  </div>
</template>

<script>
import '@/assets/managerDashboard.css'

const CIRCUMFERENCE = 2 * Math.PI * 60
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default {
  name: 'ManagerDashboard',

  data() {
    return {
      ordersLoading: false,
      apptLoading: false,
      dashboardAllOrders: [],
      allAppointments: [],
    }
  },

  computed: {
    anyLoading() {
      return this.ordersLoading || this.apptLoading
    },

    currentMonthLabel() {
      const now = new Date()
      return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
    },

    // ══════════════════ KPI ══════════════════

    kpi() {
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      const todayStr = now.toISOString().slice(0, 10)

      const totalOrders = this.dashboardAllOrders.length

      const completedThisMonth = this.dashboardAllOrders.filter(o => {
        if (o.Order_Status !== 'Check Out') return false
        if (!o.Check_Out) return false
        const d = new Date(o.Check_Out)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      }).length

      const appointmentsToday = this.allAppointments.filter(a => {
        const isActive = a.status === 'appointment' || a.status === 'booked'
        return isActive && a.appointment_date === todayStr
      }).length

      const totalAppts = this.allAppointments.length
      const cancelledAppts = this.allAppointments.filter(a => a.status === 'cancelled').length
      const cancellationRate = totalAppts > 0 ? Math.round((cancelledAppts / totalAppts) * 100) : 0

      return { totalOrders, completedThisMonth, appointmentsToday, cancellationRate }
    },

    // ══════════════════ DONUT ══════════════════

    dashboardStats() {
      const total = this.dashboardAllOrders.length
      const completed = this.dashboardAllOrders.filter(o => o.Order_Status === 'Check Out').length
      const inProgress = this.dashboardAllOrders.filter(o =>
        ['In Progress', 'Waiting For Parts', 'Ready', 'Diagnose'].includes(o.Order_Status)
      ).length
      const others = total - completed - inProgress
      return { totalOrders: total, completed, inProgress, others }
    },

    donutCompleteStyle() {
      const { totalOrders, completed } = this.dashboardStats
      if (!totalOrders) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const len = (completed / totalOrders) * CIRCUMFERENCE
      return { strokeDasharray: `${len} ${CIRCUMFERENCE - len}`, strokeDashoffset: 0 }
    },

    donutInProgressStyle() {
      const { totalOrders, completed, inProgress } = this.dashboardStats
      if (!totalOrders) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const completedLen = (completed / totalOrders) * CIRCUMFERENCE
      const len = (inProgress / totalOrders) * CIRCUMFERENCE
      return { strokeDasharray: `${len} ${CIRCUMFERENCE - len}`, strokeDashoffset: -completedLen }
    },

    donutOthersStyle() {
      const { totalOrders, completed, inProgress } = this.dashboardStats
      if (!totalOrders) return { strokeDasharray: `0 ${CIRCUMFERENCE}`, strokeDashoffset: 0 }
      const completedLen = (completed / totalOrders) * CIRCUMFERENCE
      const inProgressLen = (inProgress / totalOrders) * CIRCUMFERENCE
      const len = (this.dashboardStats.others / totalOrders) * CIRCUMFERENCE
      return {
        strokeDasharray: `${len} ${CIRCUMFERENCE - len}`,
        strokeDashoffset: -(completedLen + inProgressLen)
      }
    },

    // ══════════════════ FUNNEL ══════════════════

    appointmentFunnel() {
      const total = this.allAppointments.length
      const completed = this.allAppointments.filter(a => a.status === 'completed').length
      const cancelled = this.allAppointments.filter(a => a.status === 'cancelled').length
      const active = this.allAppointments.filter(a =>
        a.status === 'appointment' || a.status === 'booked'
      ).length
      return [
        { label: 'Total Booked', count: total,     color: '#ffd700' },
        { label: 'Active',       count: active,    color: '#fb923c' },
        { label: 'Completed',    count: completed, color: '#097969' },
        { label: 'Cancelled',    count: cancelled, color: '#ef4444' },
      ]
    },

    conversionRate() {
      const total = this.allAppointments.length
      const completed = this.allAppointments.filter(a => a.status === 'completed').length
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },

    // ══════════════════ MONTHLY TREND ══════════════════

    monthlyTrend() {
      const now = new Date()
      const months = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_NAMES[d.getMonth()], count: 0 })
      }
      this.dashboardAllOrders.forEach(o => {
        if (o.Order_Status !== 'Check Out' || !o.Check_Out) return
        const d = new Date(o.Check_Out)
        const match = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth())
        if (match) match.count++
      })
      return months
    },

    trendMax() {
      return Math.max(...this.monthlyTrend.map(m => m.count), 1)
    },

    yAxisTicks() {
      const max = this.trendMax
      const step = Math.ceil(max / 4)
      const ticks = []
      for (let i = 4; i >= 0; i--) ticks.push(i * step)
      return ticks
    },

    // ══════════════════ BAR CHARTS ══════════════════

    topVehicleMakes() {
      const counts = {}
      this.dashboardAllOrders.forEach(o => {
        const make = (o.appointment?.vehicle_make || '').trim()
        if (make) counts[make] = (counts[make] || 0) + 1
      })
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    },

    topServices() {
      const counts = {}
      this.dashboardAllOrders.forEach(o => {
        const raw = o.Services || ''
        raw.split(',').map(s => s.trim()).filter(Boolean).forEach(svc => {
          counts[svc] = (counts[svc] || 0) + 1
        })
      })
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    },
  },

  mounted() {
    this.refreshAll()
  },

  methods: {
    refreshAll() {
      this.fetchDashboardOrders()
      this.fetchDashboardAppointments()
    },

    async fetchDashboardOrders() {
      this.ordersLoading = true
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated.')
        const res = await fetch('http://localhost:3000/api/manager/jobCards?limit=500&page=1', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || result.message || 'Failed to fetch job orders')
        this.dashboardAllOrders = result.data || []
      } catch (err) {
        console.error('Dashboard orders fetch error:', err)
        this.dashboardAllOrders = []
      } finally {
        this.ordersLoading = false
      }
    },

    async fetchDashboardAppointments() {
      this.apptLoading = true
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated.')
        const res = await fetch('http://localhost:3000/api/manager/getAllAppointments', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || json.message || 'Failed to fetch appointments')
        this.allAppointments = json.data || []
      } catch (err) {
        console.error('Dashboard appointments fetch error:', err)
        this.allAppointments = []
      } finally {
        this.apptLoading = false
      }
    },

    donutPct(count) {
      const total = this.dashboardStats.totalOrders
      return total ? Math.round((count / total) * 100) : 0
    },

    barPct(count, list) {
      const max = list[0]?.count || 1
      return Math.round((count / max) * 100)
    },

    funnelPct(count) {
      const total = this.allAppointments.length
      return total ? Math.round((count / total) * 100) : 0
    },

    trendBarHeight(count) {
      return this.trendMax > 0 ? Math.round((count / this.trendMax) * 100) : 0
    },
  }
}
</script>