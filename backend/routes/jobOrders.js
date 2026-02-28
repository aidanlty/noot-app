const express = require('express')
const router = express.Router()
const requireRole = require('../middleware/requireRole')

module.exports = (supabase) => {

    // update services in a job card
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

            if (status === undefined) {
                return res.status(400).json({ message: 'status field is required' })
            }

            // indiv api for this
            if (status === 'diagnose') {
                return res.status(400).json({ message: 'Use PUT /:orderId/status/diagnose for diagnose status' })
            }
            const statusDateMap = {
                quotation: 'Quotation',
                waiting_for_parts: 'Waiting_For_Parts',
                ready: 'Ready',
            }
            const updatePayload = { Order_Status: status }
            if (statusDateMap[status]) {
                updatePayload[statusDateMap[status]] = new Date().toISOString().split('T')[0]
            }

            const { data, error } = await supabase
                .from('Job_Orders')
                .update(updatePayload)
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

    // update diagnose status and auto-fill Diagnose date
    router.put('/:orderId/status/diagnose', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params

            const { data, error } = await supabase
                .from('Job_Orders')
                .update({
                    Order_Status: 'diagnose',
                    Diagnose: new Date().toISOString().split('T')[0]
                })
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
    // END NEW

    // update appointment status via job order
    router.put('/:orderId/appointment-status', requireRole(supabase, ['manager', 'technician']), async (req, res) => {
        try {
            const { orderId } = req.params
            const { status } = req.body

            if (status === undefined) {
                return res.status(400).json({ message: 'status field is required' })
            }

            // Fetch appointment_id from job order
            const { data: jobOrder, error: jobError } = await supabase
                .from('Job_Orders')
                .select('appointment_id')
                .eq('"Order_ID"', orderId)
                .single()

            if (jobError || !jobOrder) return res.status(404).json({ message: 'Job order not found' })
            if (!jobOrder.appointment_id) return res.status(404).json({ message: 'No appointment linked to this job order' })

            // Update appointment status
            const { data, error } = await supabase
                .from('Appointments')
                .update({ status })
                .eq('id', jobOrder.appointment_id)
                .select()
                .single()

            if (error) return res.status(500).json({ error: error.message })

            res.json({ data })
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    })

    return router
}