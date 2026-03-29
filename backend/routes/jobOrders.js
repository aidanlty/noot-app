const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')

module.exports = (supabase) => {

    // create job card when diagnose button pressed in mgr appointments
    router.post('/createJobCard', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { customer_id, appointment_id, diagnose_technician_id } = req.body

            // Check if a job order already exists for this appointment
            const { data: existing, error: existingError } = await supabase
                .from('Job_Orders')
                .select('Order_ID')
                .eq('appointment_id', appointment_id)
                .maybeSingle()

            if (existingError) return res.status(500).json({ error: existingError.message })
            if (existing) return res.status(409).json({ message: 'A job card already exists for this appointment.' })

            // Fetch latest Order_ID
            const { data: latestOrder, error: fetchError } = await supabase
                .from('Job_Orders')
                .select('Order_ID')
                .order('Order_ID', { ascending: false })
                .limit(1)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                return res.status(500).json({ error: fetchError.message })
            }

            let nextOrderId = 'ORD-000001'
            if (latestOrder?.Order_ID) {
                const num = parseInt(latestOrder.Order_ID.replace('ORD-', ''), 10)
                nextOrderId = `ORD-${String(num + 1).padStart(6, '0')}`
            }

            const today = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('Job_Orders')
                .insert({
                    Order_ID:               nextOrderId,
                    Customer_id:            customer_id,
                    appointment_id:         appointment_id,
                    diagnose_technician_id: diagnose_technician_id,
                    Diagnose:               today,
                    Order_Status:           'diagnose',
                })
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            if (!data) return res.status(404).json({ message: 'Job card not found' })

            const { error: appointmentError } = await supabase
                .from('Appointments')
                .update({ status: 'completed' })
                .eq('id', appointment_id)

            if (appointmentError) return res.status(500).json({ error: appointmentError.message })

            res.status(201).json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })

    router.get('/getJobOrders', requireRole(supabase, ['customer']), async (req, res) => {
    try {
        // 1. Fetch job orders for this customer
        const { data: orders, error: ordersError } = await supabase
        .from('Job_Orders')
        .select('*')
        .eq('Customer_id', req.user.id)
        .order('Order_ID', { ascending: false })

        if (ordersError) return res.status(500).json({ error: ordersError.message })
        if (!orders || orders.length === 0)
        return res.status(404).json({ message: 'No job orders found for this customer.' })

        // 2. Collect all unique appointment IDs and technician IDs
        const appointmentIds = [...new Set(orders.map(o => o.appointment_id).filter(Boolean))]
        const techIds = [...new Set([
        ...orders.map(o => o.diagnose_technician_id),
        ...orders.map(o => o.service_technician_id),
        ].filter(Boolean))]

        // 3. Fetch related appointments
        const { data: appointments, error: apptError } = appointmentIds.length
        ? await supabase.from('Appointments').select('*').in('id', appointmentIds)
        : { data: [], error: null }
        if (apptError) return res.status(500).json({ error: apptError.message })

        // 4. Fetch technician profiles
        const { data: profiles, error: profilesError } = techIds.length
        ? await supabase.from('Profiles').select('ID, Name, Email').in('ID', techIds)
        : { data: [], error: null }
        if (profilesError) return res.status(500).json({ error: profilesError.message })

        // 5. Build lookup maps
        const apptMap = Object.fromEntries((appointments || []).map(a => [a.id, a]))
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.ID, p]))

        // 6. Merge everything
        const enriched = orders.map(order => {
        const appt = apptMap[order.appointment_id] || {}
        const diagTech = profileMap[order.diagnose_technician_id] || null
        const svcTech  = profileMap[order.service_technician_id]  || null

        return {
            ...order,
            // from Appointments
            vehicle_license_plate: appt.vehicle_license_plate || null,
            vehicle_make:          appt.vehicle_make          || null,
            vehicle_year:          appt.vehicle_year          || null,
            // technician objects
            diagnose_technician:   diagTech ? { name: diagTech.Name, email: diagTech.Email } : null,
            service_technician:    svcTech  ? { name: svcTech.Name,  email: svcTech.Email  } : null,
        }
        })

        res.status(200).json({ data: enriched })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})    

    router.get('/getTechnicianJobOrders', requireRole(supabase, ['technician']), async (req, res) => {
        try {
            const techId = req.user.id

            // 1. Fetch job orders where this technician is assigned (diagnose or service)
            const { data: orders, error: ordersError } = await supabase
                .from('Job_Orders')
                .select('*')
                .or(
                    `and(Order_Status.eq.diagnose,diagnose_technician_id.eq.${techId}),` +
                    `and(Order_Status.eq.service,service_technician_id.eq.${techId})`
                )
                .order('Order_ID', { ascending: false })

            if (ordersError) return res.status(500).json({ error: ordersError.message })
            if (!orders || orders.length === 0)
                return res.status(404).json({ message: 'No job orders found for this technician.' })

            // 2. Collect all unique IDs
            const appointmentIds = [...new Set(orders.map(o => o.appointment_id).filter(Boolean))]
            const techIds = [...new Set([
                ...orders.map(o => o.diagnose_technician_id),
                ...orders.map(o => o.service_technician_id),
            ].filter(Boolean))]
            const customerIds = [...new Set(orders.map(o => o.Customer_id).filter(Boolean))]

            // 3. Fetch related appointments
            const { data: appointments, error: apptError } = appointmentIds.length
                ? await supabase
                    .from('Appointments')
                    .select('id, vehicle_license_plate, vehicle_make, vehicle_year, customer_notes, phone_number')
                    .in('id', appointmentIds)
                : { data: [], error: null }
            if (apptError) return res.status(500).json({ error: apptError.message })

            // 4. Fetch technician profiles
            const { data: profiles, error: profilesError } = techIds.length
                ? await supabase.from('Profiles').select('ID, Name, Email').in('ID', techIds)
                : { data: [], error: null }
            if (profilesError) return res.status(500).json({ error: profilesError.message })

            // 5. Fetch customer profiles
            const { data: customerProfiles, error: customerProfilesError } = customerIds.length
                ? await supabase.from('Profiles').select('ID, Name, Email').in('ID', customerIds)
                : { data: [], error: null }
            if (customerProfilesError) return res.status(500).json({ error: customerProfilesError.message })

            // 6. Build lookup maps
            const apptMap     = Object.fromEntries((appointments     || []).map(a => [a.id,  a]))
            const profileMap  = Object.fromEntries((profiles         || []).map(p => [p.ID,  p]))
            const customerMap = Object.fromEntries((customerProfiles || []).map(p => [p.ID,  p]))

            // 7. Merge everything
            const enriched = orders.map(order => {
                const appt     = apptMap[order.appointment_id]           || {}
                const diagTech = profileMap[order.diagnose_technician_id] || null
                const svcTech  = profileMap[order.service_technician_id]  || null
                const customer = customerMap[order.Customer_id]           || null

                return {
                    ...order,
                    // from Appointments
                    vehicle_license_plate: appt.vehicle_license_plate || null,
                    vehicle_make:          appt.vehicle_make          || null,
                    vehicle_year:          appt.vehicle_year          || null,
                    customer_notes:        appt.customer_notes        || null,
                    phone_number:          appt.phone_number          || null,
                    // from customer Profile
                    customer_name:         customer ? customer.Name  : null,
                    customer_email:        customer ? customer.Email : null,
                    // technician objects
                    diagnose_technician: diagTech ? { name: diagTech.Name, email: diagTech.Email } : null,
                    service_technician:  svcTech  ? { name: svcTech.Name,  email: svcTech.Email  } : null,
                }
            })

            res.status(200).json({ data: enriched })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })
    // update services in a job order
    router.put('/:orderId/services', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params
            const { services } = req.body

            const { data, error } = await supabase
                .from('Job_Orders')
                .update({ Services: services })
                .eq('"Order_ID"', orderId)
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            if (!data) return res.status(404).json({ message: 'Job card not found' })

            res.json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })

    

    // update parts in a job order
    router.put('/:orderId/parts', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params
            const { parts } = req.body

            if (parts === undefined) {
                return res.status(400).json({ message: 'parts field is required' })
            }

            const { data, error } = await supabase
                .from('Job_Orders')
                .update({ Parts: parts })
                .eq('"Order_ID"', orderId)
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            if (!data) return res.status(404).json({ message: 'Job order not found' })

            res.json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })

    // update order status for a job order
    router.put('/:orderId/status', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params
            const { status } = req.body

            if (!status) {
                return res.status(400).json({ message: 'status field is required' })
            }

            // Map each status to its corresponding date column
            const statusDateMap = {
                'diagnose':        'Diagnose',
                'quotation':       'Quotation',
                'waiting_for_parts': 'Waiting_For_Parts',
                'service':         'Service',
                'ready':           'Ready',
                'check_out':       'Check_Out',
            }

            const dateColumn = statusDateMap[status]
            if (!dateColumn) {
                return res.status(400).json({ message: `Invalid status. Must be one of: ${Object.keys(statusDateMap).join(', ')}` })
            }

            const today = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('Job_Orders')
                .update({
                    Order_Status: status,
                    [dateColumn]:  today,
                })
                .eq('Order_ID', orderId)
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })
            if (!data)  return res.status(404).json({ message: 'Job order not found' })

            res.status(200).json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })
    
    return router
}