const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')

module.exports = (supabase) => {

    // GET all technicians
    router.get('/getTechnicians', requireRole(supabase, ['manager']), async (req, res) => {
        try {

            const { data: technicians, error } = await supabase
                .from('Profiles')
                .select('ID, Name, Email')
                .eq('Role', 'technician')

            if (error) {
                return res.status(500).json({ message: error.message })
            }

            res.json({ technicians })
        } catch (err) {
            console.error('Get technicians error:', err)
            res.status(500).json({ error: err.message })
        }
    })

    // technician's appointments
    router.get('/getAppointments', requireRole(supabase, ['technician']), async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('Appointments')
                .select(`
                *,
                Profiles:customer_id (
                Name,
                Email
                )
            `)
                .eq('technician_id', req.user.id)
                .eq('status', 'booked')
            if (error) return res.status(400).json({ error: error.message })
            res.status(200).json({ message: 'Appointments retrieved successfully', data })
        } catch (err) {
            console.error('Get appointments error:', err)
            res.status(500).json({ error: err.message })
        }
    })

    // GET /api/technician/myJobCards
    // Returns a unified view of all jobs this technician is involved in,
    // whether as the diagnosing technician (Appointments.technician_id)
    // or the service technician (Job_Orders.service_technician_id).
    // Each record includes a _roles array: ['diagnose'], ['service'], or both.
    // Used by TechnicianDashboard.vue
    router.get('/myJobCards', requireRole(supabase, ['technician']), async (req, res) => {
        try {
            const techId = req.user.id
            const page = parseInt(req.query.page) || 1
            const limit = parseInt(req.query.limit) || 500
            const from = (page - 1) * limit
            const to = from + limit - 1

            // ── 1. Jobs where I am the SERVICE technician ──────────────────────────
            const { data: serviceJobs, error: e1 } = await supabase
                .from('Job_Orders')
                .select(`
          *,
          appointment:appointment_id (
            id,
            appointment_date,
            appointment_time,
            vehicle_license_plate,
            vehicle_make,
            vehicle_year,
            status,
            technician_id
          )
        `)
                .eq('service_technician_id', techId)
                .not('Order_Status', 'in', '("Check Out","Check_Out","check_out","completed","Completed","cancelled","PRM - Check Out - PRM")')
                .range(from, to)

            if (e1) return res.status(400).json({ error: e1.message })

            // ── 2. Appointments where I am the DIAGNOSE technician ─────────────────
            const { data: diagnoseAppts, error: e2 } = await supabase
                .from('Appointments')
                .select(`
                    id,
                    appointment_date,
                    appointment_time,
                    vehicle_license_plate,
                    vehicle_make,
                    vehicle_year,
                    status,
                    technician_id,
                    Job_Orders!appointment_id (
                        Order_ID,
                        Order_Status,
                        Services,
                        Parts,
                        Service,
                        Quotation,
                        Waiting_For_Parts,
                        Diagnose,
                        Check_Out,
                        expected_parts_arrival_date,
                        service_technician_id,
                        Customer_id,
                        appointment_id
                    )
                `)
                .eq('technician_id', techId)
                .not('status', 'in', '("completed","cancelled","Check Out","Check_Out")')
                .range(from, to)

            if (e2) return res.status(400).json({ error: e2.message })

            // Normalise diagnose appointments into the same shape as a Job_Order row
            const diagnoseJobs = (diagnoseAppts || []).map(appt => {
                const order = appt.Job_Orders?.[0] || {}
                return {
                    Order_ID: order.Order_ID || null,
                    Order_Status: order.Order_Status || appt.status || null,
                    Services: order.Services || null,
                    Parts: order.Parts || null,
                    Service: order.Service || null,
                    Quotation: order.Quotation || null,
                    Waiting_For_Parts: order.Waiting_For_Parts || null,
                    Diagnose: order.Diagnose || null,
                    Check_Out: order.Check_Out || null,
                    expected_parts_arrival_date: order.expected_parts_arrival_date || null,
                    service_technician_id: order.service_technician_id || null,
                    Customer_id: order.Customer_id || null,
                    appointment_id: appt.id,
                    appointment: {
                        id: appt.id,
                        appointment_date: appt.appointment_date,
                        appointment_time: appt.appointment_time,
                        vehicle_license_plate: appt.vehicle_license_plate,
                        vehicle_make: appt.vehicle_make,
                        vehicle_year: appt.vehicle_year,
                        status: appt.status,
                        technician_id: appt.technician_id,
                    },
                }
            })

            // ── 2b. Count completed jobs this month (for KPI) ─────────────────────
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

            const { count: completedThisMonth, error: e3 } = await supabase
                .from('Job_Orders')
                .select('*', { count: 'exact', head: true })
                .eq('service_technician_id', techId)
                .in('Order_Status', ['Check Out', 'Check_Out', 'completed', 'Completed', 'PRM - Check Out - PRM'])
                .gte('Check_Out', monthStart)
                .lt('Check_Out', monthEnd)

            if (e3) return res.status(400).json({ error: e3.message })

            // ── 3. Merge — deduplicate by Order_ID, track both roles ───────────────
            const byKey = {}

            for (const job of diagnoseJobs) {
                const key = job.Order_ID || `appt-${job.appointment_id}`
                byKey[key] = { ...job, _roles: ['diagnose'] }
            }

            for (const job of (serviceJobs || [])) {
                const key = job.Order_ID || `appt-${job.appointment_id}`
                if (byKey[key]) {
                    // Technician is both diagnose and service — keep service job data (richer),
                    // but record both roles
                    byKey[key] = { ...job, _roles: ['diagnose', 'service'] }
                } else {
                    byKey[key] = { ...job, _roles: ['service'] }
                }
            }

            const merged = Object.values(byKey)

            // ── 4. Role summary counts returned alongside data ─────────────────────
            const summary = {
                completedThisMonth: completedThisMonth || 0,
                totalDiagnose: merged.filter(j => j._roles.includes('diagnose')).length,
                totalService: merged.filter(j => j._roles.includes('service')).length,
                bothRoles: merged.filter(j => j._roles.length === 2).length,
            }

            res.status(200).json({
                message: 'Job cards retrieved successfully',
                data: merged,
                summary,
            })
        } catch (err) {
            console.error('Technician myJobCards error:', err)
            res.status(500).json({ error: err.message })
        }
    })

    return router
}